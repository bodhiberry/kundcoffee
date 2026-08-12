import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
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

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");
    const date = searchParams.get("date");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const where: any = {
      isDeleted: false,
      storeId,
    };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.txnDate = { gte: start, lte: end };
    } else if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      where.txnDate = { gte: start, lte: end };
    } else if (filter) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      if (filter === "today") {
        where.txnDate = { gte: start, lte: end };
      } else if (filter === "yesterday") {
        const yesterdayStart = new Date(start);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = new Date(end);
        yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
        where.txnDate = { gte: yesterdayStart, lte: yesterdayEnd };
      } else if (filter === "this_month") {
        start.setDate(1);
        where.txnDate = { gte: start, lte: end };
      } else if (filter === "this_year") {
        start.setMonth(0, 1);
        where.txnDate = { gte: start, lte: end };
      }
    }

    // metrics calculation using aggregation for efficiency
    const metrics = await prisma.purchase.aggregate({
      where,
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // Note: quantity aggregation is slightly more complex as it's in a nested model.
    // We'll calculate total quantity separately or stick to a partial fetch if needed,
    // but for now, let's optimize the main metrics.
    const totalPurchaseCount = metrics._count.id || 0;
    const totalAmount = metrics._sum.totalAmount || 0;

    // Since we still need the list for the UI, we should limit the return count or paginate.
    // For now, we'll keep the findMany but remove the heavy manual loops where possible.
    const purchasesList = await prisma.purchase.findMany({
      where,
      include: {
        supplier: {
          select: { fullName: true },
        },
      },
      orderBy: {
        txnDate: "desc",
      },
      take: 100, // Safety limit
    });

    // Today's Metrics (Regardless of main filter)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayPurchases = await prisma.purchase.findMany({
      where: {
        storeId,
        isDeleted: false,
        txnDate: { gte: todayStart, lte: todayEnd },
      },
      select: {
        totalAmount: true,
        paymentMode: true,
      },
    });

    const todayMetrics = {
      total: 0,
      cash: 0,
      digital: 0,
      credit: 0,
    };

    todayPurchases.forEach((p) => {
      todayMetrics.total += p.totalAmount;
      if (p.paymentMode === "CASH") todayMetrics.cash += p.totalAmount;
      else if (p.paymentMode === "CREDIT") todayMetrics.credit += p.totalAmount;
      else todayMetrics.digital += p.totalAmount; // QR, ESEWA, etc.
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalPurchaseCount,
          totalAmount,
          totalQuantityPurchased: 0,
          mostPurchasedItem: "N/A",
          leadingSupplier: "N/A",
        },
        todayMetrics,
        purchases: purchasesList.map((p: any) => ({
          sn: p.id.slice(0, 8),
          id: p.id,
          referenceNumber: p.referenceNumber,
          supplier: p.supplier?.fullName || "Unknown",
          totalAmount: p.totalAmount,
          paymentStatus: p.paymentStatus,
          paymentMode: p.paymentMode || "N/A",
          txnDate: p.txnDate,
        })),
      },
    });
  } catch (error) {
    console.error("Purchase GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const storeId = session?.user?.storeId;

    if (!storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const {
      supplierId,
      txnDate,
      items,
      taxableAmount,
      totalAmount,
      discount,
      roundOff,
      paymentStatus,
      paymentMode,
      remark,
      attachment,
      staffId,
    } = body;

    const normalizedPaymentMode = paymentMode || null;
    const normalizedPaymentStatus =
      normalizedPaymentMode === "CREDIT" ? "PENDING" : "PAID";

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "No items provided" },
        { status: 400 },
      );
    }

    const referenceNumber = `PUR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const result = await prisma.$transaction(
      async (tx) => {
        // 0. Find active daily session
        const activeSession = await tx.dailySession.findFirst({
          where: { storeId, status: "OPEN" },
          select: { id: true }
        });

        // 1. Create Purchase
        const purchase = await tx.purchase.create({
          data: {
            referenceNumber,
            supplierId,
            txnDate: txnDate ? new Date(txnDate) : new Date(),
            taxableAmount,
            totalAmount,
            discount: parseFloat(discount) || 0,
            roundOff: parseFloat(roundOff) || 0,
            paymentStatus: normalizedPaymentStatus,
            paymentMode: normalizedPaymentMode,
            remark,
            attachment,
            staffId: staffId || null,
            storeId,
            dailySessionId: activeSession?.id || null,
            items: {
              create: items.map((item: any) => ({
                itemName: item.itemName,
                quantity: parseFloat(item.quantity),
                rate: parseFloat(item.rate),
                amount: parseFloat(item.amount),
                stockId: item.stockId || null,
              })),
            },
          },
        });

        // 2. Increase Stock & Update Cost Price
        for (const item of items) {
          if (item.stockId) {
            const qtyToAdd = parseFloat(item.quantity);
            const newRate = parseFloat(item.rate);
            
            await tx.stock.update({
              where: { id: item.stockId },
              data: {
                quantity: { increment: qtyToAdd },
                // Update costPrice to the latest purchase rate
                costPrice: newRate,
                // Recalculate total amount (valuation) based on new quantity and rate
                // Note: We fetch the existing stock to get current quantity after increment 
                // but increment happens in the same transaction. 
                // Better: update amount separately in next line or use a slightly more complex query.
                // Simple approach: set amount based on new state.
              },
            });

            // Re-fetch to get final quantity for accurate amount calculation
            const updatedStock = await tx.stock.findUnique({
              where: { id: item.stockId },
              select: { quantity: true }
            });

            if (updatedStock) {
              await tx.stock.update({
                where: { id: item.stockId },
                data: {
                  amount: Number((updatedStock.quantity * newRate).toFixed(2))
                }
              });
            }
          }
        }


        // 3. Update Supplier Ledger (PURCHASE - increases credit/payable)
        await tx.supplierLedger.create({
          data: {
            supplierId,
            storeId,
            txnNo: referenceNumber,
            type: "PURCHASE",
            amount: parseFloat(totalAmount),
            closingBalance: 0, // Running balance calculated on fly
            referenceId: purchase.id,
            remarks: remark || `Purchase Bill ${referenceNumber}`,
          },
        });

        // 4. If PAID, create a PAYMENT entry immediately
        if (normalizedPaymentStatus === "PAID") {
          await tx.supplierLedger.create({
            data: {
              supplierId,
              storeId,
              txnNo: `PAY-P-${purchase.id.slice(0, 8).toUpperCase()}`,
              type: "PAYMENT",
              amount: parseFloat(totalAmount),
              closingBalance: 0,
              referenceId: purchase.id,
              remarks: `Immediate payment for bill ${referenceNumber}`,
            },
          });
        }

        return purchase;
      },
      { timeout: 20000 },
    );

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Purchase POST Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
