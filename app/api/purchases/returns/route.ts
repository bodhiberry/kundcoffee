import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";

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

    const returns = await prisma.purchaseReturn.findMany({
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
    let totalQuantityReturned = 0;
    const itemQuantities: Record<string, number> = {};
    const supplierValues: Record<string, number> = {};

    returns.forEach((r: any) => {
      totalAmount += r.totalAmount;
      const supplierName = r.supplier?.fullName || "Unknown";
      supplierValues[supplierName] =
        (supplierValues[supplierName] || 0) + r.totalAmount;

      r.items?.forEach((item: any) => {
        totalQuantityReturned += item.quantity;
        itemQuantities[item.itemName] =
          (itemQuantities[item.itemName] || 0) + item.quantity;
      });
    });

    const totalReturnCount = returns.length;

    // Most Returned Item
    let mostReturned = "N/A";
    let maxQty = 0;
    for (const [name, qty] of Object.entries(itemQuantities)) {
      if (qty > maxQty) {
        maxQty = qty;
        mostReturned = name;
      }
    }

    // Top Returning Supplier (By Value)
    let topReturnedSupplier = "N/A";
    let maxReturnVal = 0;
    for (const [name, val] of Object.entries(supplierValues)) {
      if (val > maxReturnVal) {
        maxReturnVal = val;
        topReturnedSupplier = name;
      }
    }

    const response: ApiResponse = {
      success: true,
      data: {
        metrics: {
          totalReturnCount,
          totalAmount,
          totalQuantityReturned,
          mostReturned,
          topReturnedSupplier,
        },
        returns: returns.map((r: any) => ({
          sn: r.id.slice(0, 8),
          id: r.id,
          referenceNumber: r.referenceNumber,
          supplierId: r.supplierId,
          supplier: r.supplier?.fullName || "Unknown",
          totalAmount: r.totalAmount,
          paymentStatus: r.paymentStatus,
          paymentMode: r.paymentMode || "N/A",
          txnDate: r.txnDate,
          items: r.items,
        })),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Purchase Return GET Error:", error);
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
      purchaseReference,
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

    const referenceNumber = `PRT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Purchase Return
      const purchaseReturn = await tx.purchaseReturn.create({
        data: {
          referenceNumber,
          supplierId,
          txnDate: txnDate ? new Date(txnDate) : new Date(),
          purchaseReference,
          taxableAmount: parseFloat(taxableAmount),
          totalAmount: parseFloat(totalAmount),
          discount: parseFloat(discount) || 0,
          roundOff: parseFloat(roundOff) || 0,
          paymentStatus: paymentStatus || "UNPAID",
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

      // 2. Decrease Stock
      for (const item of items) {
        if (item.stockId) {
          await tx.stock.update({
            where: { id: item.stockId },
            data: {
              quantity: { decrement: parseFloat(item.quantity) },
            },
          });
        }
      }

      // 3. Update Supplier Ledger (RETURN - decreases credit/payable, increases debit)
      await tx.supplierLedger.create({
        data: {
          supplierId,
          storeId,
          txnNo: referenceNumber,
          type: "RETURN",
          amount: parseFloat(totalAmount),
          closingBalance: 0,
          referenceId: purchaseReturn.id,
          remarks: remark || `Purchase Return ${referenceNumber}`,
        },
      });

      return purchaseReturn;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Purchase Return POST Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
