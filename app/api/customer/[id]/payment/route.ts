import { prisma } from "@/lib/prisma";
import { Params } from "@/lib/types";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest, context: { params: Params }) {
  try {
    const { id: customerId } = await context.params;
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { amount, type, remarks, paymentMethod, date, splitGroupId } = await req.json();

    if (!amount || !type || !paymentMethod) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (type !== "PAYMENT_IN" && type !== "PAYMENT_OUT") {
      return NextResponse.json(
        { success: false, message: "Invalid payment type" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 0. Find active daily session
      const activeSession = await tx.dailySession.findFirst({
        where: { storeId, status: "OPEN" },
        select: { id: true }
      });

      // 1. Get the last ledger entry to calculate new balance
      const lastLedger = await tx.customerLedger.findFirst({
        where: { customerId, storeId },
        orderBy: { createdAt: "desc" },
      });

      const currentBalance = lastLedger ? lastLedger.closingBalance : 0;
      let newBalance = currentBalance;

      if (type === "PAYMENT_IN") {
        newBalance -= parseFloat(amount);
      } else if (type === "PAYMENT_OUT") {
        newBalance += parseFloat(amount);
      }

      // 1.5 Create Payment record if it's PAYMENT_IN (especially if linked to an order)
      let paymentRecordId = null;
      if (type === "PAYMENT_IN") {
        const payment = await tx.payment.create({
          data: {
            amount: parseFloat(amount),
            method: paymentMethod as any,
            status: "PAID",
            storeId,
            dailySessionId: activeSession?.id || null,
            splitGroupId: splitGroupId || null,
          }
        });
        paymentRecordId = payment.id;
      }

      // 2. Create Ledger Entry
      const ledgerEntry = await tx.customerLedger.create({
        data: {
          customerId,
          storeId,
          txnNo: `${type === "PAYMENT_IN" ? "PAY" : "POUT"}-${Date.now()}-${customerId.slice(0, 4)}`,
          type,
          amount: parseFloat(amount),
          closingBalance: newBalance,
          referenceId: paymentRecordId, // Link to the payment record we just created
          splitGroupId: splitGroupId || null,
          remarks: remarks || `Manual ${type} via ${paymentMethod}`,
          createdAt: date ? new Date(date) : new Date(),
        },
      });

      return ledgerEntry;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Payment recorded successfully",
    });
  } catch (error: any) {
    console.error("POST /api/customer/[id]/payment error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
