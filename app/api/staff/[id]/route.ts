import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const staffMember = await prisma.staff.findUnique({
      where: { id, storeId },
      include: { roleRef: true },
    });

    if (!staffMember) {
      return NextResponse.json(
        { success: false, message: "Staff not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: staffMember });
  } catch (error) {
    console.error("Get Staff Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    const updatedStaff = await prisma.staff.update({
      where: { id, storeId },
      data: {
        name,
        role,
        roleId: roleId !== undefined ? roleId || null : undefined,
        phone,
        email,
        isActive,
        image,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedStaff,
      message: "Staff updated successfully",
    });
  } catch (error) {
    console.error("Update Staff Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await prisma.staff.delete({
      where: { id, storeId },
    });

    return NextResponse.json({
      success: true,
      message: "Staff deleted successfully",
    });
  } catch (error) {
    console.error("Delete Staff Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
