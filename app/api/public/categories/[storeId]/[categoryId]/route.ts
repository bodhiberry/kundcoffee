import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

/**
 * Public Category Dishes API — No authentication required.
 *
 * GET /api/public/categories/[storeId]/[categoryId]
 *
 * Returns all dishes, combos, and subMenus for a specific category.
 * Use this for loading items when a user selects a category.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ storeId: string; categoryId: string }> }
) {
  try {
    const { storeId, categoryId } = await context.params;

    if (!storeId || !categoryId) {
      return NextResponse.json(
        { success: false, message: "Store ID and Category ID are required" },
        { status: 400 }
      );
    }

    // Verify the store exists and is active
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, isSuspended: true, status: true },
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

    const category = await prisma.category.findFirst({
      where: { id: categoryId, storeId, showInOrderingApp: true },
      select: {
        id: true,
        name: true,
        image: true,
        description: true,
        subMenus: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            image: true,
            sortOrder: true,
            dishes: {
              where: { isAvailable: true, showInOrderingApp: true },
              orderBy: { sortOrder: "asc" },
              select: {
                id: true,
                name: true,
                description: true,
                image: true,
                type: true,
                preparationTime: true,
                sortOrder: true,
                price: {
                  select: {
                    actualPrice: true,
                    discountPrice: true,
                    listedPrice: true,
                  },
                },
                addOns: {
                  select: {
                    addOn: {
                      select: {
                        id: true,
                        name: true,
                        image: true,
                        description: true,
                        type: true,
                        isAvailable: true,
                        price: {
                          select: {
                            actualPrice: true,
                            discountPrice: true,
                            listedPrice: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            combos: {
              where: { isAvailable: true },
              orderBy: { sortOrder: "asc" },
              select: {
                id: true,
                name: true,
                description: true,
                image: true,
                preparationTime: true,
                sortOrder: true,
                price: {
                  select: {
                    actualPrice: true,
                    discountPrice: true,
                    listedPrice: true,
                  },
                },
                items: {
                  select: {
                    quantity: true,
                    dish: {
                      select: {
                        id: true,
                        name: true,
                        image: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        dishes: {
          where: { isAvailable: true, subMenuId: null, showInOrderingApp: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            type: true,
            preparationTime: true,
            sortOrder: true,
            price: {
              select: {
                actualPrice: true,
                discountPrice: true,
                listedPrice: true,
              },
            },
            addOns: {
              select: {
                addOn: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    description: true,
                    type: true,
                    isAvailable: true,
                    price: {
                      select: {
                        actualPrice: true,
                        discountPrice: true,
                        listedPrice: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        combos: {
          where: { isAvailable: true, subMenuId: null },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            preparationTime: true,
            sortOrder: true,
            price: {
              select: {
                actualPrice: true,
                discountPrice: true,
                listedPrice: true,
              },
            },
            items: {
              select: {
                quantity: true,
                dish: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    // Flatten addOns from DishAddOn join table
    const formattedCategory = {
      ...category,
      dishes: category.dishes.map((dish) => ({
        ...dish,
        addOns: dish.addOns
          .map((da) => da.addOn)
          .filter((a) => a.isAvailable),
      })),
      subMenus: category.subMenus.map((sub) => ({
        ...sub,
        dishes: sub.dishes.map((dish) => ({
          ...dish,
          addOns: dish.addOns
            .map((da) => da.addOn)
            .filter((a) => a.isAvailable),
        })),
      })),
    };

    return NextResponse.json({
      success: true,
      data: formattedCategory,
    });
  } catch (error) {
    console.error("Error fetching public category:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch category" },
      { status: 500 }
    );
  }
}
