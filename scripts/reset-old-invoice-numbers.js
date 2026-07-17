const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Today's date at midnight (Nepal Time UTC+5:45 → subtract to get UTC midnight)
  // 2026-07-17 00:00:00 NPT = 2026-07-16 18:15:00 UTC
  const todayStartUTC = new Date("2026-07-16T18:15:00.000Z");
  
  console.log(`Clearing invoiceNumber from all orders/payments created BEFORE: ${todayStartUTC.toISOString()}`);
  console.log(`(This is 2026-07-17 00:00:00 Nepal Time)`);
  console.log("");

  // 1. Clear invoiceNumber from Orders created before today
  const orderResult = await prisma.order.updateMany({
    where: {
      createdAt: { lt: todayStartUTC },
      invoiceNumber: { not: null },
    },
    data: { invoiceNumber: null },
  });
  console.log(`Cleared invoiceNumber from ${orderResult.count} old orders.`);

  // 2. Clear invoiceNumber from Payments created before today
  const paymentResult = await prisma.payment.updateMany({
    where: {
      createdAt: { lt: todayStartUTC },
      invoiceNumber: { not: null },
    },
    data: { invoiceNumber: null },
  });
  console.log(`Cleared invoiceNumber from ${paymentResult.count} old payments.`);

  // 3. Verify: check what's left (should only be today's orders)
  const remainingOrders = await prisma.order.count({
    where: { invoiceNumber: { not: null } },
  });
  const remainingPayments = await prisma.payment.count({
    where: { invoiceNumber: { not: null } },
  });
  console.log("");
  console.log(`Remaining orders with invoiceNumber: ${remainingOrders} (should be only today's)`);
  console.log(`Remaining payments with invoiceNumber: ${remainingPayments} (should be only today's)`);

  // 4. Show the next invoice number that will be assigned
  const maxOrder = await prisma.order.findFirst({
    where: { invoiceNumber: { not: null } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });
  const maxPayment = await prisma.payment.findFirst({
    where: { invoiceNumber: { not: null } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });
  const currentMax = Math.max(maxOrder?.invoiceNumber || 0, maxPayment?.invoiceNumber || 0);
  console.log(`Current max invoiceNumber: ${currentMax}`);
  console.log(`Next checkout will get invoiceNumber: ${currentMax + 1}`);
  console.log("");
  console.log("Done! Old invoices will now show their original ID format.");
  console.log("New checkouts from today will start at INVGB8384-001 (or next available).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
