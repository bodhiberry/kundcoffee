import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ALL_FEATURES, ALL_LIMITS, DEFAULT_PLAN_TEMPLATES } from "@/lib/features";

// Helper to ensure default plans exist if database is empty
async function ensureDefaultPlans() {
  const count = await prisma.subscriptionPlan.count();
  if (count === 0) {
    for (const template of DEFAULT_PLAN_TEMPLATES) {
      const planLimits = Object.entries(template.limits || {}).map(([key, value]) => ({
        key,
        value: Number(value),
      }));

      await prisma.subscriptionPlan.create({
        data: {
          name: template.name,
          price: template.price,
          durationDay: template.durationDay,
          features: {
            create: template.features.map((featureKey) => ({
              key: featureKey,
              enabled: true,
            })),
          },
          limits: {
            create: planLimits,
          },
        },
      });
    }
  }
}

// GET: List all plans with their enabled features, limits & metadata
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isPlatformUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Platform Super Admin required" },
        { status: 401 }
      );
    }

    await ensureDefaultPlans();

    const plans = await prisma.subscriptionPlan.findMany({
      include: {
        features: true,
        limits: true,
        _count: {
          select: { stores: true },
        },
      },
      orderBy: { price: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        plans,
        availableFeatures: ALL_FEATURES,
        availableLimits: ALL_LIMITS,
      },
    });
  } catch (error: any) {
    console.error("GET /api/platform/plans error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load plans" },
      { status: 500 }
    );
  }
}

// POST: Create a new custom subscription plan
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isPlatformUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Platform Super Admin required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, price = 0, durationDay = 30, featureKeys = [], limits = {} } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Plan name is required" },
        { status: 400 }
      );
    }

    // Check if plan with this name already exists
    const existing = await prisma.subscriptionPlan.findFirst({
      where: { name: { equals: name.trim(), mode: "insensitive" } },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "A plan with this name already exists" },
        { status: 400 }
      );
    }

    // Prepare limits data array
    const limitEntries = Object.entries(limits).map(([key, val]) => ({
      key,
      value: typeof val === "number" ? val : parseInt(String(val), 10) || -1,
    }));

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: name.trim(),
        price: Number(price) || 0,
        durationDay: Number(durationDay) || 30,
        features: {
          create: (Array.isArray(featureKeys) ? featureKeys : []).map(
            (key: string) => ({
              key,
              enabled: true,
            })
          ),
        },
        limits: {
          create: limitEntries,
        },
      },
      include: {
        features: true,
        limits: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Plan '${plan.name}' created successfully`,
      data: plan,
    });
  } catch (error: any) {
    console.error("POST /api/platform/plans error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create plan" },
      { status: 500 }
    );
  }
}

// PUT: Update an existing plan, its features, and limits
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isPlatformUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Platform Super Admin required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, name, price, durationDay, featureKeys, limits } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Plan ID is required" },
        { status: 400 }
      );
    }

    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { features: true, limits: true },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { success: false, message: "Plan not found" },
        { status: 404 }
      );
    }

    // Execute atomic update with transaction
    const updatedPlan = await prisma.$transaction(async (tx) => {
      // 1. Update basic info if provided
      await tx.subscriptionPlan.update({
        where: { id },
        data: {
          name: name ? name.trim() : existingPlan.name,
          price: price !== undefined ? Number(price) : existingPlan.price,
          durationDay: durationDay !== undefined ? Number(durationDay) : existingPlan.durationDay,
        },
      });

      // 2. If featureKeys provided, sync features
      if (Array.isArray(featureKeys)) {
        await tx.subscriptionFeature.deleteMany({
          where: { planId: id },
        });

        if (featureKeys.length > 0) {
          await tx.subscriptionFeature.createMany({
            data: featureKeys.map((key: string) => ({
              planId: id,
              key,
              enabled: true,
            })),
          });
        }
      }

      // 3. If limits provided, sync limits
      if (limits && typeof limits === "object") {
        await tx.subscriptionLimit.deleteMany({
          where: { planId: id },
        });

        const limitEntries = Object.entries(limits).map(([key, val]) => ({
          planId: id,
          key,
          value: typeof val === "number" ? val : parseInt(String(val), 10) || -1,
        }));

        if (limitEntries.length > 0) {
          await tx.subscriptionLimit.createMany({
            data: limitEntries,
          });
        }
      }

      return tx.subscriptionPlan.findUnique({
        where: { id },
        include: {
          features: true,
          limits: true,
          _count: { select: { stores: true } },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Plan '${updatedPlan?.name}' updated successfully`,
      data: updatedPlan,
    });
  } catch (error: any) {
    console.error("PUT /api/platform/plans error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update plan" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a plan (prevents deletion if stores are actively assigned)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.isPlatformUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Platform Super Admin required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Plan ID is required" },
        { status: 400 }
      );
    }

    const storesUsingPlan = await prisma.store.count({
      where: { subscriptionId: id },
    });

    if (storesUsingPlan > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete plan. It is currently assigned to ${storesUsingPlan} store(s). Reassign them first.`,
        },
        { status: 400 }
      );
    }

    await prisma.subscriptionPlan.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE /api/platform/plans error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete plan" },
      { status: 500 }
    );
  }
}
