import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.payment.createMany({
    data: [
      {
        rail: "FEDNOW",
        debtorName: "Acme Inc",
        debtorAcct: "US00ACME0001",
        creditorName: "Globex LLC",
        creditorAcct: "US00GLOBEX0001",
        amount: 1250.55,
        currency: "USD",
        remittance: "Invoice #1001",
        purpose: "GDDS",
      },
      {
        rail: "RTP",
        debtorName: "Wayne Corp",
        debtorAcct: "US00WAYNE0002",
        creditorName: "Stark Industries",
        creditorAcct: "US00STARK0002",
        amount: 420.00,
        currency: "USD",
        remittance: "PO 77-ALPHA",
        purpose: "TRAD",
      },
      {
        rail: "SWIFT",
        debtorName: "Blue Sun",
        debtorAcct: "GB00BLUESUN3",
        creditorName: "Tyrell Corp",
        creditorAcct: "DE00TYRELL03",
        amount: 9999.99,
        currency: "EUR",
        remittance: "Settlement",
        purpose: "GDDS",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.event.create({
    data: {
      type: "seed",
      payload: { inserted: 3, at: new Date().toISOString() },
    },
  });

  console.log("Seed completed ✓");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
