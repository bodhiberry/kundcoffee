import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isPlatformUser) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id: storeId } = await context.params;
    const body = await req.json();
    const { password } = body;

    if (!password || password.trim() === "") {
      return NextResponse.json({ success: false, message: "New password is required" }, { status: 400 });
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json({ success: false, message: "Store not found" }, { status: 404 });
    }

    const ownerId = store.ownerId;
    
    const ownerUser = await prisma.user.findUnique({
      where: { id: ownerId },
    });

    if (!ownerUser) {
      return NextResponse.json({ success: false, message: "Store owner account not found" }, { status: 404 });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await prisma.user.update({
      where: { id: ownerId },
      data: { password: hashedPassword },
    });

    // Write Platform Audit Log
    try {
      await prisma.platformAuditLog.create({
        data: {
          platformUserId: session.user.id,
          action: `RESET PASSWORD for store ${store.name} owner (${ownerUser.email})`,
          storeId: storeId,
          metadata: {
            ownerEmail: ownerUser.email,
          },
        },
      });
    } catch (auditError) {
      console.error("Failed to write PlatformAuditLog:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Owner password updated successfully",
    });
  } catch (error: any) {
    console.error("POST Store Reset Password Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
