import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generatePain001 } from "@/lib/xml/generator";

const prisma = new PrismaClient();

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const p = await prisma.payment.findUnique({ where: { id } });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const xml = generatePain001(p);
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="pain001-${id}.xml"`
    }
  });
}

