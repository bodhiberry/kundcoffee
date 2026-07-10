"use client";

import { useEffect, useState, useMemo } from "react";
import { Category, Dish, SubMenu, Table, OrderItem, AddOn } from "@/lib/types";
import { getCategories, getDishes, getSubMenus } from "@/services/menu";
import { Popover } from "@/components/ui/Popover";
import {
  Search,
  Plus,
  Minus,
  UserPlus,
  Users,
  Printer,
  X,
  ChevronDown,
  ShoppingCart,
} from "lucide-react";
import { useSettings } from "@/components/providers/SettingsProvider";

interface CartItem extends Partial<OrderItem> {
  dish?: Dish;
  addons?: AddOn[];
}

interface TableOrderingSystemProps {
  table?: Table;
  onClose: () => void;
  onConfirm: (
    cart: CartItem[],
    guests: number,
    kotRemarks: string,
    staffId: string,
  ) => void;
  isAddingToExisting?: boolean;
  existingItems?: OrderItem[];
}

export function TableOrderingSystem({
  table,
  onClose,
  onConfirm,
  isAddingToExisting = false,
  existingItems = [],
}: TableOrderingSystemProps) {
  const { settings } = useSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [subMenus, setSubMenus] = useState<SubMenu[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [selectedSubMenuId, setSelectedSubMenuId] = useState<string>("ALL");
  const [groupByCategory, setGroupByCategory] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [guests, setGuests] = useState(1);
  const [kotRemarks, setKotRemarks] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [includeTax, setIncludeTax] = useState(
    settings.includeTaxByDefault === "true",
  );
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cData, dData, smData, staffRes] = await Promise.all([
          getCategories(),
          getDishes(),
          getSubMenus(),
          fetch("/api/staff"),
        ]);
        const staffData = await staffRes.json();
        // Filter out inactive categories (isActive controls POS visibility)
        const activeCategories = cData.filter((cat: any) => cat.isActive !== false);
        // Filter out dishes that belong to inactive categories
        const activeDishes = dData.filter((d: any) => {
          const parentCat = cData.find((c: any) => c.id === d.categoryId);
          return !parentCat || parentCat.isActive !== false;
        });
        setCategories(activeCategories);
        setDishes(activeDishes);
        setSubMenus(smData);
        if (staffData.success) setStaff(staffData.data);
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredDishes = dishes.filter((d) => {
    const matchesSearch = d.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategoryId === "ALL" || d.categoryId === selectedCategoryId;
    const matchesSubMenu =
      selectedSubMenuId === "ALL" || d.subMenuId === selectedSubMenuId;
    return matchesSearch && matchesCategory && matchesSubMenu;
  });

  const dishesByCategory = useMemo(() => {
    const groups: { category: Category; dishes: Dish[] }[] = [];
    categories.forEach((cat) => {
      const catDishes = filteredDishes.filter((d) => d.categoryId === cat.id);
      if (catDishes.length > 0) {
        groups.push({ category: cat, dishes: catDishes });
      }
    });
    // Add any dishes that are uncategorized
    const uncategorizedDishes = filteredDishes.filter(
      (d) => !categories.some((c) => c.id === d.categoryId)
    );
    if (uncategorizedDishes.length > 0) {
      groups.push({
        category: { id: "uncategorized", name: "Uncategorized", storeId: "" } as Category,
        dishes: uncategorizedDishes,
      });
    }
    return groups;
  }, [filteredDishes, categories]);

  // Existing function updated for better logic
  const addToCartDirectly = (dish: Dish) => {
    const existingIndex = cart.findIndex((item) => item.dishId === dish.id);
    if (existingIndex > -1) {
      updateCartQty(existingIndex, 1);
    } else {
      const newItem: CartItem = {
        dishId: dish.id,
        dish: dish,
        quantity: 1,
        unitPrice: dish.price?.listedPrice || 0,
        totalPrice: dish.price?.listedPrice || 0,
        remarks: "",
        addons: [],
      };
      setCart([...cart, newItem]);
    }
  };

  // NEW: Add this to handle the minus button in the grid
  const removeFromCartDirectly = (dishId: string) => {
    const existingIndex = cart.findIndex((item) => item.dishId === dishId);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity || 0;
      if (currentQty <= 1) {
        setCart(cart.filter((_, i) => i !== existingIndex));
      } else {
        updateCartQty(existingIndex, -1);
      }
    }
  };

  const updateCartQty = (index: number, delta: number) => {
    const newCart = [...cart];
    const item = newCart[index];
    item.quantity = Math.max(1, (item.quantity || 1) + delta);
    const addonsTotal = (item.addons || []).reduce(
      (sum, a) => sum + (a.price?.listedPrice || 0),
      0,
    );
    item.totalPrice = ((item.unitPrice || 0) + addonsTotal) * item.quantity;
    setCart(newCart);
  };

  const updateCartItemRemarks = (index: number, newRemarks: string) => {
    const newCart = [...cart];
    newCart[index].remarks = newRemarks;
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const totalAmount = cart.reduce(
    (acc, item) => acc + (item.totalPrice || 0),
    0,
  );
  const taxAmount = includeTax ? totalAmount * 0.13 : 0;
  const grandTotal = totalAmount + taxAmount;
  const totalQty = cart.reduce((acc, item) => acc + (item.quantity || 0), 0);

  return (
    <div
      className={`flex flex-col h-[90vh] w-full overflow-hidden rounded-2xl border border-black/5 bg-white shadow-2xl`}
    >
      {/* Top Header - Condensed & Professional */}
      <div
        className={`border-b h-10 flex items-center justify-between px-4 ${isAddingToExisting ? "bg-zinc-900 text-white" : "bg-white text-zinc-900 border-zinc-200"}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users
              size={14}
              className={isAddingToExisting ? "text-zinc-400" : "text-zinc-500"}
            />
            <div>
              <h2 className="text-xs font-bold leading-none">
                {isAddingToExisting
                  ? "Update Session"
                  : table?.id === "DIRECT"
                    ? "Online Order"
                    : `Table ${table?.name || "Order"}`}
              </h2>
            </div>
          </div>
          <div className="h-4 w-px bg-zinc-200 mx-1" />
          <Popover
            trigger={
              <button
                className={`flex items-center gap-2 px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-50 transition-all ${isAddingToExisting ? "text-zinc-300 border-zinc-700" : "text-zinc-600"}`}
              >
                <UserPlus size={12} className="opacity-70" />
                <span className="text-[10px] font-medium">Assign Staff</span>
                <ChevronDown size={10} className="opacity-50" />
              </button>
            }
            content={
              <div className="w-48 p-1 bg-white border border-zinc-200 shadow-xl rounded-md">
                <p className="px-3 py-1.5 text-[9px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 mb-1">
                  Select Staff
                </p>
                {staff.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStaffId(s.id)}
                    className={`w-full text-left px-3 py-2 text-xs rounded transition-colors ${selectedStaffId === s.id ? "bg-zinc-900 text-white" : "hover:bg-zinc-50 text-zinc-600"}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            }
          />
        </div>
        <div className="flex items-center gap-2">
          {includeTax && (
            <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Tax Incl.
            </span>
          )}
          {/* <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 rounded-md transition-all text-zinc-400 hover:text-zinc-900"
          >
            <X size={18} />
          </button> */}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Mobile/Tablet: Search Bar + Horizontal Category Scroller */}
        <div className="lg:hidden flex flex-col border-b border-zinc-200 bg-zinc-50">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search dishes..."
                className="pos-input w-full pl-8 h-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 pb-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategoryId("ALL")}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${selectedCategoryId === "ALL" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 border border-zinc-200"}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategoryId(c.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${selectedCategoryId === c.id ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 border border-zinc-200"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop: Left Column Sidebar (Search + Categories) */}
        <div className="hidden lg:flex w-48 bg-zinc-50 border-r border-zinc-200 flex-col p-3 space-y-4 overflow-hidden">
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
              size={14}
            />
            <input
              type="text"
              placeholder="Search dishes..."
              className="pos-input w-full pl-8 h-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-1">
              Menu Categories
            </label>
            <div className="flex-1 overflow-y-auto pr-1 space-y-0.5 custom-scrollbar">
              <button
                onClick={() => setSelectedCategoryId("ALL")}
                className={`w-full text-left px-3 py-1.5 rounded text-xs transition-all ${selectedCategoryId === "ALL" ? "bg-zinc-900 text-white font-medium" : "text-zinc-600 hover:bg-zinc-200/50"}`}
              >
                All Items
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategoryId(c.id)}
                  className={`w-full text-left px-3 py-1.5 rounded text-xs transition-all ${selectedCategoryId === c.id ? "bg-zinc-900 text-white font-medium" : "text-zinc-600 hover:bg-zinc-200/50"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-1 block">
              Filters
            </label>
            <div className="space-y-0.5">
              <button
                onClick={() => setSelectedSubMenuId("ALL")}
                className={`w-full text-left px-3 py-1.5 rounded text-xs transition-all ${selectedSubMenuId === "ALL" ? "bg-zinc-200 text-zinc-900 font-medium" : "text-zinc-500 hover:bg-zinc-200/50"}`}
              >
                Global
              </button>
              {subMenus.map((sm) => (
                <button
                  key={sm.id}
                  onClick={() => setSelectedSubMenuId(sm.id)}
                  className={`w-full text-left px-3 py-1.5 rounded text-xs transition-all ${selectedSubMenuId === sm.id ? "bg-zinc-200 text-zinc-900 font-medium" : "text-zinc-500 hover:bg-zinc-200/50"}`}
                >
                  {sm.name}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-1 block">
              View Option
            </label>
            <label className="flex items-center gap-2 px-3 py-1.5 rounded text-xs text-zinc-600 hover:bg-zinc-200/50 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={groupByCategory}
                onChange={(e) => setGroupByCategory(e.target.checked)}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 h-3.5 w-3.5 cursor-pointer"
              />
              <span>Group by Category</span>
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white p-3 lg:p-4 custom-scrollbar pb-24 lg:pb-4">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="bg-zinc-50 rounded border border-zinc-100 h-24 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              {/*Middle part Food Item  */}
              {groupByCategory ? (
                <div className="space-y-6">
                  {dishesByCategory.map(({ category, dishes: catDishes }) => (
                    <div key={category.id} className="space-y-3">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-zinc-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
                        <h3 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">
                          {category.name}
                        </h3>
                        <span className="text-[9px] font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full">
                          {catDishes.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
                        {catDishes.map((dish) => {
                          const cartItem = cart.find((item) => item.dishId === dish.id);
                          const qty = cartItem?.quantity || 0;

                          const getInitials = (name: string) =>
                            name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

                          return (
                            <div
                              key={dish.id}
                              className="group bg-white rounded border border-zinc-200 p-2.5 hover:border-zinc-900 transition-all flex flex-col justify-between h-32 active:scale-[0.98]"
                            >
                              {/* Top Section: Small Image + Title */}
                              <div className="flex gap-3">
                                {/* Small Fixed Image Box */}
                                <div className="w-10 h-10 shrink-0 bg-zinc-50 rounded border border-zinc-100 flex items-center justify-center overflow-hidden">
                                  {dish.image && dish.image[0] ? (
                                    <img
                                      src={dish.image[0]}
                                      alt={dish.name}
                                      className="w-full h-full object-cover grayscale-[50%] group-hover:grayscale-0 transition-all"
                                    />
                                  ) : (
                                    <span className="text-[10px] font-bold text-zinc-400">
                                      {getInitials(dish.name)}
                                    </span>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <h4 className="text-[11px] font-bold text-zinc-900 leading-tight line-clamp-2 uppercase tracking-tight">
                                    {dish.name}
                                  </h4>
                                  <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                                    Rs.{dish.price?.listedPrice ?? 0}
                                  </div>
                                </div>
                              </div>

                              {/* Bottom Section: Action Button */}
                              <div className="mt-auto">
                                <div className="h-7 w-full relative">
                                  {qty === 0 ? (
                                    <button
                                      onClick={() => addToCartDirectly(dish)}
                                      className="w-full h-full bg-white border border-zinc-200 text-zinc-600 text-[9px] font-bold rounded hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all uppercase tracking-wider"
                                    >
                                      + Add
                                    </button>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-between bg-zinc-900 text-white rounded px-1 animate-in fade-in zoom-in duration-150">
                                      <button
                                        onClick={() => removeFromCartDirectly(dish.id)}
                                        className="p-1 hover:text-zinc-400 transition-colors"
                                      >
                                        <Minus size={10} strokeWidth={3} />
                                      </button>
                                      
                                      <span className="text-[10px] font-bold font-mono">
                                        {qty}
                                      </span>
                                      
                                      <button
                                        onClick={() => addToCartDirectly(dish)}
                                        className="p-1 hover:text-zinc-400 transition-colors"
                                      >
                                        <Plus size={10} strokeWidth={3} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
                  {filteredDishes.map((dish) => {
                    const cartItem = cart.find((item) => item.dishId === dish.id);
                    const qty = cartItem?.quantity || 0;

                    const getInitials = (name: string) =>
                      name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

                    return (
                      <div
                        key={dish.id}
                        className="group bg-white rounded border border-zinc-200 p-2.5 hover:border-zinc-900 transition-all flex flex-col justify-between h-32 active:scale-[0.98]"
                      >
                        {/* Top Section: Small Image + Title */}
                        <div className="flex gap-3">
                          {/* Small Fixed Image Box */}
                          <div className="w-10 h-10 shrink-0 bg-zinc-50 rounded border border-zinc-100 flex items-center justify-center overflow-hidden">
                            {dish.image && dish.image[0] ? (
                              <img
                                src={dish.image[0]}
                                alt={dish.name}
                                className="w-full h-full object-cover grayscale-[50%] group-hover:grayscale-0 transition-all"
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-zinc-400">
                                {getInitials(dish.name)}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-[11px] font-bold text-zinc-900 leading-tight line-clamp-2 uppercase tracking-tight">
                              {dish.name}
                            </h4>
                            <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                              Rs.{dish.price?.listedPrice ?? 0}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Section: Action Button */}
                        <div className="mt-auto">
                          <div className="h-7 w-full relative">
                            {qty === 0 ? (
                              <button
                                onClick={() => addToCartDirectly(dish)}
                                className="w-full h-full bg-white border border-zinc-200 text-zinc-600 text-[9px] font-bold rounded hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all uppercase tracking-wider"
                              >
                                + Add
                              </button>
                            ) : (
                              <div className="w-full h-full flex items-center justify-between bg-zinc-900 text-white rounded px-1 animate-in fade-in zoom-in duration-150">
                                <button
                                  onClick={() => removeFromCartDirectly(dish.id)}
                                  className="p-1 hover:text-zinc-400 transition-colors"
                                >
                                  <Minus size={10} strokeWidth={3} />
                                </button>
                                
                                <span className="text-[10px] font-bold font-mono">
                                  {qty}
                                </span>
                                
                                <button
                                  onClick={() => addToCartDirectly(dish)}
                                  className="p-1 hover:text-zinc-400 transition-colors"
                                >
                                  <Plus size={10} strokeWidth={3} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredDishes.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center py-20 text-zinc-300">
                  <Search size={24} className="mb-2" />
                  <p className="text-xs">No items found</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Desktop: Right Column Cart Summary */}
        <div className="hidden lg:flex w-72 bg-zinc-50 flex-col border-l border-zinc-200">
          <div className="p-3 border-b border-zinc-200 bg-white flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-900">Active Order</h3>
            <span className="text-[10px] font-bold bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">
              {totalQty} Items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {isAddingToExisting && existingItems.length > 0 && (
              <div className="mb-3 bg-zinc-100 p-2 rounded border border-zinc-200">
                <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Current Session
                </h4>
                {existingItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between text-[10px] text-zinc-500"
                  >
                    <span className="truncate flex-1">
                      {item.quantity} × {item.dish?.name}
                    </span>
                    <span className="ml-2">{item.totalPrice?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {cart.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded border border-zinc-200 p-2 shadow-sm relative group"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-bold text-zinc-900 truncate">
                      {item.dish?.name}
                    </h4>
                    <span className="text-[10px] text-zinc-500">
                      @ {item.unitPrice?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs font-bold text-zinc-900">
                      {item.totalPrice?.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1.5 bg-zinc-50 rounded border border-zinc-200 px-1 py-0.5">
                      <button
                        onClick={() => updateCartQty(idx, -1)}
                        className="text-zinc-400 hover:text-zinc-900"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-[10px] font-bold w-3 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQty(idx, 1)}
                        className="text-zinc-400 hover:text-zinc-900"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Notes..."
                    className="flex-1 h-6 bg-zinc-50 border border-zinc-100 rounded px-1.5 text-[10px] outline-none"
                    value={item.remarks}
                    onChange={(e) => updateCartItemRemarks(idx, e.target.value)}
                  />
                  <button
                    onClick={() => removeFromCart(idx)}
                    className="text-zinc-300 hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-white border-t border-zinc-200 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="pos-label text-[10px]">Guests</label>
                <input
                  type="number"
                  min="1"
                  className="pos-input w-full h-8 text-xs"
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <label className="pos-label text-[10px]">Staff</label>
                <select
                  className="pos-input w-full h-8 text-xs"
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                >
                  <option value="">None</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <textarea
              className="pos-input w-full p-2 text-xs h-12 resize-none"
              placeholder="Order remarks (KOT)..."
              value={kotRemarks}
              onChange={(e) => setKotRemarks(e.target.value)}
            />

            <div className="pt-2 border-t border-zinc-100 flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-400">
                  GRAND TOTAL
                </span>
                <span className="text-xl font-bold text-zinc-900 leading-none">
                  Rs. {grandTotal?.toFixed(2)}
                </span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() =>
                    onConfirm(cart, guests, kotRemarks, selectedStaffId)
                  }
                  className="h-9 px-2 bg-zinc-100 text-zinc-600 rounded hover:bg-zinc-200 transition-all"
                >
                  <Printer size={16} />
                </button>
                <button
                  onClick={() =>
                    onConfirm(cart, guests, kotRemarks, selectedStaffId)
                  }
                  disabled={cart.length === 0}
                  className="h-9 px-4 bg-zinc-900 text-white text-xs font-bold rounded disabled:opacity-30 transition-all uppercase"
                >
                  {isAddingToExisting ? "Update" : "Place Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet: Floating Bottom Bar */}
      {totalQty > 0 && !isCartOpen && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-white border-t border-zinc-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full h-12 bg-zinc-900 text-white rounded-xl flex items-center justify-between px-5 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart size={18} />
                <span className="absolute -top-1.5 -right-2 bg-white text-zinc-900 text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center">
                  {totalQty}
                </span>
              </div>
              <span className="text-xs font-bold uppercase tracking-wide">
                View Cart
              </span>
            </div>
            <span className="text-sm font-bold">Rs. {grandTotal?.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Mobile/Tablet: Slide-up Cart Drawer */}
      {isCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />
          {/* Drawer */}
          <div className="relative mt-auto bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Drawer Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-zinc-300" />
            </div>
            {/* Drawer Header */}
            <div className="px-4 pb-3 pt-1 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Your Order</h3>
                <span className="text-[11px] text-zinc-500">{totalQty} items</span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-zinc-500" />
              </button>
            </div>

            {/* Drawer Body - Cart Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isAddingToExisting && existingItems.length > 0 && (
                <div className="mb-3 bg-zinc-100 p-2 rounded border border-zinc-200">
                  <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Current Session
                  </h4>
                  {existingItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-[10px] text-zinc-500"
                    >
                      <span className="truncate flex-1">
                        {item.quantity} × {item.dish?.name}
                      </span>
                      <span className="ml-2">{item.totalPrice?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {cart.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg border border-zinc-200 p-3 shadow-sm"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-zinc-900 truncate">
                        {item.dish?.name}
                      </h4>
                      <span className="text-[11px] text-zinc-500">
                        @ Rs. {item.unitPrice?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-zinc-900">
                        Rs. {item.totalPrice?.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-2 bg-zinc-50 rounded-lg border border-zinc-200 px-1.5 py-1">
                        <button
                          onClick={() => updateCartQty(idx, -1)}
                          className="text-zinc-400 hover:text-zinc-900"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-[11px] font-bold w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(idx, 1)}
                          className="text-zinc-400 hover:text-zinc-900"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Notes..."
                      className="flex-1 h-7 bg-zinc-50 border border-zinc-100 rounded px-2 text-[11px] outline-none"
                      value={item.remarks}
                      onChange={(e) => updateCartItemRemarks(idx, e.target.value)}
                    />
                    <button
                      onClick={() => removeFromCart(idx)}
                      className="text-zinc-300 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-white border-t border-zinc-200 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="pos-label text-[10px]">Guests</label>
                  <input
                    type="number"
                    min="1"
                    className="pos-input w-full h-9 text-xs"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="pos-label text-[10px]">Staff</label>
                  <select
                    className="pos-input w-full h-9 text-xs"
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                  >
                    <option value="">None</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <textarea
                className="pos-input w-full p-2 text-xs h-12 resize-none"
                placeholder="Order remarks (KOT)..."
                value={kotRemarks}
                onChange={(e) => setKotRemarks(e.target.value)}
              />

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-400">GRAND TOTAL</span>
                  <span className="text-lg font-bold text-zinc-900 leading-none">
                    Rs. {grandTotal?.toFixed(2)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      onConfirm(cart, guests, kotRemarks, selectedStaffId)
                    }
                    className="h-10 px-3 bg-zinc-100 text-zinc-600 rounded-lg hover:bg-zinc-200 transition-all"
                  >
                    <Printer size={16} />
                  </button>
                  <button
                    onClick={() =>
                      onConfirm(cart, guests, kotRemarks, selectedStaffId)
                    }
                    disabled={cart.length === 0}
                    className="h-10 px-6 bg-zinc-900 text-white text-xs font-bold rounded-lg disabled:opacity-30 transition-all uppercase"
                  >
                    {isAddingToExisting ? "Update" : "Place Order"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
