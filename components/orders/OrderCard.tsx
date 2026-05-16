"use client";

import { Order, OrderStatus } from "@/lib/types";
import { Plus, Printer, Copy, Zap, Clock, Utensils } from "lucide-react";
import { useSettings } from "@/components/providers/SettingsProvider";

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
  const statusColors: Record<OrderStatus, string> = {
    PENDING: "border-emerald-100 text-emerald-600 bg-emerald-50",
    PREPARING: "border-zinc-200 text-zinc-600 bg-zinc-50",
    READYTOPICK: "border-emerald-100 text-emerald-600 bg-emerald-50",
    SERVED: "border-blue-100 text-blue-600 bg-blue-50",
    COMPLETED: "border-zinc-200 text-zinc-400 bg-zinc-50",
    CANCELLED: "border-zinc-200 text-zinc-400 bg-zinc-100",
  };

  const totalDishes = order.items.reduce((acc, item) => acc + item.quantity, 0);

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
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
          <title>Prov. Bill - ${order.table?.name || "Direct"}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { 
              font-family: Arial, Helvetica, sans-serif; 
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
            <div class="center bold" style="font-size: 14px;">${settings.name || "KUND COFFEE"}</div>
            <div class="center">${settings.address || "Kathmandu, Nepal"}</div>
            <div class="center bold" style="margin-top: 5px; text-transform: uppercase;">Provisional Bill</div>
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
          
          <div style="display: flex; justify-content: space-between; font-size: 13px;" class="bold">
            <span>TOTAL</span>
            <span>${settings.currency} ${order.total.toFixed(2)}</span>
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
    <div
      className="group bg-white rounded-xl border border-zinc-200 shadow-sm hover:border-emerald-500 transition-all duration-200 cursor-pointer flex flex-col overflow-hidden"
      // onClick={() => onClick(order)}
    >
      {/* 1. TOP HEADER: Table Name and Meta */}
      <div className="p-5 border-b border-zinc-100 bg-white flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-zinc-900 text-lg tracking-tight uppercase truncate">
            {order.table?.name || "Direct Order"}
          </h3>
          <div
            className={`text-[8px] font-medium px-2 py-0.5 rounded-md border ${statusColors[order.status]} uppercase tracking-widest`}
          >
            {order.status}
          </div>
          <button
            onClick={handlePrint}
            className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all"
            title="Print Provisional Bill"
          >
            <Printer size={14} />
          </button>
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
