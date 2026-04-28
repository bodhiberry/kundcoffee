import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { autoCloseStaleSessions } from "@/services/session-service";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isActiveOnly = searchParams.get("active") === "true";

    if (isActiveOnly) {
      // Auto-close any stale sessions first
      await autoCloseStaleSessions(storeId);

      const activeSession = await prisma.dailySession.findFirst({
        where: { storeId, status: "OPEN" },
        include: {
          openedBy: { select: { name: true } },
          closedBy: { select: { name: true } },
          payments: {
            select: { method: true, amount: true, status: true }
          },
          purchases: {
            where: { isDeleted: false, paymentMode: "CASH" },
            select: { totalAmount: true }
          }
        }
      });

      if (!activeSession) {
        return NextResponse.json({ success: true, data: null });
      }

      // Compute live financial figures
      const relevantPayments = activeSession.payments.filter(
        (p) => p.status === "PAID" || p.status === "CREDIT"
      );

      const salesByMethod: Record<string, number> = {
        CASH: 0, QR: 0, ESEWA: 0, CARD: 0, BANK_TRANSFER: 0, CREDIT: 0
      };

      for (const p of relevantPayments) {
        const amount = parseFloat(p.amount.toString());
        salesByMethod[p.method] = (salesByMethod[p.method] ?? 0) + amount;
      }

      const currentCashSales = salesByMethod.CASH;
      const currentDigitalSales = (salesByMethod.QR ?? 0) + (salesByMethod.ESEWA ?? 0) + (salesByMethod.CARD ?? 0) + (salesByMethod.BANK_TRANSFER ?? 0);
      const currentCreditSales = salesByMethod.CREDIT ?? 0;
      const currentCashOutflow = activeSession.purchases.reduce(
        (sum, p) => sum + parseFloat(p.totalAmount.toString()), 0
      );
      const currentExpectedBalance =
        parseFloat(activeSession.openingBalance.toString()) + currentCashSales - currentCashOutflow;
      const totalRevenue = Object.values(salesByMethod).reduce((s, a) => s + a, 0);

      // Strip raw relation arrays before responding (keep it clean)
      const { payments: _p, purchases: _pu, ...sessionBase } = activeSession;

      return NextResponse.json({
        success: true,
        data: {
          ...sessionBase,
          currentCashSales,
          currentCashOutflow,
          currentDigitalSales,
          currentCreditSales,
          currentExpectedBalance,
          totalRevenue
        }
      });
    }

    const sessions = await prisma.dailySession.findMany({
      where: { storeId },
      include: {
        openedBy: { select: { name: true } },
        closedBy: { select: { name: true } }
      },
      orderBy: { openedAt: "desc" }
    });

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error("Daily Session GET Error:", error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;
    const userId = session?.user?.id;

    if (!storeId || !userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { openingBalance, notes } = body;

    // Auto-close any stale sessions first
    await autoCloseStaleSessions(storeId);

    // Check if there's already an active session
    const existingActive = await prisma.dailySession.findFirst({
      where: {
        storeId,
        status: "OPEN",
      }
    });

    if (existingActive) {
      return NextResponse.json({ success: false, message: "A session is already active" }, { status: 400 });
    }

    // Use full connection syntax to ensure Prisma validation passes
    const newSession = await prisma.dailySession.create({
      data: {
        store: { connect: { id: storeId } },
        openedBy: { connect: { id: userId } },
        openingBalance: parseFloat(openingBalance) || 0,
        notes,
        status: "OPEN",
      }
    });

    return NextResponse.json({ success: true, data: newSession });
  } catch (error) {
    console.error("Daily Session POST Error:", error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}
