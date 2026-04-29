import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
} from "date-fns";
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
    const date = searchParams.get("date");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    let startDate: Date | undefined;
    let endDate: Date | undefined;
    let sessionId: string | undefined;

    // Check for an active session
    const activeSession = await prisma.dailySession.findFirst({
      where: {
        storeId,
        status: "OPEN",
      },
    });

    if (date) {
      startDate = startOfDay(new Date(date));
      endDate = endOfDay(new Date(date));
    } else if (month && year) {
      const d = new Date(parseInt(year), parseInt(month) - 1);
      startDate = startOfMonth(d);
      endDate = endOfMonth(d);
    } else if (filter) {
      const now = new Date();
      if (filter === "today") {
        startDate = startOfDay(now);
        endDate = endOfDay(now);
      } else if (filter === "yesterday") {
        const y = subDays(now, 1);
        startDate = startOfDay(y);
        endDate = endOfDay(y);
      } else if (filter === "this_month") {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      } else if (filter === "this_year") {
        startDate = startOfYear(now);
        endDate = endOfYear(now);
      }
    } else if (activeSession) {
      // DEFAULT: Use active session if no filter is provided
      sessionId = activeSession.id;
    } else {
      // No filter and no active session: Start from zero as requested
      // The user wants strictly session data, "if not nothing"
      return NextResponse.json({
        success: true,
        isSessionData: true,
        hasActiveSession: false,
        data: {
          sales: 0,
          purchases: 0,
          difference: 0,
          income: 0,
          expenses: 0,
          paymentIn: 0,
          paymentOut: 0,
          returns: 0,
        },
      });
    }

    const whereBase: any = { storeId };
    if (sessionId) {
      whereBase.dailySessionId = sessionId;
    } else if (startDate && endDate) {
      whereBase.createdAt = { gte: startDate, lte: endDate };
    }

    // Determine fallback date range for models without dailySessionId when in session mode
    let fallbackDateFilter: any = undefined;
    if (sessionId && activeSession) {
      fallbackDateFilter = {
        gte: activeSession.openedAt,
        lte: new Date(),
      };
    }

    const type = searchParams.get("type");
    if (type === "chart") {
      const payments = await prisma.payment.findMany({
        where: {
          ...whereBase,
          status: "PAID",
          isDeleted: false,
        },
        select: {
          amount: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      if (sessionId) {
        // Hourly grouping for session data
        const hourlyMap = new Map<string, number>();
        payments.forEach((p) => {
          const hour = new Date(p.createdAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            hour12: true,
          });
          const current = hourlyMap.get(hour) || 0;
          hourlyMap.set(hour, current + p.amount);
        });

        const chartData = Array.from(hourlyMap.entries()).map(([hour, total]) => ({
          date: hour, // reusing the field 'date' for simplicity in frontend
          total,
        }));

        return NextResponse.json({
          success: true,
          data: chartData,
        });
      } else {
        // Daily grouping for historical data
        const dailyMap = new Map<string, number>();
        payments.forEach((p) => {
          const day = new Date(p.createdAt).toLocaleDateString("en-CA");
          const current = dailyMap.get(day) || 0;
          dailyMap.set(day, current + p.amount);
        });

        const chartData = Array.from(dailyMap.entries()).map(([date, total]) => ({
          date,
          total,
        }));

        chartData.sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({
          success: true,
          data: chartData,
        });
      }
    }

    const [sales, purchases, expenses, paymentIn, paymentOut, returns, creditSales, creditPurchases] =
      await Promise.all([
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            ...whereBase,
            status: "PAID",
            isDeleted: false,
          },
        }),
        prisma.purchase.aggregate({
          _sum: { totalAmount: true },
          where: {
            ...whereBase,
            // Map whereBase date filter to txnDate if not using session
            ...(sessionId? {} : {
              createdAt: undefined,
              txnDate: whereBase.createdAt
            })
          },
        }),
        prisma.expense.aggregate({
          _sum: { amount: true },
          where: {
            ...whereBase,
            // Map whereBase date filter to 'date' if not using session
            ...(sessionId? {} : {
              createdAt: undefined,
              date: whereBase.createdAt
            })
          },
        }),
        prisma.customerLedger.aggregate({
          _sum: { amount: true },
          where: {
            storeId,
            ...(sessionId ? { createdAt: fallbackDateFilter } : { createdAt: whereBase.createdAt }),
            type: "PAYMENT_IN",
          },
        }),
        prisma.customerLedger.aggregate({
          _sum: { amount: true },
          where: {
            storeId,
            ...(sessionId ? { createdAt: fallbackDateFilter } : { createdAt: whereBase.createdAt }),
            type: "PAYMENT_OUT",
          },
        }),
        prisma.salesReturn.aggregate({
          _sum: { totalAmount: true },
          where: {
            storeId,
            isDeleted: false,
            ...(sessionId ? { txnDate: fallbackDateFilter } : { txnDate: whereBase.createdAt }),
          },
        }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            ...whereBase,
            method: "CREDIT",
            isDeleted: false,
          },
        }),
        prisma.purchase.aggregate({
          _sum: { totalAmount: true },
          where: {
            ...whereBase,
            paymentMode: "CREDIT",
            ...(sessionId? {} : {
              createdAt: undefined,
              txnDate: whereBase.createdAt
            })
          },
        }),
      ]);

    const salesTotal = sales._sum.amount || 0;
    const purchasesTotal = purchases._sum.totalAmount || 0;
    const expensesTotal = expenses._sum.amount || 0;
    const paymentInTotal = paymentIn._sum.amount || 0;
    const paymentOutTotal = paymentOut._sum.amount || 0;
    const returnsTotal = returns._sum.totalAmount || 0;
    const creditSalesTotal = creditSales._sum.amount || 0;
    const creditPurchasesTotal = creditPurchases._sum.totalAmount || 0;

    const response: any = {
      success: true,
      isSessionData: !!sessionId,
      hasActiveSession: !!activeSession,
      data: {
        sales: salesTotal,
        purchases: purchasesTotal,
        creditSales: creditSalesTotal,
        creditPurchases: creditPurchasesTotal,
        difference: salesTotal - purchasesTotal,
        income: salesTotal + paymentInTotal, // Aggregated inflow
        expenses: expensesTotal,
        paymentIn: paymentInTotal,
        paymentOut: paymentOutTotal,
        returns: returnsTotal,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Dashboard Metrics Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
