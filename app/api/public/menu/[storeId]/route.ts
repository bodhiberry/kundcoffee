import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

/**
 * Public Menu API — No authentication required.
 *
 * GET /api/public/menu/[storeId]
 *
 * Returns the full menu for a store, organized by categories,
 * including subcategories (SubMenus), dishes, combo offers, and add-ons.
 * Only returns available items with public-safe fields (no COGS, gross profit, etc.).
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

    // Verify the store exists and is active
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        status: true,
        isSuspended: true,
        dishes:true
      },
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

    if(store.dishes){
      
    }
    // Fetch categories with nested subMenus, dishes, combos, and add-ons
    const categories = await prisma.category.findMany({
      where: { storeId, showInOrderingApp: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        image: true,
        description: true,
        sortOrder: true,
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
        addOns: {
          where: { isAvailable: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            image: true,
            description: true,
            type: true,
            sortOrder: true,
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
    });

    // Flatten dish addOns for a cleaner response
    const formattedCategories = categories.map((category) => ({
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
    }));

    return NextResponse.json({
      success: true,
      data: {
        store: {
          id: store.id,
          name: store.name,
        },
        categories: formattedCategories,
      },
    });
  } catch (error) {
    console.error("Error fetching public menu:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch menu" },
      { status: 500 }
    );
  }
}
