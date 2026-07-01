"use client";

import { useState } from "react";
import { Order, OrderItem, OrderStatus } from "@/lib/types";
import { Button } from "@/components/ui/Button";
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
  ArrowLeftRight,
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
  onTransfer?: (order: Order) => void;
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
  onTransfer,
}: OrderDetailViewProps) {
  const { settings } = useSettings();
  const printer = usePrinter();
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [includeTax, setIncludeTax] = useState(false);

  console.log("DEBUG onTransfer:", !!onTransfer, "isReadOnly:", order.status);
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
      case "PENDING": return "border-zinc-200 text-zinc-600 bg-zinc-50 font-bold";
      case "PREPARING": return "border-amber-300 text-amber-800 bg-amber-50 font-bold animate-pulse";
      case "READYTOPICK": return "border-zinc-950 text-white bg-zinc-950 font-black";
      case "SERVED": return "border-emerald-200 text-emerald-700 bg-emerald-50 font-bold";
      case "COMPLETED": return "border-zinc-200 text-zinc-400 bg-zinc-50 font-bold";
      case "CANCELLED": return "border-rose-200 text-rose-500 bg-rose-50 font-bold line-through";
      default: return "border-zinc-200 text-zinc-400 bg-zinc-50";
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
            <tr><td>ORDER: #${order.invoiceNumber ? String(order.invoiceNumber).padStart(3, '0') : order.id.slice(-6).toUpperCase()}</td><td class="right">${order.table?.name || "N/A"}</td></tr>
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
            window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 300); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col w-full bg-white rounded-xl overflow-hidden" style={{height: '85vh', maxHeight: '800px'}}>

      {/* ── HEADER ── */}
      <div className="shrink-0 bg-white border-b border-zinc-200 px-5 py-4 flex flex-col gap-3">

        {/* Row 1: close + order info */}
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all shrink-0">
            <X size={18} />
          </button>
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white shrink-0">
            <Package size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-black text-zinc-900 uppercase">Order #{order.invoiceNumber ? String(order.invoiceNumber).padStart(3, '0') : order.id.slice(-6).toUpperCase()}</h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 uppercase border border-zinc-200">
                {order.type?.replace("_", " ")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-zinc-500">
              <span>Table: <strong className="text-zinc-900">{order.table?.name || "Direct"}</strong></span>
              <span className="flex items-center gap-1">
                <Users size={10} />
                Guests: <strong className="text-zinc-900">{order.guests || 1}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Row 2: ALL action buttons — always on their own row, always visible */}
        <div className="flex flex-wrap gap-2">
          {order.status === "PENDING" && onDeleteOrder && (
            <button
              onClick={() => onDeleteOrder(order.id)}
              className="h-9 px-3 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all"
            >
              <Trash2 size={13} /> Delete
            </button>
          )}

          {!isReadOnly && onTransfer && (
            <button
              onClick={() => onTransfer(order)}
              className="h-9 px-3 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-blue-600 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all"
            >
              <ArrowLeftRight size={13} />
              {order.tableId ? "Transfer Table" : "Assign Table"}
            </button>
          )}

          {!isReadOnly && (
            <button
              onClick={() => onAddMore(order)}
              className="h-9 px-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all"
            >
              <Plus size={13} /> Add Items
            </button>
          )}

          <button
            onClick={handleInternalPrint}
            className="h-9 px-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all"
          >
            <Printer size={13} /> Print Bill
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">

        {/* Dishes list */}
        <div className="flex-1 p-4 sm:p-6 bg-white overflow-y-auto">
          {order.kotRemarks && (
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">Special Instructions</h4>
              <p className="text-xs font-bold text-amber-800 uppercase">{order.kotRemarks}</p>
            </div>
          )}

          <div className="space-y-3">
            {order.items.map((item) => {
              const isCancelled = (item.status || "PENDING") === "CANCELLED";
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
                    isCancelled ? "border-red-200 bg-red-50/30 opacity-70" : "border-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-11 h-11 bg-zinc-50 rounded-xl flex items-center justify-center border border-zinc-200 shrink-0 overflow-hidden">
                      {item.dish?.image?.[0] ? (
                        <img src={item.dish.image[0]} className="w-full h-full object-cover" />
                      ) : (
                        <LayoutGrid size={18} className="text-zinc-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`font-black text-sm uppercase ${isCancelled ? "line-through text-zinc-400" : "text-zinc-900"}`}>
                          {item.dish?.name || "Dish Item"}
                        </h4>
                        <span className="text-[10px] font-black text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">x{item.quantity}</span>
                        {isCancelled && <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-200 uppercase">Cancelled</span>}
                      </div>
                      {item.remarks && (
                        <p className="text-[10px] text-zinc-500 uppercase font-bold italic mt-1">{item.remarks}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-3 sm:pt-0 border-t border-zinc-100 sm:border-t-0">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-zinc-400 uppercase">Status</span>
                      {isReadOnly ? (
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg border uppercase ${getStatusStyle(item.status || "PENDING")}`}>
                          {item.status || "PENDING"}
                        </span>
                      ) : (
                        <select
                          value={item.status || "PENDING"}
                          onChange={(e) => onUpdateItemStatus(item.id, e.target.value as OrderStatus)}
                          className="border border-zinc-200 bg-white rounded-lg px-2 py-1 text-[10px] font-black uppercase text-zinc-800 outline-none"
                        >
                          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                    </div>

                    {!isReadOnly && !isCancelled && (
                      <button
                        onClick={() => setEditingItem(item)}
                        className="h-8 px-3 border border-rose-100 bg-white hover:bg-rose-50 text-rose-600 font-black text-[10px] uppercase rounded-lg flex items-center gap-1"
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    )}

                    <div className="text-right min-w-[70px]">
                      <span className="text-[9px] font-black text-zinc-400 uppercase block">Total</span>
                      <p className={`text-sm font-black ${isCancelled ? "line-through text-red-400" : "text-zinc-900"}`}>
                        {settings.currency} {item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="w-full lg:w-[320px] border-t lg:border-t-0 lg:border-l border-zinc-200 p-4 sm:p-6 flex flex-col gap-5 bg-zinc-50 overflow-y-auto shrink-0">
          <h3 className="font-black text-zinc-400 text-[10px] uppercase tracking-widest border-b border-zinc-200 pb-3">Order Summary</h3>

          <div className="bg-white p-4 rounded-xl border border-zinc-200 space-y-3">
            <div className="flex justify-between text-[10px] font-black uppercase text-zinc-400">
              <span className="flex items-center gap-2"><User size={13} /> Guests</span>
              <span className="text-zinc-900">{String(order.guests || 1).padStart(2, "0")}</span>
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase text-zinc-400">
              <span className="flex items-center gap-2 text-amber-500"><Clock size={13} /> Pending</span>
              <span className="text-zinc-900">{pendingItems.length} Items</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-zinc-400 uppercase">Include Tax (13%)</span>
              <button
                disabled={isReadOnly}
                onClick={() => setIncludeTax(!includeTax)}
                className={`w-9 h-5 rounded-full transition-colors relative ${includeTax ? "bg-zinc-900" : "bg-zinc-200"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${includeTax ? "left-[18px]" : "left-0.5"}`} />
              </button>
            </div>
            <div className="flex justify-between text-xs text-zinc-500 font-black uppercase">
              <span>Subtotal</span>
              <span className="text-zinc-900">{settings.currency} {order.total.toFixed(2)}</span>
            </div>
            {includeTax && (
              <div className="flex justify-between text-xs text-zinc-500 font-black uppercase">
                <span>VAT (13%)</span>
                <span className="text-zinc-900">{settings.currency} {taxAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-zinc-200">
            <div className="text-right mb-4">
              <span className="text-[10px] font-black text-zinc-400 uppercase block mb-1">Grand Total</span>
              <p className="text-3xl font-black text-zinc-900">{settings.currency} {grandTotal.toFixed(2)}</p>
            </div>

            {!isReadOnly ? (
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => onCheckout(order)}
                  variant="secondary"
                  className="w-full flex items-center justify-center gap-2 font-black text-xs h-12 uppercase bg-white border border-zinc-300 text-zinc-800 rounded-xl hover:bg-zinc-50"
                >
                  <CreditCard size={15} /> Checkout
                </Button>
                <Button
                  onClick={() => { toast.success("Changes saved"); onClose(); }}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs h-12 uppercase flex items-center justify-center gap-2 rounded-xl"
                >
                  <CheckCircle2 size={15} /> Save Changes
                </Button>
              </div>
            ) : (
              <div className="w-full py-4 bg-zinc-900 rounded-xl flex flex-col items-center gap-2">
                {order.status === "COMPLETED"
                  ? <CheckCircle2 className="text-white" size={20} />
                  : <Ban className="text-zinc-400" size={20} />}
                <span className="text-[10px] font-black text-white uppercase">Order {order.status}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit item modal */}
      <Modal isOpen={!!editingItem} onClose={() => setEditingItem(null)} title={editingItem?.dish?.name} size="2xl">
        {editingItem && (
          <EditOrderItemForm
            item={editingItem}
            onCancel={() => setEditingItem(null)}
            onSave={(updated) => { onEditItem(editingItem.id, updated); setEditingItem(null); }}
            onDelete={(id: string) => { if (onRemoveItem) { onRemoveItem(id); setEditingItem(null); } }}
          />
        )}
      </Modal>
    </div>
  );
}