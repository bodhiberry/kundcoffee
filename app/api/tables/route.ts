import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPlanLimit } from "@/lib/check-plan-limits";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      capacity,
      status,
      spaceId,
      tableTypeId,
      tableTypeName,
      spaceName,
      spaceDescription,
      sortOrder,
    } = body;

    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!name || !capacity) {
      return NextResponse.json(
        { success: false, message: "Name and capacity are required" },
        { status: 400 },
      );
    }

    // --- Server-side plan limit validation ---
    const limitCheck = await checkPlanLimit(storeId, "max_tables");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: limitCheck.message || "Table creation limit reached for your plan.",
          limitKey: "max_tables",
          current: limitCheck.current,
          max: limitCheck.max,
        },
        { status: 403 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // --- Handle TableType ---
      let finalTableTypeId = tableTypeId;

      if (!finalTableTypeId && tableTypeName) {
        const existingType = await tx.tableType.findFirst({
          where: { name: tableTypeName, storeId },
        });

        if (existingType) {
          finalTableTypeId = existingType.id;
        } else {
          const newType = await tx.tableType.create({
            data: { name: tableTypeName, storeId },
          });
          finalTableTypeId = newType.id;
        }
      }

      if (!finalTableTypeId) {
        throw new Error("TABLE_TYPE_REQUIRED");
      }

      // --- Handle Space ---
      let finalSpaceId = spaceId;

      if (!finalSpaceId && spaceName) {
        const existingSpace = await tx.space.findFirst({
          where: { name: spaceName, storeId },
        });

        if (existingSpace) {
          finalSpaceId = existingSpace.id;
        } else {
          const newSpace = await tx.space.create({
            data: { name: spaceName, description: spaceDescription, storeId },
          });
          finalSpaceId = newSpace.id;
        }
      }

      if (!finalSpaceId) {
        throw new Error("SPACE_REQUIRED");
      }

      // --- Check for duplicate table in the same space ---
      const existingTable = await tx.table.findFirst({
        where: {
          name,
          spaceId: finalSpaceId,
        },
      });

      if (existingTable) {
        throw new Error(`DUPLICATE_TABLE:${name}`);
      }

      // --- Calculate the next sortOrder if not provided ---
      let finalSortOrder = parseInt(String(sortOrder));
      if (!finalSortOrder) {
        const lastTable = await tx.table.findFirst({
          where: { spaceId: finalSpaceId },
          orderBy: { sortOrder: "desc" },
          select: { sortOrder: true },
        });
        finalSortOrder = lastTable ? lastTable.sortOrder + 1 : 1;
      }

      // --- Create Table ---
      const table = await tx.table.create({
        data: {
          name,
          capacity: parseInt(String(capacity)),
          status: status || "ACTIVE",
          spaceId: finalSpaceId,
          tableTypeId: finalTableTypeId,
          sortOrder: finalSortOrder,
          storeId,
        },
        include: { tableType: true },
      });

      // --- Create QR Code ---
      await tx.qRCode.create({
        data: { tableId: table.id, value: randomUUID(), assigned: true },
      });

      return table;
    });

    return NextResponse.json(
      { success: true, message: "Table created successfully", data: result },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Table creation error:", error);

    if (error.message?.startsWith("DUPLICATE_TABLE:")) {
      const tableName = error.message.split(":")[1];
      return NextResponse.json(
        {
          success: false,
          message: `Table "${tableName}" already exists in this space`,
        },
        { status: 400 },
      );
    }

    if (error.message === "TABLE_TYPE_REQUIRED") {
      return NextResponse.json(
        { success: false, message: "Table type is required" },
        { status: 400 },
      );
    }

    if (error.message === "SPACE_REQUIRED") {
      return NextResponse.json(
        { success: false, message: "Space is required" },
        { status: 400 },
      );
    }

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

    const tables = await prisma.table.findMany({
      where: { storeId },
      include: {
        tableType: true,
        space: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, data: tables });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 },
    );
  }
}
