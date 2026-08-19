import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      name,
      location,
      currency,
      copyMenu = true,
      managerName,
      managerEmail,
      managerPassword,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: "Branch name is required" },
        { status: 400 }
      );
    }

    if (managerEmail) {
      const existingUser = await prisma.user.findUnique({
        where: { email: managerEmail.toLowerCase().trim() },
      });
      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            message: "A user with this email/username already exists",
          },
          { status: 400 }
        );
      }
    }

    // Identify source store for copying menu (admin's current active store or first owned store)
    const currentActiveStoreId = session.user.storeId;
    let sourceStoreId = currentActiveStoreId;
    if (!sourceStoreId) {
      const firstStore = await prisma.store.findFirst({
        where: { ownerId: userId },
        orderBy: { createdAt: "asc" },
      });
      sourceStoreId = firstStore?.id;
    }

    // Pre-hash password before starting the database transaction
    let hashedPassword = "";
    if (managerEmail && managerPassword) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(managerPassword, saltRounds);
    }

    const store = await prisma.$transaction(
      async (tx) => {
        // 1. Create the new Store (branch)
        const newStore = await tx.store.create({
          data: {
            name: name.trim(),
            ownerId: userId,
          },
        });

        // 2. Link this store to the Admin User as active
        await tx.user.update({
          where: { id: userId },
          data: {
            storeId: newStore.id,
            isSetupComplete: true,
          },
        });

        // 3. If copyMenu is enabled and a source store exists, copy all catalog items
        if (copyMenu && sourceStoreId) {
          // A. Copy Measuring Units
          const sourceUnits = await tx.measuringUnit.findMany({
            where: { storeId: sourceStoreId },
          });
          const unitIdMap = new Map<string, string>();
          for (const unit of sourceUnits) {
            const newUnit = await tx.measuringUnit.create({
              data: {
                name: unit.name,
                shortName: unit.shortName,
                description: unit.description,
                sortOrder: unit.sortOrder,
                storeId: newStore.id,
              },
            });
            unitIdMap.set(unit.id, newUnit.id);
          }

          // B. Copy Categories
          const sourceCategories = await tx.category.findMany({
            where: { storeId: sourceStoreId },
          });
          const categoryIdMap = new Map<string, string>();
          for (const cat of sourceCategories) {
            const newCat = await tx.category.create({
              data: {
                name: cat.name,
                image: cat.image,
                description: cat.description,
                sortOrder: cat.sortOrder,
                showInOrderingApp: cat.showInOrderingApp,
                isActive: cat.isActive,
                storeId: newStore.id,
              },
            });
            categoryIdMap.set(cat.id, newCat.id);
          }

          // C. Copy SubMenus
          const sourceSubMenus = await tx.subMenu.findMany({
            where: { storeId: sourceStoreId },
          });
          const subMenuIdMap = new Map<string, string>();
          for (const sub of sourceSubMenus) {
            const newSub = await tx.subMenu.create({
              data: {
                name: sub.name,
                image: sub.image,
                isActive: sub.isActive,
                sortOrder: sub.sortOrder,
                categoryId: sub.categoryId ? categoryIdMap.get(sub.categoryId) || null : null,
                storeId: newStore.id,
              },
            });
            subMenuIdMap.set(sub.id, newSub.id);
          }

          // D. Copy AddOns
          const sourceAddOns = await tx.addOn.findMany({
            where: { storeId: sourceStoreId },
            include: { price: true },
          });
          const addOnIdMap = new Map<string, string>();
          for (const addOn of sourceAddOns) {
            const newAddOn = await tx.addOn.create({
              data: {
                name: addOn.name,
                image: addOn.image,
                description: addOn.description,
                type: addOn.type,
                isAvailable: addOn.isAvailable,
                sortOrder: addOn.sortOrder,
                categoryId: addOn.categoryId ? categoryIdMap.get(addOn.categoryId) || null : null,
                storeId: newStore.id,
              },
            });
            addOnIdMap.set(addOn.id, newAddOn.id);

            if (addOn.price) {
              await tx.price.create({
                data: {
                  actualPrice: addOn.price.actualPrice,
                  discountPrice: addOn.price.discountPrice,
                  listedPrice: addOn.price.listedPrice,
                  cogs: addOn.price.cogs,
                  grossProfit: addOn.price.grossProfit,
                  addOnId: newAddOn.id,
                },
              });
            }
          }

          // E. Copy Dishes
          const sourceDishes = await tx.dish.findMany({
            where: { storeId: sourceStoreId },
            include: {
              price: true,
              addOns: true,
            },
          });

          for (const dish of sourceDishes) {
            const newCategoryId = categoryIdMap.get(dish.categoryId);
            if (!newCategoryId) continue;

            const newDish = await tx.dish.create({
              data: {
                name: dish.name,
                hscode: dish.hscode,
                preparationTime: dish.preparationTime,
                description: dish.description,
                categoryId: newCategoryId,
                subMenuId: dish.subMenuId ? subMenuIdMap.get(dish.subMenuId) || null : null,
                type: dish.type,
                kotType: dish.kotType,
                isAvailable: dish.isAvailable,
                showInOrderingApp: dish.showInOrderingApp,
                image: dish.image,
                sortOrder: dish.sortOrder,
                storeId: newStore.id,
              },
            });

            // Copy Price
            if (dish.price) {
              await tx.price.create({
                data: {
                  actualPrice: dish.price.actualPrice,
                  discountPrice: dish.price.discountPrice,
                  listedPrice: dish.price.listedPrice,
                  cogs: dish.price.cogs,
                  grossProfit: dish.price.grossProfit,
                  dishId: newDish.id,
                },
              });
            }

            // Link Dish AddOns
            if (dish.addOns && dish.addOns.length > 0) {
              const mappedAddOnIds = dish.addOns
                .map((da) => addOnIdMap.get(da.addOnId))
                .filter(Boolean) as string[];

              if (mappedAddOnIds.length > 0) {
                await tx.dishAddOn.createMany({
                  data: mappedAddOnIds.map((mappedId) => ({
                    dishId: newDish.id,
                    addOnId: mappedId,
                  })),
                });
              }
            }
          }
        }

        // 4. If a dedicated branch manager account was specified, create it
        if (managerEmail && hashedPassword) {
          await tx.user.create({
            data: {
              name: managerName?.trim() || `${name.trim()} Manager`,
              email: managerEmail.toLowerCase().trim(),
              password: hashedPassword,
              role: "MANAGER",
              storeId: newStore.id,
              isSetupComplete: true,
              emailVerified: new Date(),
              permissions: [
                "pos_access",
                "view_reports",
                "manage_orders",
                "manage_menu",
                "inventory_access",
              ],
            },
          });
        }

        // 5. Save regional settings for this store
        if (currency) {
          await tx.systemSetting.upsert({
            where: {
              key_storeId: {
                key: "currency",
                storeId: newStore.id,
              },
            },
            update: { value: currency },
            create: {
              key: "currency",
              value: currency,
              storeId: newStore.id,
            },
          });
        }

        // If location is provided, save it as well
        if (location?.trim()) {
          await tx.systemSetting.upsert({
            where: {
              key_storeId: {
                key: "location",
                storeId: newStore.id,
              },
            },
            update: { value: location.trim() },
            create: {
              key: "location",
              value: location.trim(),
              storeId: newStore.id,
            },
          });
        }

        return newStore;
      },
      {
        maxWait: 10000, // 10s wait for connection from pool
        timeout: 30000, // 30s timeout for transaction
      }
    );

    return NextResponse.json({
      success: true,
      message: `Created and switched to new branch: ${store.name}`,
      data: store,
    });
  } catch (error) {
    console.error("[POST /api/user/add-store] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
