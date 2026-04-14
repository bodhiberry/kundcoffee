
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Checking Active Daily Sessions...");
    const activeSessions = await prisma.dailySession.findMany({
        where: { status: 'OPEN' },
        include: {
            _count: {
                select: {
                    payments: true,
                    purchases: true,
                    orders: true
                }
            }
        }
    });

    console.log(`Found ${activeSessions.length} active sessions.`);
    for (const session of activeSessions) {
        console.log(`- Session ID: ${session.id}`);
        console.log(`- Store ID: ${session.storeId}`);
        console.log(`- Opened At: ${session.openedAt}`);
        console.log(`- Payments Count: ${session._count.payments}`);
        console.log(`- Purchases Count: ${session._count.purchases}`);
        console.log(`- Orders Count: ${session._count.orders}`);
        
        const payments = await prisma.payment.findMany({
            where: { dailySessionId: session.id }
        });
        console.log(`- Payments:`, payments.map(p => ({ method: p.method, amount: p.amount, status: p.status })));

        const purchases = await prisma.purchase.findMany({
            where: { dailySessionId: session.id }
        });
        console.log(`- Purchases:`, purchases.map(p => ({ mode: p.paymentMode, total: p.totalAmount, deleted: p.isDeleted })));
    }

    console.log("\nChecking for unlinked payments created today...");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const unlinkedPayments = await prisma.payment.findMany({
        where: {
            dailySessionId: null,
            createdAt: { gte: today }
        }
    });
    console.log(`Found ${unlinkedPayments.length} unlinked payments created today.`);
    for (const p of unlinkedPayments) {
        console.log(`- Payment ID: ${p.id}, Amount: ${p.amount}, Method: ${p.method}, Created At: ${p.createdAt}`);
    }

    console.log("\nChecking for unlinked purchases created today...");
    const unlinkedPurchases = await prisma.purchase.findMany({
        where: {
            dailySessionId: null,
            txnDate: { gte: today }
        }
    });
    console.log(`Found ${unlinkedPurchases.length} unlinked purchases created today.`);
    for (const p of unlinkedPurchases) {
        console.log(`- Purchase ID: ${p.id}, Amount: ${p.totalAmount}, Mode: ${p.paymentMode}, Date: ${p.txnDate}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
