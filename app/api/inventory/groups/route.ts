import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const storeId = session.user.storeId;

    const groups = await prisma.stockGroup.findMany({
      where: { storeId },
      include: { _count: { select: { stocks: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, data: groups });
  } catch (error) {
    console.error("Stock Groups GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const storeId = session.user.storeId;

    const { name, description, sortOrder } = await req.json();

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 },
      );
    }

    let finalSortOrder = parseInt(String(sortOrder));
    if (!finalSortOrder) {
      const lastGroup = await prisma.stockGroup.findFirst({
        where: { storeId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      finalSortOrder = lastGroup ? lastGroup.sortOrder + 1 : 1;
    }

    const group = await prisma.stockGroup.create({
      data: {
        name,
        description,
        sortOrder: finalSortOrder,
        storeId,
      },
    });

    return NextResponse.json({ success: true, data: group });
  } catch (error) {
    console.error("Stock Groups POST Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
