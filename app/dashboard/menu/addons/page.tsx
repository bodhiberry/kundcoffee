"use client";
import { useEffect, useState } from "react";
import { AddOn, Stock, Price, Category } from "@/lib/types";
import {
  getAddOns,
  addAddOn,
  updateAddOn,
  deleteAddOn,
  getStocks,
  getCategories,
} from "@/services/menu";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useRouter } from "next/navigation";
import { useSettings } from "@/components/providers/SettingsProvider";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { SidePanel } from "@/components/ui/SidePanel";
import { ImageUpload } from "@/components/ui/ImageUpload";
import {
  RichTextEditor,
  PriceForm,
  StockConsumptionForm,
} from "@/components/menu/MenuForms";
import { Plus, Edit2, Trash2, Puzzle, Search } from "lucide-react";

export default function AddonsPage() {
  const { settings } = useSettings();
  const router = useRouter();
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [filtered, setFiltered] = useState<AddOn[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "category" | "price" | "type">(
    "name",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Inline Sorting State
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<number>(0);

  // Side Panel State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState<"EXTRA" | "ADDON">("EXTRA");
  const [isAvailable, setIsAvailable] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [imageFile, setImageFile] = useState<File | string | null>(null);
  const [price, setPrice] = useState<Partial<Price>>({});
  const [stockConsumption, setStockConsumption] = useState<
    { stockId: string; quantity: number }[]
  >([]);

  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [aData, sData, catData] = await Promise.all([
      getAddOns(),
      getStocks(),
      getCategories(),
    ]);
    setAddons(aData);
    setStocks(sData);
    setCategories(catData);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  // --- SORTING AND FILTERING LOGIC ---
  useEffect(() => {
    const lower = searchQuery.toLowerCase();
    let f = addons.filter((a) => a.name.toLowerCase().includes(lower));

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
      } else if (sortBy === "price") {
        va = a.price?.listedPrice || 0;
        vb = b.price?.listedPrice || 0;
      } else {
        va = a.type;
        vb = b.type;
      }

      if (typeof va === "string") return mult * va.localeCompare(String(vb));
      return mult * (Number(va) - Number(vb));
    });
    setFiltered(f);
  }, [searchQuery, addons, sortBy, sortDir, categories]);

  // --- INLINE SORT HANDLERS ---
  const handleSortOrderClick = (a: AddOn, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRowId(a.id);
    setEditingValue((a as any).sortOrder ?? 0);
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
    const current = addons.find((a) => a.id === id);
    if (current && (current as any).sortOrder === editingValue) {
      setEditingRowId(null);
      return;
    }

    try {
      const res = await updateAddOn({ id, sortOrder: editingValue });
      if (res?.success) {
        toast.success("Order updated");
        setAddons((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, sortOrder: editingValue } : a,
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
    setDescription("");
    setCategoryId("");
    setType("EXTRA");
    setIsAvailable(true);
    setSortOrder(0);
    setImageFile(null);
    setPrice({});
    setStockConsumption([]);
    setIsPanelOpen(true);
  };

  const openEdit = (a: AddOn) => {
    setIsEditing(true);
    setSelectedId(a.id);
    setName(a.name);
    setDescription(a.description || "");
    setCategoryId(a.categoryId || "");
    setType(a.type);
    setIsAvailable(a.isAvailable);
    setSortOrder((a as any).sortOrder ?? 0);
    setImageFile(a.image || null);
    setPrice(a.price || {});
    setStockConsumption(
      a.stocks?.map((s) => ({ stockId: s.stockId, quantity: s.quantity })) ||
        [],
    );
    setIsPanelOpen(true);
  };

  const calculateAndSetPrice = (newPartialPrice: Partial<Price>) => {
    const newState = { ...price, ...newPartialPrice };
    const actualPrice =
      parseFloat(newState.actualPrice?.toString() || "0") || 0;
    const discountPrice =
      parseFloat(newState.discountPrice?.toString() || "0") || 0;
    const cogs = parseFloat(newState.cogs?.toString() || "0") || 0;
    const listedPrice = Math.max(0, actualPrice - discountPrice);
    const grossProfit = listedPrice - cogs;
    setPrice({
      ...newState,
      actualPrice,
      discountPrice,
      cogs,
      listedPrice,
      grossProfit,
    });
  };

  const handleSubmit = async () => {
    if (!name) return;
    setIsSaving(true);

    let imageUrl = typeof imageFile === "string" ? imageFile : undefined;
    if (imageFile instanceof File) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("folder", "addons");
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
      description,
      image: imageUrl,
      type,
      isAvailable,
      sortOrder: Number(sortOrder) || 0,
      categoryId: categoryId || undefined,
      price: {
        actualPrice: Number(price.actualPrice) || 0,
        listedPrice: Number(price.listedPrice) || 0,
        cogs: Number(price.cogs) || 0,
        grossProfit: Number(price.grossProfit) || 0,
        discountPrice: Number(price.discountPrice) || 0,
        id: price.id,
      },
      stockConsumption: stockConsumption.filter(
        (s) => s.stockId && s.quantity > 0,
      ),
    };

    try {
      const res =
        isEditing && selectedId
          ? await updateAddOn({ ...payload, id: selectedId })
          : await addAddOn(payload);

      if (res?.success) {
        toast.success(isEditing ? "Add-on updated" : "Add-on created");
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
          <h1 className="text-2xl font-bold text-gray-800">Add-ons & Extras</h1>
          <p className="text-gray-500 font-medium">
            Manage extra toppings and side items
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
        >
          <Plus size={18} className="mr-2" /> Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Add-ons" value={addons.length} />
        <MetricCard
          title="Available"
          value={addons.filter((a) => a.isAvailable).length}
        />
        <MetricCard
          title="Extras"
          value={addons.filter((a) => a.type === "EXTRA").length}
        />
        <MetricCard
          title="Sides"
          value={addons.filter((a) => a.type === "ADDON").length}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4 bg-white sticky top-0 flex-wrap">
          <input
            placeholder="Search items..."
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
              <option value="price">Price</option>
              <option value="type">Type</option>
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
                <th className="px-6 py-4 font-semibold text-gray-700">Type</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Price</th>
                <th className="px-6 py-4 font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => openEdit(a)}
                  className="hover:bg-red-50/50 transition-colors cursor-pointer group"
                >
                  <td
                    className="px-6 py-4"
                    onClick={(e) => handleSortOrderClick(a, e)}
                  >
                    {editingRowId === a.id ? (
                      <input
                        type="number"
                        value={editingValue}
                        onChange={handleSortOrderChange}
                        onBlur={() => handleSortOrderBlur(a.id)}
                        onKeyDown={(e) => handleSortOrderKeyDown(e, a.id)}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-red-500 outline-none font-mono"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="text-gray-400 font-mono hover:text-gray-900 cursor-text">
                        {(a as any).sortOrder ?? 0}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                      {a.image ? (
                        <img
                          src={a.image}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold bg-slate-100">
                          {a.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {a.name}
                  </td>
                  <td className="px-6 py-4">
                    {categories.find((c) => c.id === a.categoryId)?.name || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium border ${a.type === "EXTRA" ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-red-50 text-red-700 border-red-100"}`}
                    >
                      {a.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {settings.currency} {a.price?.listedPrice || 0}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${a.isAvailable ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {a.isAvailable ? "Available" : "No"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
        title={isEditing ? "Edit Add-on" : "New Add-on"}
      >
        <div className="space-y-8 pb-24">
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase border-b pb-2">
              Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Name *
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Type
                </label>
                <select
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 outline-none"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                >
                  <option value="EXTRA">Extra (Topping)</option>
                  <option value="ADDON">Side (Add-on)</option>
                </select>
              </div>
              <div className="flex items-center pt-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="w-5 h-5 rounded text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Available
                  </span>
                </label>
              </div>
            </div>
            <ImageUpload
              label="Image"
              value={typeof imageFile === "string" ? imageFile : undefined}
              onChange={setImageFile}
            />
            <RichTextEditor
              label="Description"
              value={description}
              onChange={setDescription}
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase border-b pb-2">
              Pricing
            </h3>
            <PriceForm value={price} onChange={calculateAndSetPrice} />
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase border-b pb-2">
              Stock Consumption
            </h3>
            <StockConsumptionForm
              stocks={stocks}
              value={stockConsumption}
              onChange={setStockConsumption}
            />
          </section>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t flex items-center gap-3 z-10">
          {isEditing && selectedId && (
            <Button
              onClick={() => setIsDeleteModalOpen(true)}
              variant="secondary"
              className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
              disabled={isSaving}
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
                ? "Update Item"
                : "Create Item"}
          </Button>
        </div>
      </SidePanel>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          if (!selectedId) return;
          setIsSaving(true);
          try {
            const res = await deleteAddOn(selectedId);
            if (res?.success) {
              refresh();
              setIsPanelOpen(false);
              setIsDeleteModalOpen(false);
              router.refresh();
              toast.success("Add-on deleted");
            } else {
              toast.error(res?.message || "Failed to delete");
            }
          } catch (e) {
            toast.error("An error occurred");
          } finally {
            setIsSaving(false);
          }
        }}
        title="Delete Add-on"
        message={`Are you sure you want to delete add-on "${name}"?`}
        isLoading={isSaving}
      />
    </div>
  );
}
