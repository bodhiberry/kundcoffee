import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Params } from "@/lib/types";

export async function POST(req: NextRequest, context: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID Required" },
        { status: 400 },
      );
    }

    // Fetch the dish with all relations
    const originalDish = await prisma.dish.findFirst({
      where: { id, storeId },
      include: {
        price: true,
        stocks: true,
        addOns: true,
      },
    });

    if (!originalDish) {
      return NextResponse.json(
        { success: false, message: "Dish not found" },
        { status: 404 },
      );
    }

    // Determine the unique name
    let baseName = originalDish.name;
    let duplicateName = `${baseName} (Copy)`;
    let counter = 1;

    while (true) {
      const existing = await prisma.dish.findFirst({
        where: {
          storeId,
          name: duplicateName,
          categoryId: originalDish.categoryId,
          subMenuId: originalDish.subMenuId,
        },
      });
      if (!existing) {
        break;
      }
      counter++;
      duplicateName = `${baseName} (Copy ${counter})`;
    }

    // Get next sortOrder
    const lastDish = await prisma.dish.findFirst({
      where: { categoryId: originalDish.categoryId, storeId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const finalSortOrder = lastDish ? lastDish.sortOrder + 1 : 1;

    // Create the duplicate dish in a transaction
    const duplicatedDish = await prisma.$transaction(async (tx) => {
      return await tx.dish.create({
        data: {
          storeId,
          name: duplicateName,
          hscode: originalDish.hscode,
          image: originalDish.image || [],
          preparationTime: originalDish.preparationTime,
          description: originalDish.description,
          categoryId: originalDish.categoryId,
          subMenuId: originalDish.subMenuId,
          type: originalDish.type,
          kotType: originalDish.kotType,
          isAvailable: originalDish.isAvailable,
          sortOrder: finalSortOrder,
          price: originalDish.price
            ? {
                create: {
                  actualPrice: originalDish.price.actualPrice,
                  discountPrice: originalDish.price.discountPrice || 0,
                  listedPrice: originalDish.price.listedPrice,
                  cogs: originalDish.price.cogs,
                  grossProfit: originalDish.price.grossProfit,
                },
              }
            : undefined,
          stocks: {
            create: originalDish.stocks.map((s) => ({
              stockId: s.stockId,
              quantity: s.quantity,
            })),
          },
          addOns: {
            create: originalDish.addOns.map((a) => ({
              addOnId: a.addOnId,
            })),
          },
        },
        include: {
          price: true,
          stocks: true,
          addOns: true,
        },
      });
    });

    return NextResponse.json({ success: true, data: duplicatedDish });
  } catch (error) {
    console.error("Error duplicating dish:", error);
    return NextResponse.json(
      { success: false, message: "Failed to duplicate dish" },
      { status: 500 },
    );
  }
}
