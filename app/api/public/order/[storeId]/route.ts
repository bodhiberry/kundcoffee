import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { corsResponse, corsPreflightResponse } from "@/lib/cors";

export async function OPTIONS() {
  return corsPreflightResponse();
}

/**
 * Public Order API — Authenticated via PUBLIC_API_SECRET header.
 *
 * POST /api/public/order/[storeId]
 *
 * Request Body:
 * {
 *   "type": "TAKE_AWAY" | "DELIVERY" | "DINE_IN" | "PICKUP",
 *   "items": [
 *     {
 *       "dishId": "string", (optional)
 *       "comboId": "string", (optional)
 *       "quantity": number,
 *       "addOnIds": ["string"] (optional)
 *     }
 *   ],
 *   "tableId": "string", (optional)
 *   "customerId": "string", (optional — ignored if customerPhone is provided)
 *   "customerName": "string", (optional — used to create new customer if phone doesn't exist)
 *   "customerPhone": "string", (optional — auto-finds or creates customer by phone)
 *   "guests": number, (optional)
 *   "kotRemarks": "string" (optional)
 * }
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ storeId: string }> }
) {
  try {
    // 1. Authenticate Request
    const authHeader = req.headers.get("authorization");
    const secret = process.env.PUBLIC_API_SECRET;

    if (!secret) {
      console.error("PUBLIC_API_SECRET is not configured in environment variables.");
      return corsResponse(
        { success: false, error: "API misconfiguration" },
        { status: 500 }
      );
    }

    let token = authHeader;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token || token !== secret) {
      return corsResponse(
        { success: false, error: "Unauthorized public API access" },
        { status: 401 }
      );
    }

    // 2. Validate Store
    const { storeId } = await context.params;
    if (!storeId) {
      return corsResponse(
        { success: false, error: "Store ID is required" },
        { status: 400 }
      );
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, status: true, isSuspended: true },
    });

    if (!store) {
      return corsResponse(
        { success: false, error: "Store not found" },
        { status: 404 }
      );
    }

    if (store.isSuspended || store.status === "SUSPENDED" || store.status === "EXPIRED") {
      return corsResponse(
        { success: false, error: "Store is currently unavailable" },
        { status: 403 }
      );
    }

    // 3. Parse and Validate Request Body
    const body = await req.json();
    const { tableId, type, items, customerId, customerName, customerPhone, guests, kotRemarks } = body;

    // 4. Resolve Customer — auto-create if phone provided and customer doesn't exist
    let resolvedCustomerId: string | null = customerId || null;

    if (customerPhone) {
      const normalizedPhone = customerPhone.trim();

      // Look up existing customer by phone number
      const existingCustomer = await prisma.customer.findUnique({
        where: { phone: normalizedPhone },
      });

      if (existingCustomer) {
        // Customer found — link to this order
        resolvedCustomerId = existingCustomer.id;
      } else {
        // Customer not found — create a new one
        const newCustomerName = customerName?.trim() || `Customer ${normalizedPhone}`;

        const newCustomer = await prisma.customer.create({
          data: {
            fullName: newCustomerName,
            phone: normalizedPhone,
            storeId,
          },
        });

        // Auto-generate loyalty ID
        await prisma.customer.update({
          where: { id: newCustomer.id },
          data: {
            loyaltyId: `LOY-${newCustomer.id.slice(0, 8).toUpperCase()}`,
          },
        });

        resolvedCustomerId = newCustomer.id;
      }
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return corsResponse(
        { success: false, error: "No items in order" },
        { status: 400 }
      );
    }

    let calculatedGrandTotal = 0;
    const orderItemsData = [];

    // 4. Calculate prices and build order items data
    for (const item of items) {
      const { dishId, comboId, quantity, addOnIds } = item;

      let dbItem;
      let itemName = "";

      if (dishId) {
        dbItem = await prisma.dish.findUnique({
          where: { id: dishId, storeId },
          include: { price: true },
        });
        itemName = dbItem?.name || "Unknown Dish";
      } else if (comboId) {
        dbItem = await prisma.comboOffer.findUnique({
          where: { id: comboId, storeId },
          include: { price: true },
        });
        itemName = dbItem?.name || "Unknown Combo";
      }

      if (!dbItem || !dbItem.price) {
        return corsResponse(
          { success: false, error: `Item not found or price missing: ${itemName} (${dishId || comboId})` },
          { status: 404 }
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
          where: { id: { in: addOnIds }, storeId },
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

    // 5. Handle Table Session for Dine-In
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

    // 6. Create the Order
    const newOrder = await prisma.order.create({
      data: {
        tableId: tableId || null,
        storeId,
        type: type,
        status: "PENDING",
        total: calculatedGrandTotal,
        items: {
          create: orderItemsData,
        },
        customerId: resolvedCustomerId,
        guests,
        kotRemarks,
        sessionId: activeSessionId,
      },
      include: {
        table: true,
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

    // 7. Trigger Pusher Event
    try {
      await pusherServer.trigger(`store-${storeId}`, "new-order", {
        orderId: newOrder.id,
        type: newOrder.type,
        total: newOrder.total,
        itemCount: newOrder.items.length,
        createdAt: newOrder.createdAt,
      });
    } catch (pusherError) {
      // Don't fail the order API call if Pusher fails, but log it
      console.error("Failed to trigger Pusher notification:", pusherError);
    }

    return corsResponse({ success: true, data: newOrder }, { status: 201 });
  } catch (error) {
    console.error("Public Order Creation Error:", error);
    return corsResponse(
      {
        success: false,
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
