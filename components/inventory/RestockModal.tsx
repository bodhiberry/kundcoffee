"use client";

import { useState, useEffect } from "react";
import { SidePanel } from "@/components/ui/SidePanel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { PlusCircle, PackagePlus, ArrowUpRight, Calendar, User, FileText } from "lucide-react";

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  stock: any | null;
}

export default function RestockModal({
  isOpen,
  onClose,
  onSuccess,
  stock,
}: RestockModalProps) {
  const [loading, setLoading] = useState(false);
  const [quantityToAdd, setQuantityToAdd] = useState<number | string>("");
  const [costPrice, setCostPrice] = useState<number | string>(0);
  const [sellingPrice, setSellingPrice] = useState<number | string>(0);
  const [remarks, setRemarks] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    if (stock && isOpen) {
      setQuantityToAdd("");
      setCostPrice(stock.costPrice || 0);
      setSellingPrice(stock.sellingPrice || 0);
      setRemarks("");
      setDate(new Date().toISOString().split("T")[0]);
    }
  }, [stock, isOpen]);

  if (!stock) return null;

  const unitLabel = stock.unit?.shortName || stock.unit?.name || "units";
  const numAdded = parseFloat(String(quantityToAdd)) || 0;
  const numCost = parseFloat(String(costPrice)) || 0;
  const numSelling = parseFloat(String(sellingPrice)) || 0;

  const newTotalQuantity = (stock.quantity || 0) + numAdded;
  const restockTotalCost = Number((numAdded * numCost).toFixed(2));
  const newTotalInventoryValue = Number((newTotalQuantity * numCost).toFixed(2));

  const handleRestock = async () => {
    if (numAdded <= 0) {
      toast.error("Please enter a valid quantity to add (> 0)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/stocks/${stock.id}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantityToAdd: numAdded,
          costPrice: numCost,
          sellingPrice: numSelling,
          remarks: remarks.trim() || undefined,
          date: date || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          `Added +${numAdded} ${unitLabel} to ${stock.name}. Stock audit saved.`,
        );
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Failed to add stock");
      }
    } catch (error) {
      toast.error("An error occurred while adding stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Stock: ${stock.name}`}
    >
      <div className="space-y-5 px-1 py-4 pb-28">
        {/* Item Overview Banner */}
        <div className="bg-zinc-900 text-white p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <PackagePlus className="w-5 h-5 text-zinc-100" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{stock.name}</h3>
                <p className="text-[11px] text-zinc-400">
                  {stock.group?.name || "General Stock"} •{" "}
                  {stock.type === "FINISHED_GOOD" ? "Finished Good" : "Raw Material"}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white/10 text-zinc-200 border border-white/10">
              {unitLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">
                Current Stock
              </p>
              <p className="text-lg font-bold text-white font-mono">
                {stock.quantity?.toLocaleString() || 0} {unitLabel}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium">
                Current Cost Price
              </p>
              <p className="text-lg font-bold text-white font-mono">
                Rs. {stock.costPrice?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        </div>

        {/* Restock Inputs */}
        <div className="space-y-4">
          <Input
            label={`Quantity to Add (+${unitLabel}) *`}
            type="number"
            step="0.01"
            min="0.01"
            required
            autoFocus
            placeholder={`e.g. 10, 25, 50`}
            value={quantityToAdd}
            onChange={(e) => setQuantityToAdd(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Purchase / Cost Price (Rs.)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />

            <Input
              label="Selling Price (Rs.)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Restock Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <Input
              label="Supplier / Reference / Note"
              placeholder="e.g. Vendor delivery, Market bill #45"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        {/* Audit & Projection Summary */}
        <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-200 space-y-3">
          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-200 pb-2">
            Restock Audit Summary
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-zinc-600">
              <span>Quantity Change:</span>
              <span className="font-bold text-emerald-600 font-mono">
                +{numAdded} {unitLabel}
              </span>
            </div>

            <div className="flex items-center justify-between text-zinc-600">
              <span>New Total Stock:</span>
              <span className="font-bold text-zinc-900 font-mono">
                {newTotalQuantity} {unitLabel}
              </span>
            </div>

            <div className="flex items-center justify-between text-zinc-600">
              <span>Restock Cost (Batch):</span>
              <span className="font-bold text-zinc-900 font-mono">
                Rs. {restockTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-200 text-zinc-900 font-bold">
              <span>Projected Total Stock Value:</span>
              <span className="font-black text-sm text-zinc-900 font-mono">
                Rs. {newTotalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-zinc-500 bg-amber-50 border border-amber-200 p-3 rounded-xl leading-relaxed">
          <strong>Audit Protected:</strong> Adding this stock will create an immutable audit record with date, staff, cost, and quantity. Past order transaction prices will not be affected.
        </p>
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
          onClick={handleRestock}
          className="flex-1 rounded-2xl h-12 bg-zinc-900 hover:bg-zinc-800 border-none shadow-xl shadow-zinc-200 text-white font-bold"
          disabled={loading || numAdded <= 0}
        >
          {loading ? "Adding..." : `Add +${numAdded || 0} ${unitLabel}`}
        </Button>
      </div>
    </SidePanel>
  );
}
