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

    const spaces = await prisma.space.findMany({
      where: { storeId },
      include: { tables: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ success: true, data: spaces }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, sortOrder } = body;

    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // 1. Validation
    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 },
      );
    }

    // --- Plan limit validation ---
    const limitCheck = await checkPlanLimit(storeId, "max_spaces");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: limitCheck.message || "Space creation limit reached for your plan.",
          limitKey: "max_spaces",
          current: limitCheck.current,
          max: limitCheck.max,
        },
        { status: 403 },
      );
    }

    // 2. Check for existence within this store
    const findspace = await prisma.space.findFirst({
      where: { name, storeId },
    });

    if (findspace) {
      return NextResponse.json(
        {
          success: false,
          message: "Space already exists with the current name",
        },
        { status: 400 },
      );
    }

    // 3. Calculate the next sortOrder if not provided
    let finalSortOrder = parseInt(String(sortOrder));

    if (!finalSortOrder) {
      // We look for the space with the highest sortOrder in this store
      const lastSpace = await prisma.space.findFirst({
        where: { storeId },
        orderBy: {
          sortOrder: "desc",
        },
        select: {
          sortOrder: true,
        },
      });

      // If no spaces exist, start at 1. Otherwise, take the highest + 1.
      finalSortOrder = lastSpace ? lastSpace.sortOrder + 1 : 1;
    }

    // 4. Create the space with the calculated sortOrder
    const space = await prisma.space.create({
      data: {
        name: name,
        description: description,
        sortOrder: finalSortOrder,
        storeId,
      },
    });

    return NextResponse.json({ success: true, data: space }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 },
    );
  }
}
