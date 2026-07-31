import { prisma } from "@/lib/prisma";
import { Params } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
export async function GET(req: NextRequest, context: { params: Params }) {
  try {
    const { id } = await context.params;
    if (!id)
      return NextResponse.json(
        {
          success: false,
          message: "Stock not found",
        },
        { status: 400 },
      );

    const stock = await prisma.stock.findUnique({
      where: { id },
      include: { unit: true },
    });

    if (!stock)
      return NextResponse.json(
        {
          success: false,
          message: "Stock Item not found ",
        },
        { status: 400 },
      );

    return NextResponse.json(
      {
        success: true,
        data: stock,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 400 },
    );
  }
}

export async function PATCH(req: NextRequest, context: { params: Params }) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Stock not found" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { name, unitId, groupId, quantity, amount, costPrice, sortOrder } = body;

    const existingStock = await prisma.stock.findUnique({
      where: { id },
    });

    if (!existingStock) {
      return NextResponse.json(
        { success: false, message: "Stock item not found" },
        { status: 404 },
      );
    }

    const updatedStock = await prisma.stock.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(unitId !== undefined && { unitId }),
        ...(groupId !== undefined && { groupId }),
        ...(quantity !== undefined && { quantity }),
        ...(amount !== undefined && { amount }),
        ...(costPrice !== undefined && { costPrice }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(String(sortOrder)) }),
      },
      include: { unit: true },
    });


    return NextResponse.json(
      { success: true, message: "Stock updated", data: updatedStock },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, context: { params: Params }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const stock = await prisma.stock.findUnique({
      where: { id, storeId },
      include: {
        _count: {
          select: {
            consumptions: true,
            purchaseItems: true,
            purchaseReturnItems: true,
          },
        },
      },
    });

    if (!stock) {
      return NextResponse.json(
        { success: false, message: "Stock item not found" },
        { status: 404 },
      );
    }

    if (
      stock._count.consumptions > 0 ||
      stock._count.purchaseItems > 0 ||
      stock._count.purchaseReturnItems > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete stock item because it has associated transaction records.",
        },
        { status: 400 },
      );
    }

    await prisma.stock.delete({
      where: { id, storeId },
    });

    return NextResponse.json({
      success: true,
      message: "Stock item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting stock:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete stock item" },
      { status: 500 },
    );
  }
}
