// lib/checkout-helper.ts
import { prisma } from "@/lib/prisma";

export async function finalizeSessionTransaction(data: {
  orderId?: string;
  sessionId: string | null;
  tableId: string | null;
  amount: number;
  subtotal: number;
  tax: number;
  serviceCharge: number;
  discount: number;
  customerId?: string;
  paymentMethod: string;
  payments?: { method: string; amount: number }[];
  complimentaryItems?: Record<string, number> | null;
  extraFreeItems?:
    | { dishId?: string; name: string; unitPrice: number; quantity: number }[]
    | null;
  storeId?: string;
  staffId?: string;
}) {
  const {
    orderId,
    sessionId,
    tableId,
    amount,
    subtotal,
    tax,
    serviceCharge,
    discount,
    customerId,
    paymentMethod,
    payments,
    storeId,
    staffId,
  } = data;

  const complimentaryItems = data.complimentaryItems || {};
  const extraFreeItems = data.extraFreeItems || [];

  return await prisma.$transaction(
    async (tx) => {
      // 0. Resolve the mandatory Store ID
      let finalStoreId = storeId;
      if (!finalStoreId) {
        if (tableId) {
          const table = await tx.table.findUnique({
            where: { id: tableId },
            select: { storeId: true },
          });
          finalStoreId = table?.storeId || undefined;
        }

        if (!finalStoreId && sessionId) {
          // Try to get storeId from session
          const session = await tx.tableSession.findUnique({
            where: { id: sessionId },
            select: { storeId: true },
          });
          finalStoreId = session?.storeId || undefined;
        }

        if (!finalStoreId && orderId) {
          const order = await tx.order.findUnique({
            where: { id: orderId },
            select: { storeId: true },
          });
          finalStoreId = order?.storeId || undefined;
        }

        if (!finalStoreId) {
          throw new Error("Store identification failed. storeId is required.");
        }
      }

      // 0.1 Find Active Daily Session
      const activeDailySession = await tx.dailySession.findFirst({
        where: { storeId: finalStoreId, status: "OPEN" },
        select: { id: true },
      });
      const dailySessionId = activeDailySession?.id || null;

      // 1. Handle Payments
      // Delete existing payments for this session/order to avoid duplicates
      if (sessionId) {
        await tx.payment.deleteMany({
          where: { sessionId: sessionId },
        });
      }

      const paymentRecords = [];
      const splitPayments =
        payments && payments.length > 0
          ? payments
          : [{ method: paymentMethod, amount }];

      for (const p of splitPayments) {
        const paymentStatus = (
          p.method === "CREDIT" ? "CREDIT" : "PAID"
        ) as any;
        const createdPayment = await tx.payment.create({
          data: {
            amount: p.amount,
            method: p.method as any,
            status: paymentStatus,
            sessionId: sessionId || null,
            storeId: finalStoreId as string,
            staffId: staffId || null,
            dailySessionId: dailySessionId,
          },
        });
        paymentRecords.push(createdPayment);
      }

      const finalPaymentId = paymentRecords[0]?.id || null;

      // 2. Update orders to COMPLETED
      const orders = await tx.order.findMany({
        where: {
          OR: [
            sessionId ? { sessionId } : {},
            orderId ? { id: orderId } : {},
          ].filter((q) => Object.keys(q).length > 0),
          storeId: finalStoreId,
          status: { in: ["PENDING", "PREPARING", "READYTOPICK", "SERVED"] },
        },
        include: { items: true },
      });

      for (const order of orders) {
        await tx.order.update({
          where: { id: order.id, storeId: finalStoreId },
          data: {
            status: "COMPLETED",
            customerId: customerId || null,
            staffId: staffId || order.staffId,
            paymentId: finalPaymentId,
            dailySessionId: dailySessionId,
          },
        });

        // Update OrderItems with manual complimentary quantities
        for (const item of order.items) {
          const compQty = complimentaryItems[item.id] || 0;
          if (compQty > 0) {
            await tx.orderItem.update({
              where: { id: item.id },
              data: { complimentaryQuantity: compQty },
            });
          }
        }
      }

      // 3. Handle extra free items
      if (extraFreeItems.length > 0) {
        await tx.order.create({
          data: {
            sessionId: sessionId || null,
            tableId: tableId || null,
            storeId: finalStoreId as string,
            type: tableId ? "DINE_IN" : "TAKE_AWAY",
            status: "COMPLETED",
            customerId: customerId || null,
            paymentId: finalPaymentId,
            total: 0,
            dailySessionId: dailySessionId,
            items: {
              create: extraFreeItems.map((item) => ({
                dishId: item.dishId || null,
                remarks: item.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: 0,
                status: "SERVED",
                complimentaryQuantity: item.quantity,
              })),
            },
          },
        });
      }

      // 4. Handle stray orders on the table (Dine-in only)
      if (tableId && sessionId) {
        await tx.order.updateMany({
          where: {
            tableId,
            storeId: finalStoreId,
            status: { in: ["PENDING", "PREPARING", "READYTOPICK", "SERVED"] },
            sessionId: null,
          },
          data: {
            status: "COMPLETED",
            customerId: customerId || null,
            staffId: staffId || null,
            paymentId: finalPaymentId,
            sessionId: sessionId || null,
            dailySessionId: dailySessionId,
          },
        });
      }

      // 5. Close the TableSession if exists
      if (sessionId) {
        const sessionExists = await tx.tableSession.findUnique({
          where: { id: sessionId },
        });

        if (sessionExists) {
          await tx.tableSession.update({
            where: { id: sessionId },
            data: {
              isActive: false,
              endedAt: new Date(),
              total: subtotal || 0,
              discount: discount || 0,
              serviceCharge: serviceCharge || 0,
              tax: tax || 0,
              grandTotal: amount,
            },
          });
        }

        // 6. Reset Table status to ACTIVE if exists
        if (tableId) {
          await tx.table.update({
            where: { id: tableId, storeId: finalStoreId },
            data: { status: "ACTIVE" },
          });
        }
      }

      // 7. Handle Customer Ledger
      if (customerId) {
        const pointsEarned = Math.floor(amount / 100);
        await tx.customer.update({
          where: { id: customerId, storeId: finalStoreId },
          data: { loyaltyPoints: { increment: pointsEarned } },
        });

        const lastLedger = await tx.customerLedger.findFirst({
          where: { customerId, storeId: finalStoreId },
          orderBy: { createdAt: "desc" },
        });

        const currentBalance = lastLedger ? lastLedger.closingBalance : 0;
        const newBalance = currentBalance + amount;

        await tx.customerLedger.create({
          data: {
            customerId,
            storeId: finalStoreId as string,
            txnNo: `SALE-${Date.now()}-${(sessionId || "TA").substring(0, 4)}`,
            type: "SALE",
            amount: amount,
            closingBalance: newBalance,
            referenceId: sessionId || finalPaymentId,
            remarks: tableId
              ? `Table Checkout - ${tableId} (${paymentMethod})`
              : `Take Away Checkout (${paymentMethod})`,
          },
        });

        // Create PAYMENT_IN entries
        let runningBalance = newBalance;
        for (const payRec of paymentRecords) {
          if (payRec.status === "PAID") {
            runningBalance -= payRec.amount;
            await tx.customerLedger.create({
              data: {
                customerId,
                storeId: finalStoreId as string,
                txnNo: `PAY-${Date.now()}-${payRec.id.substring(0, 4)}`,
                type: "PAYMENT_IN",
                amount: payRec.amount,
                closingBalance: runningBalance,
                referenceId: payRec.id,
                remarks: `Payment for Order - ${payRec.method}`,
              },
            });
          }
        }
      }

      return { success: true };
    },
    { timeout: 20000 },
  );
}
