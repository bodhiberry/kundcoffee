"use client";

import { useState, useEffect } from "react";
import { SidePanel } from "@/components/ui/SidePanel";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";

interface StockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  stock?: any | null;
  units: any[];
  groups: any[];
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
  const [selectedDishId, setSelectedDishId] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    unitId: "",
    groupId: "",
    quantity: 0,
    costPrice: 0,
    amount: 0,
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
      });
      const match = dishes.find((d: any) => d.name === stock.name);
      setSelectedDishId(match ? match.id : "");
    } else {
      setFormData({
        name: "",
        unitId: units.length > 0 ? units[0].id : "",
        groupId: "",
        quantity: 0,
        costPrice: 0,
        amount: 0,
      });
      setSelectedDishId("");
    }
  }, [stock, isOpen, units, dishes]);

  const handleDishSelect = (dishId: string) => {
    setSelectedDishId(dishId);
    if (dishId) {
      const selectedDish = dishes.find((d) => d.id === dishId);
      if (selectedDish) {
        setFormData((prev) => ({ ...prev, name: selectedDish.name }));
      }
    }
  };

  // Handle auto-calculation: Qty * Cost = Amount
  const handleCalculation = (field: "quantity" | "costPrice" | "amount", value: number) => {
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
    if (!formData.unitId) {
      toast.error("Please select a measuring unit");
      return;
    }
    setLoading(true);

    try {
      const url = stock ? `/api/stocks/${stock.id}` : "/api/stocks";
      const method = stock ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(stock ? "Stock updated" : "Stock created");
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
      <div className="space-y-4 px-1 py-4">
        <div className="space-y-1">
          <label className="pos-label text-zinc-500 text-[10px] uppercase font-bold tracking-wider">
            Select Dish from Menu (Optional)
          </label>
          <select
            className="pos-input w-full bg-zinc-50 border-zinc-200 rounded-xl text-sm h-11 px-3 font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            value={selectedDishId}
            onChange={(e) => handleDishSelect(e.target.value)}
          >
            <option value="">-- Choose from Menu or enter separately below --</option>
            {dishes.map((dish) => (
              <option key={dish.id} value={dish.id}>
                {dish.name} {dish.category?.name ? `(${dish.category.name})` : ""}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Item Name *"
          required
          placeholder="e.g. Fresh Milk"
          value={formData.name}
          onChange={(e) => {
            const val = e.target.value;
            const match = dishes.find((d) => d.name.toLowerCase() === val.toLowerCase());
            setSelectedDishId(match ? match.id : "");
            setFormData({ ...formData, name: val });
          }}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="pos-label text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Measuring Unit *</label>
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
            <label className="pos-label text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Stock Group</label>
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

        <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 space-y-6 mt-6">
          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-2">
            Valuation & Inventory
          </h4>
          
          <div className="grid grid-cols-2 gap-6">
            <Input
              label="Opening Quantity"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.quantity}
              onChange={(e) =>
                handleCalculation("quantity", parseFloat(e.target.value) || 0)
              }
            />

            <Input
              label="Unit Cost (Rate)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.costPrice}
              onChange={(e) =>
                handleCalculation("costPrice", parseFloat(e.target.value) || 0)
              }
            />
          </div>

          <div className="pt-4 border-t border-dashed border-zinc-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Inventory Value</p>
                <p className="text-2xl font-black text-zinc-900 tracking-tight">
                  <span className="text-zinc-400 mr-1 opacity-50 font-medium">Rs.</span>
                  {formData.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Status</p>
                <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 ${formData.quantity > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {formData.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-zinc-100 flex items-center gap-3">
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
          className="flex-1 rounded-2xl h-12 bg-zinc-900 border-none shadow-xl shadow-zinc-200 font-bold" 
          disabled={loading}
        >
          {loading ? "Saving..." : stock ? "Update Item" : "Create Item"}
        </Button>
      </div>
    </SidePanel>
  );
}
