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
    const data = await prisma.measuringUnit.findMany({
      where: { storeId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching measuring units:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch measuring units" },
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
    const { name, shortName, description, sortOrder } = body;

    if (!name || !shortName) {
      return NextResponse.json(
        { success: false, message: "Name and Short Name are required" },
        { status: 400 },
      );
    }

    let finalSortOrder = parseInt(String(sortOrder));
    if (!finalSortOrder) {
      const lastUnit = await prisma.measuringUnit.findFirst({
        where: { storeId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      finalSortOrder = lastUnit ? lastUnit.sortOrder + 1 : 1;
    }

    const newUnit = await prisma.measuringUnit.create({
      data: {
        name,
        shortName,
        description,
        sortOrder: finalSortOrder,
        storeId,
      },
    });

    return NextResponse.json({ success: true, data: newUnit });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, message: "Unit name or short name already exists" },
        { status: 409 },
      );
    }

    console.error("Error creating measuring unit:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create measuring unit" },
      { status: 500 },
    );
  }
}
