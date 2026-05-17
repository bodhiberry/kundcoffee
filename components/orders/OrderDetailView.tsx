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
  Edit2,
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

interface OrderDetailViewProps {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onUpdateItemStatus: (itemId: string, status: OrderStatus) => void;
  onEditItem: (itemId: string, updatedData: any) => void;
  onCheckout: (order: Order) => void;
  onAddMore: (order: Order) => void;
  onRemoveItem?: (itemId: string) => void; // Optional for History Views
  onPrint?: (order: Order) => void;
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
}: OrderDetailViewProps) {
  const { settings } = useSettings();
  const [activeItemForPopover, setActiveItemForPopover] = useState<
    string | null
  >(null);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [includeTax, setIncludeTax] = useState(false);

  // 1. READ-ONLY LOGIC: Determine if this is a History View
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
        return "border-zinc-300 text-zinc-800 bg-zinc-100/50 font-bold animate-pulse";
      case "READYTOPICK":
        return "border-zinc-950 text-white bg-zinc-950 font-black";
      case "SERVED":
        return "border-zinc-200 text-zinc-600 bg-zinc-50/60 font-bold";
      case "COMPLETED":
        return "border-zinc-200 text-zinc-400 bg-zinc-50 font-bold";
      case "CANCELLED":
        return "border-zinc-200 text-zinc-400 bg-zinc-100/50 font-bold line-through";
      default:
        return "border-zinc-200 text-zinc-400 bg-zinc-50";
    }
  };

  const pendingItems = order.items.filter(
    (i) =>
      (i.status || "PENDING") !== "SERVED" &&
      (i.status || "PENDING") !== "COMPLETED",
  );

  const taxAmount = includeTax ? order.total * 0.13 : 0;
  const grandTotal = order.total + taxAmount;

  const handleInternalPrint = () => {
    // If a custom onPrint is provided and we want to use it, we can.
    // But we'll implement a robust default here.
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = order.items.map((item: any) => `
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
            @page { 
              size: 80mm auto; 
              margin: 0; 
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
            }
            html, body {
              margin: 0;
              padding: 0;
              width: 80mm;
              background: #fff;
            }
            body { 
              font-family: Arial, Helvetica, sans-serif; 
              padding: 5mm; 
              font-size: 11px;
              color: #000;
              line-height: 1.4;
            }
            .receipt-container {
              width: 100%;
              overflow: hidden;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .header { margin-bottom: 10px; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; width: 100%; }
            table { width: 100%; border-collapse: collapse; margin: 5px 0; }
            .footer { margin-top: 15px; font-size: 10px; padding-bottom: 10mm; }
            .logo { max-height: 50px; margin-bottom: 8px; filter: grayscale(1); }
            
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header center">
              ${settings.logo ? `<img src="${settings.logo}" class="logo" />` : ""}
              <div class="bold" style="font-size: 15px;">${settings.name || "KUND COFFEE"}</div>
              <div style="font-size: 10px;">${settings.address || ""}</div>
              <div style="font-size: 10px;">Tel: ${settings.phone || ""}</div>
              <div class="bold" style="margin-top: 10px; font-size: 12px; border: 1px solid #000; display: inline-block; padding: 2px 8px;">
                PROVISIONAL BILL
              </div>
            </div>
            
            <div class="divider"></div>
            
            <table style="font-size: 10px;">
              <tr>
                <td>ORDER: <span class="bold">#${order.id.slice(-6).toUpperCase()}</span></td>
                <td class="right">DATE: ${new Date(order.createdAt).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td>TABLE: <span class="bold">${order.table?.name || "N/A"}</span></td>
                <td class="right">TYPE: ${order.type || "DINE_IN"}</td>
              </tr>
            </table>
            
            <div class="divider"></div>
            
            <table>
              <thead>
                <tr style="border-bottom: 1px solid #000;">
                  <th style="text-align: left; padding: 4px 0;">ITEM</th>
                  <th style="text-align: right; padding: 4px 0;">AMT</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div class="divider"></div>
            
            <table style="font-size: 11px;">
              <tr>
                <td>Subtotal</td>
                <td class="right">${settings.currency} ${order.total.toFixed(2)}</td>
              </tr>
              ${includeTax ? `
              <tr>
                <td>VAT (13%)</td>
                <td class="right">${settings.currency} ${taxAmount.toFixed(2)}</td>
              </tr>
              ` : ""}
              <tr class="bold" style="font-size: 13px;">
                <td style="padding-top: 5px;">GRAND TOTAL</td>
                <td class="right" style="padding-top: 5px;">${settings.currency} ${grandTotal.toFixed(2)}</td>
              </tr>
            </table>
            
            <div class="divider"></div>
            
            <div class="footer center">
              <div class="bold">THANK YOU!</div>
              <div style="font-size: 9px; margin-top: 4px;">POWERED BY ${settings.name || "KUND COFFEE"} ERP</div>
              <div style="font-size: 8px;">${new Date().toLocaleString()}</div>
            </div>
          </div>
          
          <script>
            window.onload = function() { 
              setTimeout(() => {
                window.print(); 
                window.close(); 
              }, 300);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col m-auto h-[85vh] bg-white overflow-hidden rounded-xl border border-zinc-200 printable-area shadow-2xl">
      {/* HEADER */}
      <div className="bg-white border-b border-zinc-200 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-zinc-950 rounded-xl flex items-center justify-center text-white shadow-md shadow-zinc-900/10">
            <Package size={20} strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black text-zinc-900 tracking-tight uppercase">
                Order #{order.id.slice(-6).toUpperCase()}
              </h2>
              <span className="text-[9px] font-black px-2.5 py-1 rounded bg-zinc-100 text-zinc-800 uppercase tracking-widest border border-zinc-200">
                {order.type?.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1.5">
              <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">
                Table:{" "}
                <span className="text-zinc-950 font-black">
                  {order.table?.name || "Direct"}
                </span>
              </span>
              <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                <Users size={12} strokeWidth={2.5} />
                <span className="font-bold text-zinc-500 uppercase tracking-widest">
                  Guests: <span className="text-zinc-950 font-black">{order.guests || 1}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* HIDE ADD ITEMS IF READ ONLY */}
          {!isReadOnly && (
            <Button
              onClick={() => onAddMore(order)}
              variant="secondary"
              className="h-10 px-5 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-black flex items-center gap-2 uppercase text-[9px] tracking-widest bg-white rounded-xl transition-all"
            >
              <Plus size={14} strokeWidth={3} /> Add Items
            </Button>
          )}
          <Button
            onClick={handleInternalPrint}
            variant="secondary"
            className="h-10 px-5 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-black flex items-center gap-2 uppercase text-[9px] tracking-widest bg-white rounded-xl transition-all"
          >
            <Printer size={14} strokeWidth={2.5} /> Print Bill
          </Button>
          <div className="h-6 w-px bg-zinc-200 mx-1" />
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-50 rounded-xl transition-all"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* DISHES LIST */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
          {order.kotRemarks && (
            <div className="mb-6 p-4 bg-zinc-50 border border-zinc-200 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-[0.03] text-zinc-900">
                <MessageSquare size={40} />
              </div>
              <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest mb-1 relative z-10">
                Special Instructions / KOT Remarks
              </h4>
              <p className="text-xs font-bold text-zinc-600 uppercase relative z-10">
                {order.kotRemarks}
              </p>
            </div>
          )}
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-zinc-200 p-5 hover:border-zinc-950 transition-all group flex items-center justify-between gap-6 shadow-sm"
              >
                <div className="flex items-center gap-5 flex-1">
                  <div className="w-14 h-14 bg-zinc-50 rounded-xl flex items-center justify-center overflow-hidden border border-zinc-200 flex-shrink-0">
                    {item.dish?.image?.[0] ? (
                      <img
                        src={item.dish.image[0]}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <LayoutGrid size={20} className="text-zinc-300" />
                    )}
                  </div>
 
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h4 className="font-black text-zinc-900 text-[13px] uppercase tracking-tight leading-none">
                        {item.dish?.name || "Dish Item"}
                      </h4>
                      <span className="text-[10px] font-black text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                        x{item.quantity}
                      </span>
                    </div>
                    {item.remarks && (
                      <p className="text-[9px] text-zinc-500 uppercase font-black italic mt-1.5 bg-zinc-50 px-2 py-1 rounded border border-zinc-100 inline-block">
                        {item.remarks}
                      </p>
                    )}
                  </div>
                </div>
 
                <div className="flex items-center gap-6">
                  {/* Status Dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block ml-0.5">
                      Status
                    </span>
                    {isReadOnly ? (
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase ${getStatusStyle(item.status || "PENDING")}`}
                      >
                        {item.status || "PENDING"}
                      </span>
                    ) : (
                      <select
                        value={item.status || "PENDING"}
                        onChange={(e) => onUpdateItemStatus(item.id, e.target.value as OrderStatus)}
                        className="border border-zinc-200 bg-white rounded-xl px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-800 focus:border-zinc-950 focus:bg-zinc-50 outline-none cursor-pointer hover:border-zinc-300 transition-all"
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Modify Button */}
                  {!isReadOnly && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block ml-0.5">
                        Action
                      </span>
                      <button
                        onClick={() => setEditingItem(item)}
                        className="h-[30px] px-3.5 border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-800 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Edit2 size={10} strokeWidth={2.5} /> Modify
                      </button>
                    </div>
                  )}

                  {/* Subtotal */}
                  <div className="min-w-[80px] text-right flex flex-col gap-1.5">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                      Subtotal
                    </span>
                    <p className="text-sm font-black text-zinc-950 h-[30px] flex items-center justify-end">
                      {settings.currency} {item.totalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SUMMARY SIDEBAR */}
        <div className="w-80 border-l border-zinc-200 p-8 flex flex-col gap-8 bg-zinc-50/50">
          <div className="space-y-6">
            <h3 className="font-black text-zinc-400 text-[9px] uppercase tracking-[0.2em] border-b border-zinc-200 pb-4">
              Order Summary
            </h3>

            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-zinc-200 space-y-3.5 shadow-sm">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-400">
                  <span className="flex items-center gap-2">
                    <User size={12} strokeWidth={2.5} /> Guests
                  </span>
                  <span className="text-zinc-950 font-black">{String(order.guests || 1).padStart(2, "0")}</span>
                </div>
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-400">
                  <span className="flex items-center gap-2 text-zinc-500">
                    <Clock size={12} strokeWidth={2.5} /> Pending
                  </span>
                  <span className="text-zinc-950 font-black">
                    {pendingItems.length} Items
                  </span>
                </div>
              </div>

              <div className="space-y-3 px-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                    Include Tax (13%)
                  </span>
                  <button
                    disabled={isReadOnly}
                    onClick={() => setIncludeTax(!includeTax)}
                    className={`w-8 h-4 rounded-full transition-colors relative ${includeTax ? "bg-zinc-950" : "bg-zinc-200"}`}
                  >
                    <div
                      className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${includeTax ? "left-[18px]" : "left-0.5"}`}
                    />
                  </button>
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-black">
                  <span>Subtotal</span>
                  <span className="text-zinc-950">
                    {settings.currency} {order.total.toFixed(2)}
                  </span>
                </div>
                {includeTax && (
                  <div className="flex justify-between text-[10px] text-zinc-500 uppercase font-black">
                    <span>VAT Amount</span>
                    <span className="text-zinc-950 font-black">
                      {settings.currency} {taxAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <div className="text-right mb-6 pr-1">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Grand Total
              </span>
              <p className="text-3xl font-black text-zinc-950 leading-none mt-2">
                {settings.currency} {grandTotal.toFixed(2)}
              </p>
            </div>

            {/* ACTION BUTTONS: HIDE IF READ ONLY */}
            {!isReadOnly ? (
              <>
                <Button
                  variant="secondary"
                  className="w-full flex items-center justify-center gap-3 font-black text-[9px] h-12 uppercase tracking-widest bg-white border border-zinc-200 text-zinc-800 rounded-xl hover:bg-zinc-50 hover:border-zinc-300 transition-all"
                >
                  <CreditCard size={16} strokeWidth={2.5} /> Advance Payment
                </Button>
                <Button
                  onClick={() => onCheckout(order)}
                  className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-black text-[9px] h-12 uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-zinc-200/50 border-none transition-all"
                >
                  <CheckCircle2 size={16} strokeWidth={2.5} /> Checkout
                </Button>
              </>
            ) : (
              <div className="w-full py-4 bg-zinc-950 rounded-xl border border-zinc-950 flex flex-col items-center gap-2 shadow-lg shadow-zinc-200/50">
                {order.status === "COMPLETED" ? (
                  <CheckCircle2 className="text-white" size={20} strokeWidth={2.5} />
                ) : (
                  <Ban className="text-zinc-400" size={20} strokeWidth={2.5} />
                )}
                <span className="text-[9px] font-black text-white uppercase tracking-widest">
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
            // SAFE CALLING: Use optional chaining or existence check
            onDelete={(id: string) => {
              if (onRemoveItem) {
                onRemoveItem(id);
                setEditingItem(null);
              }
            }}
          />
        )}
      </Modal>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area,
          .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            height: auto !important;
            border: none !important;
            margin: 0 !important;
            padding: 5mm !important;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
          .no-print,
          [role="button"],
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
