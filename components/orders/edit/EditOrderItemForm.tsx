"use client";

import { useState, useEffect, useCallback } from "react";
import { OrderItem, AddOn } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Plus, Minus, Check } from "lucide-react";
import { getAddOns } from "@/services/menu";
import Image from "next/image";
import { useSettings } from "@/components/providers/SettingsProvider";
import { deleteOrderItem } from "@/services/order";
import { toast } from "sonner";

interface EditOrderItemFormProps {
  item: OrderItem;
  onSave: (updatedItem: Partial<OrderItem>) => void;
  onCancel: () => void;
  onDelete: (id: string) => void; // <--- Added
}

export function EditOrderItemForm({
  item,
  onSave,
  onCancel,
  onDelete,
}: EditOrderItemFormProps) {
  const { settings } = useSettings();
  const [quantity, setQuantity] = useState(item.quantity);
  const [remarks, setRemarks] = useState(item.remarks || "");
  const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>(
    (item.selectedAddOns || []).map((a) => a.addOnId),
  );

  // 1. Move fetch outside or wrap in useCallback to prevent re-renders
  const fetchAddOns = useCallback(async () => {
    try {
      const addons = await getAddOns();
      setAvailableAddOns(addons);
    } catch (error) {
      console.error("Failed to fetch addons", error);
    }
  }, []);

  useEffect(() => {
    fetchAddOns();
  }, [fetchAddOns]);

  const handleToggleAddOn = (id: string) => {
    setSelectedAddOnIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSave = () => {
    onSave({
      id: item.id,
      quantity,
      remarks,
      selectedAddOns: selectedAddOnIds.map((id) => {
        const addon = availableAddOns.find((a) => a.id === id);
        return {
          addOnId: id,
          quantity: 1,
          unitPrice: addon?.price?.listedPrice || 0,
        } as any;
      }),
    });
  };

  // Helper for your schema's image array
  const dishImage = Array.isArray(item.dish?.image)
    ? item.dish?.image[0]
    : item.dish?.image;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-zinc-50 p-4 rounded-xl border border-zinc-200">
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-zinc-200 bg-white">
            <Image
              src={dishImage || "/placeholder.png"}
              alt={item.dish?.name || ""}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-zinc-900 uppercase tracking-tight">
              {item.dish?.name}
            </span>
            <span className="text-xs font-bold text-zinc-500 mt-1">
              {settings.currency} {item.dish?.price?.listedPrice.toFixed(2)}
            </span>
          </div>
        </div>

        <button
          onClick={() => onDelete(item.id)}
          className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl border border-rose-100 shadow-sm"
        >
          Remove Item
        </button>
      </div>

      {/* Quantity Control */}
      <div className="flex items-center justify-between bg-zinc-50 p-5 rounded-xl border border-zinc-200 shadow-sm">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            Quantity
          </span>
          <span className="text-2xl font-black text-zinc-900 mt-1">{quantity}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-11 h-11 bg-white border border-zinc-200 shadow-sm rounded-xl flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 active:scale-95 transition-all"
          >
            <Minus size={18} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-11 h-11 bg-white border border-zinc-200 shadow-sm rounded-xl flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 active:scale-95 transition-all"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Add-ons List */}
      <div className="space-y-3">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block ml-1">
          Available Add-ons / Extras
        </label>
        <div className="grid grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
          {availableAddOns.map((addon) => {
            const isSelected = selectedAddOnIds.includes(addon.id);
            return (
              <button
                key={addon.id}
                onClick={() => handleToggleAddOn(addon.id)}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-zinc-900 border-zinc-900 text-white shadow-md shadow-zinc-900/10"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                }`}
              >
                <div className="flex flex-col items-start px-1 text-left">
                  <span className="text-[11px] font-black uppercase tracking-tight truncate max-w-[140px]">
                    {addon.name}
                  </span>
                  <span className={`text-[9px] font-bold mt-1 ${isSelected ? "text-zinc-300" : "text-zinc-400"}`}>
                    +{settings.currency} {addon.price?.listedPrice.toFixed(2)}
                  </span>
                </div>
                {isSelected && (
                  <Check size={14} strokeWidth={3} className="text-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Remarks */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block ml-1">
          Special Instructions
        </label>
        <textarea
          placeholder="e.g. Extra spicy, no onions, well done..."
          className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:bg-white focus:border-zinc-900 h-24 resize-none transition-all font-bold text-zinc-800"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
      </div>

      {/* Footer Buttons */}
      <div className="pt-5 border-t border-zinc-100 flex gap-4">
        <Button
          variant="secondary"
          onClick={onCancel}
          className="flex-1 font-black h-12 text-[10px] uppercase tracking-widest rounded-xl border-zinc-200 hover:bg-zinc-50"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="flex-1 bg-zinc-950 hover:bg-zinc-800 text-white font-black h-12 text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-zinc-200 border-none"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
