import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { storeId } = body;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Store ID is required" },
        { status: 400 }
      );
    }

    // Verify user owns the store
    const store = await prisma.store.findFirst({
      where: {
        id: storeId,
        ownerId: userId,
      },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, message: "Store not found or access denied" },
        { status: 403 }
      );
    }

    // Switch user's active store
    await prisma.user.update({
      where: { id: userId },
      data: { storeId },
    });

    return NextResponse.json({
      success: true,
      message: `Switched active branch to ${store.name}`,
    });
  } catch (error) {
    console.error("[POST /api/user/switch-store] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
