// app/api/payments/[id]/status/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT - Update payment status manually
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, action, simulateFailure } = body;

    // Get current payment
    const currentPayment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: { events: true }
    });

    if (!currentPayment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Define status progression
    const statusFlow = ['CREATED', 'PENDING', 'PROCESSING', 'COMPLETED'];
    const currentIndex = statusFlow.indexOf(currentPayment.status);

    let newStatus = status;

    // Handle action-based status change
    if (action === 'advance') {
      if (currentIndex < statusFlow.length - 1) {
        newStatus = statusFlow[currentIndex + 1];
      } else {
        return NextResponse.json({ 
          message: 'Already at final status',
          currentStatus: currentPayment.status 
        });
      }
    } else if (action === 'reverse') {
      if (currentIndex > 0) {
        newStatus = statusFlow[currentIndex - 1];
      } else {
        return NextResponse.json({ 
          message: 'Already at initial status',
          currentStatus: currentPayment.status 
        });
      }
    } else if (action === 'fail') {
      newStatus = 'FAILED';
    } else if (action === 'reset') {
      newStatus = 'CREATED';
    }

    // Simulate random failure if requested
    if (simulateFailure && Math.random() < 0.3) { // 30% failure rate
      newStatus = 'FAILED';
    }

    // Update the payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        updatedAt: new Date(),
        events: {
          create: {
            type: newStatus,
            description: getStatusDescription(newStatus, action),
            metadata: JSON.stringify({
              previousStatus: currentPayment.status,
              action: action || 'manual',
              timestamp: new Date().toISOString()
            })
          }
        }
      },
      include: { events: true }
    });

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message: `Status updated from ${currentPayment.status} to ${newStatus}`
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
}

// Helper function to generate status descriptions
function getStatusDescription(status: string, action?: string): string {
  const descriptions: Record<string, string> = {
    'CREATED': 'Payment initiated',
    'PENDING': 'Payment validated and submitted to processing network',
    'PROCESSING': 'Payment being processed by network',
    'COMPLETED': 'Payment successfully completed',
    'FAILED': action === 'fail' ? 'Payment failed - Manual failure triggered' : 'Payment failed during processing'
  };
  
  return descriptions[status] || `Status changed to ${status}`;
}
