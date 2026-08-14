"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import {
  TrendingDown,
  Plus,
  Search,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BarChart3,
  RefreshCw,
  ArrowUpRight,
  Filter,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { PageHeaderAction } from "@/components/ui/PageHeaderAction";
import ConsumptionModal from "@/components/inventory/ConsumptionModal";
import StockModal from "@/components/inventory/StockModal";
import PurchaseModal from "@/components/procurement/PurchaseModal";
import LowStockNotifier, { useLowStockAlert } from "@/components/inventory/LowStockNotifier";

export default function ConsumptionAnalyticsPage() {
  const [consumptions, setConsumptions] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [isConsumptionModalOpen, setIsConsumptionModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [stockSearch, setStockSearch] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [stockTabFilter, setStockTabFilter] = useState<"ALL" | "OUT" | "LOW" | "HEALTHY">("ALL");

  const { triggerCheck } = useLowStockAlert(5);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [consRes, stocksRes, unitsRes, groupsRes] = await Promise.all([
        fetch("/api/inventory/consumptions"),
        fetch("/api/stocks"),
        fetch("/api/inventory/measuring-unit"),
        fetch("/api/inventory/groups"),
      ]);

      const consData = await consRes.json();
      const stocksData = await stocksRes.json();
      const unitsData = await unitsRes.json();
      const groupsData = await groupsRes.json();

      if (consData.success) setConsumptions(consData.data || []);
      if (stocksData.success) setStocks(stocksData.data || []);
      if (unitsData.success) setUnits(unitsData.data || []);
      if (groupsData.success) setGroups(groupsData.data || []);
    } catch (error) {
      toast.error("Failed to load stock consumption analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate Key Inventory Metrics
  const totalStockItems = stocks.length;
  const outOfStockItems = stocks.filter((s) => (s.quantity || 0) <= 0);
  const lowStockItems = stocks.filter(
    (s) => (s.quantity || 0) > 0 && (s.quantity || 0) <= 5,
  );
  const healthyStockItems = stocks.filter((s) => (s.quantity || 0) > 5);

  const totalInventoryValue = stocks.reduce(
    (acc, s) => acc + (s.amount || (s.quantity || 0) * (s.costPrice || 0)),
    0,
  );

  // Aggregate consumption by stock item for analytics
  const consumptionAnalyticsMap: Record<
    string,
    { stockName: string; unit: string; totalConsumed: number; count: number }
  > = {};

  consumptions.forEach((c) => {
    const stockName = c.stock?.name || "Unknown";
    const unit = c.stock?.unit?.shortName || "";
    if (!consumptionAnalyticsMap[stockName]) {
      consumptionAnalyticsMap[stockName] = {
        stockName,
        unit,
        totalConsumed: 0,
        count: 0,
      };
    }
    consumptionAnalyticsMap[stockName].totalConsumed += c.quantity || 0;
    consumptionAnalyticsMap[stockName].count += 1;
  });

  const topConsumedItems = Object.values(consumptionAnalyticsMap)
    .sort((a, b) => b.totalConsumed - a.totalConsumed)
    .slice(0, 6);

  // Filtering stocks left
  const filteredStocks = stocks.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(stockSearch.toLowerCase()) ||
      s.group?.name?.toLowerCase().includes(stockSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (stockTabFilter === "OUT") return (s.quantity || 0) <= 0;
    if (stockTabFilter === "LOW") return (s.quantity || 0) > 0 && (s.quantity || 0) <= 5;
    if (stockTabFilter === "HEALTHY") return (s.quantity || 0) > 5;
    return true;
  });

  // Filtering consumption logs
  const filteredConsumptions = consumptions.filter((c) =>
    c.stock?.name.toLowerCase().includes(logSearch.toLowerCase()) ||
    c.dish?.name?.toLowerCase().includes(logSearch.toLowerCase()) ||
    c.addOn?.name?.toLowerCase().includes(logSearch.toLowerCase()) ||
    c.combo?.name?.toLowerCase().includes(logSearch.toLowerCase())
  );

  const handleManualCheck = () => {
    triggerCheck();
    toast.info("Low stock scan completed");
  };

  return (
    <div className="px-6 py-10 space-y-8 bg-zinc-50 min-h-screen">
      <LowStockNotifier threshold={5} />

      {/* Header */}
      <PageHeaderAction
        title="Stock Consumption Analytics & Inventory Summary"
        description="Comprehensive summary of stock levels, remaining raw materials, and consumption trends"
        actionButton={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleManualCheck}
              className="border-zinc-300 hover:bg-zinc-100 text-zinc-800"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Low Stocks
            </Button>
            <Button
              onClick={() => setIsConsumptionModalOpen(true)}
              className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Record Consumption
            </Button>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Total Stock Items
            </p>
            <p className="text-3xl font-extrabold text-zinc-900 mt-1">
              {totalStockItems}
            </p>
            <p className="text-xs font-medium text-zinc-500 mt-1">
              Active raw materials
            </p>
          </div>
          <div className="p-3 bg-zinc-100 rounded-xl text-zinc-700">
            <Package className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Stock Value Remaining
            </p>
            <p className="text-3xl font-extrabold text-zinc-900 mt-1">
              Rs. {totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs font-medium text-zinc-500 mt-1">
              Total valuation left
            </p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div
          onClick={() => setStockTabFilter("LOW")}
          className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all"
        >
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Low Stock Warning (≤ 5)
            </p>
            <p className="text-3xl font-extrabold text-amber-600 mt-1">
              {lowStockItems.length}
            </p>
            <p className="text-xs font-medium text-amber-700 mt-1">
              Items running out soon
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div
          onClick={() => setStockTabFilter("OUT")}
          className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-rose-400 transition-all"
        >
          <div>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">
              Out of Stock (0)
            </p>
            <p className="text-3xl font-extrabold text-rose-600 mt-1">
              {outOfStockItems.length}
            </p>
            <p className="text-xs font-medium text-rose-700 mt-1">
              Needs immediate restock
            </p>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <XCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* SECTION 1: STOCKS REMAINING SUMMARY */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-zinc-700" />
              Remaining Stock Levels & Status
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Live snapshot of inventory quantities left in stock
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search stock or category..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-xs border border-zinc-200 rounded-xl w-60 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-zinc-100 p-1 rounded-xl text-xs font-medium text-zinc-600">
              <button
                onClick={() => setStockTabFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  stockTabFilter === "ALL"
                    ? "bg-white text-zinc-900 font-bold shadow-sm"
                    : "hover:text-zinc-900"
                }`}
              >
                All ({stocks.length})
              </button>
              <button
                onClick={() => setStockTabFilter("OUT")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  stockTabFilter === "OUT"
                    ? "bg-rose-500 text-white font-bold shadow-sm"
                    : "hover:text-rose-600"
                }`}
              >
                Out of Stock ({outOfStockItems.length})
              </button>
              <button
                onClick={() => setStockTabFilter("LOW")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  stockTabFilter === "LOW"
                    ? "bg-amber-500 text-white font-bold shadow-sm"
                    : "hover:text-amber-600"
                }`}
              >
                Low Stock ({lowStockItems.length})
              </button>
              <button
                onClick={() => setStockTabFilter("HEALTHY")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  stockTabFilter === "HEALTHY"
                    ? "bg-emerald-600 text-white font-bold shadow-sm"
                    : "hover:text-emerald-700"
                }`}
              >
                Sufficient ({healthyStockItems.length})
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsPurchaseModalOpen(true)}
              className="border-zinc-300 text-xs hover:bg-zinc-100"
            >
              + New Purchase Restock
            </Button>
          </div>
        </div>

        {/* Stock Remaining Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Stock Item</th>
                <th className="px-6 py-3.5">Group / Category</th>
                <th className="px-6 py-3.5">Quantity Left</th>
                <th className="px-6 py-3.5">Stock Level Indicator</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Unit Cost Price</th>
                <th className="px-6 py-3.5">Total Value Left</th>
                <th className="px-6 py-3.5 text-right">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
              {filteredStocks.map((s) => {
                const qty = s.quantity || 0;
                const isOut = qty <= 0;
                const isLow = qty > 0 && qty <= 5;
                const totalValue = s.amount || qty * (s.costPrice || 0);

                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-zinc-50 transition-colors ${
                      isOut ? "bg-rose-50/40" : isLow ? "bg-amber-50/30" : ""
                    }`}
                  >
                    <td className="px-6 py-4 font-bold text-zinc-900 flex items-center gap-2">
                      {isOut && <XCircle className="h-4 w-4 text-rose-500 shrink-0" />}
                      {isLow && <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
                      {!isOut && !isLow && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                      {s.name}
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-zinc-100 rounded text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                        {s.group?.name || "Uncategorized"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`font-black text-sm ${
                          isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-zinc-900"
                        }`}
                      >
                        {qty.toLocaleString()}{" "}
                        <span className="text-xs font-normal text-zinc-500">
                          {s.unit?.shortName || ""}
                        </span>
                      </span>
                    </td>

                    {/* Stock Level Indicator Bar */}
                    <td className="px-6 py-4 w-44">
                      <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOut
                              ? "w-0 bg-rose-500"
                              : isLow
                              ? "w-1/3 bg-amber-500"
                              : "w-full bg-emerald-500"
                          }`}
                        />
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {isOut && (
                        <span className="px-2.5 py-1 bg-rose-100 text-rose-700 font-bold text-[10px] rounded-full uppercase tracking-wider">
                          OUT OF STOCK
                        </span>
                      )}
                      {isLow && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-full uppercase tracking-wider">
                          LOW STOCK
                        </span>
                      )}
                      {!isOut && !isLow && (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full uppercase tracking-wider">
                          IN STOCK
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 font-mono text-zinc-600">
                      Rs. {(s.costPrice || 0).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 font-bold font-mono text-zinc-900">
                      Rs. {totalValue.toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingStock(s);
                          setIsStockModalOpen(true);
                        }}
                        className="text-[11px] h-7 px-3 border-zinc-200 hover:bg-zinc-100"
                      >
                        Adjust / Edit
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {filteredStocks.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-zinc-500">
                    No matching stock items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: TOP CONSUMED RAW MATERIALS */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-zinc-700" />
              Most Consumed Ingredients & Stock Items
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Top raw materials by total consumption volume recorded
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topConsumedItems.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/60 flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Top #{idx + 1} Consumed
                </span>
                <span className="font-bold text-zinc-900 text-sm mt-0.5 block">
                  {item.stockName}
                </span>
                <span className="text-xs text-zinc-500 font-medium">
                  {item.count} consumption logs
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-rose-600 block">
                  -{item.totalConsumed.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-zinc-500">
                    {item.unit}
                  </span>
                </span>
              </div>
            </div>
          ))}

          {topConsumedItems.length === 0 && (
            <div className="col-span-3 text-center py-6 text-zinc-400 text-xs">
              No consumption data recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: CONSUMPTION LOG TABLE */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-zinc-700" />
              Detailed Consumption Audit Log
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Historical record of stock reductions from sales, kitchen recipes, or manual usage
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search consumption history..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs border border-zinc-200 rounded-xl w-60 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Stock Item</th>
                <th className="px-6 py-3.5">Quantity Used</th>
                <th className="px-6 py-3.5">Linked Dish / Modifier</th>
                <th className="px-6 py-3.5 text-right">Log Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
              {filteredConsumptions.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-900">
                    {c.stock?.name || "Unknown Stock"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-extrabold text-rose-600 text-sm">
                      -{c.quantity}{" "}
                      <span className="text-xs font-normal text-zinc-500">
                        {c.stock?.unit?.shortName || ""}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-zinc-100 rounded text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                      {c.dish?.name ||
                        c.addOn?.name ||
                        c.combo?.name ||
                        "Manual Adjustment"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-400 font-mono text-[10px] uppercase font-bold">
                    Recorded
                  </td>
                </tr>
              ))}

              {filteredConsumptions.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-zinc-500">
                    No consumption logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ConsumptionModal
        isOpen={isConsumptionModalOpen}
        onClose={() => setIsConsumptionModalOpen(false)}
        onSuccess={fetchData}
        stocks={stocks}
      />

      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onSuccess={fetchData}
      />

      <StockModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        onSuccess={fetchData}
        stock={editingStock}
        units={units}
        groups={groups}
      />
    </div>
  );
}
