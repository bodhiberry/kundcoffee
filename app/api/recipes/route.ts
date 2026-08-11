import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "dish"; // 'dish' | 'combo' | 'addon'
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: true, data: [] });
    }

    let whereClause: any = {};
    if (type === "dish") whereClause.dishId = id;
    else if (type === "combo") whereClause.comboId = id;
    else if (type === "addon") whereClause.addOnId = id;

    const recipes = await prisma.stockConsumption.findMany({
      where: whereClause,
      include: {
        stock: {
          select: {
            id: true,
            name: true,
            costPrice: true,
            unit: { select: { shortName: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: recipes });
  } catch (error) {
    console.error("Recipes GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
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
    const { targetType, targetId, ingredients } = body; // targetType: 'dish' | 'combo' | 'addon'

    if (!targetType || !targetId || !Array.isArray(ingredients)) {
      return NextResponse.json(
        { success: false, message: "Invalid payload" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      let deleteWhere: any = {};
      if (targetType === "dish") deleteWhere.dishId = targetId;
      else if (targetType === "combo") deleteWhere.comboId = targetId;
      else if (targetType === "addon") deleteWhere.addOnId = targetId;

      await tx.stockConsumption.deleteMany({ where: deleteWhere });

      const validIngredients = ingredients.filter(
        (i: any) => i.stockId && parseFloat(i.quantity) > 0,
      );

      if (validIngredients.length > 0) {
        await tx.stockConsumption.createMany({
          data: validIngredients.map((i: any) => ({
            stockId: i.stockId,
            quantity: parseFloat(i.quantity),
            dishId: targetType === "dish" ? targetId : undefined,
            comboId: targetType === "combo" ? targetId : undefined,
            addOnId: targetType === "addon" ? targetId : undefined,
          })),
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Recipe updated successfully",
    });
  } catch (error) {
    console.error("Recipes POST Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update recipe" },
      { status: 500 },
    );
  }
}
