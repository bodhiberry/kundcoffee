import { prisma } from "@/lib/prisma";
import { Params } from "@/lib/types";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest, context: { params: Params }) {
  // ... (Keep existing GET logic)
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ success: false, message: "Dish not found" });

    const dish = await prisma.dish.findUnique({
      where: { id },
      include: { price: true, subMenu: true, category: true },
    });
    
    if (!dish) return NextResponse.json({ success: false, message: "Dish not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: dish }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}

// ... (Keep existing calculatePriceFields function)
const calculatePriceFields = (currentPrice: any, newPrice: any) => {
  const mergedPrice = {
    actualPrice: currentPrice?.actualPrice || 0,
    discountPrice: currentPrice?.discountPrice || 0,
    cogs: currentPrice?.cogs || 0,
    ...newPrice,
  };
  const actualPrice = parseFloat(mergedPrice.actualPrice || 0);
  const discountAmount = parseFloat(mergedPrice.discountPrice || 0);
  const cogs = parseFloat(mergedPrice.cogs || 0);
  const listedPrice = Math.max(0, actualPrice - discountAmount);
  const grossProfit = listedPrice - cogs;
  return { actualPrice, discountPrice: discountAmount, cogs, listedPrice, grossProfit };
};

export async function PATCH(request: NextRequest, context: { params: Params }) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ success: false, message: "Dish ID is missing" }, { status: 400 });

    const body = await request.json();
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
      sortOrder, // <--- 1. Extract sortOrder
      showInOrderingApp,
    } = body;

    const currentDish = await prisma.dish.findUnique({ where: { id } });
    if (!currentDish) return NextResponse.json({ success: false, message: "Dish not found" }, { status: 404 });

    // (Keep duplicate check logic here...)
    // Only check duplicates if name/category/submenu actually changed
    if ((name && name !== currentDish.name) || (categoryId && categoryId !== currentDish.categoryId) || (subMenuId !== undefined && subMenuId !== currentDish.subMenuId)) {
        const existingDish = await prisma.dish.findFirst({
            where: {
            name: name || currentDish.name,
            categoryId: categoryId || currentDish.categoryId,
            subMenuId: subMenuId !== undefined ? (subMenuId || null) : currentDish.subMenuId,
            id: { not: id },
            },
        });
        if (existingDish) {
            return NextResponse.json(
            { success: false, message: `Dish already exists in this category` },
            { status: 400 }
            );
        }
    }

    await prisma.$transaction(async (tx) => {
      const dishUpdateData: any = {};
      
      // ... (Existing fields)
      if (name !== undefined) dishUpdateData.name = name;
      if (hscode !== undefined) dishUpdateData.hscode = hscode;
      if (image !== undefined) dishUpdateData.image = image;
      if (preparationTime !== undefined) dishUpdateData.preparationTime = preparationTime;
      if (description !== undefined) dishUpdateData.description = description;
      if (categoryId !== undefined) dishUpdateData.categoryId = categoryId;
      if (subMenuId !== undefined) dishUpdateData.subMenuId = subMenuId;
      if (type !== undefined) dishUpdateData.type = type;
      if (kotType !== undefined) dishUpdateData.kotType = kotType;
      
      // 2. Add sortOrder to update data
      if (sortOrder !== undefined) dishUpdateData.sortOrder = parseInt(sortOrder);
      if (showInOrderingApp !== undefined) dishUpdateData.showInOrderingApp = showInOrderingApp;

      if (Object.keys(dishUpdateData).length > 0) {
        await tx.dish.update({
          where: { id },
          data: dishUpdateData,
        });
      }

      // ... (Keep Price, Stock, Addon logic exactly as is)
      if (price) {
        let currentPrice = await tx.price.findFirst({ where: { dishId: id } });
        const calculatedPrice = calculatePriceFields(currentPrice, price);
        if (currentPrice) {
          await tx.price.update({ where: { id: currentPrice.id }, data: calculatedPrice });
        } else {
          await tx.price.create({ data: { dishId: id, ...calculatedPrice } });
        }
      }

      if (stockConsumption !== undefined) {
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

      if (addOnIds !== undefined) {
        await tx.dishAddOn.deleteMany({ where: { dishId: id } });
        if (addOnIds.length > 0) {
          await tx.dishAddOn.createMany({
            data: addOnIds.map((aid: string) => ({ dishId: id, addOnId: aid })),
          });
        }
      }
    });

    return NextResponse.json({ success: true, message: "Dish updated successfully" });
  } catch (error) {
    console.error("Error patching dish:", error);
    return NextResponse.json({ success: false, message: "Failed to update dish" }, { status: 500 });
  }
}

// ... (Keep DELETE logic)
export async function DELETE(req: NextRequest, context: { params: Params }) {
    // ... existing delete logic
    try {
        const { id } = await context.params;
        await prisma.dish.delete({ where: { id } });
        return NextResponse.json({ success: true, message: "Deleted successfully" });
    } catch (e) {
        return NextResponse.json({ success: false, message: "Error" }, { status: 500 });
    }
}