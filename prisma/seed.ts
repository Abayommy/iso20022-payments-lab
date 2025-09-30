kimport { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.payment.createMany({
    data: [
      {
        uetr: "00000000-0000-0000-0000-000000000001",
        rail: "FEDNOW",
        debtorName: "Acme Inc",
        debtorAccount: "US00ACME0001",
        creditorName: "Globex LLC",
        creditorAccount: "US00GLOBEX0001",
        amount: 1250.55,
        currency: "USD",
        remittance: "Invoice #1001",
        purpose: "GDDS",
      },
      {
        uetr: "00000000-0000-0000-0000-000000000002",
        rail: "RTP",
        debtorName: "Wayne Corp",
        debtorAccount: "US00WAYNE0002",
        creditorName: "Stark Industries",
        creditorAccount: "US00STARK0002",
        amount: 420.00,
        currency: "USD",
        remittance: "PO 77-ALPHA",
        purpose: "TRAD",
      },
      {
        uetr: "00000000-0000-0000-0000-000000000003",
        rail: "SWIFT",
        debtorName: "Blue Sun",
        debtorAccount: "GB00BLUESUN3",
        creditorName: "Tyrell Corp",
        creditorAccount: "DE00TYRELL03",
        amount: 9999.99,
        currency: "EUR",
        remittance: "Settlement",
        purpose: "GDDS",
      },
    ],
  });

  console.log("Seed completed - 3 payments created ✓");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
