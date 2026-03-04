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

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: true,
        items: true,
      },
      orderBy: {
        txnDate: "desc",
      },
    });

    // Metrics calculation
    let totalAmount = 0;
    let totalQuantityPurchased = 0;
    const itemQuantities: Record<string, number> = {};
    const supplierValues: Record<string, number> = {};

    purchases.forEach((p: any) => {
      totalAmount += p.totalAmount;
      const supplierName = p.supplier?.fullName || "Unknown";
      supplierValues[supplierName] =
        (supplierValues[supplierName] || 0) + p.totalAmount;

      p.items?.forEach((item: any) => {
        totalQuantityPurchased += item.quantity;
        itemQuantities[item.itemName] =
          (itemQuantities[item.itemName] || 0) + item.quantity;
      });
    });

    const totalPurchaseCount = purchases.length;

    // Most Purchased Item
    let mostPurchasedItem = "N/A";
    let maxItemQty = 0;
    for (const [name, qty] of Object.entries(itemQuantities)) {
      if (qty > maxItemQty) {
        maxItemQty = qty;
        mostPurchasedItem = name;
      }
    }

    // Top Supplier (By Value)
    let leadingSupplier = "N/A";
    let maxSupplierValue = 0;
    for (const [name, val] of Object.entries(supplierValues)) {
      if (val > maxSupplierValue) {
        maxSupplierValue = val;
        leadingSupplier = name;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalPurchaseCount,
          totalAmount,
          totalQuantityPurchased,
          mostPurchasedItem,
          leadingSupplier,
        },
        purchases: purchases.map((p: any) => ({
          sn: p.id.slice(0, 8),
          id: p.id,
          referenceNumber: p.referenceNumber,
          supplier: p.supplier?.fullName || "Unknown",
          totalAmount: p.totalAmount,
          paymentStatus: p.paymentStatus,
          paymentMode: p.paymentMode || "N/A",
          txnDate: p.txnDate,
          items: p.items,
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

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "No items provided" },
        { status: 400 },
      );
    }

    const referenceNumber = `PUR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const result = await prisma.$transaction(async (tx) => {
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
          paymentStatus: paymentStatus || "PENDING",
          paymentMode: paymentMode || null,
          remark,
          attachment,
          staffId,
          storeId,
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

      // 2. Increase Stock
      for (const item of items) {
        if (item.stockId) {
          await tx.stock.update({
            where: { id: item.stockId },
            data: {
              quantity: { increment: parseFloat(item.quantity) },
            },
          });
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
      if (paymentStatus === "PAID") {
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
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Purchase POST Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
