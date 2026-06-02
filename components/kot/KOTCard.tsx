"use client";

import { useState } from "react";
import { Order, OrderItem, OrderStatus, KOTType } from "@/lib/types";
import {
  Clock,
  ChefHat,
  Wine,
  MoreVertical,
  ArrowRightLeft,
  Download,
  Printer,
  CheckCircle2,
  X,
  Bluetooth,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Popover } from "@/components/ui/Popover";
import { usePrinter } from "@/components/providers/PrinterProvider";
import { toast } from "sonner";

interface KOTCardProps {
  order: Order;
  items: OrderItem[];
  type: KOTType;
  onUpdateStatus: (itemIds: string[], status: OrderStatus) => void;
  onMove: (order: Order) => void;
}

export function KOTCard({
  order,
  items,
  type,
  onUpdateStatus,
  onMove,
}: KOTCardProps) {
  // State to control the centered options modal
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const statuses: OrderStatus[] = [
    "PENDING",
    "PREPARING",
    "READYTOPICK",
    "SERVED",
  ];

  const printer = usePrinter();

  const handlePrint = async () => {
    setShowOptionsModal(false); // Close modal when action is clicked

    try {
      await printer.printKOT(order, items, type);
      toast.success("KOT sent to printer");
      return;
    } catch (err) {
      // Bluetooth failed or not available — fall through to window.print
      console.warn("Bluetooth print failed, falling back to browser print:", err);
    }

    // --- Fallback: Original window.print approach ---
    const WinPrint = window.open("", "_blank");
    if (!WinPrint) return;

    const content = `
      <html>
        <head>
          <title>KOT - Table ${order.table?.name || "N/A"}</title>
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
            .bold { font-weight: bold; }
            .header { margin-bottom: 10px; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; width: 100%; }
            table { width: 100%; border-collapse: collapse; margin: 5px 0; }
            td { padding: 6px 0; font-size: 12px; }
            .qty { font-weight: bold; width: 40px; font-size: 13px; }
            .item-name { font-size: 13px; font-weight: bold; }
            .remarks { font-size: 10px; font-style: italic; color: #555; padding-top: 2px; }
            .footer { margin-top: 15px; font-size: 10px; padding-bottom: 10mm; }
            
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header center">
              <div class="bold" style="font-size: 16px; border: 1px solid #000; display: inline-block; padding: 4px 12px; margin-bottom: 8px;">
                KOT: ${type}
              </div>
              <div class="bold" style="font-size: 14px; display: block; margin-top: 5px;">TABLE: ${order.table?.name || "N/A"}</div>
              <div style="font-size: 10px; margin-top: 2px;">ID: #${order.id.slice(-6).toUpperCase()}</div>
            </div>
            
            <div class="divider"></div>
            
            <table style="font-size: 10px;">
              <tr>
                <td>DATE: ${new Date().toLocaleDateString()}</td>
                <td style="text-align: right;">TIME: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            </table>
            
            <div class="divider"></div>
            
            <table>
              <thead>
                <tr style="border-bottom: 1px solid #000;">
                  <th style="text-align: left; padding: 4px 0; font-size: 11px; width: 40px;">QTY</th>
                  <th style="text-align: left; padding: 4px 0; font-size: 11px;">ITEM</th>
                </tr>
              </thead>
              <tbody>
                ${items
                  .map(
                    (item) => `
                  <tr style="border-bottom: 0.5px solid #eee;">
                    <td class="qty" style="vertical-align: top; padding: 6px 0;">${item.quantity}x</td>
                    <td style="vertical-align: top; padding: 6px 0;">
                      <div class="item-name">${item.dish?.name || item.combo?.name}</div>
                      ${
                        item.remarks
                          ? `<div class="remarks">Note: ${item.remarks}</div>`
                          : ""
                      }
                    </td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
            
            <div class="divider"></div>
            
            <div class="footer center">
              <div class="bold">*** END OF KOT ***</div>
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
    `;

    WinPrint.document.write(content);
    WinPrint.document.close();
  };

  const handleDownload = () => {
    setShowOptionsModal(false); // Close modal when action is clicked
    const text = `
KOT TICKET - ${type}
Ticket: #${order.id.slice(-6).toUpperCase()}
Table: ${order.table?.name || "N/A"}
Time: ${new Date(order.createdAt).toLocaleString()}
--------------------------------
${items
  .map(
    (i) =>
      `${i.quantity} x ${i.dish?.name || i.combo?.name}${
        i.remarks ? `\n   Note: ${i.remarks}` : ""
      }`
  )
  .join("\n")}
--------------------------------
    `;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `KOT-${order.id.slice(-4)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-rose-50 text-rose-600 border-rose-100";
      case "PREPARING":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "READYTOPICK":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "SERVED":
        return "bg-zinc-100 text-zinc-400 border-zinc-200";
      default:
        return "bg-zinc-50";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm flex flex-col group relative z-10 hover:z-40 focus-within:z-40">
      {/* UI Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-100 bg-white">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-zinc-900 text-white shadow-sm">
            {type === "BAR" ? <Wine size={16} /> : <ChefHat size={16} />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
              KOT #{order.id.slice(-6).toUpperCase()}
            </h3>
            <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">
              Table: {order.table?.name || "N/A"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold">
          <Clock size={11} />
          {new Date(order.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 p-4 space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between py-2 border-b border-zinc-50 last:border-0"
          >
            <div className="flex-1">
              <span className="text-[11px] font-bold text-zinc-800 uppercase">
                {item.quantity} x {item.dish?.name || item.combo?.name}
              </span>
              {item.remarks && (
                <p className="text-[9px] text-rose-500 font-bold mt-0.5 italic">
                  Note: {item.remarks}
                </p>
              )}
            </div>

            {/* Individual Item Status Update (Left untouched as requested) */}
            <Popover
              align="center"
              trigger={
                <button
                  className={`text-[8px] px-2 py-1 rounded border font-black uppercase transition-all hover:scale-105 ${getStatusColor(
                    item.status || "PENDING"
                  )}`}
                >
                  {item.status || "PENDING"}
                </button>
              }
              content={
                <div className="">
                  {statuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => onUpdateStatus([item.id], s)}
                      className="text-[9px] font-bold p-2 hover:bg-zinc-100 rounded text-left uppercase text-zinc-600 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              }
            />
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex gap-2">
        <Button
          onClick={() => onUpdateStatus(items.map((i) => i.id), "READYTOPICK")}
          className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-widest border-none gap-2"
        >
          <CheckCircle2 size={14} /> Ready All
        </Button>

        {/* Options Button that triggers the centered modal */}
        <Button
          variant="secondary"
          className="px-3 h-9 border-zinc-200 text-zinc-400"
          onClick={() => setShowOptionsModal(true)}
        >
          <MoreVertical size={14} />
        </Button>
      </div>

      {/* CENTERED MODAL OVERLAY FOR OPTIONS */}
      {showOptionsModal && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowOptionsModal(false)} // Close when clicking the backdrop
        >
          {/* Modal Container */}
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-zinc-200 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50">
              <h3 className="text-xs font-black text-zinc-800 uppercase tracking-widest">
                Ticket Management
              </h3>
              <button 
                onClick={() => setShowOptionsModal(false)}
                className="text-zinc-400 hover:text-zinc-700 transition-colors p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-2">
              <p className="text-[10px] font-bold text-zinc-400 uppercase px-2 pt-2 pb-1 tracking-wider">
                Update Entire KOT
              </p>
              <div className="grid grid-cols-2 gap-1 mb-2 p-1">
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      onUpdateStatus(items.map((i) => i.id), s);
                      setShowOptionsModal(false);
                    }}
                    className="text-[10px] font-bold p-3 bg-zinc-50 hover:bg-zinc-100 rounded text-center uppercase text-zinc-700 transition-colors border border-zinc-100"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="h-px bg-zinc-100 my-2 mx-2" />

              <div className="flex flex-col gap-1 p-1">
                <button
                  onClick={() => {
                    onMove(order);
                    setShowOptionsModal(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 text-[11px] font-bold hover:bg-zinc-50 rounded uppercase text-zinc-700 transition-colors"
                >
                  <ArrowRightLeft size={16} className="text-zinc-400" /> Transfer Ticket
                </button>
                
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center gap-3 p-3 text-[11px] font-bold hover:bg-zinc-50 rounded uppercase text-zinc-700 transition-colors"
                >
                  <Download size={16} className="text-zinc-400" /> Get Ticket (.txt)
                </button>

                <button
                  onClick={handlePrint}
                  className="w-full flex items-center gap-3 p-3 text-[11px] font-bold hover:bg-zinc-50 rounded uppercase text-zinc-700 transition-colors"
                >
                  <Printer size={16} className="text-zinc-400" /> Print KOT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}