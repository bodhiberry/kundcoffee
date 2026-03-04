// routes/api/customers/summary.ts
import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const customers = await prisma.customer.findMany({
      where: {
        storeId, // Filter by storeId
      },
      include: {
        CustomerLedger: true,
      },
    });

    let totalToReceive = 0;
    let totalToPay = 0;

    const summary = customers.map((c) => {
      // Calculate due amount based on ledger
      // For performance in future, this should be aggregated in DB or stored field
      // But adhering to existing logic pattern:
      const dueAmount =
        c.openingBalance +
        c.CustomerLedger.reduce((sum, l) => {
          if (
            l.type === "SALE" ||
            l.type === "ADJUSTMENT" ||
            l.type === "PAYMENT_OUT"
          )
            return sum + l.amount;
          if (l.type === "PAYMENT_IN" || l.type === "RETURN")
            return sum - l.amount;
          return sum;
        }, 0);

      if (dueAmount > 0) totalToReceive += dueAmount;
      else if (dueAmount < 0) totalToPay += Math.abs(dueAmount);

      return {
        id: c.id,
        fullName: c.fullName,
        email: c.email,
        phone: c.phone,
        dob: c.dob,
        loyaltyId: c.loyaltyId,
        loyaltyDiscount: c.loyaltyDiscount,
        dueAmount,
      };
    });

    return NextResponse.json({
      success: true,
      data: summary,
      metrics: {
        toReceive: totalToReceive,
        toPay: totalToPay,
        netToReceive: totalToReceive - totalToPay,
      },
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch customer summary" },
      { status: 500 },
    );
  }
}
