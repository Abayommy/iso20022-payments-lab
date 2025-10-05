import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const STATUS_FLOW: Record<string, string> = {
  CREATED: 'PENDING',
  PENDING: 'PROCESSING',
  PROCESSING: 'COMPLETED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

export async function POST() {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        status: {
          notIn: ['COMPLETED', 'FAILED']
        }
      }
    });

    if (payments.length === 0) {
      return NextResponse.json({
        success: true,
        updated: 0,
        message: 'No payments to advance'
      });
    }

    const updates = await Promise.all(
      payments.map(async (payment) => {
        const nextStatus = STATUS_FLOW[payment.status] || payment.status;
        
        const updated = await prisma.payment.update({
          where: { id: payment.id },
          data: { 
            status: nextStatus
          }
        });

        await prisma.event.create({
          data: {
            paymentId: payment.id,
            type: 'STATUS_CHANGE',
            description: `Status advanced from ${payment.status} to ${nextStatus}`
          }
        });

        return updated;
      })
    );

    return NextResponse.json({
      success: true,
      updated: updates.length,
      payments: updates
    });

  } catch (error) {
    console.error('Batch advance error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to advance payments',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
