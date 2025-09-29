// app/api/payments/route.ts - Enhanced version with test mode support
import { NextResponse } from 'next/server';
import { ISO20022Generator, PaymentValidator, PaymentData } from '@/lib/xml/generator';
import prisma from '@/lib/prisma';

// Test configuration (you can move this to a separate config file)
const TEST_CONFIG = {
  enabled: false,
  speedMultiplier: 1, // 1 = normal, 0.5 = slower, 2 = faster
  failureRate: 0.1, // 10% chance of failure
  delayTimes: {
    CREATED_TO_PENDING: 5000,     // 5 seconds
    PENDING_TO_PROCESSING: 10000,  // 10 seconds
    PROCESSING_TO_FINAL: 15000,    // 15 seconds
  }
};

// GET - List all payments
export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        events: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

// POST - Create a new payment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received payment data:', body);

    // Check for test mode settings in the request
    const testMode = body.testMode || TEST_CONFIG;
    const speedMultiplier = testMode.speedMultiplier || 1;

    // Map the field names from the form to what we expect
    const paymentData: PaymentData = {
      paymentId: body.paymentId || `PMT-${Date.now()}`,
      amount: parseFloat(body.amount),
      currency: body.currency || 'USD',
      debtorName: body.debtorName?.trim(),
      debtorAccountId: body.debtorAccount?.trim(),
      creditorName: body.creditorName?.trim(),
      creditorAccountId: body.creditorAccount?.trim(),
      paymentRail: body.rail || body.paymentRail || 'FEDNOW',
      remittanceInfo: body.remittance || body.remittanceInfo || body.purpose || '',
      timestamp: new Date().toISOString()
    };

    console.log('Processed payment data:', paymentData);

    // Validate payment data
    const validation = PaymentValidator.validate(paymentData);
    if (!validation.isValid) {
      console.error('Validation errors:', validation.errors);
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      );
    }

    // Generate ISO 20022 XML messages
    let xmlMessages;
    try {
      xmlMessages = ISO20022Generator.generateAllMessages(paymentData);
      console.log('Generated XML messages successfully');
    } catch (xmlError) {
      console.error('Error generating XML:', xmlError);
      return NextResponse.json(
        { error: 'Failed to generate XML messages', details: xmlError instanceof Error ? xmlError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Create payment in database
    let payment;
    try {
      console.log('Creating payment in database...');
      
      const uetr = `${paymentData.paymentRail}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      payment = await prisma.payment.create({
        data: {
          uetr: uetr,
          rail: paymentData.paymentRail,
          amount: paymentData.amount,
          currency: paymentData.currency,
          debtorName: paymentData.debtorName,
          debtorAccount: paymentData.debtorAccountId,
          creditorName: paymentData.creditorName,
          creditorAccount: paymentData.creditorAccountId,
          purpose: body.purpose || 'GDDS',
          remittance: paymentData.remittanceInfo || '',
          status: 'CREATED',
          pain001Xml: xmlMessages.pain001,
          pacs008Xml: xmlMessages.pacs008,
          events: {
            create: {
              type: 'CREATED',
              description: 'Payment initiated',
              metadata: JSON.stringify({ 
                timestamp: new Date().toISOString(),
                testMode: testMode.enabled
              })
            }
          }
        },
        include: {
          events: true
        }
      });

      console.log('Payment created successfully:', payment.id);

      // Simulate payment processing workflow with configurable timing
      if (testMode.enabled && body.autoProgress !== false) {
        simulatePaymentProgression(payment, paymentData, testMode, speedMultiplier);
      }

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { 
          error: 'Database operation failed', 
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500 }
      );
    }

    // Return the created payment with XML
    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        uetr: payment.uetr,
        amount: payment.amount,
        currency: payment.currency,
        debtorName: payment.debtorName,
        creditorName: payment.creditorName,
        rail: payment.rail,
        status: payment.status,
        createdAt: payment.createdAt
      },
      xml: {
        pain001: xmlMessages.pain001,
        pacs008: xmlMessages.pacs008,
        pacs002: xmlMessages.pacs002,
        camt054: xmlMessages.camt054
      }
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process payment', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to simulate payment progression with configurable timing
async function simulatePaymentProgression(
  payment: any, 
  paymentData: PaymentData,
  testMode: any,
  speedMultiplier: number
) {
  // Calculate delays based on speed multiplier
  const delays = {
    toPending: Math.round(TEST_CONFIG.delayTimes.CREATED_TO_PENDING / speedMultiplier),
    toProcessing: Math.round(TEST_CONFIG.delayTimes.PENDING_TO_PROCESSING / speedMultiplier),
    toFinal: Math.round(TEST_CONFIG.delayTimes.PROCESSING_TO_FINAL / speedMultiplier)
  };

  // Different timing for different rails
  if (paymentData.paymentRail === 'SWIFT') {
    delays.toPending *= 2;
    delays.toProcessing *= 2;
    delays.toFinal *= 3;
  } else if (paymentData.paymentRail === 'RTP') {
    delays.toPending *= 0.8;
    delays.toProcessing *= 0.8;
    delays.toFinal *= 0.8;
  }

  console.log(`Payment ${payment.id} progression delays:`, delays);

  // Update to PENDING
  setTimeout(async () => {
    try {
      const shouldPause = testMode.pauseAtStatus === 'PENDING';
      if (!shouldPause) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PENDING',
            events: {
              create: {
                type: 'PENDING',
                description: 'Payment validated and submitted to processing network',
                metadata: JSON.stringify({ 
                  timestamp: new Date().toISOString(),
                  rail: paymentData.paymentRail
                })
              }
            }
          }
        });
        console.log(`Payment ${payment.id} -> PENDING`);
      }
    } catch (error) {
      console.error('Error updating to PENDING:', error);
    }
  }, delays.toPending);

  // Update to PROCESSING
  setTimeout(async () => {
    try {
      const currentPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
      if (currentPayment?.status === 'PENDING') {
        const shouldPause = testMode.pauseAtStatus === 'PROCESSING';
        if (!shouldPause) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'PROCESSING',
              events: {
                create: {
                  type: 'PROCESSING',
                  description: `Payment being processed by ${paymentData.paymentRail} network`,
                  metadata: JSON.stringify({ 
                    timestamp: new Date().toISOString(),
                    rail: paymentData.paymentRail
                  })
                }
              }
            }
          });
          console.log(`Payment ${payment.id} -> PROCESSING`);
        }
      }
    } catch (error) {
      console.error('Error updating to PROCESSING:', error);
    }
  }, delays.toPending + delays.toProcessing);

  // Update to COMPLETED or FAILED
  setTimeout(async () => {
    try {
      const currentPayment = await prisma.payment.findUnique({ where: { id: payment.id } });
      if (currentPayment?.status === 'PROCESSING') {
        // Determine if payment should fail based on failure rate
        const shouldFail = Math.random() < (testMode.failureRate || 0);
        
        // Also fail if amount exceeds certain thresholds
        const exceedsLimit = (
          (paymentData.paymentRail === 'FEDNOW' && paymentData.amount > 500000) ||
          (paymentData.paymentRail === 'RTP' && paymentData.amount > 1000000)
        );

        const finalStatus = shouldFail || exceedsLimit ? 'FAILED' : 'COMPLETED';
        const description = shouldFail 
          ? 'Payment failed during processing - Test failure simulation'
          : exceedsLimit
          ? `Payment failed - Amount exceeds ${paymentData.paymentRail} limit`
          : 'Payment successfully completed';

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: finalStatus,
            events: {
              create: {
                type: finalStatus,
                description: description,
                metadata: JSON.stringify({ 
                  timestamp: new Date().toISOString(),
                  rail: paymentData.paymentRail,
                  reason: shouldFail ? 'test_failure' : exceedsLimit ? 'limit_exceeded' : 'success'
                })
              }
            }
          }
        });
        console.log(`Payment ${payment.id} -> ${finalStatus}`);
      }
    } catch (error) {
      console.error('Error updating to final status:', error);
    }
  }, delays.toPending + delays.toProcessing + delays.toFinal);
}
