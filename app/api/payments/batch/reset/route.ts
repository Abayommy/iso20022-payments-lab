import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    // Update all payments to CREATED status
    const result = await prisma.payment.updateMany({
      data: { status: 'CREATED' }
    });

    // Create reset event for each payment
    const payments = await prisma.payment.findMany();
    await Promise.all(
      payments.map(payment =>
        prisma.event.create({
          data: {
            paymentId: payment.id,
            type: 'RESET',
            description: 'Payment reset to CREATED status'
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      reset: result.count
    });

  } catch (error) {
    console.error('Batch reset error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to reset payments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
