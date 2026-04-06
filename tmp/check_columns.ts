import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'DailySession'
    `;
    console.log('Columns in DailySession:', result);
  } catch (e) {
    console.error('Error checking columns:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
