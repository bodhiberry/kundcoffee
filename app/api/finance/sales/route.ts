import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const search = searchParams.get("search");

    const where: any = {
      isDeleted: false,
      storeId,
    };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { gte: start, lte: end };
    } else if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      where.createdAt = { gte: start, lte: end };
    } else if (filter) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      if (filter === "today") {
        where.createdAt = { gte: start, lte: end };
      } else if (filter === "yesterday") {
        const yesterdayStart = new Date(start);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(end);
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
        where.createdAt = { gte: yesterdayStart, lte: yesterdayEnd };
      } else if (filter === "this_month") {
        start.setDate(1);
        where.createdAt = { gte: start, lte: end };
      } else if (filter === "this_year") {
        start.setMonth(0, 1);
        where.createdAt = { gte: start, lte: end };
      }
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        {
          orders: {
            some: {
              customer: { fullName: { contains: search, mode: "insensitive" } },
            },
          },
        },
        {
          orders: {
            some: { id: { contains: search, mode: "insensitive" } },
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    } else {
      where.status = { notIn: ["FAILED"] };
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        orders: {
          include: {
            customer: true,
            table: true,
            items: {
              include: {
                dish: true,
                combo: true,
              },
            },
          },
        },
        session: {
          include: {
            table: true,
          },
        },
        staff: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Metrics calculation - Standardized to match Dashboard (PAID only for main total)
    const totalSales = payments
      .filter((p) => p.status === "PAID")
      .reduce((acc, p) => acc + p.amount, 0);
    
    const creditSalesTotal = payments
      .filter((p) => p.method === "CREDIT")
      .reduce((acc, p) => acc + p.amount, 0);

    const totalOrders = new Set(
      payments.map((p) => p.orders?.[0]?.id || p.sessionId).filter(Boolean),
    ).size;

    const methodCounts: Record<string, number> = {};
    payments.forEach((p) => {
      methodCounts[p.method] = (methodCounts[p.method] || 0) + 1;
    });

    let leadingPayment = "N/A";
    let maxCount = 0;
    for (const [method, count] of Object.entries(methodCounts)) {
      if (count > maxCount) {
        maxCount = count;
        leadingPayment = method;
      }
    }

    // Additional Metrics calculation
    const dateRange = where.createdAt;
    
    const [purchases, expenses, paymentIn, paymentOut, returns] = await Promise.all([
      prisma.purchase.aggregate({
        _sum: { totalAmount: true },
        where: {
          storeId,
          txnDate: dateRange,
          isDeleted: false,
        },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: {
          storeId,
          date: dateRange,
        },
      }),
      prisma.customerLedger.aggregate({
        _sum: { amount: true },
        where: {
          storeId,
          type: "PAYMENT_IN",
          createdAt: dateRange,
        },
      }),
      prisma.customerLedger.aggregate({
        _sum: { amount: true },
        where: {
          storeId,
          type: "PAYMENT_OUT",
          createdAt: dateRange,
        },
      }),
      prisma.salesReturn.aggregate({
        _sum: { totalAmount: true },
        where: {
          storeId,
          txnDate: dateRange,
          isDeleted: false,
        },
      }),
    ]);

    const salesTotal = totalSales;
    const purchasesTotal = purchases._sum.totalAmount || 0;
    const expensesTotal = expenses._sum.amount || 0;
    const paymentInTotal = paymentIn._sum.amount || 0;
    const paymentOutTotal = paymentOut._sum.amount || 0;
    const returnsTotal = returns._sum.totalAmount || 0;

    const transactionsMap = new Map<string, any>();

    payments.forEach((p: any) => {
      // Use splitGroupId as key, or p.id if it's a single payment without splitGroupId
      const key = p.splitGroupId || p.id;
      
      if (!transactionsMap.has(key)) {
        const order = p.orders?.[0];
        const allItems = p.orders?.flatMap((o: any) => 
          o.items.map((it: any) => ({
            dishName: it.dish?.name || it.combo?.name || it.remarks || "Unknown Item",
            quantity: it.quantity,
            amount: it.totalPrice,
          }))
        ) || [];

        transactionsMap.set(key, {
          id: p.id,
          orderId: order?.id,
          sessionId: p.sessionId,
          splitGroupId: p.splitGroupId,
          orderType: order?.type || "DINE_IN", 
          amount: p.amount,
          mode: p.method,
          modes: [{ method: p.method, amount: p.amount }],
          status: p.status,
          date: p.createdAt,
          billedBy: p.staff?.name || "Admin",
          customer: order?.customer?.fullName || "Guest",
          table: order?.table?.name || p.session?.table?.name || "N/A",
          items: allItems,
          invoiceNumber: p.invoiceNumber,
        });
      } else {
        const existing = transactionsMap.get(key);
        existing.amount += p.amount;
        existing.modes.push({ method: p.method, amount: p.amount });
        // Join modes for the 'mode' display field
        existing.mode = existing.modes.map((m: any) => m.method).join(", ");
        
        // If this payment has orders (unlikely for subsequent ones but safe), add items
        if (p.orders?.length > 0) {
          const newItems = p.orders.flatMap((o: any) => 
            o.items.map((it: any) => ({
              dishName: it.dish?.name || it.combo?.name || it.remarks || "Unknown Item",
              quantity: it.quantity,
              amount: it.totalPrice,
            }))
          );
          existing.items = [...existing.items, ...newItems];
        }
      }
    });

    const cashSales = payments
      .filter((p) => p.method === "CASH" && p.status === "PAID")
      .reduce((acc, p) => acc + p.amount, 0);
    const digitalSales = payments
      .filter((p) => ["QR", "ESEWA", "CARD", "BANK_TRANSFER"].includes(p.method) && p.status === "PAID")
      .reduce((acc, p) => acc + p.amount, 0);

    const response: ApiResponse = {
      success: true,
      data: {
        metrics: {
          totalOrders,
          totalSales: salesTotal,
          cashSales,
          digitalSales,
          creditSales: creditSalesTotal,
          leadingPayment,
          purchases: purchasesTotal,
          income: salesTotal + paymentInTotal,
          expenses: expensesTotal,
          paymentIn: paymentInTotal,
          paymentOut: paymentOutTotal,
          returns: returnsTotal,
        },
        transactions: Array.from(transactionsMap.values()),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Sales API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { customerId, amount, paymentMethod, description, staffId, date } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid amount" },
        { status: 400 },
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, message: "Payment method is required" },
        { status: 400 },
      );
    }

    // 0. Find active daily session
    const activeDailySession = await prisma.dailySession.findFirst({
      where: { storeId, status: "OPEN" },
      select: { id: true },
      orderBy: { openedAt: "desc" },
    });
    const dailySessionId = activeDailySession?.id || null;

    const txnDate = date ? new Date(date) : new Date();

    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Create Payment
        const paymentStatus = paymentMethod === "CREDIT" ? "CREDIT" : "PAID";
        const splitGroupId = `split-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const payment = await tx.payment.create({
          data: {
            amount: parseFloat(amount),
            method: paymentMethod,
            status: paymentStatus,
            storeId,
            staffId: staffId || null,
            dailySessionId,
            splitGroupId,
            createdAt: txnDate,
          },
        });

        // 2. Create Order
        const order = await tx.order.create({
          data: {
            storeId,
            type: "QUICK_BILLING",
            status: "COMPLETED",
            total: parseFloat(amount),
            customerId: customerId || null,
            staffId: staffId || null,
            dailySessionId,
            paymentId: payment.id,
            splitGroupId,
            createdAt: txnDate,
            items: {
              create: [
                {
                  remarks: description || "Quick Sale Item",
                  quantity: 1,
                  unitPrice: parseFloat(amount),
                  totalPrice: parseFloat(amount),
                  status: "COMPLETED",
                },
              ],
            },
          },
        });

        // 3. Customer Ledger
        if (customerId) {
          const pointsEarned = Math.floor(amount / 100);
          await tx.customer.update({
            where: { id: customerId, storeId },
            data: { loyaltyPoints: { increment: pointsEarned } },
          });

          const lastLedger = await tx.customerLedger.findFirst({
            where: { customerId, storeId },
            orderBy: { createdAt: "desc" },
          });

          const currentBalance = lastLedger ? lastLedger.closingBalance : 0;
          const newBalance = currentBalance + parseFloat(amount);

          await tx.customerLedger.create({
            data: {
              customerId,
              storeId,
              txnNo: `SALE-${Date.now()}-QS`,
              type: "SALE",
              amount: parseFloat(amount),
              closingBalance: newBalance,
              referenceId: payment.id,
              splitGroupId,
              remarks: `Quick Sale Checkout (${paymentMethod})`,
              createdAt: txnDate,
            },
          });

          if (paymentStatus === "PAID") {
            await tx.customerLedger.create({
              data: {
                customerId,
                storeId,
                txnNo: `PAY-${Date.now()}-QS`,
                type: "PAYMENT_IN",
                amount: parseFloat(amount),
                closingBalance: newBalance - parseFloat(amount),
                referenceId: payment.id,
                splitGroupId,
                remarks: `Payment for Quick Sale - ${paymentMethod}`,
                createdAt: txnDate,
              },
            });
          }
        }

        return { payment, order };
      },
      { timeout: 20000 },
    );

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Quick Sale POST Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
