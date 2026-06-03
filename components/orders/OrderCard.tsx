"use client";

import { Order, OrderStatus } from "@/lib/types";
import { Plus, Printer, Copy, Zap, Clock, Utensils, Edit } from "lucide-react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { usePrinter } from "@/components/providers/PrinterProvider";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface OrderCardProps {
  order: Order;
  onClick: (order: Order) => void;
  onQuickCheckout: (order: Order) => void;
  onPrint: (order: Order) => void;
  onCopy: (order: Order) => void;
  onAddItems: (order: Order) => void;
}

export function OrderCard({
  order,
  onClick,
  onQuickCheckout,
  onPrint,
  onCopy,
  onAddItems,
}: OrderCardProps) {
  const { settings } = useSettings();
  const { data: session } = useSession();
  const printer = usePrinter();

  const userRole = session?.user?.role as string | undefined;
  const userPermissions = (session?.user?.permissions as string[]) || [];
  const canEdit = userRole === "ADMIN" || userRole === "SUPERADMIN" || userPermissions.includes("edit_orders");
  const statusColors: Record<OrderStatus, string> = {
    PENDING: "border-emerald-100 text-emerald-600 bg-emerald-50",
    PREPARING: "border-zinc-200 text-zinc-600 bg-zinc-50",
    READYTOPICK: "border-emerald-100 text-emerald-600 bg-emerald-50",
    SERVED: "border-blue-100 text-blue-600 bg-blue-50",
    COMPLETED: "border-zinc-200 text-zinc-400 bg-zinc-50",
    CANCELLED: "border-zinc-200 text-zinc-400 bg-zinc-100",
  };

  const totalDishes = order.items.reduce((acc, item) => acc + item.quantity, 0);

  const handlePrintKOT = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Split items by kotType and print to the correct Bluetooth printer
    const kitchenItems = order.items.filter((i) => i.dish?.kotType === "KITCHEN");
    const barItems = order.items.filter((i) => i.dish?.kotType === "BAR");

    let bluetoothSuccess = false;
    try {
      const promises: Promise<void>[] = [];
      if (kitchenItems.length > 0) {
        promises.push(printer.printKOT(order, kitchenItems, "KITCHEN"));
      }
      if (barItems.length > 0) {
        promises.push(printer.printKOT(order, barItems, "BAR"));
      }
      // If no items matched kotType, print all items as KITCHEN
      if (kitchenItems.length === 0 && barItems.length === 0 && order.items.length > 0) {
        promises.push(printer.printKOT(order, order.items, "KITCHEN"));
      }
      if (promises.length > 0) {
        await Promise.all(promises);
        bluetoothSuccess = true;
        toast.success("KOT sent to printer");
      }
    } catch (err) {
      console.warn("Bluetooth print failed, falling back:", err);
    }

    if (bluetoothSuccess) return;

    // --- Fallback: Original window.print approach ---
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = order.items.map((item: any) => `
      <tr style="border-bottom: 0.5px dashed #999;">
        <td style="padding: 6px 0; font-size: 13px; font-weight: bold;">
          ${item.dish?.name || item.combo?.name || "Item"}
          ${item.note ? `<div style="font-size: 10px; font-weight: normal; color: #555; margin-top: 2px;">Note: ${item.note}</div>` : ""}
        </td>
        <td style="padding: 6px 0; font-size: 15px; font-weight: bold; text-align: right;">
          x${item.quantity}
        </td>
      </tr>
    `).join("");

    const orderTime = new Date(order.createdAt);
    const timeStr = orderTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateStr = orderTime.toLocaleDateString();

    printWindow.document.write(`
      <html>
        <head>
          <title>KOT - ${order.table?.name || "Direct"}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 80mm; 
              margin: 0; 
              padding: 5mm; 
              font-size: 12px;
              color: #000;
              background: #fff;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 2px dashed #000; margin: 8px 0; }
            .divider-thin { border-top: 1px dashed #999; margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 18px; letter-spacing: 3px; padding: 5px 0;">
            *** KOT ***
          </div>
          <div class="center" style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">
            Kitchen Order Ticket
          </div>
          
          <div class="divider"></div>
          
          <div style="display: flex; justify-content: space-between; font-size: 11px;">
            <span class="bold">Order: #${order.id.slice(-6).toUpperCase()}</span>
            <span>${dateStr}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 3px;">
            <span class="bold" style="font-size: 14px;">TABLE: ${order.table?.name || "N/A"}</span>
            <span class="bold">${timeStr}</span>
          </div>
          <div style="font-size: 11px; margin-top: 3px;">
            <span>Type: ${order.type?.replace("_", " ") || "DINE IN"}</span>
          </div>
          
          <div class="divider"></div>
          
          <table>
            <thead>
              <tr style="border-bottom: 1.5px solid #000;">
                <th style="text-align: left; padding-bottom: 5px; font-size: 11px; text-transform: uppercase;">Item</th>
                <th style="text-align: right; padding-bottom: 5px; font-size: 11px; text-transform: uppercase;">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <div class="center" style="font-size: 11px;">
            <span class="bold">Total Items: ${order.items.reduce((acc: number, item: any) => acc + item.quantity, 0)}</span>
          </div>
          
          <div class="divider-thin"></div>
          
          <div class="center" style="font-size: 9px; color: #666; margin-top: 5px;">
            Printed: ${new Date().toLocaleString()}
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
    <div
      className="group bg-white rounded-xl border border-zinc-200 shadow-sm hover:border-emerald-500 transition-all duration-200 cursor-pointer flex flex-col overflow-hidden animate-in fade-in-50 duration-200"
      onClick={() => onClick(order)}
    >
      {/* 1. TOP HEADER: Table Name and Meta */}
      <div className="p-5 border-b border-zinc-100 bg-white flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-zinc-900 text-sm tracking-tight uppercase truncate">
            {order.table?.name || "Direct Order"}
          </h3>
          <div
            className={`text-[8px] font-medium px-2 py-0.5 rounded-md border ${statusColors[order.status]} uppercase tracking-widest`}
          >
            {order.status}
          </div>
          <div className="flex items-center gap-1">
            {canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(order);
                }}
                className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                title="Edit Order"
              >
                <Edit size={14} />
              </button>
            )}
            <button
              onClick={handlePrintKOT}
              className="p-1.5 text-zinc-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-all"
              title="Print KOT"
            >
              <Printer size={14} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              {order.type?.replace("_", " ")}
            </span>
            <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-medium">
              <Clock size={11} />
              {new Date(order.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT: Dish Summary */}
      <div className="p-5 flex-1 space-y-2 min-h-[90px] max-h-[150px] overflow-y-auto custom-scrollbar">
        {order.items.map((item, idx) => (
          <div
            key={item.id + idx}
            className="flex items-center justify-between text-[11px] text-zinc-600 font-normal uppercase tracking-tight"
          >
            <span className="truncate flex-1">
              {item.dish?.name || item.combo?.name || "Item"}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-zinc-500">x{item.quantity}</span>
              <span className="text-zinc-900 font-medium">
                Rs. {item.unitPrice.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. TOTAL & ACTIONS */}
      <div className="px-5 pb-5 pt-2 space-y-4">
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Total Amount
          </span>
          <span className="text-lg font-bold text-zinc-900">
            Rs. {order.total.toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddItems(order);
            }}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-zinc-100 text-zinc-600 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
          >
            <Plus size={14} />
            Add More
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickCheckout(order);
            }}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-zinc-900 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-md shadow-zinc-500/20 active:scale-95 border-none"
          >
            <Zap size={14} />
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
