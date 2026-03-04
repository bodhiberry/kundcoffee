import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tableId, type, items, customerId, staffId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    let calculatedGrandTotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const { dishId, comboId, quantity, addOnIds } = item;

      let dbItem;
      let itemName = "";

      if (dishId) {
        dbItem = await prisma.dish.findUnique({
          where: { id: dishId },
          include: { price: true },
        });
        itemName = dbItem?.name || "Unknown Dish";
      } else if (comboId) {
        dbItem = await prisma.comboOffer.findUnique({
          where: { id: comboId },
          include: { price: true },
        });
        itemName = dbItem?.name || "Unknown Combo";
      }

      if (!dbItem || !dbItem.price) {
        return NextResponse.json(
          { error: `Item not found or price missing: ${itemName}` },
          { status: 404 },
        );
      }

      const unitPrice =
        dbItem.price.discountPrice && dbItem.price.discountPrice > 0
          ? dbItem.price.discountPrice
          : dbItem.price.listedPrice;
      let itemTotalPrice = unitPrice * quantity;

      const addOnsData = [];
      if (addOnIds && Array.isArray(addOnIds) && addOnIds.length > 0) {
        const dbAddOns = await prisma.addOn.findMany({
          where: { id: { in: addOnIds } },
          include: { price: true },
        });

        for (const dbAddOn of dbAddOns) {
          if (dbAddOn.price) {
            const addOnPrice = dbAddOn.price.listedPrice;
            itemTotalPrice += addOnPrice * quantity;

            addOnsData.push({
              addOnId: dbAddOn.id,
              unitPrice: addOnPrice,
              quantity: 1,
            });
          }
        }
      }

      calculatedGrandTotal += itemTotalPrice;

      orderItemsData.push({
        dishId: dishId || null,
        comboId: comboId || null,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: itemTotalPrice,
        selectedAddOns: {
          create: addOnsData,
        },
      });
    }

    let activeSessionId: string | undefined;

    if (tableId && type === "DINE_IN") {
      let activeSession = await prisma.tableSession.findFirst({
        where: { tableId, isActive: true },
      });

      if (!activeSession) {
        activeSession = await prisma.tableSession.create({
          data: {
            tableId,
            isActive: true,
            storeId,
          },
        });

        await prisma.table.update({
          where: { id: tableId },
          data: { status: "OCCUPIED" },
        });
      }
      activeSessionId = activeSession.id;
    }

    const newOrder = await prisma.order.create({
      data: {
        tableId: tableId || null,
        storeId, // Add storeId
        type: type,
        status: "PENDING",
        total: calculatedGrandTotal,
        items: {
          create: orderItemsData,
        },
        customerId,
        staffId,
        sessionId: activeSessionId,
      },
      include: {
        items: {
          include: {
            selectedAddOns: true,
            dish: true,
            combo: true,
          },
        },
        customer: true,
      },
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Order Creation Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: {
        storeId, // Filter by storeId
        status: { not: "CANCELLED" },
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
      include: {
        table: true,
        items: {
          include: {
            dish: true,
            combo: true,
            selectedAddOns: true,
          },
        },
      },
      take: 50, // Limit to recent 50 orders for performance
    });

    return NextResponse.json(
      {
        success: true,
        data: orders,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
