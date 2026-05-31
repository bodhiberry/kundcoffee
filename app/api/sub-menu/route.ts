import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    const { name, image, categoryId, sortOrder, isActive } = await req.json();

    if (!name)
      return NextResponse.json(
        { success: false, message: "Sub-Name required" },
        { status: 400 },
      );

    const existingSubMenu = await prisma.subMenu.findFirst({
      where: {
        name,
        storeId,
        categoryId: categoryId || null,
      },
    });

    if (existingSubMenu) {
      return NextResponse.json(
        {
          success: false,
          message: `Sub-menu "${name}" already exists in this category`,
        },
        { status: 400 },
      );
    }

    // Calculate next sortOrder if not provided
    let finalSortOrder = parseInt(String(sortOrder));
    if (!finalSortOrder) {
      const lastSubMenu = await prisma.subMenu.findFirst({
        where: { storeId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      finalSortOrder = lastSubMenu ? lastSubMenu.sortOrder + 1 : 1;
    }

    // 2. Include sortOrder and isActive in the creation data
    const subMenu = await prisma.subMenu.create({
      data: {
        name,
        categoryId: categoryId || null,
        image: image || null,
        sortOrder: finalSortOrder,
        isActive: isActive !== undefined ? isActive : true,
        storeId,
      },
    });

    return NextResponse.json(
      { success: true, message: "Sub-menu Created", data: subMenu },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 },
    );
  }
}
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

    const submenu = await prisma.subMenu.findMany({
      where: { storeId },
      orderBy: { sortOrder: "asc" },
      include: {
        dishes: true,
        _count: {
          select: { dishes: true },
        },
      },
    });
    if (!submenu)
      return NextResponse.json(
        {
          success: false,
          message: "No Sub-menu found",
        },
        { status: 400 },
      );

    return NextResponse.json(
      {
        success: true,
        data: submenu,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 400 },
    );
  }
}
