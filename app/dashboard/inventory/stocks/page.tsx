"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageHeaderAction } from "@/components/ui/PageHeaderAction";
import { CustomTable } from "@/components/ui/CustomTable";
import { MetricCard } from "@/components/ui/MetricCard";
import {
  Package,
  Plus,
  Search,
  Trash2,
  Edit2,
  History,
  Scale,
  DollarSign,
} from "lucide-react";
import StockModal from "@/components/inventory/StockModal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { toast } from "sonner";
import LowStockNotifier from "@/components/inventory/LowStockNotifier";

export default function StocksPage() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<any | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Inline editing state
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
    let f = stocks.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.group?.name?.toLowerCase().includes(lowerQuery) ||
        s.unit?.name?.toLowerCase().includes(lowerQuery) ||
        s.unit?.shortName?.toLowerCase().includes(lowerQuery),
    );
    f = [...f].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    setFilteredStocks(f);
  }, [searchQuery, stocks]);

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

  const totalInventoryValue = stocks.reduce(
    (acc, s) => acc + (s.amount || 0),
    0,
  );
  const lowStockItems = stocks.filter((s) => s.quantity < 5).length;

  return (
    <div className="px-6 py-10">
      <LowStockNotifier threshold={5} />
      <PageHeaderAction
        title="Inventory Stocks"
        description="Manage raw materials and stock levels"
        onSearch={setSearchQuery}
        actionButton={
          <Button
            onClick={openCreate}
            className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
          >
            <span className="flex items-center gap-2">Add Stock Item</span>
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-6 mb-8">
        <MetricCard title="Total Items" value={stocks.length} />
        <MetricCard
          title="Total Value"
          value={`Rs. ${totalInventoryValue.toLocaleString()}`}
        />
        <MetricCard title="Low Stock" value={lowStockItems} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-600">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-xs tracking-widest w-16">
                #
              </th>
              <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-xs tracking-widest">
                Item Name
              </th>
              <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-xs tracking-widest">
                Unit
              </th>
              <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-xs tracking-widest">
                Current Stock
              </th>
              <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-xs tracking-widest">
                Value
              </th>
              <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-xs tracking-widest text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredStocks.map((s) => (
              <tr
                key={s.id}
                onClick={() => openEdit(s)}
                className="hover:bg-zinc-50 transition-colors cursor-pointer group"
              >
                <td
                  className="px-6 py-4"
                  onClick={(e) => handleSortOrderClick(s, e)}
                >
                  {editingRowId === s.id ? (
                    <input
                      type="number"
                      value={editingValue}
                      onChange={handleSortOrderChange}
                      onBlur={() => handleSortOrderBlur(s.id)}
                      onKeyDown={handleSortOrderKeyDown}
                      className="w-16 px-2 py-1 text-sm border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="font-mono text-xs font-black text-zinc-400 group-hover:text-zinc-900 transition-colors">
                      {s.sortOrder ?? 0}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-900">{s.name}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      {s.group?.name || "Uncategorized"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-zinc-50 rounded border border-zinc-100 text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                    {s.unit?.shortName || "—"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-semibold ${s.quantity < 5 ? "text-red-600" : "text-zinc-700"}`}
                    >
                      {s.quantity.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">
                      {s.unit?.shortName}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-zinc-900">
                  Rs. {s.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(s);
                      }}
                      className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(s.id);
                      }}
                      className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredStocks.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-zinc-500">
                  No stock items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <StockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        stock={editingStock}
        units={units}
        groups={groups}
      />

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
