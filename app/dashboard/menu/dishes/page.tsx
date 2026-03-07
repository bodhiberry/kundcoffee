"use client";
import { useEffect, useState } from "react";
import { Dish, Category, SubMenu, AddOn, Stock, Price } from "@/lib/types";
import {
  getDishes,
  addDish,
  updateDish,
  deleteDish,
  getCategories,
  getSubMenus,
  getAddOns,
  getStocks,
} from "@/services/menu";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { PageHeaderAction } from "@/components/ui/PageHeaderAction";
import { MetricCard } from "@/components/ui/MetricCard";
import { Button } from "@/components/ui/Button";
import { SidePanel } from "@/components/ui/SidePanel";
import { useRouter } from "next/navigation";
import { useSettings } from "@/components/providers/SettingsProvider";
import {
  RichTextEditor,
  PriceForm,
  StockConsumptionForm,
} from "@/components/menu/MenuForms";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Trash2, Edit2, Plus, Coffee, Utensils } from "lucide-react";

export default function DishesPage() {
  const { settings } = useSettings();
  const router = useRouter();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [filtered, setFiltered] = useState<Dish[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "name" | "price" | "category" | "type" | "prep"
  >("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);

  // Aux Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [subMenus, setSubMenus] = useState<SubMenu[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);

  // Side Panel State
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [hscode, setHscode] = useState("");
  const [imageFile, setImageFile] = useState<File | string | null>(null);
  const [prepTime, setPrepTime] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subMenuId, setSubMenuId] = useState("");
  const [type, setType] = useState<"VEG" | "NON_VEG" | "SNACK" | "DRINK">(
    "VEG",
  );
  const [kotType, setKotType] = useState<"KITCHEN" | "BAR">("KITCHEN");
  const [sortOrder, setSortOrder] = useState(0);

  const [price, setPrice] = useState<Partial<Price>>({});
  const [stockConsumption, setStockConsumption] = useState<
    { stockId: string; quantity: number }[]
  >([]);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // --- Inline Sorting State ---
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<number>(0);

  const refresh = async () => {
    setLoading(true);
    // Add cache busting logic if needed, or rely on nextjs revalidation
    const [dData, cData, sData, aData, stData] = await Promise.all([
      getDishes(),
      getCategories(),
      getSubMenus(),
      getAddOns(),
      getStocks(),
    ]);
    setDishes(dData);
    setFiltered(dData);
    setCategories(cData);
    setSubMenus(sData);
    setAddOns(aData);
    setStocks(stData);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  // --- SORTING LOGIC ---
  useEffect(() => {
    const lower = searchQuery.toLowerCase();
    let f = dishes.filter((d) => d.name.toLowerCase().includes(lower));

    f = [...f].sort((a, b) => {
      // 1. Primary Sort: Sort Order (Always Ascending)
      const aOrder = (a as any).sortOrder ?? 0;
      const bOrder = (b as any).sortOrder ?? 0;
      if (aOrder !== bOrder) return aOrder - bOrder;

      // 2. Secondary Sort: Selected Column
      const mult = sortDir === "asc" ? 1 : -1;
      let va: string | number = "";
      let vb: string | number = "";

      if (sortBy === "name") {
        va = a.name || "";
        vb = b.name || "";
      } else if (sortBy === "price") {
        va = a.price?.listedPrice ?? 0;
        vb = b.price?.listedPrice ?? 0;
      } else if (sortBy === "category") {
        va = categories.find((c) => c.id === a.categoryId)?.name || "";
        vb = categories.find((c) => c.id === b.categoryId)?.name || "";
      } else if (sortBy === "type") {
        va = a.type || "";
        vb = b.type || "";
      } else {
        va = a.preparationTime ?? 0;
        vb = b.preparationTime ?? 0;
      }

      if (typeof va === "string")
        return mult * String(va).localeCompare(String(vb));
      return mult * (Number(va) - Number(vb));
    });
    setFiltered(f);
  }, [searchQuery, dishes, sortBy, sortDir, categories]);

  // --- INLINE SORT HANDLERS ---
  const handleSortOrderClick = (dish: Dish, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRowId(dish.id);
    setEditingValue((dish as any).sortOrder ?? 0);
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    if (editingValue === 0 && newVal.length > 1 && newVal.startsWith("0")) {
      setEditingValue(parseInt(newVal.substring(1)) || 0);
    } else {
      setEditingValue(parseInt(newVal) || 0);
    }
  };

  const handleSortOrderKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    id: string,
  ) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setEditingRowId(null);
    }
  };

  const handleSortOrderBlur = async (id: string) => {
    const currentDish = dishes.find((d) => d.id === id);
    if (currentDish && (currentDish as any).sortOrder === editingValue) {
      setEditingRowId(null);
      return;
    }

    try {
      // Use the existing updateDish service, passing only ID and sortOrder
      const res = await updateDish({ id, sortOrder: editingValue });
      if (res.success) {
        toast.success("Order updated");
        // Optimistic update or refresh
        const updatedDishes = dishes.map((d) =>
          d.id === id ? { ...d, sortOrder: editingValue } : d,
        );
        setDishes(updatedDishes);
      } else {
        toast.error("Failed to update order");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error updating order");
    } finally {
      setEditingRowId(null);
    }
  };

  // ... (Keep existing form handlers: resetForm, openCreate, openEdit, calculateAndSetPrice, handleSubmit)
  const resetForm = () => {
    setName("");
    setHscode("");
    setImageFile(null);
    setPrepTime("");
    setDescription("");
    setCategoryId("");
    setSubMenuId("");
    setType("VEG");
    setKotType("KITCHEN");
    setSortOrder(0);
    setPrice({});
    setStockConsumption([]);
    setSelectedAddOnIds([]);
  };

  const openCreate = () => {
    setIsEditing(false);
    setSelectedId(null);
    resetForm();
    setIsPanelOpen(true);
  };

  const openEdit = (d: Dish, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsEditing(true);
    setSelectedId(d.id);
    setName(d.name || "");
    setHscode(d.hscode || "");
    setImageFile(d.image && d.image.length > 0 ? d.image[0] : null);
    setPrepTime((d.preparationTime ?? 0).toString());
    setDescription(d.description || "");
    setCategoryId(d.categoryId || "");
    setSubMenuId(d.subMenuId || "");
    setType(d.type || "VEG");
    setKotType(d.kotType || "KITCHEN");
    setSortOrder((d as any).sortOrder ?? 0);
    setPrice(d.price || {});
    setStockConsumption(
      d.stocks?.map((s: any) => ({
        stockId: s.stockId,
        quantity: s.quantity,
      })) || [],
    );
    // @ts-ignore
    setSelectedAddOnIds(d.addOns?.map((da: any) => da.addOnId) || []);
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
    if (!name || !categoryId) {
      toast.error("Please fill required fields");
      return;
    }
    let imageUrl = typeof imageFile === "string" ? imageFile : undefined;
    if (imageFile instanceof File) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("folder", "dishes");
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
      hscode,
      image: imageUrl ? [imageUrl] : [],
      preparationTime: prepTime === "" ? 0 : parseInt(prepTime),
      description,
      categoryId,
      subMenuId: subMenuId || undefined,
      type,
      kotType,
      sortOrder: Number(sortOrder) || 0,
      price: {
        actualPrice: price.actualPrice || 0,
        listedPrice: price.listedPrice || 0,
        cogs: price.cogs || 0,
        grossProfit: price.grossProfit || 0,
        discountPrice: price.discountPrice || 0,
        id: price.id,
      },
      stocks: stockConsumption.filter((s) => s.stockId && s.quantity > 0),
      addOnIds: selectedAddOnIds,
    };

    let res;
    if (isEditing && selectedId) {
      res = await updateDish({ ...payload, id: selectedId });
    } else {
      res = await addDish(payload);
    }

    if (res?.success) {
      toast.success(isEditing ? "Dish updated" : "Dish created");
      await refresh();
      setIsPanelOpen(false);
      resetForm();
      router.refresh();
    } else {
      toast.error(res?.message || "Failed to save dish");
    }
  };

  const totalDishes = dishes.length;
  const vegDishes = dishes.filter((d) => d.type === "VEG").length;
  const avgPrice =
    totalDishes > 0
      ? (
          dishes.reduce((acc, d) => acc + (d.price?.listedPrice || 0), 0) /
          totalDishes
        ).toFixed(2)
      : "0";

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dishes</h1>
          <p className="text-gray-500 font-medium">
            Manage your restaurant menu items
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={openCreate}
            className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
          >
            <Plus size={18} className="mr-2" /> Add Dish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Dishes" value={totalDishes} />
        <MetricCard
          title="Veg / Non-Veg"
          value={`${vegDishes} / ${totalDishes - vegDishes}`}
        />
        <MetricCard
          title="Avg Listed Price"
          value={`${settings.currency} ${avgPrice}`}
        />
        <MetricCard title="Most Popular" value="-" subValue="Based on sales" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 flex-wrap">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
            Menu Item Register
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 font-medium">
              {filtered.length} items found
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-black text-gray-500 uppercase text-[10px] tracking-widest w-24">
                  Row #
                </th>
                <th className="px-6 py-4 font-black text-gray-500 uppercase text-[10px] tracking-widest">
                  Dish Name
                </th>
                <th className="px-6 py-4 font-black text-gray-500 uppercase text-[10px] tracking-widest">
                  Price
                </th>
                <th className="px-6 py-4 font-black text-gray-500 uppercase text-[10px] tracking-widest">
                  Category
                </th>
                <th className="px-6 py-4 font-black text-gray-500 uppercase text-[10px] tracking-widest">
                  Type
                </th>
                <th className="px-6 py-4 font-black text-gray-500 uppercase text-[10px] tracking-widest">
                  Prep(m)
                </th>
                <th className="px-6 py-4 font-black text-gray-500 uppercase text-[10px] tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 font-black text-gray-500 uppercase text-[10px] tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => openEdit(d)}
                  className="hover:bg-red-50/50 transition-colors cursor-pointer group"
                >
                  {/* INLINE EDITING CELL */}
                  <td
                    className="px-6 py-4"
                    onClick={(e) => handleSortOrderClick(d, e)}
                  >
                    {editingRowId === d.id ? (
                      <input
                        type="number"
                        value={editingValue}
                        onChange={handleSortOrderChange}
                        onBlur={() => handleSortOrderBlur(d.id)}
                        onKeyDown={(e) => handleSortOrderKeyDown(e, d.id)}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="font-mono text-xs font-black text-gray-400 group-hover:text-red-600 transition-colors">
                        {(d as any).sortOrder ?? 0}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                      {d.image && d.image[0] ? (
                        <img
                          src={d.image[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-black bg-slate-100 uppercase">
                          {d.name?.substring(0, 2).toUpperCase() || "??"}
                        </div>
                      )}
                    </div>
                    <span className="font-black text-gray-900">{d.name}</span>
                  </td>
                  <td className="px-6 py-4 font-black font-mono text-gray-900">
                    {settings.currency} {d.price?.listedPrice || 0}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-500 uppercase text-[10px]">
                    {categories.find((c) => c.id === d.categoryId)?.name || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                        d.type === "VEG"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : d.type === "NON_VEG"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }`}
                    >
                      {d.type?.replace("_", " ") || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono font-black text-xs text-gray-400">
                    {d.preparationTime}m
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${d.isAvailable ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-gray-100 text-gray-500 border-gray-200"}`}
                    >
                      {d.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => openEdit(d, e)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Utensils size={24} className="opacity-20" />
                      <p>No dishes found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Panel (Keep exactly as provided in prompt) */}
      <SidePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title={isEditing ? "Edit Dish" : "Add New Dish"}
      >
        <div className="space-y-8 pb-24">
          {/* ... (Keep form content exactly as provided) */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Coffee size={18} className="text-red-600" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Basic Info
              </h3>
            </div>
            {/* Inputs for Name, HSCode... */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Dish Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none"
                  placeholder="e.g. Grilled Chicken"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  HS Code
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none"
                  placeholder="HS Code"
                  value={hscode}
                  onChange={(e) => setHscode(e.target.value)}
                />
              </div>
            </div>
            {/* Category & SubMenu */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Category *
                </label>
                <select
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none"
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
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Sub Menu
                </label>
                <select
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none"
                  value={subMenuId}
                  onChange={(e) => setSubMenuId(e.target.value)}
                >
                  <option value="">Select Sub Menu</option>
                  {subMenus.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Type, KOT, Prep */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Type
                </label>
                <select
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none"
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                >
                  <option value="VEG">Veg</option>
                  <option value="NON_VEG">Non-Veg</option>
                  <option value="SNACK">Snack</option>
                  <option value="DRINK">Drink</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none font-mono"
                  placeholder="0"
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
                  KOT
                </label>
                <select
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm outline-none"
                  value={kotType}
                  onChange={(e) => setKotType(e.target.value as any)}
                >
                  <option value="KITCHEN">Kitchen</option>
                  <option value="BAR">Bar</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Prep(m)
                </label>
                <input
                  type="number"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none"
                  value={prepTime}
                  placeholder="0"
                  onChange={(e) => setPrepTime(e.target.value)}
                />
              </div>
            </div>
            <ImageUpload
              label="Dish Photo"
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
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <span className="text-green-600 font-bold">
                {settings.currency}
              </span>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Pricing & Cost
              </h3>
            </div>
            <PriceForm value={price} onChange={calculateAndSetPrice} />
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <span className="text-orange-600 font-bold">📦</span>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Stock Consumption
              </h3>
            </div>
            <StockConsumptionForm
              stocks={stocks}
              value={stockConsumption}
              onChange={setStockConsumption}
            />
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <span className="text-blue-600 font-bold">+</span>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Add-ons & Extras
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {addOns.map((addon) => (
                <label
                  key={addon.id}
                  className={`flex items-center gap-2 border px-3 py-2 rounded-lg text-sm cursor-pointer ${selectedAddOnIds.includes(addon.id) ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-gray-200 text-gray-600"}`}
                >
                  <input
                    type="checkbox"
                    className="rounded text-red-600"
                    checked={selectedAddOnIds.includes(addon.id)}
                    onChange={(e) => {
                      if (e.target.checked)
                        setSelectedAddOnIds([...selectedAddOnIds, addon.id]);
                      else
                        setSelectedAddOnIds(
                          selectedAddOnIds.filter((id) => id !== addon.id),
                        );
                    }}
                  />
                  {addon.name}{" "}
                  <span className="text-xs text-gray-400">
                    ({settings.currency} {addon.price?.listedPrice})
                  </span>
                </label>
              ))}
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
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            disabled={!name || !categoryId || uploading}
          >
            {uploading
              ? "Saving..."
              : isEditing
                ? "Update Dish"
                : "Create Dish"}
          </Button>
        </div>
      </SidePanel>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          if (!selectedId) return;
          setUploading(true);
          try {
            const res = await deleteDish(selectedId);
            if (res?.success) {
              toast.success("Dish deleted");
              await refresh();
              setIsPanelOpen(false);
              setIsDeleteModalOpen(false);
              resetForm();
              router.refresh();
            } else {
              toast.error(res?.message || "Failed to delete dish");
            }
          } catch (e) {
            toast.error("Failed to delete dish");
          } finally {
            setUploading(false);
          }
        }}
        title="Delete Dish"
        message={`Are you sure you want to delete dish "${name}"?`}
        isLoading={uploading}
      />
    </div>
  );
}
