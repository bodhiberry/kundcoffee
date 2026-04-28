import { prisma } from "@/lib/prisma";

/**
 * Automatically closes a daily session if it's still open and the day has ended in Nepal Time.
 * This is intended to be called before fetching active sessions or starting new ones.
 */
export async function autoCloseStaleSessions(storeId: string) {
  try {
    const activeSession = await prisma.dailySession.findFirst({
      where: { storeId, status: "OPEN" },
      include: {
        payments: true,
        purchases: {
          where: { paymentMode: "CASH", isDeleted: false }
        }
      }
    });

    if (!activeSession) return false;

    // Nepal Time Date Check
    // Nepal is UTC+5:45
    const getNepalDateString = (date: Date) => {
      try {
        return new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Kathmandu",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(date);
      } catch (e) {
        // Fallback if Intl is not available or timezone fails
        const nptOffset = 5.75 * 60 * 60 * 1000;
        const nptDate = new Date(date.getTime() + nptOffset);
        return nptDate.toISOString().split("T")[0];
      }
    };

    const now = new Date();
    const todayNepal = getNepalDateString(now);
    const openedNepal = getNepalDateString(activeSession.openedAt);

    // If the opened date is before today in Nepal, it's stale
    if (openedNepal < todayNepal) {
      console.log(`[AutoClose] Stale session ${activeSession.id} found for store ${storeId}. Opened: ${openedNepal}, Today: ${todayNepal}`);
      
      // Reconciliation Logic
      const relevantPayments = activeSession.payments
        .filter(p => ["PAID", "CREDIT"].includes(p.status))
        .map(p => ({
          ...p,
          amount: parseFloat(p.amount.toString())
        }));

      const salesByMethod: Record<string, number> = {
        CASH: 0,
        QR: 0,
        ESEWA: 0,
        CARD: 0,
        BANK_TRANSFER: 0,
        CREDIT: 0
      };

      relevantPayments.forEach(p => {
        if (salesByMethod[p.method] !== undefined) {
          salesByMethod[p.method] += p.amount;
        } else {
          salesByMethod[p.method] = p.amount;
        }
      });

      const purchaseByMethod: Record<string, number> = {
        CASH: 0, QR: 0, ESEWA: 0, CARD: 0, BANK_TRANSFER: 0, CREDIT: 0
      };

      for (const p of activeSession.purchases) {
        const amount = parseFloat(p.totalAmount.toString());
        purchaseByMethod[p.paymentMode || "CASH"] = (purchaseByMethod[p.paymentMode || "CASH"] ?? 0) + amount;
      }

      const cashSales = salesByMethod.CASH || 0;
      const totalCashOutflow = purchaseByMethod.CASH || 0;
      const digitalOutflow = (purchaseByMethod.QR ?? 0) + (purchaseByMethod.ESEWA ?? 0) + (purchaseByMethod.CARD ?? 0) + (purchaseByMethod.BANK_TRANSFER ?? 0);
      const creditOutflow = purchaseByMethod.CREDIT ?? 0;
      
      // For auto-close, we assume expected == actual
      const expectedClosingBalance = parseFloat(activeSession.openingBalance.toString()) + cashSales - totalCashOutflow;
      const actualClosingBalance = expectedClosingBalance;
      const difference = 0;
      const cashOnDrawer = cashSales - totalCashOutflow;
      const totalRevenue = Object.values(salesByMethod).reduce((sum, amount) => sum + amount, 0);

      const salesBreakdownNote = Object.entries(salesByMethod)
        .filter(([_, amount]) => amount > 0)
        .map(([method, amount]) => `- ${method}: ${amount.toFixed(2)}`)
        .join("\n");

      const purchaseBreakdownNote = Object.entries(purchaseByMethod)
        .filter(([_, amount]) => amount > 0)
        .map(([method, amount]) => `- ${method}: ${amount.toFixed(2)}`)
        .join("\n");

      const purchaseNote = activeSession.purchases.length > 0 
        ? `\n\nCash Purchases (-):\n${activeSession.purchases.map(p => `- ${p.referenceNumber}: ${parseFloat(p.totalAmount.toString()).toFixed(2)}`).join("\n")}`
        : "";

      await prisma.dailySession.update({
        where: { id: activeSession.id },
        data: {
          closedAt: now,
          closedBy: { connect: { id: activeSession.openedById } },
          expectedClosingBalance,
          actualClosingBalance,
          difference,
          cashOnDrawer,
          status: "CLOSED",
          notes: `${activeSession.notes || ""}\n\n[SYSTEM] Automatically closed because the day ended.\n\nSession Revenue Breakdown:\n${salesBreakdownNote}\n- Total Revenue: ${totalRevenue.toFixed(2)}\n\nSession Purchase Breakdown:\n${purchaseBreakdownNote}\n- Total Purchases: ${(totalCashOutflow + digitalOutflow + creditOutflow).toFixed(2)}${purchaseNote}\n\nFinal Reconciliation:\n- Opening Cash: ${parseFloat(activeSession.openingBalance.toString()).toFixed(2)}\n- Cash Sales (+): ${cashSales.toFixed(2)}\n- Cash Purchases (-): ${totalCashOutflow.toFixed(2)}\n- Expected Cash: ${expectedClosingBalance.toFixed(2)}\n- Actual Cash in Drawer (Auto): ${actualClosingBalance.toFixed(2)}\n- Difference: ${difference.toFixed(2)}`.trim()
        }
      });
      
      console.log(`[AutoClose] Successfully closed session ${activeSession.id}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("[AutoClose] Error:", error);
    return false;
  }
}
