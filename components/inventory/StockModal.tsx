"use client";

import { useState, useEffect } from "react";
import { SidePanel } from "@/components/ui/SidePanel";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Trash2, TrendingUp, DollarSign, Package } from "lucide-react";

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  stock?: any | null;
  units: any[];
  groups: any[];
}

interface DishConsumptionItem {
  dishId: string;
  quantity: number | string;
}

export default function StockModal({
  isOpen,
  onClose,
  onSuccess,
  stock,
  units,
  groups,
}: StockModalProps) {
  const [loading, setLoading] = useState(false);
  const [dishes, setDishes] = useState<any[]>([]);
  const [dishConsumptions, setDishConsumptions] = useState<DishConsumptionItem[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    unitId: "",
    groupId: "",
    quantity: 0,
    costPrice: 0,
    sellingPrice: 0,
    type: "RAW_MATERIAL",
  });

  useEffect(() => {
    if (isOpen) {
      fetch("/api/dishes")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setDishes(data.data);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch dishes", err);
        });
    }
  }, [isOpen]);

  // Helper to find best default group based on stock type
  const getDefaultGroupId = (type: string, availableGroups: any[]) => {
    if (!availableGroups || availableGroups.length === 0) return "";
    const targetName =
      type === "FINISHED_GOOD" ? "Finished Goods" : "Raw Materials";
    const matched = availableGroups.find(
      (g) => g.name.toLowerCase() === targetName.toLowerCase(),
    );
    return matched ? matched.id : availableGroups[0]?.id || "";
  };

  // Helper to find default unit (e.g. "Pcs" / "Piece" or first)
  const getDefaultUnitId = (availableUnits: any[]) => {
    if (!availableUnits || availableUnits.length === 0) return "";
    const pcs = availableUnits.find(
      (u) =>
        u.shortName?.toLowerCase() === "pcs" ||
        u.name?.toLowerCase().includes("piece"),
    );
    return pcs ? pcs.id : availableUnits[0]?.id || "";
  };

  useEffect(() => {
    if (stock) {
      setFormData({
        name: stock.name || "",
        unitId: stock.unitId || getDefaultUnitId(units),
        groupId: stock.groupId || getDefaultGroupId(stock.type || "RAW_MATERIAL", groups),
        quantity: stock.quantity || 0,
        costPrice: stock.costPrice || 0,
        sellingPrice: stock.sellingPrice || 0,
        type: stock.type || "RAW_MATERIAL",
      });

      // Load existing dish consumptions
      if (stock.consumptions && Array.isArray(stock.consumptions)) {
        const dishLinks = stock.consumptions
          .filter((c: any) => c.dishId)
          .map((c: any) => ({
            dishId: c.dishId,
            quantity: c.quantity,
          }));
        setDishConsumptions(dishLinks);
      } else {
        setDishConsumptions([]);
      }
    } else {
      const defaultUnit = getDefaultUnitId(units);
      const defaultGroup = getDefaultGroupId("RAW_MATERIAL", groups);
      setFormData({
        name: "",
        unitId: defaultUnit,
        groupId: defaultGroup,
        quantity: 0,
        costPrice: 0,
        sellingPrice: 0,
        type: "RAW_MATERIAL",
      });
      setDishConsumptions([]);
    }
  }, [stock, isOpen, units, groups]);

  const handleTypeChange = (newType: "RAW_MATERIAL" | "FINISHED_GOOD") => {
    // If not editing, auto-adjust group to match type
    const newGroup = !stock
      ? getDefaultGroupId(newType, groups)
      : formData.groupId;
    setFormData((prev) => ({
      ...prev,
      type: newType,
      groupId: newGroup || prev.groupId,
    }));
  };

  const selectedUnit = units.find((u) => u.id === formData.unitId);
  const unitLabel = selectedUnit?.shortName || selectedUnit?.name || "units";

  const totalValue = Number((formData.quantity * formData.costPrice).toFixed(2));
  const profitMargin = Number((formData.sellingPrice - formData.costPrice).toFixed(2));
  const marginPercent =
    formData.costPrice > 0
      ? Number(((profitMargin / formData.costPrice) * 100).toFixed(1))
      : 0;

  const handleAddDishLink = () => {
    const unlinkedDish = dishes.find(
      (d) => !dishConsumptions.some((dc) => dc.dishId === d.id),
    );
    setDishConsumptions((prev) => [
      ...prev,
      { dishId: unlinkedDish ? unlinkedDish.id : "", quantity: "" },
    ]);
  };

  const handleRemoveDishLink = (index: number) => {
    setDishConsumptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDishChange = (index: number, dishId: string) => {
    setDishConsumptions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], dishId };
      return updated;
    });

    if (!formData.name && dishId) {
      const dish = dishes.find((d) => d.id === dishId);
      if (dish) {
        setFormData((prev) => ({ ...prev, name: dish.name }));
      }
    }
  };

  const handleDishQuantityChange = (index: number, val: string) => {
    setDishConsumptions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: val };
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a stock item name");
      return;
    }

    // Validate dish consumptions
    for (let i = 0; i < dishConsumptions.length; i++) {
      const item = dishConsumptions[i];
      if (item.dishId) {
        const qty = parseFloat(String(item.quantity));
        if (isNaN(qty) || qty <= 0) {
          const dishObj = dishes.find((d) => d.id === item.dishId);
          toast.error(
            `Please specify a valid deduction quantity for ${dishObj?.name || "the linked dish"}`,
          );
          return;
        }
      }
    }

    setLoading(true);

    try {
      const url = stock ? `/api/stocks/${stock.id}` : "/api/stocks";
      const method = stock ? "PATCH" : "POST";

      const validDishConsumptions = dishConsumptions
        .filter((dc) => dc.dishId && parseFloat(String(dc.quantity)) > 0)
        .map((dc) => ({
          dishId: dc.dishId,
          quantity: parseFloat(String(dc.quantity)),
        }));

      const payload = {
        name: formData.name.trim(),
        unitId: formData.unitId || undefined,
        groupId: formData.groupId || undefined,
        quantity: Number(formData.quantity || 0),
        costPrice: Number(formData.costPrice || 0),
        sellingPrice: Number(formData.sellingPrice || 0),
        amount: totalValue,
        type: formData.type,
        dishConsumptions: validDishConsumptions,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          stock
            ? "Stock item updated successfully"
            : "New stock item added to inventory",
        );
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Failed to save stock item");
      }
    } catch (error) {
      toast.error("An error occurred while saving the stock item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={stock ? "Edit Stock Item" : "Add New Stock Item"}
    >
      <div className="space-y-5 px-1 py-4 pb-28">
        {/* Stock Type Selector */}
        <div className="space-y-2">
          <label className="pos-label text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
            Stock Classification *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange("RAW_MATERIAL")}
              className={`p-3 rounded-xl border text-left transition-all ${
                formData.type === "RAW_MATERIAL"
                  ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                  : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800"
              }`}
            >
              <div className="mb-1">
                <span className="text-xs font-bold">Raw Material / Ingredient</span>
              </div>
              <p
                className={`text-[11px] leading-tight ${
                  formData.type === "RAW_MATERIAL"
                    ? "text-zinc-300"
                    : "text-zinc-500"
                }`}
              >
                Coffee beans, milk, syrups, flour, spices
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange("FINISHED_GOOD")}
              className={`p-3 rounded-xl border text-left transition-all ${
                formData.type === "FINISHED_GOOD"
                  ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                  : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800"
              }`}
            >
              <div className="mb-1">
                <span className="text-xs font-bold">Finished / Retail Good</span>
              </div>
              <p
                className={`text-[11px] leading-tight ${
                  formData.type === "FINISHED_GOOD"
                    ? "text-zinc-300"
                    : "text-zinc-500"
                }`}
              >
                Bakery items, muffins, bottled drinks, merchandise
              </p>
            </button>
          </div>
        </div>

        {/* Item Name */}
        <Input
          label="Stock Item Name *"
          required
          placeholder={
            formData.type === "FINISHED_GOOD"
              ? "e.g. Cheesecake Slice, Chocolate Croissant"
              : "e.g. Whole Milk, Espresso Beans, White Sugar"
          }
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        {/* Measuring Unit & Stock Group */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="pos-label text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                Measuring Unit
              </label>
              <span className="text-[10px] text-zinc-400 font-medium">Auto-selected</span>
            </div>
            <select
              className="pos-input w-full bg-zinc-50 border-zinc-200 rounded-xl text-sm h-11"
              value={formData.unitId}
              onChange={(e) =>
                setFormData({ ...formData, unitId: e.target.value })
              }
            >
              {units.length === 0 ? (
                <option value="">Piece (Pcs) - Default</option>
              ) : (
                units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.shortName})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="pos-label text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                Stock Group
              </label>
              <span className="text-[10px] text-zinc-400 font-medium">Auto-categorized</span>
            </div>
            <select
              className="pos-input w-full bg-zinc-50 border-zinc-200 rounded-xl text-sm h-11"
              value={formData.groupId}
              onChange={(e) =>
                setFormData({ ...formData, groupId: e.target.value })
              }
            >
              <option value="">General</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing & Stock Valuation */}
        <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
              Pricing & Initial Quantity
            </h4>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">
              Per {unitLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cost Price (Rs.) *"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.costPrice || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  costPrice: parseFloat(e.target.value) || 0,
                })
              }
            />

            <Input
              label="Selling Price (Rs.)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.sellingPrice || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sellingPrice: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <Input
              label={`Opening Stock Quantity (${unitLabel})`}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.quantity || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: parseFloat(e.target.value) || 0,
                })
              }
            />

            <div className="space-y-1">
              <label className="pos-label text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
                Unit Margin
              </label>
              <div className="h-11 px-3.5 rounded-xl border border-zinc-200 bg-white flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700">
                  Rs. {profitMargin.toFixed(2)}
                </span>
                {formData.costPrice > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      profitMargin >= 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {marginPercent > 0 ? "+" : ""}
                    {marginPercent}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Valuation Summary */}
          <div className="pt-3 border-t border-dashed border-zinc-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Total Inventory Value
              </p>
              <p className="text-xl font-black text-zinc-900 tracking-tight">
                <span className="text-zinc-400 mr-1 opacity-50 font-medium">
                  Rs.
                </span>
                {totalValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Stock Status
              </p>
              <div
                className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mt-1 ${
                  formData.quantity > 0
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {formData.quantity > 0 ? `${formData.quantity} ${unitLabel}` : "0 Stock"}
              </div>
            </div>
          </div>
        </div>

        {/* Linked Dishes (Recipe Auto-Deduction) */}
        <div className="space-y-3 mt-2">
          <div className="flex items-center justify-between">
            <label className="pos-label text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
              Recipe Link (Auto-Deduct on Order)
            </label>
            <button
              type="button"
              onClick={handleAddDishLink}
              className="text-xs text-zinc-900 font-semibold hover:underline"
            >
              + Link Dish
            </button>
          </div>

          {dishConsumptions.length === 0 && (
            <p className="text-xs text-zinc-400">
              No dishes linked. Link a menu dish if this ingredient should auto-deduct upon POS checkout.
            </p>
          )}

          {dishConsumptions.map((dc, index) => {
            const usedDishIds = dishConsumptions
              .filter((_, i) => i !== index)
              .map((item) => item.dishId);

            return (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Menu Dish
                  </label>
                  <select
                    className="pos-input w-full bg-zinc-50 border-zinc-200 rounded-xl text-sm h-11 px-3"
                    value={dc.dishId}
                    onChange={(e) => handleDishChange(index, e.target.value)}
                  >
                    <option value="">-- Select Dish --</option>
                    {dishes.map((dish) => {
                      const isUsed = usedDishIds.includes(dish.id);
                      return (
                        <option key={dish.id} value={dish.id} disabled={isUsed}>
                          {dish.name}
                          {dish.category?.name ? ` (${dish.category.name})` : ""}
                          {isUsed ? " — already linked" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="w-32 space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Deduct ({unitLabel})
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="0.00"
                    value={dc.quantity}
                    onChange={(e) =>
                      handleDishQuantityChange(index, e.target.value)
                    }
                    className="pos-input w-full bg-zinc-50 border-zinc-200 rounded-xl text-sm h-11 px-3"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveDishLink(index)}
                  className="h-11 px-2 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-md border-t border-zinc-200 flex items-center gap-3">
        <Button
          onClick={onClose}
          variant="secondary"
          className="flex-1 rounded-2xl h-12 bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-600 font-bold"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex-1 rounded-2xl h-12 bg-zinc-900 hover:bg-zinc-800 border-none shadow-xl shadow-zinc-200 text-white font-bold"
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : stock
            ? "Update Stock Item"
            : "Save Stock Item"}
        </Button>
      </div>
    </SidePanel>
  );
}
