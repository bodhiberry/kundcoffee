import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

/**
 * Public Categories API — No authentication required.
 *
 * GET /api/public/categories/[storeId]
 *
 * Returns all categories for a store with dish/combo counts.
 * Lightweight endpoint for building category navigation.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await context.params;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Store ID is required" },
        { status: 400 }
      );
    }

    // Verify the store exists
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true, isSuspended: true, status: true },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, message: "Store not found" },
        { status: 404 }
      );
    }

    if (store.isSuspended || store.status === "SUSPENDED" || store.status === "EXPIRED") {
      return NextResponse.json(
        { success: false, message: "Store is currently unavailable" },
        { status: 403 }
      );
    }

    const categories = await prisma.category.findMany({
      where: { storeId },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        image: true,
        description: true,
        sortOrder: true,
        _count: {
          select: {
            dishes: { where: { isAvailable: true, showInOrderingApp: true } },
            combos: { where: { isAvailable: true } },
            subMenus: { where: { isActive: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        image: cat.image,
        description: cat.description,
        sortOrder: cat.sortOrder,
        dishCount: cat._count.dishes,
        comboCount: cat._count.combos,
        subMenuCount: cat._count.subMenus,
        totalItems: cat._count.dishes + cat._count.combos,
      })),
    });
  } catch (error) {
    console.error("Error fetching public categories:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
