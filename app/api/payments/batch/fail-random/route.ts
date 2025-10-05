import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    // Get all non-failed payments
    const candidates = await prisma.payment.findMany({
      where: {
        status: { not: 'FAILED' }
      }
    });

    if (candidates.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No payments available to fail'
      });
    }

    // Select random payment
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const targetPayment = candidates[randomIndex];

    // Update to FAILED
    const updated = await prisma.payment.update({
      where: { id: targetPayment.id },
      data: { status: 'FAILED' }
    });

    // Create event
    await prisma.event.create({
      data: {
        paymentId: targetPayment.id,
        type: 'FAILURE',
        description: `Payment randomly failed from ${targetPayment.status} status`
      }
    });

    return NextResponse.json({
      success: true,
      payment: updated
    });

  } catch (error) {
    console.error('Random fail error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fail payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
