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
    const isActiveOnly = searchParams.get("active") === "true";

    if (isActiveOnly) {
      const activeSession = await prisma.dailySession.findFirst({
        where: { storeId, status: "OPEN" },
        include: {
          openedBy: { select: { name: true } },
          closedBy: { select: { name: true } }
        }
      });
      return NextResponse.json({ success: true, data: activeSession });
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
