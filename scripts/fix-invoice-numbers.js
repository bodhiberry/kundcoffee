const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Inlined helper for Nepali fiscal year start
function getFiscalYearStartAD(date = new Date()) {
  // Since we don't have the NepaliDate helper easily imported in a plain JS script,
  // let's approximate Shrawan 1 (usually July 16 or 17).
  // For 2026, Shrawan 1, 2083 is July 16, 2026.
  // We can safely use July 15, 2026 as the threshold to catch all invoices since yesterday.
  return new Date("2026-07-15T00:00:00Z");
}

async function main() {
  const stores = await prisma.store.findMany();
  console.log(`Found ${stores.length} store(s).`);

  const fiscalYearStart = getFiscalYearStartAD();
  console.log(`Targeting current Nepali Fiscal Year starting from (approx): ${fiscalYearStart.toISOString()}`);

  for (const store of stores) {
    console.log(`Processing store: ${store.name} (ID: ${store.id})`);

    // Fetch all completed orders since the start of fiscal year, ordered by createdAt
    const orders = await prisma.order.findMany({
      where: {
        storeId: store.id,
        status: "COMPLETED",
        createdAt: { gte: fiscalYearStart },
        isDeleted: false,
      },
      orderBy: { createdAt: "asc" },
    });

    console.log(`Found ${orders.length} completed orders since fiscal year start.`);

    let currentSeq = 0;

    for (const order of orders) {
      // Find the highest sequence number so far
      if (order.invoiceNumber && order.invoiceNumber > currentSeq) {
        currentSeq = order.invoiceNumber;
      }
    }

    console.log(`Current highest invoice sequence number: ${currentSeq}`);

    let assignedCount = 0;
    for (const order of orders) {
      if (!order.invoiceNumber) {
        currentSeq += 1;
        console.log(`Assigning sequence ${currentSeq} to Order ID ${order.id} (created at ${order.createdAt.toISOString()})`);
        
        // Update Order
        await prisma.order.update({
          where: { id: order.id },
          data: { invoiceNumber: currentSeq },
        });

        // Update corresponding Payment if it exists
        if (order.paymentId) {
          await prisma.payment.update({
            where: { id: order.paymentId },
            data: { invoiceNumber: currentSeq },
          });
        } else {
          // If payment doesn't exist, check if there's any payment connected via relation table/orders
          const connectedPayment = await prisma.payment.findFirst({
            where: {
              orders: { some: { id: order.id } }
            }
          });
          if (connectedPayment) {
            await prisma.payment.update({
              where: { id: connectedPayment.id },
              data: { invoiceNumber: currentSeq },
            });
            // Update order with paymentId
            await prisma.order.update({
              where: { id: order.id },
              data: { paymentId: connectedPayment.id },
            });
          } else {
            // Create a default payment if none exists for a completed order
            const newPayment = await prisma.payment.create({
              data: {
                amount: order.total,
                method: "CASH",
                status: "PAID",
                storeId: store.id,
                invoiceNumber: currentSeq,
                orders: {
                  connect: { id: order.id },
                },
              }
            });
            await prisma.order.update({
              where: { id: order.id },
              data: { paymentId: newPayment.id },
            });
          }
        }
        assignedCount++;
      } else {
        // Order has invoiceNumber, make sure Payment has it synced
        if (order.paymentId) {
          await prisma.payment.updateMany({
            where: { id: order.paymentId, invoiceNumber: null },
            data: { invoiceNumber: order.invoiceNumber },
          });
        }
      }
    }

    console.log(`Finished processing store ${store.name}. Assigned ${assignedCount} new invoice numbers.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
