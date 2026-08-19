import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;
    const userRole = session?.user?.role;
    const { id } = await params;

    if (!session || !storeId || userRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admins Only" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { name, role, permissions, password, storeId: targetStoreId } = body;
    const userId = session.user.id;

    // Find all store IDs owned by this admin
    const ownedStores = await prisma.store.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const ownedStoreIds = ownedStores.map((s) => s.id);
    if (storeId && !ownedStoreIds.includes(storeId)) {
      ownedStoreIds.push(storeId);
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        storeId: { in: ownedStoreIds },
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found or unauthorized to edit" },
        { status: 404 },
      );
    }

    const updateData: any = {
      name: name !== undefined ? name : existingUser.name,
      role: role !== undefined ? role : existingUser.role,
      permissions:
        permissions !== undefined ? permissions : existingUser.permissions,
      ...(targetStoreId && { storeId: targetStoreId }),
    };

    if (password && password.trim() !== "") {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        storeId: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Update User Error:", error);
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
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;
    const userRole = session?.user?.role;
    const { id } = await params;

    if (!session || !storeId || userRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admins Only" },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    // Prevent deleting oneself
    if (session.user.id === id) {
      return NextResponse.json(
        { success: false, message: "Cannot delete your own admin account" },
        { status: 400 },
      );
    }

    // Find all store IDs owned by this admin
    const ownedStores = await prisma.store.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });
    const ownedStoreIds = ownedStores.map((s) => s.id);
    if (storeId && !ownedStoreIds.includes(storeId)) {
      ownedStoreIds.push(storeId);
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        storeId: { in: ownedStoreIds },
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found or unauthorized to delete" },
        { status: 404 },
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
