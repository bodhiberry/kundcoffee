"use client";
import { useEffect, useState } from "react";
import { MenuSet, SubMenu } from "@/lib/types";
import {
  getMenuSets,
  addMenuSet,
  updateMenuSet,
  deleteMenuSet,
  getSubMenus,
} from "@/services/menu";
import { PageHeaderAction } from "@/components/ui/PageHeaderAction";
import { MetricCard } from "@/components/ui/MetricCard";
import { Button } from "@/components/ui/Button";
import { SidePanel } from "@/components/ui/SidePanel";
import { useRouter } from "next/navigation";
import { Trash2, Edit2, Plus, Users, Folder } from "lucide-react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

export default function MenuSetsPage() {
  const router = useRouter();
  const [menuSets, setMenuSets] = useState<MenuSet[]>([]);
  const [subMenus, setSubMenus] = useState<SubMenu[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "service" | "status">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Side Panel
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [service, setService] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedSubMenuIds, setSelectedSubMenuIds] = useState<string[]>([]);

  const [uploading, setUploading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [mKey, sKey] = await Promise.all([getMenuSets(), getSubMenus()]);
    setMenuSets(mKey);
    setSubMenus(sKey);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = (() => {
    let f = menuSets.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    const mult = sortDir === "asc" ? 1 : -1;
    f = [...f].sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";
      if (sortBy === "name") {
        va = a.name;
        vb = b.name;
      } else if (sortBy === "service") {
        va = a.service;
        vb = b.service;
      } else {
        va = a.isActive ? 1 : 0;
        vb = b.isActive ? 1 : 0;
      }
      if (typeof va === "string")
        return mult * String(va).localeCompare(String(vb));
      return mult * (Number(va) - Number(vb));
    });
    return f;
  })();

  const openCreate = () => {
    setIsEditing(false);
    setSelectedId(null);
    setName("");
    setService("");
    setIsActive(true);
    setSelectedSubMenuIds([]);
    setIsPanelOpen(true);
  };

  const openEdit = (m: MenuSet) => {
    setIsEditing(true);
    setSelectedId(m.id);
    setName(m.name);
    setService(m.service);
    setIsActive(m.isActive);
    // @ts-ignore
    setSelectedSubMenuIds(m.subMenus?.map((sm) => sm.subMenuId) || []);
    setIsPanelOpen(true);
  };

  const handleSubmit = async () => {
    if (!name || !service) return;

    setUploading(true);
    const payload = {
      name,
      service,
      isActive,
      subMenuIds: selectedSubMenuIds,
    };

    let res;
    if (isEditing && selectedId) {
      res = await updateMenuSet({ ...payload, id: selectedId });
    } else {
      res = await addMenuSet(payload);
    }

    setUploading(false);

    if (res?.success) {
      toast.success(isEditing ? "Menu set updated" : "Menu set created");
      refresh();
      setIsPanelOpen(false);
      router.refresh();
    } else {
      toast.error(res?.message ?? "Failed to save");
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    setUploading(true);
    try {
      const res = await deleteMenuSet(selectedId);
      if (res?.success) {
        toast.success("Menu set deleted");
        refresh();
        setIsPanelOpen(false);
        setIsDeleteModalOpen(false);
        router.refresh();
      } else {
        toast.error(res?.message ?? "Failed to delete menu set");
      }
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("Failed to delete menu set");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Menu Sets</h1>
          <p className="text-gray-500 font-medium">
            Create menu sets for different services (e.g. Lunch, Dinner)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={openCreate}
            className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
          >
            <Plus size={18} className="mr-2" /> Create Set
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Sets" value={menuSets.length} />
        <MetricCard
          title="Active Sets"
          value={menuSets.filter((m) => m.isActive).length}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4 bg-white/50 backdrop-blur-sm sticky top-0 flex-wrap">
          <input
            placeholder="Search menu sets..."
            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 w-full max-w-sm transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
            >
              <option value="name">Name</option>
              <option value="service">Service</option>
              <option value="status">Status</option>
            </select>
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
            >
              <option value="asc">A → Z</option>
              <option value="desc">Z → A</option>
            </select>
          </div>
        </div>
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-slate-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">Name</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Service</th>
              <th className="px-6 py-4 font-semibold text-gray-700">
                Sub Menus
              </th>
              <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
              <th className="px-6 py-4 font-semibold text-gray-700 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((m) => (
              <tr
                key={m.id}
                onClick={() => openEdit(m)}
                className="hover:bg-red-50/50 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500">
                    <Users size={18} />
                  </div>
                  {m.name}
                </td>
                <td className="px-6 py-4">{m.service}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {/* @ts-ignore */}
                    {m.subMenus?.map((sm: any) => (
                      <span
                        key={sm.id}
                        className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs"
                      >
                        {sm.subMenu?.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${m.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {m.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Edit2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <Folder size={24} className="opacity-20" />
                    <p>No menu sets found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title={isEditing ? "Edit Menu Set" : "New Menu Set"}
      >
        <div className="space-y-8 pb-24">
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">
              Details
            </h3>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Name *
              </label>
              <input
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                placeholder="e.g. Lunch Set"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Service *
              </label>
              <input
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                placeholder="e.g. Daily Lunch"
                value={service}
                onChange={(e) => setService(e.target.value)}
              />
            </div>

            <div className="flex items-center py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Active
                </span>
              </label>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">
              Included Sub Menus
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {subMenus.map((sm) => (
                <label
                  key={sm.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedSubMenuIds.includes(sm.id)
                      ? "bg-red-50 border-red-200"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-red-600"
                    checked={selectedSubMenuIds.includes(sm.id)}
                    onChange={(e) => {
                      if (e.target.checked)
                        setSelectedSubMenuIds([...selectedSubMenuIds, sm.id]);
                      else
                        setSelectedSubMenuIds(
                          selectedSubMenuIds.filter((id) => id !== sm.id),
                        );
                    }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {sm.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {/* @ts-ignore */}
                      {sm._count?.dishes || 0} items
                    </div>
                  </div>
                </label>
              ))}
              {subMenus.length === 0 && (
                <p className="text-sm text-gray-400">No sub-menus available.</p>
              )}
            </div>
          </section>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 flex items-center gap-3 z-10">
          {isEditing && selectedId && (
            <Button
              onClick={() => setIsDeleteModalOpen(true)}
              variant="secondary"
              className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
              disabled={uploading}
            >
              <Trash2 size={18} />
            </Button>
          )}
          <Button
            onClick={() => setIsPanelOpen(false)}
            variant="secondary"
            className="flex-1"
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
            disabled={!name || !service || uploading}
          >
            {uploading ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </SidePanel>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Menu Set"
        message={`Are you sure you want to delete menu set "${name}"?`}
        isLoading={uploading}
      />
    </div>
  );
}
