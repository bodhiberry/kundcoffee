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
        return "border-emerald-100 text-emerald-600 bg-emerald-50";
      case "PREPARING":
        return "border-zinc-200 text-zinc-600 bg-zinc-50";
      case "READYTOPICK":
        return "border-emerald-100 text-emerald-600 bg-emerald-50";
      case "SERVED":
        return "border-blue-100 text-blue-600 bg-blue-50";
      case "COMPLETED":
        return "border-zinc-200 text-zinc-400 bg-zinc-50";
      case "CANCELLED":
        return "border-zinc-200 text-zinc-400 bg-zinc-100";
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
            @page { size: 80mm auto; margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 80mm; 
              margin: 0; 
              padding: 5mm; 
              font-size: 11px;
              color: #000;
              background: #fff;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            .footer { margin-top: 20px; font-size: 9px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="center">
            ${settings.logo ? `<img src="${settings.logo}" style="max-height: 40px; margin-bottom: 5px;" />` : ""}
            <div class="bold" style="font-size: 14px;">${settings.name || "KUND COFFEE"}</div>
            <div>${settings.address || "Kathmandu, Nepal"}</div>
            <div>Phone: ${settings.phone || ""}</div>
            <div class="bold" style="margin-top: 5px; text-transform: uppercase;">Provisional Bill</div>
          </div>
          
          <div class="divider"></div>
          
          <div style="display: flex; justify-content: space-between;">
            <span>Order: #${order.id.slice(-6).toUpperCase()}</span>
            <span>Date: ${new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Table: ${order.table?.name || "N/A"}</span>
            <span>Type: ${order.type || "DINE_IN"}</span>
          </div>
          
          <div class="divider"></div>
          
          <table>
            <thead>
              <tr style="border-bottom: 1px solid #000;">
                <th style="text-align: left; padding-bottom: 5px;">ITEM</th>
                <th style="text-align: right; padding-bottom: 5px;">AMT</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <div style="space-y: 2px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Subtotal</span>
              <span>${settings.currency} ${order.total.toFixed(2)}</span>
            </div>
            ${includeTax ? `
            <div style="display: flex; justify-content: space-between;">
              <span>VAT (13%)</span>
              <span>${settings.currency} ${taxAmount.toFixed(2)}</span>
            </div>
            ` : ""}
            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-top: 5px;" class="bold">
              <span>Grand Total</span>
              <span>${settings.currency} ${grandTotal.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            <p class="bold">THANK YOU!</p>
            <p>POWERED BY ${settings.name || "BODHIBERRY"} ERP</p>
          </div>
          
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col m-auto h-[85vh] bg-white overflow-hidden rounded-xl border border-zinc-100 printable-area">
      {/* HEADER */}
      <div className="bg-white border-b border-zinc-100 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Package size={20} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-medium text-zinc-900 tracking-tight">
                Order #{order.id.slice(-6).toUpperCase()}
              </h2>
              <span className="text-[9px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 uppercase tracking-widest">
                {order.type?.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[11px] text-zinc-600 font-bold uppercase tracking-widest">
                Table:{" "}
                <span className="text-zinc-900">
                  {order.table?.name || "Direct"}
                </span>
              </span>
              <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                <Users size={12} />
                <span className="font-bold uppercase tracking-widest">
                  Guests: {order.guests || 1}
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
              className="h-10 px-5 border-zinc-200 text-zinc-700 font-medium flex items-center gap-2 uppercase text-[10px] tracking-widest bg-white"
            >
              <Plus size={16} /> Add Items
            </Button>
          )}
          <Button
            onClick={handleInternalPrint}
            variant="secondary"
            className="h-10 px-5 border-zinc-200 text-zinc-700 font-medium flex items-center gap-2 uppercase text-[10px] tracking-widest bg-white"
          >
            <Printer size={16} /> Print Bill
          </Button>
          <div className="h-6 w-px bg-zinc-200 mx-1" />
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* DISHES LIST */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
          {order.kotRemarks && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <MessageSquare size={40} />
              </div>
              <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1 relative z-10">
                Special Instructions / KOT Remarks
              </h4>
              <p className="text-xs font-black text-rose-700 uppercase relative z-10">
                {order.kotRemarks}
              </p>
            </div>
          )}
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-zinc-200 p-5 hover:border-zinc-400 transition-all group flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-5 flex-1">
                  <Popover
                    isOpen={activeItemForPopover === item.id}
                    setIsOpen={(open) =>
                      setActiveItemForPopover(open ? item.id : null)
                    }
                    trigger={
                      <div className="w-14 h-14 bg-zinc-50 rounded-lg flex items-center justify-center overflow-hidden border border-zinc-100 cursor-pointer">
                        {item.dish?.image?.[0] ? (
                          <img
                            src={item.dish.image[0]}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <LayoutGrid size={20} className="text-zinc-300" />
                        )}
                      </div>
                    }
                    content={
                      <div className="w-60 p-2 space-y-4">
                        {/* Status Change - Disabled in History */}
                        <div className="grid grid-cols-2 gap-1">
                          {statuses.map((s) => (
                            <button
                              key={s}
                              disabled={isReadOnly}
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateItemStatus(item.id, s);
                                setActiveItemForPopover(null);
                              }}
                              className={`text-left px-3 py-1.5 text-[9px] font-medium rounded uppercase tracking-widest transition-all ${
                                (item.status || "PENDING") === s
                                  ? "bg-zinc-900 text-white shadow-sm"
                                  : isReadOnly
                                    ? "text-zinc-300 cursor-not-allowed"
                                    : "text-zinc-500 hover:bg-zinc-50"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>

                        {/* HIDE MODIFY IF READ ONLY */}
                        {!isReadOnly && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveItemForPopover(null);
                              setEditingItem(item);
                            }}
                            variant="secondary"
                            className="w-full h-9 border-zinc-200 text-zinc-700 text-[9px] uppercase tracking-widest bg-white"
                          >
                            <Edit2 size={12} className="mr-2" /> Modify Item
                          </Button>
                        )}
                      </div>
                    }
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-zinc-900 text-[13px] uppercase tracking-tight leading-none">
                        {item.dish?.name || "Dish Item"}
                      </h4>
                      <span className="text-[10px] font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">
                        x{item.quantity}
                      </span>
                    </div>
                    {item.remarks && (
                      <p className="text-[9px] text-zinc-600 uppercase italic mt-1 bg-zinc-50 px-2 py-1 rounded inline-block">
                        {item.remarks}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-8 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                      Status
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase mt-1 ${getStatusStyle(item.status || "PENDING")}`}
                    >
                      {item.status || "PENDING"}
                    </span>
                  </div>
                  <div className="min-w-[70px]">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                      Subtotal
                    </span>
                    <p className="text-sm font-bold text-zinc-900 mt-1">
                      Rs. {item.totalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SUMMARY SIDEBAR */}
        <div className="w-80 border-l border-zinc-100 p-8 flex flex-col gap-8 bg-zinc-50/30">
          <div className="space-y-6">
            <h3 className="font-medium text-zinc-400 text-[9px] uppercase tracking-[0.2em] border-b border-zinc-100 pb-4">
              Order Summary
            </h3>

            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-zinc-200 space-y-3 shadow-sm">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                  <span className="flex items-center gap-2">
                    <User size={12} /> Guests
                  </span>
                  <span className="text-zinc-900">04</span>
                </div>
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                  <span className="flex items-center gap-2 text-emerald-500">
                    <Clock size={12} /> Pending
                  </span>
                  <span className="text-emerald-600 font-black">
                    {pendingItems.length} Items
                  </span>
                </div>
              </div>

              <div className="space-y-3 px-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                    Include Tax (13%)
                  </span>
                  <button
                    disabled={isReadOnly}
                    onClick={() => setIncludeTax(!includeTax)}
                    className={`w-8 h-4 rounded-full transition-colors relative ${includeTax ? "bg-zinc-900" : "bg-zinc-300"}`}
                  >
                    <div
                      className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${includeTax ? "left-[18px]" : "left-0.5"}`}
                    />
                  </button>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-600 uppercase font-bold">
                  <span>Subtotal</span>
                  <span className="text-zinc-900">
                    Rs. {order.total.toFixed(2)}
                  </span>
                </div>
                {includeTax && (
                  <div className="flex justify-between text-[11px] text-zinc-600 uppercase font-bold">
                    <span>VAT Amount</span>
                    <span className="text-zinc-900">
                      Rs. {taxAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <div className="text-right mb-6 pr-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Grand Total
              </span>
              <p className="text-4xl font-bold text-zinc-900 leading-none mt-1">
                Rs. {grandTotal.toFixed(2)}
              </p>
            </div>

            {/* ACTION BUTTONS: HIDE IF READ ONLY */}
            {!isReadOnly ? (
              <>
                <Button
                  variant="secondary"
                  className="w-full flex items-center justify-center gap-3 font-bold text-[10px] h-12 uppercase tracking-widest bg-white"
                >
                  <CreditCard size={18} strokeWidth={1.5} /> Advance Payment
                </Button>
                <Button
                  onClick={() => onCheckout(order)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] h-12 uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 border-none"
                >
                  <CheckCircle2 size={18} /> Checkout
                </Button>
              </>
            ) : (
              <div className="w-full py-4 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col items-center gap-1 shadow-sm">
                {order.status === "COMPLETED" ? (
                  <CheckCircle2 className="text-emerald-500" size={20} />
                ) : (
                  <Ban className="text-emerald-400" size={20} />
                )}
                <span className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest">
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
