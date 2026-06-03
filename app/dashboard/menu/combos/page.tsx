"use client";
import { useEffect, useState } from "react";
import { ComboOffer, Category, Dish, Stock, Price, SubMenu } from "@/lib/types";
import {
  getCombos,
  addCombo,
  updateCombo,
  deleteCombo,
  getCategories,
  getDishes,
  getStocks,
  getSubMenus,
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
import { Trash2, Edit2, Plus, Gift, Utensils } from "lucide-react";

export default function CombosPage() {
  const { settings } = useSettings();
  const router = useRouter();
  const [combos, setCombos] = useState<ComboOffer[]>([]);
  const [filtered, setFiltered] = useState<ComboOffer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subMenus, setSubMenus] = useState<SubMenu[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "category" | "price">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<number>(0);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [hscode, setHscode] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subMenuId, setSubMenuId] = useState("");
  const [kotType, setKotType] = useState<"KITCHEN" | "BAR">("KITCHEN");
  const [sortOrder, setSortOrder] = useState(0);
  const [imageFile, setImageFile] = useState<File | string | null>(null);

  const [price, setPrice] = useState<Partial<Price>>({});
  const [comboItems, setComboItems] = useState<
    { dishId: string; quantity: number; unitPrice: number }[]
  >([]);
  const [stockConsumption, setStockConsumption] = useState<
    { stockId: string; quantity: number }[]
  >([]);

  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [cData, catData, dData, sData, smData] = await Promise.all([
      getCombos(),
      getCategories(),
      getDishes(),
      getStocks(),
      getSubMenus(),
    ]);
    setCombos(cData);
    setCategories(catData);
    setDishes(dData);
    setStocks(sData);
    setSubMenus(smData);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  // --- AUTO CALCULATION LOGIC ---
  // Calculates total Actual Price whenever combo items change
  useEffect(() => {
    const totalActual = comboItems.reduce(
      (acc, item) => acc + item.unitPrice * item.quantity,
      0,
    );
    const discount = Number(price.discountPrice) || 0;
    const listed = Math.max(0, totalActual - discount);
    const cogs = Number(price.cogs) || 0;

    setPrice((prev) => ({
      ...prev,
      actualPrice: totalActual,
      listedPrice: listed,
      grossProfit: listed - cogs,
    }));
  }, [comboItems]);

  const handleManualPriceChange = (newPartial: Partial<Price>) => {
    const actual = Number(newPartial.actualPrice ?? price.actualPrice) || 0;
    const discount =
      Number(newPartial.discountPrice ?? price.discountPrice) || 0;
    const cogs = Number(newPartial.cogs ?? price.cogs) || 0;
    const listed = Math.max(0, actual - discount);

    setPrice({
      ...price,
      ...newPartial,
      actualPrice: actual,
      listedPrice: listed,
      grossProfit: listed - cogs,
    });
  };

  // --- SORTING AND FILTERING ---
  useEffect(() => {
    const lower = searchQuery.toLowerCase();
    let f = combos.filter((c) => c.name.toLowerCase().includes(lower));

    f = [...f].sort((a, b) => {
      const aSort = (a as any).sortOrder ?? 0;
      const bSort = (b as any).sortOrder ?? 0;
      if (aSort !== bSort) return aSort - bSort;

      const mult = sortDir === "asc" ? 1 : -1;
      let va: any = "";
      let vb: any = "";
      if (sortBy === "name") {
        va = a.name;
        vb = b.name;
      } else if (sortBy === "price") {
        va = a.price?.listedPrice || 0;
        vb = b.price?.listedPrice || 0;
      } else {
        va = categories.find((c) => c.id === a.categoryId)?.name || "";
        vb = categories.find((c) => c.id === b.categoryId)?.name || "";
      }

      if (typeof va === "string") return mult * va.localeCompare(String(vb));
      return mult * (Number(va) - Number(vb));
    });
    setFiltered(f);
  }, [searchQuery, combos, sortBy, sortDir, categories]);

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    if (editingValue === 0 && newVal.length > 1 && newVal.startsWith("0")) {
      setEditingValue(parseInt(newVal.substring(1)) || 0);
    } else {
      setEditingValue(parseInt(newVal) || 0);
    }
  };

  const handleSortOrderBlur = async (id: string) => {
    try {
      const res = await updateCombo({ id, sortOrder: editingValue });
      if (res?.success) {
        setCombos((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, sortOrder: editingValue } : c,
          ),
        );
        toast.success("Order updated");
      }
    } catch (e) {
      toast.error("Failed");
    } finally {
      setEditingRowId(null);
    }
  };

  const openCreate = () => {
    setIsEditing(false);
    setSelectedId(null);
    setName("");
    setHscode("");
    setPrepTime("");
    setDescription("");
    setCategoryId("");
    setSubMenuId("");
    setKotType("KITCHEN");
    setSortOrder(0);
    setImageFile(null);
    setPrice({});
    setComboItems([]);
    setStockConsumption([]);
    setIsPanelOpen(true);
  };

  const openEdit = (c: ComboOffer) => {
    setIsEditing(true);
    setSelectedId(c.id);
    setName(c.name);
    setHscode(c.hscode || "");
    setPrepTime(c.preparationTime?.toString() || "");
    setDescription(c.description || "");
    setCategoryId(c.categoryId);
    setSubMenuId(c.subMenuId || "");
    setKotType(c.kotType);
    setSortOrder((c as any).sortOrder ?? 0);
    setImageFile(c.image?.[0] || null);
    setPrice(c.price || {});
    setComboItems(
      c.items?.map((i) => ({
        dishId: i.dishId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })) || [],
    );
    setStockConsumption(
      c.stocks?.map((s) => ({ stockId: s.stockId, quantity: s.quantity })) ||
        [],
    );
    setIsPanelOpen(true);
  };

  const handleSubmit = async () => {
    if (!name || !categoryId) return;
    setIsSaving(true);

    // Image logic remains the same...
    let imageUrl = typeof imageFile === "string" ? imageFile : undefined;
    if (imageFile instanceof File) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("folder", "combos");
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

    // --- UPDATED PAYLOAD BLOCK ---
    const payload = {
      name,
      hscode,
      image: imageUrl ? [imageUrl] : [],
      preparationTime: parseInt(prepTime) || 0,
      description,
      categoryId,
      subMenuId: subMenuId || undefined,
      kotType,
      sortOrder: Number(sortOrder) || 0,
      items: comboItems,
      price: {
        // Use price.id if it exists for updates
        id: price.id,
        // Force every numeric field to be a number, never undefined
        actualPrice: Number(price.actualPrice) || 0,
        listedPrice: Number(price.listedPrice) || 0,
        discountPrice: Number(price.discountPrice) || 0,
        cogs: Number(price.cogs) || 0,
        grossProfit: Number(price.grossProfit) || 0, // This fixes ts(2345)
      },
      stockConsumption: stockConsumption.filter(
        (s) => s.stockId && s.quantity > 0,
      ),
    };

    try {
      // We cast to 'any' here if your service specifically expects Partial<ComboOffer>
      // but your payload contains nested objects that are slightly different.
      const res =
        isEditing && selectedId
          ? await updateCombo({ ...payload, id: selectedId } as any)
          : await addCombo(payload as any);

      if (res?.success) {
        toast.success(isEditing ? "Combo updated" : "Combo created");
        refresh();
        setIsPanelOpen(false);
        router.refresh();
      } else {
        toast.error(res?.message || "Failed to save");
      }
    } catch (error) {
      toast.error("Error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Combo Offers</h1>
          <p className="text-gray-500 font-medium">
            Manage meal sets and special offers
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
        >
          <Plus size={18} className="mr-2" /> Add Combo
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Combos" value={combos.length} />
        <MetricCard
          title="Available"
          value={combos.filter((c) => c.isAvailable).length}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4 bg-white sticky top-0 flex-wrap">
          <input
            placeholder="Search combos..."
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
                <th className="px-6 py-4 font-semibold text-gray-700">Price</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => openEdit(c)}
                  className="hover:bg-red-50/50 transition-colors cursor-pointer group"
                >
                  <td
                    className="px-6 py-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingRowId(c.id);
                      setEditingValue((c as any).sortOrder || 0);
                    }}
                  >
                    {editingRowId === c.id ? (
                      <input
                        type="number"
                        value={editingValue}
                        onChange={handleSortOrderChange}
                        onBlur={() => handleSortOrderBlur(c.id)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSortOrderBlur(c.id)
                        }
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded outline-none font-mono"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="text-gray-400 font-mono hover:text-gray-900 cursor-text">
                        {(c as any).sortOrder ?? 0}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                      {c.image?.[0] ? (
                        <img
                          src={c.image[0]}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100">
                          <Gift size={16} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    {c.name}
                  </td>
                  <td className="px-6 py-4">
                    {categories.find((cat) => cat.id === c.categoryId)?.name ||
                      "-"}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {settings.currency} {c.price?.listedPrice || 0}
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
        title={isEditing ? "Edit Combo" : "New Combo"}
      >
        <div className="space-y-8 pb-24">
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase border-b pb-2">
              Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Combo Name *
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Category *
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
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">
                  Sub Menu
                </label>
                <select
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 outline-none"
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
            <ImageUpload
              label="Combo Image"
              value={typeof imageFile === "string" ? imageFile : undefined}
              onChange={setImageFile}
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase border-b pb-2">
              Items in Combo
            </h3>
            <div className="space-y-2">
              {comboItems.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border"
                >
                  <select
                    className="flex-1 rounded border border-gray-200 p-2 text-sm outline-none"
                    value={item.dishId}
                    onChange={(e) => {
                      const dish = dishes.find((d) => d.id === e.target.value);
                      const newItems = [...comboItems];
                      newItems[index] = {
                        ...newItems[index],
                        dishId: e.target.value,
                        unitPrice: dish?.price?.listedPrice || 0,
                      };
                      setComboItems(newItems);
                    }}
                  >
                    <option value="">Select Dish</option>
                    {dishes.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({settings.currency} {d.price?.listedPrice})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="w-16 rounded border border-gray-200 p-2 text-sm outline-none"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...comboItems];
                      newItems[index].quantity = parseInt(e.target.value) || 0;
                      setComboItems(newItems);
                    }}
                  />
                  <button
                    onClick={() =>
                      setComboItems(comboItems.filter((_, i) => i !== index))
                    }
                    className="text-red-500 hover:bg-red-50 p-1 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <Button
                variant="secondary"
                className="w-full text-xs"
                onClick={() =>
                  setComboItems([
                    ...comboItems,
                    { dishId: "", quantity: 1, unitPrice: 0 },
                  ])
                }
              >
                <Plus size={14} className="mr-1" /> Add Dish
              </Button>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase border-b pb-2">
              Pricing
            </h3>
            <PriceForm value={price} onChange={handleManualPriceChange} />
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
                ? "Update Combo"
                : "Create Combo"}
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
            const res = await deleteCombo(selectedId);
            if (res?.success) {
              refresh();
              setIsPanelOpen(false);
              setIsDeleteModalOpen(false);
              router.refresh();
              toast.success("Combo deleted");
            } else {
              toast.error(res?.message || "Failed to delete");
            }
          } catch (e) {
            toast.error("Failed to delete");
          } finally {
            setIsSaving(false);
          }
        }}
        title="Delete Combo"
        message={`Are you sure you want to delete combo "${name}"?`}
        isLoading={isSaving}
      />
    </div>
  );
}
