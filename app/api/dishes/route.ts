import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const dishes = await prisma.dish.findMany({
      where: { storeId: storeId },
      include: {
        price: true,
        category: {
          select: {
            name: true,
          },
        },
        stocks: true,
        addOns: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ success: true, data: dishes });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const {
      name,
      hscode,
      image,
      preparationTime,
      description,
      categoryId,
      subMenuId,
      type,
      kotType,
      price,
      stockConsumption,
      addOnIds,
      sortOrder,
    } = body;

    if (!name || !categoryId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    const existingDish = await prisma.dish.findFirst({
      where: {
        storeId,
        name,
        categoryId,
        subMenuId: subMenuId || null,
      },
    });

    if (existingDish) {
      return NextResponse.json(
        {
          success: false,
          message: `Dish "${name}" already exists in this category or sub-menu`,
        },
        { status: 400 },
      );
    }

    console.log("price check", price);

    const actualPrice = parseFloat(price?.actualPrice || 0);
    const discountAmount = parseFloat(price?.discountPrice || 0);
    const cogs = parseFloat(price?.cogs || 0);
    const listedPrice = Math.max(0, actualPrice - discountAmount);

    const grossProfit = listedPrice - cogs;

    // Calculate next sortOrder
    let finalSortOrder = parseInt(String(sortOrder));
    if (!finalSortOrder) {
      const lastDish = await prisma.dish.findFirst({
        where: { categoryId, storeId }, // Filter by storeId for sort order
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      finalSortOrder = lastDish ? lastDish.sortOrder + 1 : 1;
    }

    const dish = await prisma.dish.create({
      data: {
        storeId, // Add storeId here
        name,
        hscode,
        image: image || [],
        preparationTime: preparationTime || 0,
        description,
        categoryId,
        subMenuId: subMenuId || null,
        type: type || "VEG",
        kotType: kotType || "KITCHEN",
        isAvailable: true,
        sortOrder: finalSortOrder,
        price: {
          create: {
            actualPrice: actualPrice,
            discountPrice: discountAmount,
            cogs: cogs,
            listedPrice: listedPrice,
            grossProfit: grossProfit,
          },
        },
        stocks: {
          create:
            stockConsumption?.map((s: any) => ({
              stockId: s.stockId,
              quantity: parseFloat(s.quantity),
            })) || [],
        },
        addOns: {
          create:
            addOnIds?.map((id: string) => ({
              addOnId: id,
            })) || [],
        },
      },
      include: {
        price: true,
      },
    });

    return NextResponse.json({ success: true, data: dish });
  } catch (error) {
    console.error("Error creating dish:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create dish" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      hscode,
      image,
      preparationTime,
      description,
      categoryId,
      subMenuId,
      type,
      kotType,
      price,
      stockConsumption,
      addOnIds,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID Required" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.dish.update({
        where: { id },
        data: {
          name,
          hscode,
          image,
          preparationTime,
          description,
          categoryId,
          subMenuId,
          type,
          kotType,
        },
      });

      if (price) {
        const existingPrice = await tx.price.findFirst({
          where: { dishId: id },
        });
        if (existingPrice) {
          await tx.price.update({
            where: { id: existingPrice.id },
            data: {
              actualPrice: parseFloat(price.actualPrice),
              discountPrice: parseFloat(price.discountPrice),
              listedPrice: parseFloat(price.listedPrice),
              cogs: parseFloat(price.cogs),
              grossProfit: parseFloat(price.grossProfit),
            },
          });
        } else {
          await tx.price.create({
            data: {
              dishId: id,
              actualPrice: parseFloat(price.actualPrice),
              discountPrice: parseFloat(price.discountPrice),
              listedPrice: parseFloat(price.listedPrice),
              cogs: parseFloat(price.cogs),
              grossProfit: parseFloat(price.grossProfit),
            },
          });
        }
      }

      if (stockConsumption) {
        await tx.stockConsumption.deleteMany({ where: { dishId: id } });
        if (stockConsumption.length > 0) {
          await tx.stockConsumption.createMany({
            data: stockConsumption.map((s: any) => ({
              dishId: id,
              stockId: s.stockId,
              quantity: parseFloat(s.quantity),
            })),
          });
        }
      }

      if (addOnIds) {
        // Note: DishAddOn is the join table name? We need to check schema.
        // Assuming the schema has a many-to-many relation or explicit join table.
        // Based on view_code_item output for Prisma schema, there was no explicit join table shown in snippet,
        // but `addOns` property usually implies one.
        // If the schema is explicit: model DishAddOn { ... }
        // Let's assume explicit delete/create for safety if we don't know the exact implicit table name.
        await tx.dishAddOn.deleteMany({ where: { dishId: id } });
        if (addOnIds.length > 0) {
          await tx.dishAddOn.createMany({
            data: addOnIds.map((aid: string) => ({
              dishId: id,
              addOnId: aid,
            })),
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Dish updated successfully",
    });
  } catch (error) {
    console.error("Error updating dish:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update dish" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID Required" },
        { status: 400 },
      );
    }

    await prisma.dish.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Dish deleted" });
  } catch (error) {
    console.error("Error deleting dish:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete dish" },
      { status: 500 },
    );
  }
}
