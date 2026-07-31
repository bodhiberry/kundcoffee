import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const storeId = session.user.storeId;

    const { id } = await params;
    const { name, description, sortOrder } = await req.json();

    const group = await prisma.stockGroup.updateMany({
      where: { id, storeId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(String(sortOrder)) }),
      },
    });

    if (group.count === 0) {
      return NextResponse.json(
        { success: false, message: "Group not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, message: "Group updated" });
  } catch (error) {
    console.error("Stock Groups PATCH Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const storeId = session.user.storeId;

    const { id } = await params;

    // Check if group has stocks
    const stocksCount = await prisma.stock.count({
      where: { groupId: id, storeId },
    });

    if (stocksCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete group with associated stocks",
        },
        { status: 400 },
      );
    }

    const group = await prisma.stockGroup.deleteMany({
      where: { id, storeId },
    });

    if (group.count === 0) {
      return NextResponse.json(
        { success: false, message: "Group not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, message: "Group deleted" });
  } catch (error) {
    console.error("Stock Groups DELETE Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
