import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/lib/types";
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

    const body = await req.json();
    const { name, role, roleId, phone, email, isActive, image } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 },
      );
    }

    const newStaff = await prisma.staff.create({
      data: {
        name,
        role: role || "Staff",
        roleId: roleId || null,
        phone,
        email,
        isActive: isActive !== undefined ? isActive : true,
        image,
        storeId,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: newStaff,
      message: "Staff created successfully",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Create Staff Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

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

    const staff = await prisma.staff.findMany({
      where: { storeId },
      include: {
        roleRef: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const response: ApiResponse = {
      success: true,
      data: staff,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get Staff Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
