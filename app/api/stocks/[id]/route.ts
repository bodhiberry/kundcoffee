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
      include: {
        unit: true,
        group: true,
        consumptions: {
          include: {
            dish: {
              select: { id: true, name: true },
            },
          },
        },
        audits: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!stock)
      return NextResponse.json(
        {
          success: false,
          message: "Stock Item not found",
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
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!id || !storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized or stock not found" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const {
      name,
      unitId,
      groupId,
      quantity,
      costPrice,
      sellingPrice,
      sortOrder,
      type,
      dishConsumptions,
    } = body;

    const existingStock = await prisma.stock.findUnique({
      where: { id },
    });

    if (!existingStock || existingStock.storeId !== storeId) {
      return NextResponse.json(
        { success: false, message: "Stock item not found" },
        { status: 404 },
      );
    }

    const performer =
      session.user?.name || session.user?.email || "Authorized Staff";

    const updatedStock = await prisma.$transaction(async (tx) => {
      const newQty =
        quantity !== undefined ? Number(quantity) : existingStock.quantity;
      const newCostPrice =
        costPrice !== undefined ? Number(costPrice) : existingStock.costPrice;
      const newSellingPrice =
        sellingPrice !== undefined
          ? Number(sellingPrice)
          : existingStock.sellingPrice;
      const newAmount = Number((newQty * newCostPrice).toFixed(2));
      const newName = name !== undefined ? name.trim() : existingStock.name;

      const stock = await tx.stock.update({
        where: { id },
        data: {
          ...(name !== undefined && { name: newName }),
          ...(unitId !== undefined && { unitId }),
          ...(groupId !== undefined && { groupId: groupId || null }),
          ...(quantity !== undefined && { quantity: newQty }),
          amount: newAmount,
          ...(costPrice !== undefined && { costPrice: newCostPrice }),
          ...(sellingPrice !== undefined && { sellingPrice: newSellingPrice }),
          ...(sortOrder !== undefined && {
            sortOrder: parseInt(String(sortOrder)),
          }),
          ...(type !== undefined && { type }),
        },
        include: {
          unit: true,
          group: true,
          consumptions: {
            include: {
              dish: { select: { id: true, name: true } },
            },
          },
        },
      });

      // Audit: Name change
      if (name !== undefined && newName !== existingStock.name) {
        await tx.stockAudit.create({
          data: {
            stockId: id,
            storeId,
            action: "NAME_CHANGE",
            oldName: existingStock.name,
            newName: newName,
            previousQuantity: existingStock.quantity,
            newQuantity: newQty,
            costPrice: newCostPrice,
            sellingPrice: newSellingPrice,
            remarks: `Name updated from '${existingStock.name}' to '${newName}'`,
            performedBy: performer,
          },
        });
      }

      // Audit: Price change (Cost or Selling Price)
      const costChanged =
        costPrice !== undefined && newCostPrice !== existingStock.costPrice;
      const sellingChanged =
        sellingPrice !== undefined &&
        newSellingPrice !== existingStock.sellingPrice;

      if (costChanged || sellingChanged) {
        const changesDesc = [
          costChanged
            ? `Cost: Rs. ${existingStock.costPrice} -> Rs. ${newCostPrice}`
            : null,
          sellingChanged
            ? `Selling: Rs. ${existingStock.sellingPrice} -> Rs. ${newSellingPrice}`
            : null,
        ]
          .filter(Boolean)
          .join(", ");

        await tx.stockAudit.create({
          data: {
            stockId: id,
            storeId,
            action: "PRICE_UPDATE",
            previousCostPrice: existingStock.costPrice,
            costPrice: newCostPrice,
            previousSellingPrice: existingStock.sellingPrice,
            sellingPrice: newSellingPrice,
            previousQuantity: existingStock.quantity,
            newQuantity: newQty,
            newName: newName,
            remarks: `Price updated: ${changesDesc}`,
            performedBy: performer,
          },
        });
      }

      // Audit: Quantity adjustment (manual direct edit)
      if (quantity !== undefined && newQty !== existingStock.quantity) {
        const diff = newQty - existingStock.quantity;
        await tx.stockAudit.create({
          data: {
            stockId: id,
            storeId,
            action: "ADJUSTMENT",
            quantityChange: diff,
            previousQuantity: existingStock.quantity,
            newQuantity: newQty,
            costPrice: newCostPrice,
            sellingPrice: newSellingPrice,
            newName: newName,
            remarks: `Quantity adjusted: ${existingStock.quantity} -> ${newQty} (${diff > 0 ? "+" : ""}${diff})`,
            performedBy: performer,
          },
        });
      }

      if (dishConsumptions !== undefined && Array.isArray(dishConsumptions)) {
        // Delete existing dish consumptions for this stock item
        await tx.stockConsumption.deleteMany({
          where: { stockId: id, dishId: { not: null } },
        });

        const validConsumptions = dishConsumptions.filter(
          (dc: any) => dc.dishId && parseFloat(dc.quantity) > 0,
        );

        if (validConsumptions.length > 0) {
          await tx.stockConsumption.createMany({
            data: validConsumptions.map((dc: any) => ({
              stockId: id,
              dishId: dc.dishId,
              quantity: parseFloat(dc.quantity),
            })),
          });
        }
      }

      return stock;
    });

    return NextResponse.json(
      { success: true, message: "Stock updated successfully", data: updatedStock },
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
