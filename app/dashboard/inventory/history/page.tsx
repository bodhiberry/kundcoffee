"use client";

import { useEffect, useState } from "react";
import {
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Tag,
  PackagePlus,
  RefreshCw,
  Edit3,
  Sliders,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { PageHeaderAction } from "@/components/ui/PageHeaderAction";
import { MetricCard } from "@/components/ui/MetricCard";

export default function StockHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "ALL" | "RESTOCK" | "PRICE_NAME" | "PURCHASE" | "CONSUMPTION"
  >("ALL");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory/history");
      const data = await res.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch stock history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredHistory = history.filter((h) => {
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch =
      (h.stockName && h.stockName.toLowerCase().includes(lowerQuery)) ||
      (h.reference && h.reference.toLowerCase().includes(lowerQuery)) ||
      (h.entity && h.entity.toLowerCase().includes(lowerQuery)) ||
      (h.type && h.type.toLowerCase().includes(lowerQuery));

    if (!matchesSearch) return false;

    if (filterType === "ALL") return true;
    if (filterType === "RESTOCK") {
      return h.type === "RESTOCK" || h.type === "INITIAL_STOCK";
    }
    if (filterType === "PRICE_NAME") {
      return (
        h.type === "PRICE_UPDATE" ||
        h.type === "NAME_CHANGE" ||
        h.type === "ADJUSTMENT"
      );
    }
    if (filterType === "PURCHASE") {
      return h.type === "PURCHASE";
    }
    if (filterType === "CONSUMPTION") {
      return (
        h.type === "CONSUMPTION" ||
        h.type === "CONSUMPTION_LINK" ||
        h.type === "DEDUCTION"
      );
    }

    return true;
  });

  const getActionBadge = (type: string) => {
    switch (type) {
      case "INITIAL_STOCK":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <PackagePlus size={12} /> Initial Stock
          </span>
        );
      case "RESTOCK":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowUpRight size={12} /> Restocked (+)
          </span>
        );
      case "PRICE_UPDATE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <DollarSign size={12} /> Price Change
          </span>
        );
      case "NAME_CHANGE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Edit3 size={12} /> Name Change
          </span>
        );
      case "ADJUSTMENT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Sliders size={12} /> Adjustment
          </span>
        );
      case "PURCHASE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <ArrowUpRight size={12} /> Supplier Bill
          </span>
        );
      case "CONSUMPTION":
      case "CONSUMPTION_LINK":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <ArrowDownLeft size={12} /> Order Deduction
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-700">
            {type}
          </span>
        );
    }
  };

  const restockCount = history.filter(
    (h) => h.type === "RESTOCK" || h.type === "INITIAL_STOCK",
  ).length;
  const priceNameCount = history.filter(
    (h) =>
      h.type === "PRICE_UPDATE" ||
      h.type === "NAME_CHANGE" ||
      h.type === "ADJUSTMENT",
  ).length;

  return (
    <div className="px-6 py-10">
      <PageHeaderAction
        title="Stock & Audit History"
        description="Immutable audit trail of stock additions, cost & selling price changes, name updates, and movements"
        onSearch={setSearchQuery}
      />

      <div className="grid grid-cols-4 gap-6 mb-6">
        <MetricCard title="Total Audit Entries" value={history.length} />
        <MetricCard title="Restocks & Initial Additions" value={restockCount} />
        <MetricCard title="Price & Name Updates" value={priceNameCount} />
        <MetricCard
          title="Procurement & Linked Consumptions"
          value={history.length - restockCount - priceNameCount}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setFilterType("ALL")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterType === "ALL"
              ? "bg-zinc-900 text-white shadow-sm"
              : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          All Activities ({history.length})
        </button>
        <button
          onClick={() => setFilterType("RESTOCK")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterType === "RESTOCK"
              ? "bg-zinc-900 text-white shadow-sm"
              : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          Restocks ({restockCount})
        </button>
        <button
          onClick={() => setFilterType("PRICE_NAME")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterType === "PRICE_NAME"
              ? "bg-zinc-900 text-white shadow-sm"
              : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          Price & Name Audits ({priceNameCount})
        </button>
        <button
          onClick={() => setFilterType("PURCHASE")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterType === "PURCHASE"
              ? "bg-zinc-900 text-white shadow-sm"
              : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          Purchases
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-600">
          <thead className="bg-zinc-50/80 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-[11px] tracking-wider">
                Event Type
              </th>
              <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-[11px] tracking-wider">
                Stock Item
              </th>
              <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-[11px] tracking-wider">
                Quantity Impact
              </th>
              <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-[11px] tracking-wider">
                Cost & Selling Rate
              </th>
              <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-[11px] tracking-wider">
                Audit Details / Reference
              </th>
              <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-[11px] tracking-wider">
                Staff / Entity
              </th>
              <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-[11px] tracking-wider text-right">
                Date & Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredHistory.map((h, i) => {
              const hasQtyChange =
                h.quantity !== undefined &&
                h.quantity !== null &&
                h.quantity !== 0;

              return (
                <tr
                  key={h.id || i}
                  className="hover:bg-zinc-50/70 transition-colors"
                >
                  <td className="px-6 py-4">{getActionBadge(h.type)}</td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-zinc-900">
                        {h.stockName}
                      </span>
                      {h.oldName && h.newName && h.oldName !== h.newName && (
                        <span className="text-[10px] text-amber-700">
                          Renamed from &ldquo;{h.oldName}&rdquo;
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    {hasQtyChange ? (
                      <div className="flex flex-col">
                        <span
                          className={`font-mono font-bold text-xs ${
                            h.quantity > 0
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {h.quantity > 0 ? `+${h.quantity}` : h.quantity}{" "}
                          {h.unit}
                        </span>
                        {h.previousQuantity !== null &&
                          h.previousQuantity !== undefined &&
                          h.newQuantity !== null &&
                          h.newQuantity !== undefined && (
                            <span className="text-[10px] text-zinc-400 font-mono">
                              ({h.previousQuantity} → {h.newQuantity})
                            </span>
                          )}
                      </div>
                    ) : (
                      <span className="text-zinc-400 text-xs">—</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col text-xs font-mono">
                      {h.costPrice !== null && h.costPrice !== undefined && (
                        <span className="text-zinc-800">
                          Cost: Rs. {Number(h.costPrice).toFixed(2)}
                        </span>
                      )}
                      {h.sellingPrice !== null &&
                        h.sellingPrice !== undefined &&
                        h.sellingPrice > 0 && (
                          <span className="text-zinc-500 text-[11px]">
                            Selling: Rs. {Number(h.sellingPrice).toFixed(2)}
                          </span>
                        )}
                      {h.costPrice === null && h.sellingPrice === null && (
                        <span className="text-zinc-400">—</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-xs text-zinc-700 leading-snug font-medium">
                      {h.reference || "—"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
                      {h.entity || "Staff"}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <span className="text-xs font-mono text-zinc-500">
                      {h.date
                        ? format(new Date(h.date), "MMM dd, yyyy HH:mm")
                        : "—"}
                    </span>
                  </td>
                </tr>
              );
            })}

            {filteredHistory.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-zinc-500">
                  <History className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                  <p className="font-semibold text-zinc-700">
                    No history records found
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Stock additions, price updates, and restocks will be audited
                    here automatically.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
