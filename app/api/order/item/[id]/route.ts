import { prisma } from "@/lib/prisma";
import { Params } from "@/lib/types";
import { OrderStatus } from "@prisma/client";
import { NextResponse,NextRequest} from "next/server";

export async function PATCH(req: NextRequest, context: { params: Params }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const status = body.status as OrderStatus;

    if (!status) {
      return NextResponse.json(
        { success: false, message: "Status is required" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.orderItem.update({
        where: { id },
        data: { status },
        include: {
          dish: true,
          selectedAddOns: {
            include: { addOn: true },
          },
        },
      });

      // Recalculate parent order's total, excluding CANCELLED items
      const allItems = await tx.orderItem.findMany({
        where: { orderId: updatedItem.orderId },
      });
      const nonCancelledItems = allItems.filter((item) => item.status !== "CANCELLED");
      const newTotal = nonCancelledItems.reduce((sum, item) => sum + item.totalPrice, 0);

      await tx.order.update({
        where: { id: updatedItem.orderId },
        data: { total: newTotal },
      });

      return updatedItem;
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, context: { params: Params }) {
  try {
    const { id } = await context.params;
    if(!id){
      return NextResponse.json(
        { success: false, message: "Item ID is required" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete the item (Cascade onDelete automatically removes orderItemAddOn rows)
      const deletedItem = await tx.orderItem.delete({
        where: { id },
      });

      // 2. Fetch remaining items for the same order
      const remainingItems = await tx.orderItem.findMany({
        where: { orderId: deletedItem.orderId },
      });

      // 3. Recalculate total price, excluding CANCELLED items
      const nonCancelledItems = remainingItems.filter((item) => item.status !== "CANCELLED");
      const newTotal = nonCancelledItems.reduce((sum, item) => sum + item.totalPrice, 0);

      // 4. Update order total in database
      await tx.order.update({
        where: { id: deletedItem.orderId },
        data: { total: newTotal },
      });

      return deletedItem;
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("DELETE ORDER ITEM ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
