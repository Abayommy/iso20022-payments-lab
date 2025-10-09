import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action, status } = await request.json();
    const paymentId = params.id;

    // Get current payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    let newStatus = payment.status;
    let eventType = '';
    let eventDescription = '';

    // Determine new status based on action
    if (action === 'advance') {
      const statusFlow = ['CREATED', 'PENDING', 'PROCESSING', 'COMPLETED'];
      const currentIndex = statusFlow.indexOf(payment.status);
      if (currentIndex < statusFlow.length - 1 && payment.status !== 'FAILED') {
        newStatus = statusFlow[currentIndex + 1];
        eventType = 'STATUS_ADVANCED';
        eventDescription = `Payment advanced from ${payment.status} to ${newStatus}`;
      }
    } else if (action === 'reverse') {
      const statusFlow = ['CREATED', 'PENDING', 'PROCESSING', 'COMPLETED'];
      const currentIndex = statusFlow.indexOf(payment.status);
      if (currentIndex > 0) {
        newStatus = statusFlow[currentIndex - 1];
        eventType = 'STATUS_REVERSED';
        eventDescription = `Payment reversed from ${payment.status} to ${newStatus}`;
      }
    } else if (action === 'fail') {
      if (payment.status !== 'COMPLETED' && payment.status !== 'FAILED') {
        newStatus = 'FAILED';
        eventType = 'PAYMENT_FAILED';
        eventDescription = `Payment marked as failed from ${payment.status}`;
      }
    } else if (action === 'manual' && status) {
      newStatus = status;
      eventType = 'MANUAL_STATUS_CHANGE';
      eventDescription = `Payment status manually changed from ${payment.status} to ${newStatus}`;
    }

    // Update payment if status changed
    if (newStatus !== payment.status) {
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: { 
          status: newStatus,
          updatedAt: new Date()
        },
        include: { events: true }
      });

      // Create event
      await prisma.event.create({
        data: {
          type: eventType,
          description: eventDescription,
          paymentId: payment.id
        }
      });

      return NextResponse.json({
        success: true,
        payment: updatedPayment,
        message: `Payment ${paymentId.substring(0, 8)} updated to ${newStatus}`
      });
    }

    return NextResponse.json({
      success: false,
      message: 'No status change needed'
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
}