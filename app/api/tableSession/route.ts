import { prisma } from "@/lib/prisma";
import { table } from "console";
import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.tableSession.findMany({
      where: {
        isActive: true,
        storeId,
      },
      include: {
        table: true,
        orders: {
          where: {
            status: { notIn: ["COMPLETED", "CANCELLED"] },
          },
          select: { id: true },
        },
      },
    });

    if (!sessions || sessions.length === 0) {
      return NextResponse.json(
        { success: true, data: [] },
        { status: 200 },
      );
    }

    // Identify and close any orphaned sessions (sessions marked active with 0 active orders)
    const validSessions = [];
    const orphanSessionIds: string[] = [];
    const orphanTableIds: string[] = [];

    for (const sessionItem of sessions) {
      if (sessionItem.orders.length > 0) {
        const { orders, ...rest } = sessionItem;
        validSessions.push(rest);
      } else {
        orphanSessionIds.push(sessionItem.id);
        if (sessionItem.tableId) {
          orphanTableIds.push(sessionItem.tableId);
        }
      }
    }

    // Auto-heal orphaned sessions in background/cleanup
    if (orphanSessionIds.length > 0) {
      await prisma.tableSession.updateMany({
        where: { id: { in: orphanSessionIds } },
        data: { isActive: false, endedAt: new Date() },
      });

      if (orphanTableIds.length > 0) {
        await prisma.table.updateMany({
          where: { id: { in: orphanTableIds } },
          data: { status: "ACTIVE" },
        });
      }
    }

    return NextResponse.json(
      { success: true, data: validSessions },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("tableSession error:", error.message);
    return NextResponse.json(
      { success: true, data: [] },
      { status: 200 },
    );
  }
}
