"use client";
import React, { useState, useEffect } from "react";
import { Stock, Price, StockConsumption } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";

interface PriceFormProps {
  value?: Partial<Price>;
  onChange: (value: Partial<Price>) => void;
}

import { useSettings } from "@/components/providers/SettingsProvider";
import { Input } from "@/components/ui/Input";

export function PriceForm({ value, onChange }: PriceFormProps) {
  const { settings } = useSettings();
  const handleChange = (field: keyof Price, val: string) => {
    const num = parseFloat(val);
    onChange({ ...value, [field]: isNaN(num) ? 0 : num });
  };

  return (
    <div className="space-y-3 p-4 border border-zinc-200 bg-white rounded-md">
      <h3 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2 mb-3">
        Pricing & Cost ({settings.currency})
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
        <Input
          label={`Actual Price (${settings.currency})`}
          type="number"
          value={value?.actualPrice || 0}
          onChange={(e) => handleChange("actualPrice", e.target.value)}
        />
        <Input
          label={`Discount Price (${settings.currency})`}
          type="number"
          value={value?.discountPrice || 0}
          onChange={(e) => handleChange("discountPrice", e.target.value)}
        />
        <Input
          label={`Listed Price (${settings.currency})`}
          type="number"
          value={value?.listedPrice || 0}
          onChange={(e) => handleChange("listedPrice", e.target.value)}
        />
        <Input
          label={`COGS (${settings.currency})`}
          type="number"
          value={value?.cogs || 0}
          onChange={(e) => handleChange("cogs", e.target.value)}
        />
        <Input
          label={`Gross Profit (${settings.currency})`}
          type="number"
          value={value?.grossProfit || 0}
          onChange={(e) => handleChange("grossProfit", e.target.value)}
        />
      </div>
    </div>
  );
}

interface StockConsumptionFormProps {
  stocks: Stock[]; // Available stocks to choose from
  value?: { stockId: string; quantity: number | string }[];
  onChange: (value: { stockId: string; quantity: number }[]) => void;
}

export function StockConsumptionForm({
  stocks,
  value = [],
  onChange,
}: StockConsumptionFormProps) {
  const addRow = () => {
    onChange([...value.map(v => ({ ...v, quantity: typeof v.quantity === "string" ? parseFloat(v.quantity) || 0 : v.quantity })), { stockId: "", quantity: 0 }]);
  };

  const removeRow = (index: number) => {
    const newVal = value.map(v => ({ ...v, quantity: typeof v.quantity === "string" ? parseFloat(v.quantity) || 0 : v.quantity }));
    newVal.splice(index, 1);
    onChange(newVal);
  };

  const updateRow = (
    index: number,
    field: "stockId" | "quantity",
    val: any,
  ) => {
    const newVal = [...value];
    newVal[index] = { ...newVal[index], [field]: val };
    
    // Pass parsed float values to parent onChange
    const parsed = newVal.map(item => ({
      stockId: item.stockId,
      quantity: typeof item.quantity === "string" ? (item.quantity === "" ? 0 : parseFloat(item.quantity) || 0) : item.quantity
    }));
    onChange(parsed);
  };

  return (
    <div className="space-y-4 p-5 border border-zinc-200 bg-zinc-50/50 rounded-xl">
      <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
            Recipe Ingredients
          </h3>
          <p className="text-xs text-zinc-500">
            Select stock item and quantity consumed per serving
          </p>
        </div>
        <Button
          onClick={addRow}
          type="button"
          variant="secondary"
          size="sm"
          className="bg-white border border-zinc-200 hover:bg-zinc-100 font-bold text-xs text-zinc-900 px-4 py-2 rounded-lg shadow-sm"
        >
          + Add Ingredient
        </Button>
      </div>

      <div className="space-y-3">
        {value.map((row, index) => {
          const selectedStock = stocks.find((s) => s.id === row.stockId);
          const unitName = selectedStock?.unit?.shortName || selectedStock?.unit?.name || "units";
          return (
            <div
              key={index}
              className="flex gap-4 items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm"
            >
              <div className="flex-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 block mb-1.5">
                  Ingredient #{index + 1}
                </label>
                <select
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm font-semibold text-zinc-900 focus:outline-none focus:border-zinc-900"
                  value={row.stockId}
                  onChange={(e) => updateRow(index, "stockId", e.target.value)}
                >
                  <option value="">-- Choose Stock Item --</option>
                  {stocks.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.unit?.shortName || s.unit?.name || "units"}) - Available: {s.quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-44">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 block mb-1.5">
                  Quantity ({unitName})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 0.3"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm font-bold text-zinc-900 focus:outline-none focus:border-zinc-900"
                    value={row.quantity === 0 || row.quantity === "0" ? "" : row.quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Allow typing decimal point like "0." or "0.3"
                      if (val === "" || /^\d*\.?\d*$/.test(val)) {
                        updateRow(index, "quantity", val);
                      }
                    }}
                  />
                  <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-1.5 rounded-lg border border-zinc-200 shrink-0">
                    {unitName}
                  </span>
                </div>
              </div>

              <div className="pt-5">
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="h-10 w-10 flex items-center justify-center rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors shrink-0"
                  title="Remove Ingredient"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {value.length === 0 && (
          <div className="text-center py-8 border border-dashed border-zinc-200 rounded-xl bg-white">
            <p className="text-xs text-zinc-400 font-medium">
              No ingredients added yet. Click "+ Add Ingredient" above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple Rich Text Placeholder
export function RichTextEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const insertFormat = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById(
      `rte-${label}`,
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = `${before}${prefix}${selection}${suffix}${after}`;
    onChange(newText);

    // Defer focus restoration
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1">
        {label}
      </label>
      <div className="border border-gray-300 rounded-lg p-1 bg-white focus-within:ring-2 focus-within:ring-zinc-900/10 focus-within:border-zinc-900 transition-all">
        <div className="flex gap-1 border-b border-gray-100 pb-2 mb-2 px-1">
          <button
            type="button"
            onClick={() => insertFormat("**", "**")}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
            title="Bold"
          >
            <span className="font-bold text-xs">B</span>
          </button>
          <button
            type="button"
            onClick={() => insertFormat("*", "*")}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
            title="Italic"
          >
            <span className="italic text-xs">I</span>
          </button>
          <button
            type="button"
            onClick={() => insertFormat("- ")}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
            title="List"
          >
            <span className="text-xs">List</span>
          </button>
          <button
            type="button"
            onClick={() => insertFormat("# ")}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
            title="Heading 1"
          >
            <span className="font-bold text-xs">H1</span>
          </button>
          <button
            type="button"
            onClick={() => insertFormat("## ")}
            className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
            title="Heading 2"
          >
            <span className="font-bold text-xs">H2</span>
          </button>
        </div>
        <textarea
          id={`rte-${label}`}
          className="w-full p-2 text-sm focus:outline-none min-h-[120px] resize-y rounded-b-lg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type description here... (Markdown supported)"
        />
      </div>
    </div>
  );
}
