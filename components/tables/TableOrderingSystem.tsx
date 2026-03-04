"use client";

import { useEffect, useState } from "react";
import { Category, Dish, SubMenu, Table, OrderItem, AddOn } from "@/lib/types";
import {
  getCategories,
  getDishes,
  getSubMenus,
  getAddOns,
} from "@/services/menu";
import { Button } from "@/components/ui/Button";
import { Popover } from "@/components/ui/Popover";
import {
  Search,
  Plus,
  Minus,
  UserPlus,
  Users,
  MessageSquare,
  Printer,
  Filter,
  LayoutGrid,
  X,
  PlusCircle,
  ChevronDown,
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
  const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [selectedSubMenuId, setSelectedSubMenuId] = useState<string>("ALL");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [guests, setGuests] = useState(1);
  const [kotRemarks, setKotRemarks] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [includeTax, setIncludeTax] = useState(
    settings.includeTaxByDefault === "true",
  );

  useEffect(() => {
    const fetchData = async () => {
      const [cData, dData, smData, aData, staffRes] = await Promise.all([
        getCategories(),
        getDishes(),
        getSubMenus(),
        getAddOns(),
        fetch("/api/staff"),
      ]);
      const staffData = await staffRes.json();
      setCategories(cData);
      setDishes(dData);
      setSubMenus(smData);
      setAvailableAddOns(aData);
      if (staffData.success) setStaff(staffData.data);
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

  const addToCartDirectly = (dish: Dish) => {
    const newItem: CartItem = {
      dishId: dish.id,
      dish: dish,
      quantity: 1,
      unitPrice: dish.price?.listedPrice || 0,
      totalPrice: dish.price?.listedPrice || 0,
      remarks: "",
      addons: [],
    };

    // Check if item already in cart (without addons/remarks) to increment qty instead
    const existingIndex = cart.findIndex(
      (item) =>
        item.dishId === dish.id &&
        (!item.addons || item.addons.length === 0) &&
        !item.remarks,
    );

    if (existingIndex > -1) {
      updateCartQty(existingIndex, 1);
    } else {
      setCart([...cart, newItem]);
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
      className={`flex flex-col h-[85vh] w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50`}
    >
      {/* Top Header */}
      <div
        className={`border-b p-4 flex items-center justify-between shadow-sm px-8 ${isAddingToExisting ? "bg-zinc-900 text-white" : "bg-white text-zinc-900 border-zinc-100"}`}
      >
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
              <Users size={18} />
            </div>
            <div>
              <h2
                className={`text-sm font-black leading-tight uppercase tracking-widest ${isAddingToExisting ? "text-white" : "text-zinc-900"}`}
              >
                {isAddingToExisting
                  ? "Updating Ongoing Order"
                  : table?.id === "DIRECT"
                    ? "Direct Order"
                    : `Table: ${table?.name || "Order"}`}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p
                  className={`text-[9px] font-bold uppercase tracking-widest ${isAddingToExisting ? "text-zinc-400" : "text-zinc-500"}`}
                >
                  {isAddingToExisting
                    ? `Table ${table?.name || ""} • Ongoing Session`
                    : table?.tableType?.name || "Standard Order"}
                </p>
                {isAddingToExisting && (
                  <span className="text-[9px] bg-white text-zinc-900 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>
          <div
            className={`h-6 w-px ${isAddingToExisting ? "bg-zinc-800" : "bg-zinc-200"}`}
          />
          <Popover
            trigger={
              <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-lg border border-zinc-200 hover:border-zinc-400 transition-all group">
                <UserPlus
                  size={12}
                  className="text-zinc-400 group-hover:text-zinc-900"
                />
                <span className="text-[9px] font-medium text-zinc-600 uppercase tracking-widest">
                  Staff
                </span>
                <ChevronDown size={10} className="text-zinc-500" />
              </button>
            }
            content={
              <div className="w-44 py-1">
                {["Waiter John", "Waiter Alex", "Waiter Sarah"].map((staff) => (
                  <button
                    key={staff}
                    className="w-full text-left px-4 py-2 text-[10px] font-medium text-zinc-700 hover:bg-zinc-50 transition-colors uppercase tracking-tight"
                  >
                    {staff}
                  </button>
                ))}
              </div>
            }
          />
        </div>
        <button
          onClick={onClose}
          className={`p-2 transition-all ${isAddingToExisting ? "text-zinc-400 hover:text-white" : "text-zinc-400 hover:text-zinc-900"}`}
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Sidebar (Search + Categories) */}
        <div className="w-72 bg-white border-r border-zinc-100 flex flex-col p-6 space-y-8 overflow-hidden">
          {/* Search Section */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-1">
              Search Dishes
            </label>
            <div className="relative group">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:border-zinc-900 focus:bg-white transition-all font-medium placeholder:text-zinc-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Categories Section */}
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
                Categories
              </label>
              <Popover
                trigger={
                  <button className="text-zinc-400 hover:text-zinc-900 transition-colors">
                    <Filter size={14} />
                  </button>
                }
                content={
                  <div className="w-56 p-1">
                    <p className="px-3 py-2 text-[8px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 mb-1">
                      Filter by Sub-Menu
                    </p>
                    <button
                      onClick={() => setSelectedSubMenuId("ALL")}
                      className={`w-full text-left px-3 py-2 text-[9px] font-medium rounded mb-0.5 transition-all uppercase ${selectedSubMenuId === "ALL" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50"}`}
                    >
                      All Sub-Menus
                    </button>
                    {subMenus.map((sm) => (
                      <button
                        key={sm.id}
                        onClick={() => setSelectedSubMenuId(sm.id)}
                        className={`w-full text-left px-3 py-2 text-[9px] font-medium rounded mb-0.5 transition-all uppercase ${selectedSubMenuId === sm.id ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-50"}`}
                      >
                        {sm.name}
                      </button>
                    ))}
                  </div>
                }
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1.5">
              <button
                onClick={() => setSelectedCategoryId("ALL")}
                className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${selectedCategoryId === "ALL" ? "bg-zinc-900 text-white border-zinc-900 shadow-lg shadow-zinc-900/10" : "bg-zinc-50 text-zinc-500 border-zinc-100 hover:border-zinc-200"}`}
              >
                All Items
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategoryId(c.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${selectedCategoryId === c.id ? "bg-zinc-900 text-white border-zinc-900 shadow-lg shadow-zinc-900/10" : "bg-zinc-50 text-zinc-500 border-zinc-100 hover:border-zinc-200"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white p-4 custom-scrollbar">
          {/* Increased grid columns to make items smaller */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {filteredDishes.map((dish) => (
              <div
                key={dish.id}
                onClick={() => addToCartDirectly(dish)}
                className="group bg-white border border-zinc-100 rounded-xl shadow-sm hover:shadow-md hover:border-zinc-900 transition-all cursor-pointer aspect-square flex flex-col p-2 overflow-hidden"
              >
                {/* 1. Image (Small & Square) */}
                <div className="relative flex-2 rounded-lg bg-zinc-50 overflow-hidden mb-1.5">
                  {dish.image?.[0] ? (
                    <img
                      src={dish.image[0]}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-200">
                      <LayoutGrid size={50} />
                    </div>
                  )}
                </div>

                {/* 2. Content Stack */}
                <div className="flex flex-col gap-0.5">
                  {/* Name - Truncated to 1 line */}
                  <h4 className="text-[10px] font-bold text-zinc-900 uppercase truncate leading-tight">
                    {dish.name}
                  </h4>

                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-900">
                      ₹{dish.price?.listedPrice ?? 0}
                    </span>
                  </div>

                  {/* 3. Small Add Button */}
                  <button className="w-full mt-1 bg-zinc-900 text-white text-[8px] font-bold uppercase py-1.5 rounded-md flex items-center justify-center gap-1 hover:bg-black transition-colors">
                    <Plus size={10} strokeWidth={4} />
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredDishes.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center py-20 opacity-20">
              <Search size={32} className="text-zinc-400 mb-2" />
              <p className="text-[9px] font-bold uppercase tracking-widest">
                No items
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Cart Summary */}
        <div className="w-[400px] bg-zinc-50/50 flex flex-col border-l border-zinc-100 shadow-sm z-10">
          <div
            className={`p-6 border-b flex items-center justify-between sticky top-0 backdrop-blur-sm z-20 ${isAddingToExisting ? "bg-zinc-100 text-zinc-900 border-zinc-200" : "bg-white/50 border-zinc-100"}`}
          >
            <div>
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                {isAddingToExisting ? "Updating Session" : "Active Selection"}
              </h3>
              <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-widest mt-0.5">
                {totalQty} Items in Cart
              </p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-[9px] font-bold text-zinc-400 hover:text-red-500 uppercase tracking-widest transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {isAddingToExisting && existingItems.length > 0 && (
              <div className="mb-6 space-y-3">
                <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">
                  Already in Order
                </h4>
                <div className="space-y-2 opacity-60">
                  {existingItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-[10px] bg-zinc-100/50 p-2.5 rounded-xl border border-zinc-200/50"
                    >
                      <span className="font-medium text-zinc-900">
                        {item.quantity} x{" "}
                        {item.dish?.name || item.combo?.name || "Item"}
                      </span>
                      <span className="text-zinc-600 font-bold">
                        Rs. {(item.totalPrice ?? 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-zinc-200 mx-1" />
              </div>
            )}

            {cart.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm group relative"
              >
                <div className="flex justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[12px] font-bold text-zinc-900 leading-tight truncate uppercase tracking-tight">
                      {item.dish?.name}
                    </h4>
                    <span className="text-[10px] text-zinc-400 font-bold">
                      Rs. {(item.unitPrice ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-[12px] font-black text-zinc-900">
                      Rs. {(item.totalPrice ?? 0).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-3 bg-zinc-50 rounded-lg p-1 border border-zinc-100">
                      <button
                        onClick={() => updateCartQty(idx, -1)}
                        className="p-1 text-zinc-400 hover:text-zinc-900 transition-colors"
                      >
                        <Minus size={10} strokeWidth={3} />
                      </button>
                      <span className="text-[10px] font-black w-4 text-center text-zinc-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQty(idx, 1)}
                        className="p-1 text-zinc-400 hover:text-zinc-900 transition-colors"
                      >
                        <Plus size={10} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Short note..."
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-lg px-2.5 py-1.5 text-[9px] font-medium uppercase outline-none focus:bg-white focus:border-zinc-900 transition-all text-zinc-600 placeholder:text-zinc-300"
                    value={item.remarks}
                    onChange={(e) => updateCartItemRemarks(idx, e.target.value)}
                  />
                  <button
                    onClick={() => removeFromCart(idx)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-zinc-900 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg flex items-center justify-center scale-90"
                  >
                    <X size={10} strokeWidth={3} />
                  </button>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center py-20 opacity-20">
                <LayoutGrid size={48} className="text-zinc-400 mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
                  No items selected
                </p>
              </div>
            )}
          </div>

          <div className="p-8 bg-white border-t border-zinc-100 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">
                  Guests
                </label>
                <div className="relative">
                  <Users
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <input
                    type="number"
                    min="1"
                    className="w-full pl-10 pr-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:border-zinc-900 transition-all font-bold text-zinc-900"
                    value={guests}
                    max={table?.capacity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setGuests(isNaN(val) ? 1 : val);
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "") setGuests(1);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-1">
                  Server / Staff
                </label>
                <div className="relative">
                  <Users
                    size={14}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                  />
                  <select
                    className="w-full pl-10 pr-3 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:border-zinc-900 transition-all font-bold text-zinc-900 appearance-none"
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                  >
                    <option value="">Select Staff</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 space-y-4">
              <div className="flex justify-between items-end px-1">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] block mb-1">
                    Grand Total
                  </span>
                  <p className="text-[10px] font-medium text-zinc-400 uppercase">
                    Inc. Tax 13%: Rs. {(taxAmount ?? 0).toFixed(2)}
                  </p>
                </div>
                <span className="text-4xl font-black text-zinc-900 leading-none tracking-tighter">
                  Rs. {(grandTotal ?? 0).toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  className="h-14 border border-zinc-200 text-zinc-500 rounded-2xl hover:bg-zinc-50 transition-colors"
                  onClick={() =>
                    onConfirm(cart, guests, kotRemarks, selectedStaffId)
                  }
                >
                  <Printer size={18} />
                </Button>
                <Button
                  onClick={() =>
                    onConfirm(cart, guests, kotRemarks, selectedStaffId)
                  }
                  disabled={cart.length === 0}
                  className={`h-14 text-white font-black text-[10px] uppercase tracking-widest border-none rounded-2xl shadow-xl transition-all active:scale-95 bg-zinc-900 hover:bg-zinc-800 shadow-zinc-900/10 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isAddingToExisting ? "Update Order" : "Send KOT"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
