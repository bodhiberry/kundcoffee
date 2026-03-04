import { prisma } from "@/lib/prisma";
import { Params } from "@/lib/types";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest, context: { params: Params }) {
  const { id } = await context.params;

  try {
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        roleRef: true,
      },
    });

    if (!staff) {
      return NextResponse.json(
        { success: false, message: "Staff not found" },
        { status: 404 },
      );
    }

    const [orders, purchases, purchaseReturns, salesReturns, payments] =
      await Promise.all([
        prisma.order.findMany({
          where: { staffId: id, isDeleted: false },
          include: { items: true, payment: true, customer: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.purchase.findMany({
          where: { staffId: id, isDeleted: false },
          include: { items: true, supplier: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.purchaseReturn.findMany({
          where: { staffId: id, isDeleted: false },
          include: { items: true, supplier: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.salesReturn.findMany({
          where: { staffId: id, isDeleted: false },
          include: { items: true, customer: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.payment.findMany({
          where: { staffId: id, isDeleted: false },
          include: { session: { include: { table: true } } },
          orderBy: { createdAt: "desc" },
        }),
      ]);

    // Calculate Metrics
    const metrics = {
      totalOrders: orders.length,
      ordersValue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
      totalPurchases: purchases.length,
      purchasesValue: purchases.reduce(
        (sum, p) => sum + (p.totalAmount || 0),
        0,
      ),
      totalReturns: purchaseReturns.length + salesReturns.length,
      returnsValue:
        purchaseReturns.reduce((sum, pr) => sum + (pr.totalAmount || 0), 0) +
        salesReturns.reduce((sum, sr) => sum + (sr.totalAmount || 0), 0),
      totalPayments: payments.length,
      paymentsValue: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        staff,
        orders,
        purchases,
        purchaseReturns,
        salesReturns,
        payments,
        metrics,
      },
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
