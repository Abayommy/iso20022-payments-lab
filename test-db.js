const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    const count = await prisma.payment.count();
    console.log(`✅ Found ${count} payments in database`);
    await prisma.$disconnect();
    console.log('🎉 Everything is working!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}
test();
