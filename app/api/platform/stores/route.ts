import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isPlatformUser) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const stores = await prisma.store.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: stores });
  } catch (error: any) {
    console.error("GET Stores Platform Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isPlatformUser) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { storeId, action, trialEndsAt, subscriptionEndsAt } = body;

    if (!storeId) {
      return NextResponse.json({ success: false, message: "storeId is required" }, { status: 400 });
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json({ success: false, message: "Store not found" }, { status: 404 });
    }

    let updateData: any = {};

    if (action === "suspend") {
      updateData.isSuspended = true;
      updateData.status = "SUSPENDED";
    } else if (action === "unsuspend") {
      updateData.isSuspended = false;
      
      const now = new Date();
      const sEnds = subscriptionEndsAt ? new Date(subscriptionEndsAt) : store.subscriptionEndsAt;
      const tEnds = trialEndsAt ? new Date(trialEndsAt) : store.trialEndsAt;

      if (sEnds && sEnds > now) {
        updateData.status = "ACTIVE";
      } else if (tEnds && tEnds > now) {
        updateData.status = "TRIAL";
      } else {
        updateData.status = "EXPIRED";
      }
    } else if (action === "update_subscription") {
      if (trialEndsAt !== undefined) {
        updateData.trialEndsAt = trialEndsAt ? new Date(trialEndsAt) : null;
      }
      if (subscriptionEndsAt !== undefined) {
        updateData.subscriptionEndsAt = subscriptionEndsAt ? new Date(subscriptionEndsAt) : null;
      }

      const now = new Date();
      const isSusp = store.isSuspended;
      if (isSusp) {
        updateData.status = "SUSPENDED";
      } else {
        const sEnds = subscriptionEndsAt !== undefined 
          ? (subscriptionEndsAt ? new Date(subscriptionEndsAt) : null) 
          : store.subscriptionEndsAt;
        const tEnds = trialEndsAt !== undefined 
          ? (trialEndsAt ? new Date(trialEndsAt) : null) 
          : store.trialEndsAt;

        if (sEnds && sEnds > now) {
          updateData.status = "ACTIVE";
        } else if (tEnds && tEnds > now) {
          updateData.status = "TRIAL";
        } else {
          updateData.status = "EXPIRED";
        }
      }
    } else {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: updateData,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Write Platform Audit Log
    try {
      await prisma.platformAuditLog.create({
        data: {
          platformUserId: session.user.id,
          action: `${action.toUpperCase()} Store ${store.name}`,
          storeId: storeId,
          metadata: {
            previousStatus: store.status,
            newStatus: updatedStore.status,
            updateData,
          },
        },
      });
    } catch (auditError) {
      console.error("Failed to write PlatformAuditLog:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "Store updated successfully",
      data: updatedStore,
    });
  } catch (error: any) {
    console.error("POST Stores Platform Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
