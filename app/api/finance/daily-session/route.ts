import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const active = searchParams.get("active");

    if (active === "true") {
      const activeSession = await prisma.dailySession.findFirst({
        where: {
          storeId,
          status: "OPEN",
        },
        include: {
          openedBy: {
            select: { name: true, email: true }
          },
          payments: {
            where: { status: "PAID" },
            select: { amount: true, method: true }
          }
        }
      });

      if (activeSession) {
        // Calculate current expected balance
        const cashSales = activeSession.payments
          .filter(p => p.method === "CASH")
          .reduce((sum, p) => sum + p.amount, 0);
        
        const digitalSales = activeSession.payments
          .filter(p => p.method !== "CASH")
          .reduce((sum, p) => sum + p.amount, 0);

        const currentExpectedBalance = activeSession.openingBalance + cashSales;

        return NextResponse.json({ 
          success: true, 
          data: { 
            ...activeSession, 
            currentExpectedBalance,
            currentCashSales: cashSales,
            currentDigitalSales: digitalSales
          } 
        });
      }

      return NextResponse.json({ success: true, data: null });
    }

    const sessions = await prisma.dailySession.findMany({
      where: { storeId },
      orderBy: { openedAt: "desc" },
      include: {
        openedBy: { select: { name: true } },
        closedBy: { select: { name: true } },
      }
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

    const newSession = await prisma.dailySession.create({
      data: {
        storeId,
        openedById: userId,
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
