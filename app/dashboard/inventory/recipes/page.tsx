"use client";

import { useEffect, useState } from "react";
import { PageHeaderAction } from "@/components/ui/PageHeaderAction";
import { MetricCard } from "@/components/ui/MetricCard";
import { Button } from "@/components/ui/Button";
import { StockConsumptionForm } from "@/components/menu/MenuForms";
import { toast } from "sonner";
import { Utensils, Coffee, Plus, Save, ChefHat, PackageCheck, AlertCircle } from "lucide-react";

export default function RecipePage() {
  const [targetType, setTargetType] = useState<"dish" | "addon" | "combo">("dish");
  const [items, setItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [stocks, setStocks] = useState<any[]>([]);
  const [recipe, setRecipe] = useState<{ stockId: string; quantity: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch stocks & items when target type changes
  useEffect(() => {
    fetchStocks();
    fetchItems(targetType);
  }, [targetType]);

  // Fetch recipe when selected item changes
  useEffect(() => {
    if (selectedItemId) {
      fetchRecipe(targetType, selectedItemId);
    } else {
      setRecipe([]);
    }
  }, [selectedItemId, targetType]);

  const fetchStocks = async () => {
    try {
      const res = await fetch("/api/stocks");
      const data = await res.json();
      if (data.success) setStocks(data.data || []);
    } catch (e) {
      toast.error("Failed to load stock list");
    }
  };

  const fetchItems = async (type: "dish" | "addon" | "combo") => {
    setLoading(true);
    try {
      let endpoint = "/api/dishes";
      if (type === "addon") endpoint = "/api/addons";
      if (type === "combo") endpoint = "/api/combos";

      const res = await fetch(endpoint);
      const data = await res.json();
      const loadedItems = data.data || [];
      setItems(loadedItems);
      if (loadedItems.length > 0) {
        setSelectedItemId(loadedItems[0].id);
      } else {
        setSelectedItemId("");
      }
    } catch (e) {
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipe = async (type: string, id: string) => {
    try {
      const res = await fetch(`/api/recipes?type=${type}&id=${id}`);
      const data = await res.json();
      if (data.success) {
        setRecipe(
          (data.data || []).map((r: any) => ({
            stockId: r.stockId,
            quantity: r.quantity,
          })),
        );
      }
    } catch (e) {
      toast.error("Failed to load recipe details");
    }
  };

  const handleSaveRecipe = async () => {
    if (!selectedItemId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId: selectedItemId,
          ingredients: recipe.filter((r) => r.stockId && r.quantity > 0),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Recipe saved successfully!");
      } else {
        toast.error(data.message || "Failed to save recipe");
      }
    } catch (e) {
      toast.error("Failed to save recipe");
    } finally {
      setSaving(false);
    }
  };

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Calculate estimated ingredient cost
  const estimatedCost = recipe.reduce((sum, r) => {
    const stock = stocks.find((s) => s.id === r.stockId);
    return sum + (stock?.costPrice || 0) * (r.quantity || 0);
  }, 0);

  return (
    <div className="px-6 py-10 max-w-7xl mx-auto space-y-8">
      <PageHeaderAction
        title="Recipe Hub"
        description="Define ingredient quantities consumed per order to automate stock deduction"
        onSearch={setSearchQuery}
        actionButton={
          <Button
            onClick={handleSaveRecipe}
            disabled={saving || !selectedItemId}
            className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Recipe..." : "Save Recipe"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Active Menu Items"
          value={items.length}
          icon={ChefHat}
        />
        <MetricCard
          title="Ingredients in Recipe"
          value={recipe.length}
          icon={PackageCheck}
        />
        <MetricCard
          title="Est. Recipe Cost (COGS)"
          value={`Rs. ${estimatedCost.toFixed(2)}`}
          icon={AlertCircle}
        />
      </div>

      {/* Target Type Selector Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 pb-3">
        {(["dish", "addon", "combo"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setTargetType(type)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all capitalize ${
              targetType === type
                ? "bg-zinc-900 text-white shadow"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {type === "dish" ? "Dishes" : type === "addon" ? "Add-Ons" : "Combo Offers"}
          </button>
        ))}
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Item List */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
          <div className="p-4 bg-zinc-50 border-b border-zinc-200 font-bold text-xs uppercase tracking-wider text-zinc-500">
            Select {targetType}
          </div>
          <div className="overflow-y-auto divide-y divide-zinc-100 flex-1">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className={`w-full text-left px-5 py-3.5 transition-colors flex justify-between items-center ${
                  selectedItemId === item.id
                    ? "bg-amber-50/80 text-amber-900 border-l-4 border-amber-600 font-semibold"
                    : "hover:bg-zinc-50 text-zinc-700"
                }`}
              >
                <span>{item.name}</span>
                <span className="text-xs text-zinc-400 font-mono">
                  Rs. {item.price?.listedPrice || 0}
                </span>
              </button>
            ))}
            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-sm text-zinc-400">
                No items found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recipe Ingredients Form */}
        <div className="lg:col-span-8 space-y-6">
          {selectedItem ? (
            <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm space-y-6">
              <div className="flex justify-between items-start border-b border-zinc-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">
                    Recipe for {selectedItem.name}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Set quantities consumed each time this item is ordered.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-400 uppercase font-semibold">
                    Cost per portion
                  </span>
                  <div className="text-lg font-bold text-emerald-600">
                    Rs. {estimatedCost.toFixed(2)}
                  </div>
                </div>
              </div>

              <StockConsumptionForm
                stocks={stocks}
                value={recipe}
                onChange={setRecipe}
              />

              <div className="pt-4 border-t border-zinc-100 flex justify-end">
                <Button
                  onClick={handleSaveRecipe}
                  disabled={saving || !selectedItemId}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold px-6 py-3 rounded-xl shadow-md flex items-center gap-2 text-sm"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving Recipe..." : `Save Recipe for ${selectedItem.name}`}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 border border-dashed border-zinc-300 rounded-xl p-12 text-center text-zinc-400">
              Select an item on the left to edit its recipe.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
