"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Package, RefreshCcw, FileText } from "lucide-react";
import Link from "next/link";
import PurchaseModal from "@/components/procurement/PurchaseModal";

interface LowStockHeaderWidgetProps {
  threshold?: number;
}

export default function LowStockHeaderWidget({ threshold = 5 }: LowStockHeaderWidgetProps) {
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchStocks = async () => {
    try {
      const res = await fetch("/api/stocks", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setStocks(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch low stock header widget data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 30000);
    return () => clearInterval(interval);
  }, []);

  const outOfStock = stocks.filter((s) => (s.quantity || 0) <= 0);
  const lowStock = stocks.filter(
    (s) => (s.quantity || 0) > 0 && (s.quantity || 0) <= threshold,
  );
  const totalAlerts = outOfStock.length + lowStock.length;

  if (loading || totalAlerts === 0) {
    return (
      <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border-l-4 border-l-emerald-500 border border-emerald-200/60 px-4 py-2.5 rounded-xl text-xs font-medium shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        Note: All Stocks Sufficient
      </div>
    );
  }

  const isCritical = outOfStock.length > 0;

  return (
    <>
      <div className="relative font-sans">
        {/* Note-Style Header Widget */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl border border-zinc-200/80 shadow-sm cursor-pointer transition-all duration-200 ${
            isCritical
              ? "bg-rose-50/90 border-l-4 border-l-rose-500 text-rose-950 hover:bg-rose-100/90"
              : "bg-amber-50/90 border-l-4 border-l-amber-500 text-amber-950 hover:bg-amber-100/90"
          }`}
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-800">
                {isCritical ? "Stock Note: Critical" : "Stock Note: Low Level"}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                  isCritical ? "bg-rose-600" : "bg-amber-600"
                }`}
              >
                {totalAlerts} {totalAlerts === 1 ? "Item" : "Items"}
              </span>
            </div>
            <span className="text-[11px] font-medium text-zinc-600 mt-0.5 line-clamp-1">
              {isCritical
                ? `${outOfStock.length} out of stock item(s)`
                : `${lowStock.length} item(s) running low`}
            </span>
          </div>

          <RefreshCcw
            size={13}
            className="text-zinc-400 hover:text-zinc-700 ml-1 transition-transform active:rotate-180"
            onClick={(e) => {
              e.stopPropagation();
              fetchStocks();
            }}
          />
        </div>

        {/* Note-Style Expanded Panel */}
        {isExpanded && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl z-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <div className="flex items-center gap-1.5 text-zinc-800">
                <FileText className="h-4 w-4 text-zinc-500" />
                <h4 className="text-xs font-black uppercase tracking-wider">
                  Inventory Restock Note
                </h4>
              </div>
              <span className="text-[10px] font-semibold text-zinc-400">
                {totalAlerts} pending
              </span>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {/* Out of Stock Items */}
              {outOfStock.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50/70 border-l-2 border-l-rose-500 border border-rose-100 text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-zinc-900">{s.name}</span>
                    <span className="text-[10px] text-zinc-500 font-medium">
                      {s.group?.name || "Raw Material"}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded uppercase">
                    0 {s.unit?.shortName || ""} (Out)
                  </span>
                </div>
              ))}

              {/* Low Stock Items */}
              {lowStock.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/70 border-l-2 border-l-amber-500 border border-amber-100 text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-zinc-900">{s.name}</span>
                    <span className="text-[10px] text-zinc-500 font-medium">
                      {s.group?.name || "Raw Material"}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded uppercase">
                    {s.quantity} {s.unit?.shortName || ""} left
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setIsExpanded(false);
                  setIsPurchaseOpen(true);
                }}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all text-center"
              >
                + New Purchase Restock
              </button>
              <Link
                href="/dashboard/inventory/consumption"
                onClick={() => setIsExpanded(false)}
                className="py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold transition-all text-center flex items-center gap-1 shrink-0"
              >
                Summary <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}
      </div>

      <PurchaseModal
        isOpen={isPurchaseOpen}
        onClose={() => setIsPurchaseOpen(false)}
        onSuccess={fetchStocks}
      />
    </>
  );
}
