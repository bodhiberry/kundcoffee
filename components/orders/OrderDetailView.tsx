"use client";

import { useState } from "react";
import { Order, OrderItem, OrderStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Popover } from "@/components/ui/Popover";
import { Modal } from "@/components/ui/Modal";
import { EditOrderItemForm } from "./edit/EditOrderItemForm";
import {
  X,
  Clock,
  User,
  Trash2,
  Plus,
  Package,
  CreditCard,
  LayoutGrid,
  CheckCircle2,
  Ban,
  Printer,
  Users,
  MessageSquare,
} from "lucide-react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { usePrinter } from "@/components/providers/PrinterProvider";
import { toast } from "sonner";

interface OrderDetailViewProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onUpdateItemStatus: (itemId: string, status: OrderStatus) => void;
  onEditItem: (itemId: string, updatedData: any) => void;
  onCheckout: (order: Order) => void;
  onAddMore: (order: Order) => void;
  onRemoveItem?: (itemId: string) => void;
  onPrint?: (order: Order) => void;
  onDeleteOrder?: (orderId: string) => void;
}

export function OrderDetailView({
  order,
  onClose,
  onUpdateStatus,
  onUpdateItemStatus,
  onEditItem,
  onCheckout,
  onAddMore,
  onRemoveItem,
  onPrint,
  onDeleteOrder,
}: OrderDetailViewProps) {
  const { settings } = useSettings();
  const printer = usePrinter();
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [includeTax, setIncludeTax] = useState(false);

  // 1. READ-ONLY LOGIC
  const isReadOnly =
    order.status === "COMPLETED" || order.status === "CANCELLED";

  const statuses: OrderStatus[] = [
    "PENDING",
    "PREPARING",
    "READYTOPICK",
    "SERVED",
    "COMPLETED",
    "CANCELLED",
  ];

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return "border-zinc-200 text-zinc-600 bg-zinc-50 font-bold";
      case "PREPARING":
        return "border-amber-300 text-amber-800 bg-amber-50 font-bold animate-pulse";
      case "READYTOPICK":
        return "border-zinc-950 text-white bg-zinc-950 font-black";
      case "SERVED":
        return "border-emerald-200 text-emerald-700 bg-emerald-50 font-bold";
      case "COMPLETED":
        return "border-zinc-200 text-zinc-400 bg-zinc-50 font-bold";
      case "CANCELLED":
        return "border-rose-200 text-rose-500 bg-rose-50 font-bold line-through";
      default:
        return "border-zinc-200 text-zinc-400 bg-zinc-50";
    }
  };

  const pendingItems = order.items.filter(
    (i) =>
      (i.status || "PENDING") !== "SERVED" &&
      (i.status || "PENDING") !== "COMPLETED" &&
      (i.status || "PENDING") !== "CANCELLED",
  );

  const taxAmount = includeTax ? order.total * 0.13 : 0;
  const grandTotal = order.total + taxAmount;

  const handleInternalPrint = async () => {
    try {
      await printer.printBill(order, settings);
      toast.success("Bill sent to printer");
      return;
    } catch (err) {
      console.warn("Bluetooth bill print failed, falling back:", err);
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = order.items
      .filter((item: any) => (item.status || "PENDING") !== "CANCELLED")
      .map((item: any) => `
      <tr style="border-bottom: 0.5px solid #eee;">
        <td style="padding: 5px 0; font-size: 11px;">
          ${item.quantity}x ${item.dish?.name || item.combo?.name || "Item"}
        </td>
        <td style="padding: 5px 0; font-size: 11px; text-align: right;">
          ${settings.currency} ${(item.quantity * item.unitPrice).toFixed(2)}
        </td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Bill - ${order.table?.name || "Direct"}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { font-family: Arial, sans-serif; padding: 5mm; font-size: 11px; margin: 0;}
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="bold" style="font-size: 15px;">${settings.name || "STORE NAME"}</div>
            <div>PROVISIONAL BILL</div>
          </div>
          <div class="divider"></div>
          <table>
            <tr><td>ORDER: #${order.id.slice(-6).toUpperCase()}</td><td class="right">${order.table?.name || "N/A"}</td></tr>
          </table>
          <div class="divider"></div>
          <table>${itemsHtml}</table>
          <div class="divider"></div>
          <table>
            <tr class="bold" style="font-size: 13px;">
              <td>TOTAL</td><td class="right">${settings.currency} ${grandTotal.toFixed(2)}</td>
            </tr>
          </table>
          <script>
            window.onload = function() { 
              setTimeout(() => { window.print(); window.close(); }, 300);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    // FIX: Full screen on mobile (100dvh), modal sizing on desktop (md:h-[85vh])
    // FIX: overflow-y-auto on mobile, overflow-hidden on desktop for split pane
    <div className="relative flex flex-col w-full h-[100dvh] md:h-[85vh] md:max-h-[800px] m-auto bg-white overflow-y-auto lg:overflow-hidden rounded-none md:rounded-xl border border-zinc-200 shadow-2xl">
      
      {/* HEADER */}
      <div className="bg-white border-b border-zinc-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20">
        
        {/* Absolute Close Button for Mobile (Top Right) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:static p-2 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 bg-zinc-50 sm:bg-transparent rounded-full sm:rounded-xl transition-all z-10"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-4 pr-10 sm:pr-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-zinc-950 rounded-xl flex items-center justify-center text-white shadow-md shadow-zinc-900/10 shrink-0">
            <Package size={20} strokeWidth={2} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight uppercase">
                Order #{order.id.slice(-6).toUpperCase()}
              </h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 uppercase tracking-widest border border-zinc-200">
                {order.type?.replace("_", " ")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-1 font-medium">
              <span className="text-xs text-zinc-500 uppercase tracking-widest">
                Table:{" "}
                <span className="text-zinc-950 font-black">
                  {order.table?.name || "Direct"}
                </span>
              </span>
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <Users size={12} strokeWidth={2.5} />
                <span className="font-bold text-zinc-500 uppercase tracking-widest">
                  Guests: <span className="text-zinc-950 font-black">{order.guests || 1}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          {order.status === "PENDING" && onDeleteOrder && (
            <Button
              onClick={() => onDeleteOrder(order.id)}
              className="flex-1 sm:flex-initial h-10 px-3 sm:px-5 border-rose-200 hover:border-rose-300 hover:bg-rose-50 text-rose-600 font-black flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest bg-white rounded-xl transition-all"
            >
              <Trash2 size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">Delete Order</span>
              <span className="sm:hidden">Delete</span>
            </Button>
          )}
          {!isReadOnly && (
            <Button
              onClick={() => onAddMore(order)}
              variant="secondary"
              className="flex-1 sm:flex-initial h-10 px-3 sm:px-5 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-black flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest bg-white rounded-xl transition-all"
            >
              <Plus size={16} strokeWidth={3} /> 
              <span className="hidden sm:inline">Add Items</span>
              <span className="sm:hidden">Add</span>
            </Button>
          )}
          <Button
            onClick={handleInternalPrint}
            variant="secondary"
            className="flex-1 sm:flex-initial h-10 px-3 sm:px-5 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-black flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest bg-white rounded-xl transition-all"
          >
            <Printer size={16} strokeWidth={2.5} /> 
            <span className="hidden sm:inline">Print Bill</span>
            <span className="sm:hidden">Print</span>
          </Button>
        </div>
      </div>

      {/* BODY: Scrolls naturally on mobile, split-pane on desktop */}
      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">
        
        {/* DISHES LIST */}
        <div className="flex-1 p-4 sm:p-6 bg-white lg:overflow-y-auto custom-scrollbar">
          {order.kotRemarks && (
            <div className="mb-6 p-4 bg-amber-50/50 border border-amber-200 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10 text-amber-600">
                <MessageSquare size={40} />
              </div>
              <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1 relative z-10">
                Special Instructions / KOT Remarks
              </h4>
              <p className="text-xs font-bold text-amber-800 uppercase relative z-10">
                {order.kotRemarks}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {order.items.map((item) => {
              const isCancelled = (item.status || "PENDING") === "CANCELLED";
              return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border p-4 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
                  isCancelled
                    ? "border-red-200 bg-red-50/30 opacity-70"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                  <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center overflow-hidden border border-zinc-200 flex-shrink-0">
                    {item.dish?.image?.[0] ? (
                      <img src={item.dish.image[0]} className="w-full h-full object-cover" />
                    ) : (
                      <LayoutGrid size={20} className="text-zinc-300" />
                    )}
                  </div>
 
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`font-black text-sm uppercase tracking-tight leading-none ${isCancelled ? "line-through text-zinc-400" : "text-zinc-900"}`}>
                        {item.dish?.name || "Dish Item"}
                      </h4>
                      <span className="text-[10px] font-black text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                        x{item.quantity}
                      </span>
                      {isCancelled && (
                        <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-200 uppercase">
                          Cancelled
                        </span>
                      )}
                    </div>
                    {item.remarks && (
                      <p className="text-[10px] text-zinc-500 uppercase font-bold italic mt-1.5 bg-zinc-50 px-2 py-1 rounded border border-zinc-200 inline-block">
                        {item.remarks}
                      </p>
                    )}
                  </div>
                </div>
 
                {/* Mobile optimization: Grid layout for actions on small screens */}
                <div className="grid grid-cols-2 sm:flex items-end sm:items-center justify-between sm:justify-end gap-3 sm:gap-6 pt-3 sm:pt-0 border-t border-zinc-100 sm:border-t-0 w-full sm:w-auto">
                  
                  {/* Status Dropdown */}
                  <div className="flex flex-col gap-1 col-span-1">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                      Status
                    </span>
                    {isReadOnly ? (
                      <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border uppercase w-max ${getStatusStyle(item.status || "PENDING")}`}>
                        {item.status || "PENDING"}
                      </span>
                    ) : (
                      <select
                        value={item.status || "PENDING"}
                        onChange={(e) => onUpdateItemStatus(item.id, e.target.value as OrderStatus)}
                        className="border border-zinc-200 bg-white rounded-xl px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-800 focus:border-zinc-950 focus:bg-zinc-50 outline-none w-full sm:w-auto"
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  </div>
 
                  <div className="flex items-center justify-end sm:justify-start gap-4 col-span-1">
                    {/* Modify Button */}
                    {!isReadOnly && !isCancelled && (
                      <div className="flex flex-col gap-1 items-end sm:items-start">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest sm:block hidden">Action</span>
                        <button
                          onClick={() => setEditingItem(item)}
                          className="h-[32px] px-3 border border-rose-100 bg-white hover:bg-rose-50 hover:border-rose-200 text-rose-600 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Trash2 size={12} strokeWidth={2.5} /> <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    )}
  
                    {/* Subtotal */}
                    <div className="text-right flex flex-col gap-1 min-w-[70px]">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        Total
                      </span>
                      <p className={`text-sm font-black h-[32px] flex items-center justify-end ${isCancelled ? "line-through text-red-400" : "text-zinc-950"}`}>
                        {settings.currency} {item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </div>

        {/* SUMMARY SIDEBAR */}
        <div className="w-full lg:w-[340px] border-t lg:border-t-0 lg:border-l border-zinc-200 p-4 sm:p-6 flex flex-col gap-6 bg-zinc-50 lg:overflow-y-auto shrink-0">
          <div className="space-y-5">
            <h3 className="font-black text-zinc-400 text-[10px] uppercase tracking-[0.2em] border-b border-zinc-200 pb-3">
              Order Summary
            </h3>

            <div className="bg-white p-4 rounded-xl border border-zinc-200 space-y-3 shadow-sm">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                <span className="flex items-center gap-2">
                  <User size={14} strokeWidth={2.5} /> Guests
                </span>
                <span className="text-zinc-950 text-xs">{String(order.guests || 1).padStart(2, "0")}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                <span className="flex items-center gap-2 text-amber-500">
                  <Clock size={14} strokeWidth={2.5} /> Pending
                </span>
                <span className="text-zinc-950 text-xs">
                  {pendingItems.length} Items
                </span>
              </div>
            </div>

            <div className="space-y-3 px-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Include Tax (13%)
                </span>
                <button
                  disabled={isReadOnly}
                  onClick={() => setIncludeTax(!includeTax)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${includeTax ? "bg-zinc-950" : "bg-zinc-200"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${includeTax ? "left-[18px]" : "left-0.5"}`} />
                </button>
              </div>
              <div className="flex justify-between text-xs text-zinc-500 uppercase font-black">
                <span>Subtotal</span>
                <span className="text-zinc-950">{settings.currency} {order.total.toFixed(2)}</span>
              </div>
              {includeTax && (
                <div className="flex justify-between text-xs text-zinc-500 uppercase font-black">
                  <span>VAT Amount</span>
                  <span className="text-zinc-950">{settings.currency} {taxAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-zinc-200 lg:border-none">
            <div className="flex items-end justify-between lg:block lg:text-right mb-5 pr-1">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">
                Grand Total
              </span>
              <p className="text-2xl sm:text-3xl font-black text-zinc-950 leading-none">
                {settings.currency} {grandTotal.toFixed(2)}
              </p>
            </div>

            {/* ACTION BUTTONS */}
            {!isReadOnly ? (
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                <Button
                  onClick={() => onCheckout(order)}
                  variant="secondary"
                  className="flex-1 flex items-center justify-center gap-2 font-black text-[10px] sm:text-xs h-12 uppercase tracking-widest bg-white border border-zinc-300 text-zinc-800 rounded-xl hover:bg-zinc-50 transition-all shadow-sm"
                >
                  <CreditCard size={16} strokeWidth={2.5} /> Checkout
                </Button>
                <Button
                  onClick={() => {
                    toast.success("Changes saved successfully");
                    onClose();
                  }}
                  className="flex-1 bg-zinc-950 hover:bg-zinc-800 text-white font-black text-[10px] sm:text-xs h-12 uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl shadow-md transition-all"
                >
                  <CheckCircle2 size={16} strokeWidth={2.5} /> Save Changes
                </Button>
              </div>
            ) : (
              <div className="w-full py-4 bg-zinc-950 rounded-xl border border-zinc-950 flex flex-col items-center gap-2 shadow-md">
                {order.status === "COMPLETED" ? (
                  <CheckCircle2 className="text-white" size={20} strokeWidth={2.5} />
                ) : (
                  <Ban className="text-zinc-400" size={20} strokeWidth={2.5} />
                )}
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  Order {order.status}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={editingItem?.dish?.name}
        size="2xl"
      >
        {editingItem && (
          <EditOrderItemForm
            item={editingItem}
            onCancel={() => setEditingItem(null)}
            onSave={(updated) => {
              onEditItem(editingItem.id, updated);
              setEditingItem(null);
            }}
            onDelete={(id: string) => {
              if (onRemoveItem) {
                onRemoveItem(id);
                setEditingItem(null);
              }
            }}
          />
        )}
      </Modal>
    </div>
  );
}