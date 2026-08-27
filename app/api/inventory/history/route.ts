import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.storeId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const storeId = session.user.storeId;

    const { searchParams } = new URL(req.url);
    const stockId = searchParams.get("stockId");

    // 1. Fetch Stock Audit Logs
    const audits = await prisma.stockAudit.findMany({
      where: {
        storeId,
        ...(stockId ? { stockId } : {}),
      },
      include: {
        stock: {
          select: {
            id: true,
            name: true,
            unit: { select: { shortName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Fetch Purchases
    const purchases = await prisma.purchaseItem.findMany({
      where: {
        purchase: { storeId },
        ...(stockId ? { stockId } : {}),
      },
      include: {
        purchase: {
          select: {
            id: true,
            txnDate: true,
            referenceNumber: true,
            supplier: { select: { fullName: true } },
          },
        },
        stock: {
          select: { name: true, unit: { select: { shortName: true } } },
        },
      },
      orderBy: { purchase: { txnDate: "desc" } },
    });

    // 3. Fetch Consumptions
    const consumptions = await prisma.stockConsumption.findMany({
      where: {
        stock: { storeId },
        ...(stockId ? { stockId } : {}),
      },
      include: {
        stock: {
          select: { name: true, unit: { select: { shortName: true } } },
        },
        dish: { select: { name: true } },
        addOn: { select: { name: true } },
        combo: { select: { name: true } },
      },
      orderBy: { id: "desc" },
    });

    // Merge and format
    const history = [
      ...audits.map((a) => ({
        id: a.id,
        type: a.action,
        date: a.createdAt,
        stockName: a.stock?.name || a.newName || a.oldName || "Stock Item",
        quantity: a.quantityChange ?? 0,
        previousQuantity: a.previousQuantity,
        newQuantity: a.newQuantity,
        costPrice: a.costPrice,
        previousCostPrice: a.previousCostPrice,
        sellingPrice: a.sellingPrice,
        previousSellingPrice: a.previousSellingPrice,
        oldName: a.oldName,
        newName: a.newName,
        unit: a.stock?.unit?.shortName || "",
        reference: a.remarks || a.action,
        entity: a.performedBy || "Staff",
      })),
      ...purchases.map((p) => ({
        id: p.id,
        type: "PURCHASE",
        date: p.purchase.txnDate,
        stockName: p.stock?.name || p.itemName,
        quantity: p.quantity,
        previousQuantity: null,
        newQuantity: null,
        costPrice: p.rate,
        previousCostPrice: null,
        sellingPrice: null,
        previousSellingPrice: null,
        oldName: null,
        newName: null,
        unit: p.stock?.unit?.shortName || "",
        reference: `Invoice #${p.purchase.referenceNumber} (Rate: Rs. ${p.rate})`,
        entity: p.purchase.supplier.fullName,
      })),
      ...consumptions.map((c) => ({
        id: c.id,
        type: "CONSUMPTION_LINK",
        date: new Date(),
        stockName: c.stock.name,
        quantity: -c.quantity,
        previousQuantity: null,
        newQuantity: null,
        costPrice: null,
        previousCostPrice: null,
        sellingPrice: null,
        previousSellingPrice: null,
        oldName: null,
        newName: null,
        unit: c.stock.unit?.shortName || "",
        reference: `Recipe link: ${c.dish?.name || c.addOn?.name || c.combo?.name || "Dish"}`,
        entity: "System",
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error("Stock History GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
