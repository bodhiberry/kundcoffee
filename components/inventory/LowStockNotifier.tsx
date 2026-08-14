"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface LowStockNotifierProps {
  threshold?: number;
  silentIfEmpty?: boolean;
}

export function useLowStockAlert(threshold: number = 5) {
  const hasNotified = useRef(false);

  const checkLowStock = async () => {
    try {
      const res = await fetch("/api/stocks");
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data)) return;

      const stocks: any[] = data.data;
      const outOfStock = stocks.filter((s) => (s.quantity || 0) <= 0);
      const lowStock = stocks.filter(
        (s) => (s.quantity || 0) > 0 && (s.quantity || 0) <= threshold,
      );

      if (outOfStock.length > 0) {
        const names = outOfStock.map((s) => s.name).join(", ");
        toast.error(`Out of Stock (${outOfStock.length}): ${names}`, {
          duration: 6000,
          description: "Note: Immediate restock required for these items.",
        });
      }

      if (lowStock.length > 0) {
        const names = lowStock
          .map((s) => `${s.name} (${s.quantity} ${s.unit?.shortName || ""})`)
          .join(", ");
        toast.warning(`Low Stock Alert (${lowStock.length}): ${names}`, {
          duration: 6000,
          description: "Note: Items are running low and about to finish.",
        });
      }
    } catch (err) {
      console.error("Failed to check low stock", err);
    }
  };

  useEffect(() => {
    // Alert once per session/mount
    const sessionAlerted = sessionStorage.getItem("low_stock_alerted");
    if (!sessionAlerted && !hasNotified.current) {
      hasNotified.current = true;
      sessionStorage.setItem("low_stock_alerted", "true");
      checkLowStock();
    }
  }, [threshold]);

  return { triggerCheck: checkLowStock };
}

export default function LowStockNotifier({ threshold = 5 }: LowStockNotifierProps) {
  useLowStockAlert(threshold);
  return null;
}
