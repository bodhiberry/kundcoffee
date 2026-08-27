"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageHeaderAction } from "@/components/ui/PageHeaderAction";
import { MetricCard } from "@/components/ui/MetricCard";
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  PlusCircle,
  TrendingUp,
} from "lucide-react";
import StockModal from "@/components/inventory/StockModal";
import RestockModal from "@/components/inventory/RestockModal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { toast } from "sonner";
import LowStockNotifier from "@/components/inventory/LowStockNotifier";

export default function StocksPage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockTypeFilter, setStockTypeFilter] = useState<
    "ALL" | "RAW_MATERIAL" | "FINISHED_GOOD"
  >("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<any | null>(null);

  // Quick Restock state
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [restockItem, setRestockItem] = useState<any | null>(null);

  const [groups, setGroups] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Inline editing state for sortOrder
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<number>(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stocksRes, unitsRes, groupsRes] = await Promise.all([
        fetch("/api/stocks"),
        fetch("/api/inventory/measuring-unit"),
        fetch("/api/inventory/groups"),
      ]);
      const stocksData = await stocksRes.json();
      const unitsData = await unitsRes.json();
      const groupsData = await groupsRes.json();

      if (stocksData.success) {
        setStocks(stocksData.data);
        setFilteredStocks(stocksData.data);
      }
      if (unitsData.success) {
        setUnits(unitsData.data);
      }
      if (groupsData.success) {
        setGroups(groupsData.data);
      }
    } catch (error) {
      toast.error("Failed to fetch inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();
    let f = stocks.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(lowerQuery) ||
        s.group?.name?.toLowerCase().includes(lowerQuery) ||
        s.unit?.name?.toLowerCase().includes(lowerQuery) ||
        s.unit?.shortName?.toLowerCase().includes(lowerQuery);

      const matchesType =
        stockTypeFilter === "ALL" ||
        (stockTypeFilter === "RAW_MATERIAL" &&
          (!s.type || s.type === "RAW_MATERIAL")) ||
        (stockTypeFilter === "FINISHED_GOOD" && s.type === "FINISHED_GOOD");

      return matchesSearch && matchesType;
    });
    f = [...f].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    setFilteredStocks(f);
  }, [searchQuery, stocks, stockTypeFilter]);

  const handleSortOrderClick = (stock: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRowId(stock.id);
    setEditingValue(stock.sortOrder ?? 0);
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    if (editingValue === 0 && newVal.length > 1 && newVal.startsWith("0")) {
      setEditingValue(parseInt(newVal.substring(1)) || 0);
    } else {
      setEditingValue(parseInt(newVal) || 0);
    }
  };

  const handleSortOrderBlur = async (id: string) => {
    const current = stocks.find((s) => s.id === id);
    if (current && current.sortOrder === editingValue) {
      setEditingRowId(null);
      return;
    }

    try {
      const res = await fetch(`/api/stocks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: editingValue }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Order updated");
        setStocks((prev) =>
          prev.map((s) => (s.id === id ? { ...s, sortOrder: editingValue } : s)),
        );
      }
    } catch (err) {
      toast.error("Failed to update order");
    } finally {
      setEditingRowId(null);
    }
  };

  const handleSortOrderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
    if (e.key === "Escape") setEditingRowId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/stocks/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Stock item deleted successfully");
        fetchData();
      } else {
        toast.error(data.message || "Failed to delete item");
      }
    } catch (error) {
      toast.error("Error deleting stock item");
    } finally {
      setDeleteId(null);
    }
  };

  const openCreate = () => {
    setEditingStock(null);
    setIsModalOpen(true);
  };

  const openEdit = (stock: any) => {
    setEditingStock(stock);
    setIsModalOpen(true);
  };

  const openRestock = (stock: any) => {
    setRestockItem(stock);
    setIsRestockOpen(true);
  };

  const rawCount = stocks.filter(
    (s) => !s.type || s.type === "RAW_MATERIAL",
  ).length;
  const finishedCount = stocks.filter((s) => s.type === "FINISHED_GOOD").length;

  const totalInventoryValue = stocks.reduce(
    (acc, s) => acc + (s.amount || (s.quantity * (s.costPrice || 0)) || 0),
    0,
  );

  return (
    <div className="px-6 py-10">
      <LowStockNotifier threshold={5} />
      <PageHeaderAction
        title="Inventory Stocks"
        description="Manage stock inventory, prices, restock quantities, and recipe deductions"
        onSearch={setSearchQuery}
        actionButton={
          <Button
            onClick={openCreate}
            className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm font-bold"
          >
            <span className="flex items-center gap-2">
              <Plus size={16} /> Add Stock Item
            </span>
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-6 mb-6">
        <MetricCard title="Total Stock Items" value={stocks.length} />
        <MetricCard
          title="Total Inventory Value"
          value={`Rs. ${totalInventoryValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}`}
        />
        <MetricCard title="Raw Materials" value={rawCount} />
        <MetricCard title="Finished Goods" value={finishedCount} />
      </div>

      {/* Stock Type Filter Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setStockTypeFilter("ALL")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            stockTypeFilter === "ALL"
              ? "bg-zinc-900 text-white shadow-sm"
              : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          All Items ({stocks.length})
        </button>
        <button
          onClick={() => setStockTypeFilter("RAW_MATERIAL")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            stockTypeFilter === "RAW_MATERIAL"
              ? "bg-zinc-900 text-white shadow-sm"
              : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          <span>Raw Materials</span>
          <span className="text-[10px] opacity-75 font-normal">({rawCount})</span>
        </button>
        <button
          onClick={() => setStockTypeFilter("FINISHED_GOOD")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            stockTypeFilter === "FINISHED_GOOD"
              ? "bg-zinc-900 text-white shadow-sm"
              : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          <span>Finished Goods</span>
          <span className="text-[10px] opacity-75 font-normal">
            ({finishedCount})
          </span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-600">
          <thead className="bg-zinc-50/80 border-b border-zinc-200">
            <tr>
              <th className="px-5 py-4 font-bold text-zinc-600 uppercase text-[11px] tracking-wider w-14">
                #
              </th>
              <th className="px-5 py-4 font-bold text-zinc-600 uppercase text-[11px] tracking-wider">
                Item Name
              </th>
              <th className="px-5 py-4 font-bold text-zinc-600 uppercase text-[11px] tracking-wider">
                Classification
              </th>
              <th className="px-5 py-4 font-bold text-zinc-600 uppercase text-[11px] tracking-wider">
                Cost Price
              </th>
              <th className="px-5 py-4 font-bold text-zinc-600 uppercase text-[11px] tracking-wider">
                Selling Price
              </th>
              <th className="px-5 py-4 font-bold text-zinc-600 uppercase text-[11px] tracking-wider">
                Current Stock
              </th>
              <th className="px-5 py-4 font-bold text-zinc-600 uppercase text-[11px] tracking-wider">
                Total Value
              </th>
              <th className="px-5 py-4 font-bold text-zinc-600 uppercase text-[11px] tracking-wider text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredStocks.map((s) => {
              const unitLabel = s.unit?.shortName || s.unit?.name || "units";
              const cost = s.costPrice ?? 0;
              const selling = s.sellingPrice ?? 0;
              const totalVal = s.amount ?? Number((s.quantity * cost).toFixed(2));

              return (
                <tr
                  key={s.id}
                  onClick={() => openEdit(s)}
                  className="hover:bg-zinc-50/70 transition-colors cursor-pointer group"
                >
                  <td
                    className="px-5 py-4"
                    onClick={(e) => handleSortOrderClick(s, e)}
                  >
                    {editingRowId === s.id ? (
                      <input
                        type="number"
                        value={editingValue}
                        onChange={handleSortOrderChange}
                        onBlur={() => handleSortOrderBlur(s.id)}
                        onKeyDown={handleSortOrderKeyDown}
                        className="w-14 px-1.5 py-0.5 text-xs border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="font-mono text-xs font-bold text-zinc-400 group-hover:text-zinc-900 transition-colors">
                        {s.sortOrder ?? 0}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-zinc-900">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          {s.group?.name || "General"}
                        </span>
                        {s.consumptions && s.consumptions.length > 0 && (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {s.consumptions.length} dish link
                            {s.consumptions.length > 1 ? "es" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    {s.type === "FINISHED_GOOD" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Finished Good
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                        Raw Material
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 font-mono text-xs font-semibold text-zinc-800">
                    Rs. {cost.toFixed(2)}
                    <span className="text-[10px] text-zinc-400 font-normal ml-1">
                      /{unitLabel}
                    </span>
                  </td>

                  <td className="px-5 py-4 font-mono text-xs font-semibold text-zinc-800">
                    {selling > 0 ? (
                      <>
                        Rs. {selling.toFixed(2)}
                        <span className="text-[10px] text-zinc-400 font-normal ml-1">
                          /{unitLabel}
                        </span>
                      </>
                    ) : (
                      <span className="text-zinc-400 font-normal">—</span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-bold font-mono text-sm ${
                          s.quantity <= 0
                            ? "text-red-600"
                            : s.quantity < 5
                            ? "text-amber-600"
                            : "text-zinc-900"
                        }`}
                      >
                        {s.quantity?.toLocaleString() || 0}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">
                        {unitLabel}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 font-mono text-xs font-bold text-zinc-900">
                    Rs. {totalVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Add Stock / Quick Restock Action Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openRestock(s);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all shadow-xs"
                        title="Add Stock / Restock Quantity"
                      >
                        <PlusCircle size={14} className="text-emerald-600" />
                        <span>Add Stock</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(s);
                        }}
                        className="p-2 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
                        title="Edit Details"
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(s.id);
                        }}
                        className="p-2 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredStocks.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-zinc-500">
                  <Package className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                  <p className="font-semibold text-zinc-700">No stock items found</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Click &quot;Add Stock Item&quot; to register your inventory items.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Stock Edit / Create Modal */}
      <StockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        stock={editingStock}
        units={units}
        groups={groups}
      />

      {/* Quick Restock Modal */}
      <RestockModal
        isOpen={isRestockOpen}
        onClose={() => setIsRestockOpen(false)}
        onSuccess={fetchData}
        stock={restockItem}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Stock Item"
        message="Are you sure you want to delete this stock item? This action cannot be undone."
        confirmVariant="danger"
      />
    </div>
  );
}
