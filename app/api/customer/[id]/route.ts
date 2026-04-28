import { prisma } from "@/lib/prisma";
import { Params } from "@/lib/types";
import { NextResponse ,NextRequest} from "next/server";

export async function GET(req: NextRequest, context: { params: Params }) {
  const { id } = await context.params;

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        CustomerLedger: { orderBy: { createdAt: "desc" } },
        orders: {
          include: { items: true, payment: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 },
      );
    }

    // Calculate Metrics
    let totalSales = 0;
    let salesReturn = 0;
    let paymentIn = 0;
    let paymentOut = 0;

    customer.CustomerLedger.forEach((l) => {
      if (l.type === "SALE") totalSales += l.amount;
      if (l.type === "RETURN") salesReturn += l.amount;
      if (l.type === "PAYMENT_IN") paymentIn += l.amount;
      if (l.type === "PAYMENT_OUT") paymentOut += l.amount;
    });

    const ledgerData: any[] = [];
    const processedPaymentGroups = new Set<string>();

    customer.CustomerLedger.forEach((l: any) => {
      if (l.type === "PAYMENT_IN" && l.splitGroupId) {
        if (!processedPaymentGroups.has(l.splitGroupId)) {
          const group = customer.CustomerLedger.filter(
            (sl) => sl.splitGroupId === l.splitGroupId && sl.type === "PAYMENT_IN"
          );
          
          if (group.length > 1) {
            const totalAmount = group.reduce((sum, item) => sum + item.amount, 0);
            const methods = group.map(item => item.remarks?.replace("Payment for Order - ", "")).join(", ");
            
            ledgerData.push({
              ...l,
              amount: totalAmount,
              remarks: `Split Payment (${methods})`,
              isSplit: true,
              parts: group
            });
            processedPaymentGroups.add(l.splitGroupId);
          } else {
            ledgerData.push(l);
          }
        }
      } else {
        ledgerData.push(l);
      }
    });

    const ordersWithPayments = await Promise.all(
      customer.orders.map(async (order: any) => {
        if (order.splitGroupId) {
          const splitPayments = await prisma.payment.findMany({
            where: { splitGroupId: order.splitGroupId },
          });
          return { ...order, splitPayments };
        }
        return {
          ...order,
          splitPayments: order.payment ? [order.payment] : [],
        };
      })
    );

    const dueAmount =
      customer.openingBalance +
      (totalSales + paymentOut) -
      (paymentIn + salesReturn);

    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        CustomerLedger: ledgerData,
        orders: ordersWithPayments,
        dueAmount,
        metrics: {
          totalSales,
          salesReturn,
          paymentIn,
          paymentOut,
        },
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

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;

  try {
    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Customer deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, context: { params: Params }) {
  try {
    const { id } = await context.params;
    if (!id)
      return NextResponse.json({
        success: false,
        message: "Customer not found",
      });

    const {
      fullName,
      phone,
      email,
      dob,
      loyaltyId,
      creditLimit,
      creditTermDays,
      loyaltyDiscount,
      legalName,
      taxNumber,
      address,
      notes,
    } = await req.json();

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 },
      );
    }

    if (phone && phone !== customer.phone) {
      const phoneExists = await prisma.customer.findUnique({
        where: { phone },
      });
      if (phoneExists) {
        return NextResponse.json(
          { success: false, message: "Phone already in use" },
          { status: 409 },
        );
      }
    }
    if (creditLimit !== undefined && creditLimit < 0) {
      return NextResponse.json(
        { success: false, message: "Invalid credit limit" },
        { status: 400 },
      );
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        fullName,
        phone,
        email,
        dob,
        loyaltyId,
        creditLimit,
        creditTermDays,
        loyaltyDiscount,
        legalName,
        taxNumber,
        address,
        notes,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedCustomer,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to update customer" },
      { status: 500 },
    );
  }
}
