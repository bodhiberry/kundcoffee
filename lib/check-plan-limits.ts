import { prisma } from "@/lib/prisma";
import { ALL_LIMITS } from "@/lib/features";

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  max: number; // -1 means unlimited
  limitName: string;
  unit: string;
  message?: string;
}

/**
 * Counts current active entities for a store based on the limit key.
 */
async function countCurrentEntities(storeId: string, limitKey: string): Promise<number> {
  switch (limitKey) {
    case "max_tables":
      return await prisma.table.count({ where: { storeId } });

    case "max_spaces":
      return await prisma.space.count({ where: { storeId } });

    case "max_categories":
      return await prisma.category.count({ where: { storeId } });

    case "max_dishes":
      return await prisma.dish.count({ where: { storeId } });

    case "max_staff":
      return await prisma.staff.count({ where: { storeId } });

    case "max_suppliers":
      return await prisma.supplier.count({ where: { storeId } });

    case "max_stock_items":
      return await prisma.stock.count({ where: { storeId } });

    case "max_customers":
      return await prisma.customer.count({ where: { storeId } });

    case "max_daily_orders": {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return await prisma.order.count({
        where: {
          storeId,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });
    }

    case "max_qr_codes": {
      const qrRecord = await prisma.qrPayment.findFirst({
        where: { storeId },
      });
      return qrRecord?.image?.length ?? 0;
    }

    default:
      return 0;
  }
}

/**
 * Server-side guard: Checks if the store has reached its subscription plan limit for a given key.
 * @param storeId - The ID of the store
 * @param limitKey - The key defined in ALL_LIMITS (e.g. 'max_tables', 'max_staff')
 */
export async function checkPlanLimit(
  storeId: string,
  limitKey: string
): Promise<LimitCheckResult> {
  const limitDef = ALL_LIMITS.find((l) => l.key === limitKey);
  const limitName = limitDef?.name || limitKey;
  const unit = limitDef?.unit || "items";

  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        subscription: {
          include: {
            limits: true,
          },
        },
      },
    });

    if (!store) {
      return {
        allowed: false,
        current: 0,
        max: 0,
        limitName,
        unit,
        message: "Store not found.",
      };
    }

    // Determine max limit
    let maxLimit = -1; // Default to unlimited if no limits set

    if (store.subscription && store.subscription.limits) {
      const definedLimit = store.subscription.limits.find(
        (l) => l.key === limitKey
      );
      if (definedLimit) {
        maxLimit = definedLimit.value;
      }
    }

    // If max is -1, it's unlimited
    if (maxLimit === -1) {
      const current = await countCurrentEntities(storeId, limitKey);
      return {
        allowed: true,
        current,
        max: -1,
        limitName,
        unit,
      };
    }

    // If limit is 0, completely disabled/blocked
    if (maxLimit === 0) {
      return {
        allowed: false,
        current: 0,
        max: 0,
        limitName,
        unit,
        message: `Your current subscription plan (${store.subscription?.name || "Default"}) does not allow adding ${limitName.toLowerCase()} (limit is 0). Please upgrade your plan.`,
      };
    }

    // Count existing entities
    const current = await countCurrentEntities(storeId, limitKey);

    if (current >= maxLimit) {
      return {
        allowed: false,
        current,
        max: maxLimit,
        limitName,
        unit,
        message: `Plan Limit Reached: Your current plan allows a maximum of ${maxLimit} ${unit}. You currently have ${current} ${unit}. Please upgrade your subscription plan to create more.`,
      };
    }

    return {
      allowed: true,
      current,
      max: maxLimit,
      limitName,
      unit,
    };
  } catch (error: any) {
    console.error(`Error checking plan limit for ${limitKey}:`, error);
    // Fail-open with logged error to avoid locking out stores accidentally
    return {
      allowed: true,
      current: 0,
      max: -1,
      limitName,
      unit,
    };
  }
}
