import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: tableId } = await params;

    // 1. Find the active session for the table
    const activeSession = await prisma.tableSession.findFirst({
      where: { tableId, isActive: true },
    });

    if (!activeSession) {
      return NextResponse.json(
        { success: false, message: "No active session found for this table" },
        { status: 404 },
      );
    }

    // 2. Fetch all orders for this table that are not COMPLETED or CANCELLED
    // We assume orders during an active session belong to that session.
    const orders = await prisma.order.findMany({
      where: {
        tableId,
        status: {
          in: ["PENDING", "PREPARING", "READYTOPICK", "SERVED"],
        },
      },
      include: {
        items: {
          include: {
            dish: { include: { price: true } },
            combo: { include: { price: true } },
            selectedAddOns: {
              include: { addOn: { include: { price: true } } },
            },
          },
        },
        customer: true,
      },
    });

    // 3. Flatten items and calculate totals
    let subtotal = 0;
    const allItems = orders.flatMap((order) =>
      order.items.map((item) => {
        subtotal += item.totalPrice;
        return {
          id: item.id,
          name: item.dish?.name || item.combo?.name || "Unknown",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          type: item.dish ? "DISH" : "COMBO",
          addOns: item.selectedAddOns.map((ao) => ({
            id: ao.id,
            name: ao.addOn.name,
            quantity: ao.quantity,
            unitPrice: ao.unitPrice,
          })),
        };
      }),
    );

    // Fetch settings to get dynamic tax and service charge rates
    const settingsList = await prisma.systemSetting.findMany();
    const settings = settingsList.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    const serviceChargeRate = parseFloat(settings.serviceChargeRate || "10") / 100;
    const taxRate = parseFloat(settings.taxRate || "13") / 100;

    const serviceCharge = subtotal * serviceChargeRate;
    const tax = (subtotal + serviceCharge) * taxRate;
    const grandTotal = subtotal + serviceCharge + tax;

    return NextResponse.json({
      success: true,
      data: {
        tableId,
        sessionId: activeSession.id,
        orders: orders.map((o) => ({ id: o.id, createdAt: o.createdAt })),
        items: allItems,
        summary: {
          subtotal,
          serviceCharge,
          tax,
          grandTotal,
        },
        customer: orders[0]?.customer || null, // Pick customer from first order if available
      },
    });
  } catch (error) {
    console.error("Checkout Details Fetch Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
