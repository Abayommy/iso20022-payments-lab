import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ISO20022Generator, PaymentData } from "@/lib/xml/generator";

const prisma = new PrismaClient();

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const p = await prisma.payment.findUnique({ where: { id } });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Transform Prisma payment to PaymentData format
  const paymentData: PaymentData = {
    paymentId: p.id,
    amount: p.amount,
    currency: p.currency,
    debtorName: p.debtorName,
    debtorAccountId: p.debtorAccount,
    creditorName: p.creditorName,
    creditorAccountId: p.creditorAccount,
    paymentRail: p.rail as 'FEDNOW' | 'RTP' | 'SWIFT',
    remittanceInfo: p.remittance || '',
    timestamp: p.createdAt.toISOString()
  };

  const xml = ISO20022Generator.generatePain001(paymentData);
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="pain001-${id}.xml"`
    }
  });
}
