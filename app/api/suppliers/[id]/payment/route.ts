import { prisma } from "@/lib/prisma";
import { Params } from "@/lib/types";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest, context: { params: Params }) {
  try {
    const { id: supplierId } = await context.params;
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { amount, remarks, paymentMethod, date } = await req.json();

    if (!amount || !paymentMethod) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the last ledger entry to calculate new balance (if we decide to track it)
      // Note: Existing purchase logic sets closingBalance to 0, but it's better to track it.
      const lastLedger = await tx.supplierLedger.findFirst({
        where: { supplierId, storeId },
        orderBy: { createdAt: "desc" },
      });

      // If existing records use 0, we might want to calculate from scratch or just continue with 0.
      // For now, let's try to maintain a running balance if possible, but fallback to 0 if that's the pattern.
      // Given the 'purchases' route sets it to 0, we'll stick to 0 for consistency with existing supplier logic
      // until a full refactor of supplier balance is requested.
      
      const ledgerEntry = await tx.supplierLedger.create({
        data: {
          supplierId,
          storeId,
          txnNo: `PAY-S-${Date.now()}-${supplierId.slice(0, 4)}`,
          type: "PAYMENT",
          amount: parseFloat(amount),
          closingBalance: 0, // Matching existing pattern in purchases route
          remarks: remarks || `Manual Payment via ${paymentMethod}`,
          createdAt: date ? new Date(date) : new Date(),
        },
      });

      return ledgerEntry;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Supplier payment recorded successfully",
    });
  } catch (error: any) {
    console.error("POST /api/suppliers/[id]/payment error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
