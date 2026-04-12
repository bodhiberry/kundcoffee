import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    const where: any = {
      isDeleted: false,
      storeId, // Filter by storeId
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

    if (status) {
      where.status = status;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        orders: {
          include: {
            customer: true,
            items: {
              include: {
                dish: true,
              },
            },
          },
        },
        session: {
          include: {
            table: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Metrics calculation
    const totalSales = payments.reduce((acc, p) => acc + p.amount, 0);
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

    const response: ApiResponse = {
      success: true,
      data: {
        metrics: {
          totalOrders,
          totalSales: salesTotal,
          leadingPayment,
          purchases: purchasesTotal,
          income: salesTotal + paymentInTotal,
          expenses: expensesTotal,
          paymentIn: paymentInTotal,
          paymentOut: paymentOutTotal,
          returns: returnsTotal,
        },
        transactions: payments.map((p) => {
          const order = p.orders?.[0];
          return {
            id: p.id,
            orderId: order?.id,
            sessionId: p.sessionId,
            orderType: order?.type || "DINE_IN", // Fallback for sessions
            amount: p.amount,
            mode: p.method,
            status: p.status,
            date: p.createdAt,
            billedBy: "Admin", // Placeholder as User model is not present
            customer: order?.customer?.fullName || "Guest",
            items:
              order?.items.map((it: any) => ({
                dishName: it.dish?.name || "Unknown Item",
                quantity: it.quantity,
                amount: it.totalPrice,
              })) || [],
          };
        }),
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
