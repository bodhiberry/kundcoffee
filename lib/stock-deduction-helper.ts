import { PrismaClient } from "@prisma/client";

/**
 * Deducts stock inventory for an order based on recipes (StockConsumption).
 * Prevents double deduction using Order.isStockDeducted flag.
 */
export async function deductStockForOrder(
  tx: any,
  orderId: string,
): Promise<{ success: boolean; deductedCount: number }> {
  try {
    // 1. Fetch order with items and selected add-ons
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            selectedAddOns: true,
          },
        },
      },
    });

    if (!order) {
      console.error(`[StockDeduction] Order ${orderId} not found.`);
      return { success: false, deductedCount: 0 };
    }

    // 2. Double-deduction safety check
    if (order.isStockDeducted) {
      console.log(`[StockDeduction] Stock already deducted for Order ${orderId}. Skipping.`);
      return { success: true, deductedCount: 0 };
    }

    const stockDeductions: Record<string, number> = {};

    // 3. Aggregate all required recipe stock quantities
    for (const item of order.items || []) {
      const itemQty = item.quantity || 1;

      // Dish recipe
      if (item.dishId) {
        const dishRecipes = await tx.stockConsumption.findMany({
          where: { dishId: item.dishId },
        });
        for (const r of dishRecipes) {
          stockDeductions[r.stockId] = (stockDeductions[r.stockId] || 0) + r.quantity * itemQty;
        }
      }

      // Combo recipe
      if (item.comboId) {
        const comboRecipes = await tx.stockConsumption.findMany({
          where: { comboId: item.comboId },
        });
        for (const r of comboRecipes) {
          stockDeductions[r.stockId] = (stockDeductions[r.stockId] || 0) + r.quantity * itemQty;
        }
      }

      // Add-on recipes
      if (item.selectedAddOns && item.selectedAddOns.length > 0) {
        for (const addOn of item.selectedAddOns) {
          const addOnQty = addOn.quantity || 1;
          const addOnRecipes = await tx.stockConsumption.findMany({
            where: { addOnId: addOn.addOnId },
          });
          for (const r of addOnRecipes) {
            stockDeductions[r.stockId] =
              (stockDeductions[r.stockId] || 0) + r.quantity * addOnQty * itemQty;
          }
        }
      }
    }

    // 4. Apply stock decrements
    let deductedCount = 0;
    for (const [stockId, qty] of Object.entries(stockDeductions)) {
      if (qty > 0) {
        await tx.stock.update({
          where: { id: stockId },
          data: { quantity: { decrement: qty } },
        });
        deductedCount++;
        console.log(`[StockDeduction] Decremented Stock ${stockId} by ${qty} for Order ${orderId}`);
      }
    }

    // 5. Flag order as stock deducted
    await tx.order.update({
      where: { id: orderId },
      data: { isStockDeducted: true },
    });

    return { success: true, deductedCount };
  } catch (error) {
    console.error(`[StockDeduction] Error deducting stock for Order ${orderId}:`, error);
    return { success: false, deductedCount: 0 };
  }
}
