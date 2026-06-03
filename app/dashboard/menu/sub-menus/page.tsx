"use client";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { SidePanel } from "@/components/ui/SidePanel";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Plus, Edit2, Trash2, Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSubMenus,
  addSubMenu,
  updateSubMenu,
  deleteSubMenu,
  getCategories,
} from "@/services/menu";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { SubMenu } from "@/lib/types";

export default function SubMenusPage() {
  const router = useRouter();
  const [subMenus, setSubMenus] = useState<SubMenu[]>([]);
  const [filtered, setFiltered] = useState<SubMenu[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<
    "name" | "category" | "dishes" | "status"
  >("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<number>(0);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageFile, setImageFile] = useState<File | string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0); // For the SidePanel form
  const [categories, setCategories] = useState<any[]>([]);

  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [smData, catData] = await Promise.all([
      getSubMenus(),
      getCategories(),
    ]);
    setSubMenus(smData);
    setCategories(catData);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  // --- SORTING AND FILTERING LOGIC ---
  useEffect(() => {
    const lower = searchQuery.toLowerCase();
    let f = subMenus.filter((s) => s.name.toLowerCase().includes(lower));

    f = [...f].sort((a, b) => {
      // 1. Primary Sort: sortOrder (Ascending)
      const aSort = (a as any).sortOrder ?? 0;
      const bSort = (b as any).sortOrder ?? 0;
      if (aSort !== bSort) return aSort - bSort;

      // 2. Secondary Sort: Selected Column
      const mult = sortDir === "asc" ? 1 : -1;
      let va: string | number = "";
      let vb: string | number = "";

      if (sortBy === "name") {
        va = a.name;
        vb = b.name;
      } else if (sortBy === "category") {
        va = categories.find((c) => c.id === a.categoryId)?.name || "";
        vb = categories.find((c) => c.id === b.categoryId)?.name || "";
      } else if (sortBy === "dishes") {
        va = (a as any)._count?.dishes || 0;
        vb = (b as any)._count?.dishes || 0;
      } else {
        va = a.isActive ? 1 : 0;
        vb = b.isActive ? 1 : 0;
      }

      if (typeof va === "string")
        return mult * String(va).localeCompare(String(vb));
      return mult * (Number(va) - Number(vb));
    });
    setFiltered(f);
  }, [searchQuery, subMenus, sortBy, sortDir, categories]);

  // --- INLINE SORT HANDLERS ---
  const handleSortOrderClick = (s: SubMenu, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRowId(s.id);
    setEditingValue((s as any).sortOrder ?? 0);
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
    const current = subMenus.find((s) => s.id === id);
    if (current && (current as any).sortOrder === editingValue) {
      setEditingRowId(null);
      return;
    }

    try {
      const res = await updateSubMenu({ id, sortOrder: editingValue });
      if (res?.success) {
        toast.success("Order updated");
        setSubMenus((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, sortOrder: editingValue } : s,
          ),
        );
      }
    } catch (err) {
      toast.error("Failed to update order");
    } finally {
      setEditingRowId(null);
    }
  };

  const handleSortOrderKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
    if (e.key === "Escape") setEditingRowId(null);
  };

  const openCreate = () => {
    setIsEditing(false);
    setSelectedId(null);
    setName("");
    setCategoryId("");
    setImageFile(null);
    setIsActive(true);
    setSortOrder(0);
    setIsPanelOpen(true);
  };

  const openEdit = (s: SubMenu) => {
    setIsEditing(true);
    setSelectedId(s.id);
    setName(s.name);
    setCategoryId(s.categoryId || "");
    setImageFile(s.image || null);
    setIsActive(s.isActive);
    setSortOrder((s as any).sortOrder ?? 0);
    setIsPanelOpen(true);
  };

  const handleSubmit = async () => {
    if (!name) return;
    setIsSaving(true);

    let imageUrl = typeof imageFile === "string" ? imageFile : undefined;
    if (imageFile instanceof File) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("folder", "submenus");
      try {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const { url } = await uploadRes.json();
        if (url) imageUrl = url;
      } catch (err) {
        console.error(err);
      }
      setUploading(false);
    }

    const payload = {
      name,
      image: imageUrl,
      isActive,
      categoryId: categoryId || undefined,
      sortOrder,
    };

    try {
      let res;
      if (isEditing && selectedId) {
        res = await updateSubMenu({ ...payload, id: selectedId });
      } else {
        res = await addSubMenu(payload);
      }

      if (res?.success || res?.id) {
        toast.success(isEditing ? "Sub menu updated" : "Sub menu created");
        refresh();
        setIsPanelOpen(false);
        router.refresh();
      } else {
        toast.error(res?.message || "Failed to save");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sub Menus</h1>
          <p className="text-gray-500 font-medium">
            Organize dishes into sub-menus
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
        >
          <Plus size={18} className="mr-2" /> Create Sub Menu
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Sub Menus" value={subMenus.length} />
        <MetricCard
          title="Active"
          value={subMenus.filter((s) => s.isActive).length}
        />
        <MetricCard
          title="Dishes Linked"
          value={subMenus.reduce(
            (acc, curr) => acc + (curr.dishes?.length || 0),
            0,
          )}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4 bg-white sticky top-0 flex-wrap">
          <input
            placeholder="Search sub-menus..."
            className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm w-full max-w-sm outline-none focus:ring-2 focus:ring-red-500/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none"
            >
              <option value="name">Name</option>
              <option value="category">Category</option>
              <option value="dishes">Dishes Count</option>
              <option value="status">Status</option>
            </select>
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none"
            >
              <option value="asc">A → Z</option>
              <option value="desc">Z → A</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700 w-24">
                  Row #
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700">Name</th>
                <th className="px-6 py-4 font-semibold text-gray-700">
                  Category
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700">
                  Dishes Count
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => openEdit(s)}
                  className="hover:bg-red-50/50 transition-colors cursor-pointer group"
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
                        onKeyDown={(e) => handleSortOrderKeyDown(e, s.id)}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-red-500 outline-none font-mono"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="text-gray-400 font-mono hover:text-gray-900 cursor-text">
                        {(s as any).sortOrder ?? 0}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                      {s.image ? (
                        <img
                          src={s.image}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold bg-slate-100">
                          {s.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {s.name}
                  </td>
                  <td className="px-6 py-4">
                    {categories.find((c) => c.id === s.categoryId)?.name || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold">
                      {(s as any)._count?.dishes || 0} Dishes
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${s.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title={isEditing ? "Edit Sub Menu" : "New Sub Menu"}
      >
        <div className="space-y-8 pb-24">
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase border-b pb-2">
              Details
            </h3>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Name *
              </label>
              <input
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {/* Added sortOrder to SidePanel */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Display Order (Row #)
              </label>
              <input
                type="number"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 outline-none font-mono"
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
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Category
              </label>
              <select
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 outline-none"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer py-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded text-red-600"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
            <ImageUpload
              label="Cover Image"
              value={typeof imageFile === "string" ? imageFile : undefined}
              onChange={setImageFile}
            />
          </section>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t flex items-center gap-3 z-10">
          {isEditing && selectedId && (
            <Button
              onClick={() => setIsDeleteModalOpen(true)}
              variant="secondary"
              className="bg-red-50 text-red-600"
            >
              <Trash2 size={18} />
            </Button>
          )}
          <Button
            onClick={() => setIsPanelOpen(false)}
            variant="secondary"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-red-600 text-white shadow-lg"
            disabled={!name || isSaving || uploading}
          >
            {isSaving || uploading
              ? "Saving..."
              : isEditing
                ? "Update"
                : "Create"}
          </Button>
        </div>
      </SidePanel>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          if (!selectedId) return;
          try {
            const res = await deleteSubMenu(selectedId);
            if (res?.success) {
              refresh();
              setIsPanelOpen(false);
              setIsDeleteModalOpen(false);
              router.refresh();
              toast.success("Sub-menu deleted");
            } else {
              toast.error(res?.message || "Failed to delete");
            }
          } catch (e) {
            toast.error("An error occurred");
          }
        }}
        title="Delete Sub Menu"
        message={`Are you sure you want to delete sub-menu "${name}"?`}
        isLoading={isSaving}
      />
    </div>
  );
}
