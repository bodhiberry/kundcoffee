import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Params } from "@/lib/types";
export async function GET(req: NextRequest,context: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const dailySession = await prisma.dailySession.findFirst({
      where: { id: id, storeId },
      include: {
        openedBy: { select: { name: true } },
        closedBy: { select: { name: true } },
        payments: true,
      }
    });

    if (!dailySession) {
      return NextResponse.json({ success: false, message: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: dailySession });
  } catch (error) {
    console.error("Daily Session Detail GET Error:", error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Params }) {
  try {
    const {id} = await context.params;
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;
    const userId = session?.user?.id;

    if (!storeId || !userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const dailySession = await prisma.dailySession.findFirst({
      where: { id: id, storeId },
      include: { payments: true }
    });

    if (!dailySession || dailySession.status !== "OPEN") {
      return NextResponse.json({ success: false, message: "Active session not found" }, { status: 404 });
    }

    const body = await req.json();
    const { actualClosingBalance, notes } = body;

    // Calculate expected closing balance (Opening Balance + Cash Sales)
    const cashSales = dailySession.payments
      .filter(p => p.method === "CASH" && p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0);

    const digitalSales = dailySession.payments
      .filter(p => p.method !== "CASH" && p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0);

    const expectedClosingBalance = dailySession.openingBalance + cashSales;
    const difference = (parseFloat(actualClosingBalance) || 0) - expectedClosingBalance;

    const updatedSession = await prisma.dailySession.update({
      where: { id: id },
      data: {
        closedAt: new Date(),
        closedById: userId,
        expectedClosingBalance,
        actualClosingBalance: parseFloat(actualClosingBalance) || 0,
        difference,
        status: "CLOSED",
        notes: `${dailySession.notes || ""}\n\nSystem Calculation:\n- Cash Sales: ${cashSales}\n- Digital Sales: ${digitalSales}\n- Notes: ${notes || ""}`.trim()
      }
    });

    return NextResponse.json({ success: true, data: updatedSession });
  } catch (error) {
    console.error("Daily Session PATCH Error:", error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}
