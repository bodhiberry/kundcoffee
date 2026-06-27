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
      },
    });
    if (!sessions)
      return NextResponse.json(
        { success: true, data: [] },
        { status: 200 },
      );

    return NextResponse.json(
      { success: true, data: sessions },
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
