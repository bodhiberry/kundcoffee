import { prisma } from "@/lib/prisma";
import { Params } from "@/lib/types";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";

export async function PATCH(req: NextRequest, context: { params: Params }) {
  try {
    // 1. Get Session and StoreId
    const sessionUser = await getServerSession(authOptions);
    const storeId = sessionUser?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const { status, paymentMethod, items, staffId, guests, kotRemarks } = body;

    // 2. Authorization Check: Does this order belong to this store?
    const existingOrder = await prisma.order.findFirst({
      where: { id, storeId },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, message: "Order not found or unauthorized" },
        { status: 404 },
      );
    }

    const updatedOrder = await prisma.$transaction(
      async (tx) => {
        // --- Handle Item Updates ---
        if (items && Array.isArray(items)) {
          for (const item of items) {
            if (item.action === "add") {
              const addOnsTotal = (item.selectedAddOns || []).reduce(
                (sum: number, a: any) =>
                  sum + (a.unitPrice || 0) * (a.quantity || 1),
                0,
              );
              const totalPrice =
                (item.unitPrice || 0) * (item.quantity || 1) + addOnsTotal;

              await (tx.orderItem.create as any)({
                data: {
                  orderId: id,
                  dishId: item.dishId || null,
                  comboId: item.comboId || null,
                  quantity: item.quantity || 1,
                  unitPrice: item.unitPrice || 0,
                  totalPrice,
                  remarks: item.remarks || null,
                  selectedAddOns: {
                    create: (item.selectedAddOns || []).map((a: any) => ({
                      addOnId: a.addOnId,
                      quantity: a.quantity || 1,
                      unitPrice: a.unitPrice || 0,
                    })),
                  },
                },
              });
            } else if (item.action === "update") {
              const existingOrderItem = await tx.orderItem.findUnique({
                where: { id: item.id },
              });
              const unitPrice = item.unitPrice !== undefined ? item.unitPrice : (existingOrderItem?.unitPrice || 0);

              // Check if price is being overridden
              if (item.unitPrice !== undefined && item.unitPrice !== existingOrderItem?.unitPrice) {
                if (!hasPermission(sessionUser, PERMISSIONS.OVERRIDE_PRICE)) {
                  throw new Error("You do not have permission to override item prices.");
                }
              }

              const addOnsTotal = (item.selectedAddOns || []).reduce(
                (sum: number, a: any) =>
                  sum + (a.unitPrice || 0) * (a.quantity || 1),
                0,
              );
              const totalPrice =
                unitPrice * (item.quantity || 1) + addOnsTotal;

              await (tx.orderItem.update as any)({
                where: { id: item.id },
                data: {
                  quantity: item.quantity,
                  unitPrice: unitPrice,
                  totalPrice,
                  remarks: item.remarks,
                },
              });

              if (item.selectedAddOns) {
                await tx.orderItemAddOn.deleteMany({
                  where: { orderItemId: item.id },
                });
                await tx.orderItemAddOn.createMany({
                  data: item.selectedAddOns.map((a: any) => ({
                    orderItemId: item.id,
                    addOnId: a.addOnId,
                    quantity: a.quantity || 1,
                    unitPrice: a.unitPrice || 0,
                  })),
                });
              }
            } else if (item.action === "remove") {
              await tx.orderItem.delete({ where: { id: item.id } });
            }
          }
        }

        // --- Recalculate Total ---
        const allItems = await tx.orderItem.findMany({
          where: { orderId: id },
        });
        const nonCancelledItems = allItems.filter((i) => i.status !== "CANCELLED");
        const newTotal = nonCancelledItems.reduce((sum, i) => sum + i.totalPrice, 0);

        const updateData: any = { total: newTotal };
        if (status) updateData.status = status;
        if (staffId) updateData.staffId = staffId;
        if (guests !== undefined) updateData.guests = guests;
        if (kotRemarks !== undefined) updateData.kotRemarks = kotRemarks;

        const order = await tx.order.update({
          where: { id },
          data: updateData,
          include: {
            items: {
              include: {
                selectedAddOns: { include: { addOn: true } },
                dish: true,
              },
            },
            table: true,
          },
        });

        // --- Handle Completion and Payments ---
        if (status === "COMPLETED" && paymentMethod) {
          let tableSession = null;
          if (order.tableId && order.type === "DINE_IN") {
            tableSession = await tx.tableSession.findFirst({
              where: { tableId: order.tableId, isActive: true },
            });
          }

          if (order.paymentId) {
            await tx.payment.update({
              where: { id: order.paymentId },
              data: {
                amount: newTotal,
                method: paymentMethod,
                status: "PAID",
                sessionId: tableSession?.id || null, // Scalar field
                storeId: storeId, // FIX: Changed from 'store: { connect... }'
              },
            });
          } else {
            await tx.payment.create({
              data: {
                amount: newTotal,
                method: paymentMethod,
                status: "PAID",
                sessionId: tableSession?.id || null, // Scalar field
                storeId: storeId, // FIX: Changed from 'store: { connect... }'
                orders: {
                  connect: { id: id },
                },
              },
            });
          }

          if (tableSession) {
            await tx.tableSession.update({
              where: { id: tableSession.id },
              data: {
                total: { increment: order.total },
                isActive: false,
                endedAt: new Date(),
              },
            });

            await tx.table.update({
              where: { id: order.tableId! },
              data: { status: "ACTIVE" },
            });
          }
        }

        return order;
      },
      {
        timeout: 20000, // Increase timeout to 20 seconds
      },
    );

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error: any) {
    console.error("DEBUG ORDER PATCH ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, context: { params: Params }) {
  try {
    const sessionUser = await getServerSession(authOptions);
    const storeId = sessionUser?.user?.storeId;
    if (!storeId)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );

    const { id } = await context.params;

    // Authorization: Check if order belongs to user's store
    const order = await prisma.order.findFirst({
      where: { id, storeId },
    });

    if (!order)
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 },
      );

    if (order.status !== "PENDING") {
      return NextResponse.json(
        { success: false, message: "Cannot delete processed order" },
        { status: 400 },
      );
    }

    // Soft delete the order and clean up active session if DINE_IN
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { isDeleted: true },
      });

      if (order.type === "DINE_IN" && order.tableId && order.sessionId) {
        await tx.tableSession.update({
          where: { id: order.sessionId },
          data: { isActive: false, endedAt: new Date() },
        });

        await tx.table.update({
          where: { id: order.tableId },
          data: { status: "ACTIVE" },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Deleted Successfully",
    });
  } catch (error: any) {
    console.error("DEBUG ORDER DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest, context: { params: Params }) {
  try {
    const sessionUser = await getServerSession(authOptions);
    const storeId = sessionUser?.user?.storeId;
    if (!storeId)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );

    const { id } = await context.params;
    const order = await prisma.order.findFirst({
      where: { id, storeId }, // Ensure store context
      include: {
        table: true,
        customer: true,
      },
    });

    if (!order)
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 },
      );

    return NextResponse.json({ success: true, data: order }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
