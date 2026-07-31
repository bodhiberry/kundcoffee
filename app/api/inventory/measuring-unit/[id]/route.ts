import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { name, shortName, description, sortOrder } = body;

    const updatedUnit = await prisma.measuringUnit.update({
      where: { id, storeId },
      data: {
        ...(name !== undefined && { name }),
        ...(shortName !== undefined && { shortName }),
        ...(description !== undefined && { description }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(String(sortOrder)) }),
      },
    });

    return NextResponse.json({ success: true, data: updatedUnit });
  } catch (error: any) {
    console.error("Error updating measuring unit:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update measuring unit" },
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
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    const stockCount = await prisma.stock.count({
      where: { unitId: id, storeId },
    });

    if (stockCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete unit as it is being used by stock items",
        },
        { status: 400 },
      );
    }

    await prisma.measuringUnit.delete({
      where: { id, storeId },
    });

    return NextResponse.json({
      success: true,
      message: "Unit deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting measuring unit:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete measuring unit" },
      { status: 500 },
    );
  }
}
