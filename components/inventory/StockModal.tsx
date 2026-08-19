"use client";

import { useState, useEffect } from "react";
import { SidePanel } from "@/components/ui/SidePanel";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Trash2 } from "lucide-react";

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
    amount: 0,
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

  useEffect(() => {
    if (stock) {
      setFormData({
        name: stock.name || "",
        unitId: stock.unitId || "",
        groupId: stock.groupId || "",
        quantity: stock.quantity || 0,
        costPrice: stock.costPrice || 0,
        amount: stock.amount || 0,
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
      setFormData({
        name: "",
        unitId: units.length > 0 ? units[0].id : "",
        groupId: "",
        quantity: 0,
        costPrice: 0,
        amount: 0,
        type: "RAW_MATERIAL",
      });
      setDishConsumptions([]);
    }
  }, [stock, isOpen, units]);

  const selectedUnit = units.find((u) => u.id === formData.unitId);
  const unitLabel = selectedUnit?.shortName || selectedUnit?.name || "units";

  const handleAddDishLink = () => {
    // Pick first dish not already linked if possible
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

    // Auto-fill stock name if it is currently empty and this is the first dish
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

  // Handle auto-calculation: Qty * Cost = Amount
  const handleCalculation = (
    field: "quantity" | "costPrice" | "amount",
    value: number,
  ) => {
    const updated = { ...formData, [field]: value };

    if (field === "quantity" || field === "costPrice") {
      updated.amount = Number((updated.quantity * updated.costPrice).toFixed(2));
    } else if (field === "amount") {
      // If user enters total value manually, adjust cost price if quantity > 0
      if (updated.quantity > 0) {
        updated.costPrice = Number((updated.amount / updated.quantity).toFixed(2));
      }
    }

    setFormData(updated);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a stock item name");
      return;
    }
    if (!formData.unitId) {
      toast.error("Please select a measuring unit");
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
        ...formData,
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
            ? "Stock & recipe links updated"
            : "Stock & recipe links created",
        );
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (error) {
      toast.error("Failed to save stock item");
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
            Stock Type *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "RAW_MATERIAL" })}
              className={`p-3 rounded-xl border text-left transition-all ${
                formData.type === "RAW_MATERIAL"
                  ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                  : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🌾</span>
                <span className="text-xs font-bold">Raw Material</span>
              </div>
              <p
                className={`text-[11px] leading-tight ${
                  formData.type === "RAW_MATERIAL"
                    ? "text-zinc-300"
                    : "text-zinc-500"
                }`}
              >
                Ingredient used in recipes (e.g. Milk, Beans, Flour)
              </p>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: "FINISHED_GOOD" })}
              className={`p-3 rounded-xl border text-left transition-all ${
                formData.type === "FINISHED_GOOD"
                  ? "border-amber-600 bg-amber-500 text-white shadow-sm"
                  : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🍰</span>
                <span className="text-xs font-bold">Finished Good</span>
              </div>
              <p
                className={`text-[11px] leading-tight ${
                  formData.type === "FINISHED_GOOD"
                    ? "text-amber-100"
                    : "text-zinc-500"
                }`}
              >
                Ready-to-sell bakery / retail item (e.g. Cheesecake Slices)
              </p>
            </button>
          </div>
        </div>

        {/* Item Name */}
        <Input
          label="Item Name *"
          required
          placeholder={
            formData.type === "FINISHED_GOOD"
              ? "e.g. Cheesecake Slices, Chocolate Muffin"
              : "e.g. Fresh Milk, Espresso Beans, Sugar"
          }
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        {/* Unit & Group */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="pos-label text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
              Measuring Unit *
            </label>
            <select
              required
              className="pos-input w-full bg-zinc-50 border-zinc-200 rounded-xl text-sm h-11"
              value={formData.unitId}
              onChange={(e) =>
                setFormData({ ...formData, unitId: e.target.value })
              }
            >
              <option value="" disabled>
                Select Unit
              </option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.shortName})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="pos-label text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
              Stock Group
            </label>
            <select
              className="pos-input w-full bg-zinc-50 border-zinc-200 rounded-xl text-sm h-11"
              value={formData.groupId}
              onChange={(e) =>
                setFormData({ ...formData, groupId: e.target.value })
              }
            >
              <option value="">No Group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Valuation & Inventory */}
        <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200 space-y-4">
          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-2">
            Valuation & Stock Quantity
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`Opening Quantity (${unitLabel})`}
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.quantity}
              onChange={(e) =>
                handleCalculation("quantity", parseFloat(e.target.value) || 0)
              }
            />

            <Input
              label={`Unit Cost / Rate (Per ${unitLabel})`}
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.costPrice}
              onChange={(e) =>
                handleCalculation("costPrice", parseFloat(e.target.value) || 0)
              }
            />
          </div>

          <div className="pt-3 border-t border-dashed border-zinc-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Total Inventory Value
                </p>
                <p className="text-2xl font-black text-zinc-900 tracking-tight">
                  <span className="text-zinc-400 mr-1 opacity-50 font-medium">
                    Rs.
                  </span>
                  {formData.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Status
                </p>
                <div
                  className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mt-1 ${
                    formData.quantity > 0
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-red-50 text-red-600 border border-red-200"
                  }`}
                >
                  {formData.quantity > 0 ? "In Stock" : "Out of Stock"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Linked Dishes */}
        <div className="space-y-3 mt-2">
          <div className="flex items-center justify-between">
            <label className="pos-label text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
              Used in Dishes (Optional)
            </label>
            <button
              type="button"
              onClick={handleAddDishLink}
              className="text-xs text-zinc-900 font-semibold hover:underline"
            >
              + Add Dish
            </button>
          </div>

          {dishConsumptions.length === 0 && (
            <p className="text-xs text-zinc-400">
              No dishes linked. Add a dish to auto-deduct this stock per order.
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
                    Dish
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
                          {isUsed ? " — already added" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="w-32 space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Qty ({unitLabel})
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
                  className="h-11 px-2 text-zinc-400 hover:text-red-500"
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
            : "Create Stock Item"}
        </Button>
      </div>
    </SidePanel>
  );
}
