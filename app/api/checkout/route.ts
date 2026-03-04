import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { finalizeSessionTransaction } from "@/lib/checkout-helper";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getServerSession(authOptions);
    const storeId = sessionUser?.user?.storeId;

    if (!storeId) {
      // Ideally we should enforce storeId here, but for now let's at least try to get it
      // If this is a client-side call from a logged-in user, we have it.
      // Only "Guest" checkout might be tricky, but usually checkout is done by Staff/Cashier.
    }

    const body = await req.json();
    const {
      tableId,
      sessionId,
      paymentMethod,
      payments, // Array of { method: string, amount: number }
      amount,
      customerId,
      subtotal,
      tax,
      serviceCharge,
      discount,
      complimentaryItems,
      extraFreeItems,
      staffId,
    } = body;

    // --- 1. VALIDATION ---
    if (!paymentMethod && (!payments || payments.length === 0)) {
      return NextResponse.json(
        { success: false, message: "Missing payment method or payments" },
        { status: 400 },
      );
    }

    let session;
    // Look up by Session ID
    if (sessionId) {
      session = await prisma.tableSession.findUnique({
        where: { id: sessionId },
        include: { table: true },
      });
    }

    // Fallback search by tableId (only if tableId exists)
    if (!session && tableId) {
      session = await prisma.tableSession.findFirst({
        where: { tableId, isActive: true },
        include: { table: true },
      });
    }

    // DINE_IN must have a session.
    if (!session || !session.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Active session not found. Please ensure an order exists.",
        },
        { status: 400 },
      );
    }

    // Ensure the session belongs to the authenticated store
    if (storeId && session.storeId && session.storeId !== storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access to this session" },
        { status: 401 },
      );
    }

    const effectiveStoreId = storeId || session.storeId;

    if (!effectiveStoreId) {
      return NextResponse.json(
        { success: false, message: "Store identification failed." },
        { status: 400 },
      );
    }

    const activeSessionId = session.id;

    // --- 2. BRANCHING LOGIC ---

    // === OPTION A: ESEWA GATEWAY ===
    if (paymentMethod === "ESEWA") {
      const transactionUuid = `${Date.now()}-${uuidv4()}`;

      const existing = await prisma.payment.findFirst({
        where: { sessionId: activeSessionId, status: "PAID" },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, message: "This session is already paid." },
          { status: 400 },
        );
      }

      const payment = await prisma.payment.create({
        data: {
          sessionId: activeSessionId,
          method: "ESEWA",
          amount: parseFloat(amount),
          status: "PENDING",
          transactionUuid,
          storeId: effectiveStoreId as string,
          staffId: staffId || null,
        },
      });

      return NextResponse.json({
        success: true,
        isPending: true,
        paymentId: payment.id,
        config: {
          amount,
          transaction_uuid: transactionUuid,
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?pid=${payment.id}`,
          failure_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure`,
        },
      });
    }

    // === OPTION B: INSTANT PAYMENT ===
    // If payments array is provided, or a single instant method
    const isInstant =
      (payments && payments.length > 0) ||
      ["CASH", "QR", "CARD", "CREDIT", "BANK_TRANSFER"].includes(paymentMethod);

    if (isInstant) {
      const hasCredit =
        payments?.some((p: any) => p.method === "CREDIT") ||
        paymentMethod === "CREDIT";
      if (hasCredit && !customerId) {
        return NextResponse.json(
          {
            success: false,
            message: "Customer is required for credit payments",
          },
          { status: 400 },
        );
      }

      await finalizeSessionTransaction({
        sessionId: activeSessionId,
        tableId: tableId || session.tableId || null,
        amount,
        subtotal,
        tax,
        serviceCharge,
        discount,
        customerId,
        paymentMethod: paymentMethod || payments?.[0]?.method || "CASH",
        payments,
        complimentaryItems,
        extraFreeItems,
        storeId: effectiveStoreId,
        staffId,
      });

      return NextResponse.json({
        success: true,
        message: hasCredit ? "Saved as Credit" : "Payment completed",
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid Payment Method" },
      { status: 400 },
    );

    return NextResponse.json(
      { success: false, message: "Invalid Payment Method" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Checkout Processing Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
