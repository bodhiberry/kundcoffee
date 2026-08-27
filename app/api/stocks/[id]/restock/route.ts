import { prisma } from "@/lib/prisma";
import { Params } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest, context: { params: Params }) {
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
    const { quantityToAdd, costPrice, sellingPrice, remarks, date } = body;

    const addedQty = parseFloat(String(quantityToAdd));
    if (isNaN(addedQty) || addedQty <= 0) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid quantity to add (> 0)" },
        { status: 400 },
      );
    }

    const existingStock = await prisma.stock.findUnique({
      where: { id },
      include: { unit: true },
    });

    if (!existingStock || existingStock.storeId !== storeId) {
      return NextResponse.json(
        { success: false, message: "Stock item not found" },
        { status: 404 },
      );
    }

    const effectiveCostPrice =
      costPrice !== undefined && !isNaN(parseFloat(String(costPrice)))
        ? parseFloat(String(costPrice))
        : existingStock.costPrice;

    const effectiveSellingPrice =
      sellingPrice !== undefined && !isNaN(parseFloat(String(sellingPrice)))
        ? parseFloat(String(sellingPrice))
        : existingStock.sellingPrice;

    const newQuantity = existingStock.quantity + addedQty;
    const newAmount = Number((newQuantity * effectiveCostPrice).toFixed(2));
    const performer =
      session.user?.name || session.user?.email || "Authorized Staff";

    const unitLabel = existingStock.unit?.shortName || existingStock.unit?.name || "units";
    const auditRemark =
      remarks && remarks.trim() !== ""
        ? remarks.trim()
        : `Restocked +${addedQty} ${unitLabel} @ Rs. ${effectiveCostPrice}`;

    const restockDate = date ? new Date(date) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      const updatedStock = await tx.stock.update({
        where: { id },
        data: {
          quantity: newQuantity,
          costPrice: effectiveCostPrice,
          sellingPrice: effectiveSellingPrice,
          amount: newAmount,
        },
        include: {
          unit: true,
          group: true,
        },
      });

      const audit = await tx.stockAudit.create({
        data: {
          stockId: id,
          storeId,
          action: "RESTOCK",
          quantityChange: addedQty,
          previousQuantity: existingStock.quantity,
          newQuantity: newQuantity,
          costPrice: effectiveCostPrice,
          previousCostPrice: existingStock.costPrice,
          sellingPrice: effectiveSellingPrice,
          previousSellingPrice: existingStock.sellingPrice,
          newName: existingStock.name,
          remarks: auditRemark,
          performedBy: performer,
          createdAt: restockDate,
        },
      });

      return { stock: updatedStock, audit };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully added ${addedQty} ${unitLabel} to ${existingStock.name}`,
      data: result,
    });
  } catch (error) {
    console.error("Restock error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process restock" },
      { status: 500 },
    );
  }
}
