// app/api/payments/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        events: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!payment) {
      return NextResponse.json({ 
        success: false,
        error: 'Payment not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      payment
    });
  } catch (error) {
    console.error('Payment fetch error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch payment' 
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;

    const payment = await prisma.payment.update({
      where: { id: params.id },
      data: {
        status,
        events: {
          create: {
            type: 'STATUS_CHANGE',
            description: `Status updated to ${status}`,
            metadata: JSON.stringify({ previousStatus: body.previousStatus })
          }
        }
      },
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    return NextResponse.json({
      success: true,
      payment
    });
  } catch (error) {
    console.error('Payment update error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update payment' 
    }, { status: 500 });
  }
}
