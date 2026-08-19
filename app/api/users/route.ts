import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const storeId = session?.user?.storeId;
    const userRole = session?.user?.role;

    if (!session || !userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const filterBranchId = searchParams.get("branchId");

    let whereClause: any = {};

    if (userRole === "ADMIN") {
      // Find all stores owned by this admin
      const ownedStores = await prisma.store.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });
      const ownedStoreIds = ownedStores.map((s) => s.id);
      if (storeId && !ownedStoreIds.includes(storeId)) {
        ownedStoreIds.push(storeId);
      }

      if (filterBranchId && filterBranchId !== "ALL") {
        whereClause = { storeId: filterBranchId };
      } else {
        whereClause = { storeId: { in: ownedStoreIds } };
      }
    } else {
      whereClause = { storeId };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isSetupComplete: true,
        emailVerified: true,
        trialEndsAt: true,
        storeId: true,
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("Get Users Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;
    const userRole = session?.user?.role;

    if (!session || !storeId || userRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admins Only" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const {
      name,
      email,
      password,
      role = "CASHIER",
      permissions = [],
      storeId: targetStoreId,
    } = body;

    const assignedStoreId = targetStoreId || storeId;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User already exists with this email" },
        { status: 400 },
      );
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        permissions,
        storeId: assignedStoreId,
        isSetupComplete: true, // Auto complete setup since admin created
        emailVerified: new Date(), // Skip email verification for admin-created users
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
      },
    });

    return NextResponse.json(
      { success: true, data: newUser, message: "User created successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create User Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
