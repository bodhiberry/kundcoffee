"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageHeaderAction } from "@/components/ui/PageHeaderAction";
import { MetricCard } from "@/components/ui/MetricCard";
import { Trash2, Edit2 } from "lucide-react";
import UnitModal from "@/components/inventory/UnitModal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { toast } from "sonner";

export default function MeasuringUnitsPage() {
  const [units, setUnits] = useState<any[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Inline editing state
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<number>(0);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory/measuring-unit");
      const data = await res.json();
      if (data.success) {
        setUnits(data.data);
        setFilteredUnits(data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch units");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();
    let f = units.filter(
      (u) =>
        u.name.toLowerCase().includes(lowerQuery) ||
        u.shortName.toLowerCase().includes(lowerQuery),
    );
    f = [...f].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    setFilteredUnits(f);
  }, [searchQuery, units]);

  const handleSortOrderClick = (unit: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRowId(unit.id);
    setEditingValue(unit.sortOrder ?? 0);
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
    const current = units.find((u) => u.id === id);
    if (current && current.sortOrder === editingValue) {
      setEditingRowId(null);
      return;
    }

    try {
      const res = await fetch(`/api/inventory/measuring-unit/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: editingValue }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Order updated");
        setUnits((prev) =>
          prev.map((u) => (u.id === id ? { ...u, sortOrder: editingValue } : u)),
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
      const res = await fetch(`/api/inventory/measuring-unit/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Unit deleted successfully");
        fetchUnits();
      } else {
        toast.error(data.message || "Failed to delete unit");
      }
    } catch (error) {
      toast.error("Error deleting unit");
    } finally {
      setDeleteId(null);
    }
  };

  const openCreate = () => {
    setEditingUnit(null);
    setIsModalOpen(true);
  };

  const openEdit = (unit: any) => {
    setEditingUnit(unit);
    setIsModalOpen(true);
  };

  return (
    <div className="px-6 py-10">
      <PageHeaderAction
        title="Measuring Units"
        description="Manage inventory units and symbols"
        onSearch={setSearchQuery}
        actionButton={
          <Button
            onClick={openCreate}
            className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
          >
            Add New Unit
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-6 mb-8">
        <MetricCard title="Total Units" value={units.length} />
        <MetricCard
          title="Most Used"
          value={units.length > 0 ? units[0].shortName : "N/A"}
        />
        <MetricCard title="System Default" value="Metric" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-600">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-xs tracking-widest w-16">
                #
              </th>
              <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-xs tracking-widest">
                Unit Name
              </th>
              <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-xs tracking-widest">
                Symbol
              </th>
              <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-xs tracking-widest text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredUnits.map((u) => (
              <tr
                key={u.id}
                onClick={() => openEdit(u)}
                className="hover:bg-zinc-50 transition-colors cursor-pointer group"
              >
                <td
                  className="px-6 py-4"
                  onClick={(e) => handleSortOrderClick(u, e)}
                >
                  {editingRowId === u.id ? (
                    <input
                      type="number"
                      value={editingValue}
                      onChange={handleSortOrderChange}
                      onBlur={() => handleSortOrderBlur(u.id)}
                      onKeyDown={handleSortOrderKeyDown}
                      className="w-16 px-2 py-1 text-sm border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="font-mono text-xs font-black text-zinc-400 group-hover:text-zinc-900 transition-colors">
                      {u.sortOrder ?? 0}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-900">{u.name}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      {u.description || "System Unit"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-zinc-50 rounded border border-zinc-100 text-[10px] font-black text-zinc-500 uppercase tracking-wider">
                    {u.shortName}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(u);
                      }}
                      className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(u.id);
                      }}
                      className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUnits.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-zinc-500">
                  No measuring units found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <UnitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUnits}
        unit={editingUnit}
      />

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Measuring Unit"
        message="Are you sure you want to delete this unit? This will only succeed if the unit is not currently linked to any stock items."
        confirmVariant="danger"
      />
    </div>
  );
}
