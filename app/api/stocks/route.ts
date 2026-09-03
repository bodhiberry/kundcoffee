import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPlanLimit } from "@/lib/check-plan-limits";

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

    const data = await prisma.stock.findMany({
      where: { storeId },
      include: {
        unit: true,
        group: true,
        consumptions: {
          include: {
            dish: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching stocks:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch stocks" },
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
      unitId,
      groupId,
      quantity,
      costPrice,
      sellingPrice,
      sortOrder,
      type,
      dishConsumptions,
    } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Stock item name is required" },
        { status: 400 },
      );
    }

    // --- Plan limit validation ---
    const limitCheck = await checkPlanLimit(storeId, "max_stock_items");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: limitCheck.message || "Stock items limit reached for your plan.",
          limitKey: "max_stock_items",
          current: limitCheck.current,
          max: limitCheck.max,
        },
        { status: 403 },
      );
    }

    const existingStock = await prisma.stock.findFirst({
      where: { name: name.trim(), storeId },
    });

    if (existingStock) {
      return NextResponse.json(
        { success: false, message: "Stock item with this name already exists" },
        { status: 409 },
      );
    }

    // Auto-resolve measuring unit if not provided
    let finalUnitId = unitId;
    if (!finalUnitId) {
      let defaultUnit = await prisma.measuringUnit.findFirst({
        where: { storeId },
        orderBy: { sortOrder: "asc" },
      });

      if (!defaultUnit) {
        // Auto-create standard "Pcs" measuring unit
        defaultUnit = await prisma.measuringUnit.create({
          data: {
            name: "Piece",
            shortName: "Pcs",
            description: "Default standard unit",
            storeId,
            sortOrder: 1,
          },
        });
      }
      finalUnitId = defaultUnit.id;
    }

    // Auto-resolve or create default stock group if requested or empty
    let finalGroupId = groupId || null;
    if (!finalGroupId) {
      const defaultGroupName =
        type === "FINISHED_GOOD" ? "Finished Goods" : "Raw Materials";
      const existingGroup = await prisma.stockGroup.findFirst({
        where: { storeId, name: defaultGroupName },
      });
      if (existingGroup) {
        finalGroupId = existingGroup.id;
      }
    }

    let finalSortOrder = parseInt(String(sortOrder));
    if (!finalSortOrder) {
      const lastStock = await prisma.stock.findFirst({
        where: { storeId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      finalSortOrder = lastStock ? lastStock.sortOrder + 1 : 1;
    }

    const numericQty = Number(quantity || 0);
    const numericCost = Number(costPrice || 0);
    const numericSelling = Number(sellingPrice || 0);
    const numericAmount = Number((numericQty * numericCost).toFixed(2));

    const performer =
      session.user?.name || session.user?.email || "Authorized Staff";

    const result = await prisma.$transaction(async (tx) => {
      const newStock = await tx.stock.create({
        data: {
          name: name.trim(),
          unitId: finalUnitId,
          groupId: finalGroupId,
          quantity: numericQty,
          amount: numericAmount,
          costPrice: numericCost,
          sellingPrice: numericSelling,
          sortOrder: finalSortOrder,
          type: type === "FINISHED_GOOD" ? "FINISHED_GOOD" : "RAW_MATERIAL",
          storeId,
        },
      });

      // Record initial audit entry
      await tx.stockAudit.create({
        data: {
          stockId: newStock.id,
          storeId,
          action: "INITIAL_STOCK",
          quantityChange: numericQty,
          previousQuantity: 0,
          newQuantity: numericQty,
          costPrice: numericCost,
          previousCostPrice: 0,
          sellingPrice: numericSelling,
          previousSellingPrice: 0,
          newName: name.trim(),
          remarks: "Initial stock registration",
          performedBy: performer,
        },
      });

      if (Array.isArray(dishConsumptions) && dishConsumptions.length > 0) {
        const validConsumptions = dishConsumptions.filter(
          (dc: any) => dc.dishId && parseFloat(dc.quantity) > 0,
        );

        if (validConsumptions.length > 0) {
          await tx.stockConsumption.createMany({
            data: validConsumptions.map((dc: any) => ({
              stockId: newStock.id,
              dishId: dc.dishId,
              quantity: parseFloat(dc.quantity),
            })),
          });
        }
      }

      return newStock;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "Stock item already exists" },
        { status: 409 },
      );
    }

    console.error("Error creating stock:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create stock item" },
      { status: 500 },
    );
  }
}
