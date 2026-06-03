"use client";
import { useEffect, useState } from "react";
import { spaceType } from "@/lib/types";
import {
  getSpaces,
  addSpace,
  updateSpace,
  deleteSpace,
} from "@/services/space";
import { PageHeaderAction } from "@/components/ui/PageHeaderAction";
import { MetricCard } from "@/components/ui/MetricCard";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { SidePanel } from "@/components/ui/SidePanel";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

export default function SpacesPage() {
  const router = useRouter();
  const [spaces, setSpaces] = useState<spaceType[]>([]);
  const [filteredSpaces, setFilteredSpaces] = useState<spaceType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "description" | "tables">(
    "name",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Panel & Form State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  // Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Inline editing state
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<number>(0);

  useEffect(() => {
    const fetch = async () => {
      const data = await getSpaces();
      setSpaces(data);
      setFilteredSpaces(data);
    };
    fetch();
  }, []);

  useEffect(() => {
    const lower = searchQuery.toLowerCase();
    let filtered = spaces.filter((s) => s.name.toLowerCase().includes(lower));

    // Always sort by sortOrder first, then by the selected column
    filtered = [...filtered].sort((a, b) => {
      const aSortOrder =
        (a as spaceType & { sortOrder?: number }).sortOrder ?? 0;
      const bSortOrder =
        (b as spaceType & { sortOrder?: number }).sortOrder ?? 0;

      // Primary sort: sortOrder (ascending)
      if (aSortOrder !== bSortOrder) {
        return aSortOrder - bSortOrder;
      }

      // Secondary sort: selected column
      const mult = sortDir === "asc" ? 1 : -1;
      let va: string | number = "";
      let vb: string | number = "";
      if (sortBy === "name") {
        va = a.name;
        vb = b.name;
      } else if (sortBy === "description") {
        va = a.description || "";
        vb = b.description || "";
      } else {
        va = a.tables?.length || 0;
        vb = b.tables?.length || 0;
      }
      if (typeof va === "string")
        return mult * String(va).localeCompare(String(vb));
      return mult * (Number(va) - Number(vb));
    });
    setFilteredSpaces(filtered);
  }, [searchQuery, spaces, sortBy, sortDir]);

  // Handle opening the panel for creating
  const openCreate = () => {
    setIsEditing(false);
    setSelectedId(null);
    setName("");
    setDescription("");
    setIsPanelOpen(true);
  };

  // Handle opening the panel for editing
  const openEdit = (space: spaceType, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsEditing(true);
    setSelectedId(space.id);
    setName(space.name);
    setDescription(space.description || "");
    setSortOrder((space as spaceType & { sortOrder?: number }).sortOrder ?? 0);
    setIsPanelOpen(true);
  };

  // Handle inline sortOrder editing
  const handleSortOrderClick = (
    space: spaceType & { sortOrder?: number },
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setEditingRowId(space.id);
    setEditingValue(space.sortOrder ?? 0);
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    // If current value is 0 and we type a number, replace it
    if (editingValue === 0 && newVal.length > 1 && newVal.startsWith("0")) {
      setEditingValue(parseInt(newVal.substring(1)) || 0);
    } else {
      setEditingValue(parseInt(newVal) || 0);
    }
  };

  const handleSortOrderBlur = async (spaceId: string) => {
    setIsLoading(true);
    try {
      console.log(
        "Updating sortOrder to:",
        editingValue,
        "for space:",
        spaceId,
      );
      const res = await updateSpace({ id: spaceId, sortOrder: editingValue });
      console.log("Update response:", res);

      if (res.success) {
        // Force a fresh fetch with cache busting
        const updated = await fetch("/api/spaces?t=" + Date.now(), {
          cache: "no-store",
        })
          .then((r) => r.json())
          .then((data) => (data.success ? data.data : []));

        console.log("Updated spaces:", updated);
        setSpaces(updated);
        toast.success("Sort order updated");
      } else {
        toast.error(res.message ?? "Failed to update sort order");
      }
    } catch (error) {
      console.error("Failed to update sort order:", error);
      toast.error("Failed to update sort order");
    } finally {
      setEditingRowId(null);
      setIsLoading(false);
    }
  };

  const handleSortOrderKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    spaceId: string,
  ) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setEditingRowId(null);
    }
  };

  const handleSubmit = async () => {
    if (!name) return;

    setIsLoading(true);

    try {
      let res;

      if (isEditing && selectedId) {
        const data = {
          id: selectedId,
          name,
          description,
          sortOrder,
        };

        res = await updateSpace(data);
      } else {
        res = await addSpace(name, description, sortOrder);
      }

      // 🔴 Handle API failure
      if (!res.success || !res.data) {
        toast.error(res.message ?? "Failed to save space");
        return;
      }

      toast.success(
        res.message ?? (isEditing ? "Space updated" : "Space created"),
      );

      // Refresh data
      const updated = await getSpaces();
      setSpaces(updated);

      setIsPanelOpen(false);

      // Reset form
      setName("");
      setDescription("");

      router.refresh();
    } catch (error) {
      console.error("Failed to save space", error);
      toast.error("Unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    setIsLoading(true);
    try {
      const res = await deleteSpace(selectedId);
      if (res.success) {
        toast.success("Space deleted");
        const updated = await getSpaces();
        setSpaces(updated);
        setIsPanelOpen(false);
        setIsDeleteModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.message ?? "Failed to delete space");
      }
    } catch (error) {
      console.error("Failed to delete space", error);
      toast.error("Unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ["Name", "Description", "Table Count"];
    const csvContent = [
      headers.join(","),
      ...filteredSpaces.map((s) =>
        [s.name, s.description, s.tables?.length || 0].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "spaces_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="px-6 py-10">
      <PageHeaderAction
        title="Spaces"
        description="Manage dining areas"
        onSearch={setSearchQuery}
        onExport={handleExport}
        actionButton={
          <Button
            onClick={openCreate}
            className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
          >
            <span className="flex items-center gap-2">Add Space</span>
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <MetricCard title="Total Spaces" value={spaces.length} />
        <MetricCard
          title="With Tables"
          value={spaces.filter((s) => s.tables?.length > 0).length}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex flex-wrap items-center gap-4 bg-white">
          <span className="text-xs font-medium text-zinc-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-sm border border-zinc-200 rounded-lg px-3 py-1.5 bg-white focus:border-zinc-900 outline-none"
          >
            <option value="name">Name</option>
            <option value="description">Description</option>
            <option value="tables">Tables</option>
          </select>
          <select
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
            className="text-sm border border-zinc-200 rounded-lg px-3 py-1.5 bg-white focus:border-zinc-900 outline-none"
          >
            <option value="asc">A → Z</option>
            <option value="desc">Z → A</option>
          </select>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-xs tracking-widest w-24">
                  Row #
                </th>
                <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-xs tracking-widest">
                  Name
                </th>
                <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-xs tracking-widest">
                  Description
                </th>
                <th className="px-6 py-4 font-bold text-zinc-600 uppercase text-xs tracking-widest">
                  Tables
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSpaces.map((s) => (
                <tr
                  key={s.id}
                  onClick={(e) => openEdit(s, e)}
                  className="hover:bg-zinc-50 transition-colors cursor-pointer group"
                >
                  <td
                    className="px-6 py-4"
                    onClick={(e) =>
                      handleSortOrderClick(
                        s as spaceType & { sortOrder?: number },
                        e,
                      )
                    }
                  >
                    {editingRowId === s.id ? (
                      <input
                        type="number"
                        value={editingValue}
                        onChange={handleSortOrderChange}
                        onBlur={() => handleSortOrderBlur(s.id)}
                        onKeyDown={(e) => handleSortOrderKeyDown(e, s.id)}
                        className="w-16 px-2 py-1 text-sm border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="text-zinc-500 font-mono text-sm hover:text-zinc-900 cursor-text">
                        {(s as spaceType & { sortOrder?: number }).sortOrder ?? 0}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900">
                    {s.name}
                  </td>
                  <td className="px-6 py-4 text-zinc-600 font-medium">
                    {s.description || "-"}
                  </td>
                  <td className="px-6 py-4 text-zinc-900 font-bold">
                    {s.tables?.length || 0}
                  </td>
                </tr>
              ))}
              {filteredSpaces.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    No spaces found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title={isEditing ? "Edit Space" : "Add New Space"}
      >
        <div className="space-y-6 pb-20">
          {/* Name Field */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Space Name <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/20 transition-all placeholder:text-gray-400"
              placeholder="e.g. Garden, Main Hall"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Description
            </label>
            <textarea
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/20 transition-all placeholder:text-gray-400 min-h-[120px]"
              placeholder="Optional details about this area..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Display Order Field */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Display Order (Row #)
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/20 transition-all font-mono"
              placeholder="e.g. 1"
              value={sortOrder}
              onChange={(e) => {
                const newVal = e.target.value;
                if (
                  sortOrder === 0 &&
                  newVal.length > 1 &&
                  newVal.startsWith("0")
                ) {
                  setSortOrder(parseInt(newVal.substring(1)) || 0);
                } else {
                  setSortOrder(parseInt(newVal) || 0);
                }
              }}
            />
            <p className="mt-1.5 text-xs text-zinc-500 italic">
              Leave as 0 to automatically place at the end.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 flex items-center gap-3">
          {isEditing && selectedId && (
            <Button
              onClick={() => setIsDeleteModalOpen(true)}
              variant="secondary"
              className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
              disabled={isLoading}
            >
              <Trash2 size={18} />
            </Button>
          )}
          <Button
            onClick={() => setIsPanelOpen(false)}
            variant="secondary"
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white"
            disabled={!name || isLoading}
          >
            {isLoading
              ? "Saving..."
              : isEditing
                ? "Update Space"
                : "Create Space"}
          </Button>
        </div>
      </SidePanel>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Space"
        message={`Are you sure you want to delete space "${name}"? Tables in this space will need to be reassigned.`}
        isLoading={isLoading}
      />
    </div>
  );
}
