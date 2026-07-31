import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
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

    const data = await prisma.stock.findMany({
      where: { storeId },
      include: { unit: true, group: true },
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
    const { name, unitId, groupId, quantity, amount, costPrice, sortOrder } = body;

    if (!name || quantity === undefined || amount === undefined) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    const existingStock = await prisma.stock.findFirst({
      where: { name, storeId },
    });

    if (existingStock) {
      return NextResponse.json(
        { success: false, message: "Stock item already exists" },
        { status: 409 },
      );
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

    const newStock = await prisma.stock.create({
      data: {
        name,
        unitId,
        groupId,
        quantity: Number(quantity),
        amount: Number(amount),
        costPrice: Number(costPrice || 0),
        sortOrder: finalSortOrder,
        storeId,
      },
    });


    return NextResponse.json({ success: true, data: newStock });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "Stock item already exists" },
        { status: 409 },
      );
    }

    console.error("Error creating stock:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create stock" },
      { status: 500 },
    );
  }
}
