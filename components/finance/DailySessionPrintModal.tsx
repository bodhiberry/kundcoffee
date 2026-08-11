"use client";

import React, { useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Printer, X, FileText, CheckCircle2, TrendingUp, ShoppingBag, Banknote, CreditCard, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { useSettings } from "@/components/providers/SettingsProvider";

interface DailySessionPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: any;
}

export function DailySessionPrintModal({
  isOpen,
  onClose,
  sessionData,
}: DailySessionPrintModalProps) {
  const { settings } = useSettings();
  const printRef = useRef<HTMLDivElement>(null);

  if (!sessionData) return null;

  const currency = settings?.currency || "NPR";
  const storeName = settings?.name || "KUND COFFEE";
  const storeAddress = settings?.address || "";
  const storePhone = settings?.phone || "";

  // Extract financial data safely
  const openingBalance = parseFloat(sessionData.openingBalance || 0);
  const actualClosingBalance = parseFloat(sessionData.actualClosingBalance || 0);
  const expectedClosingBalance = parseFloat(sessionData.expectedClosingBalance || 0);
  const difference = parseFloat(sessionData.difference || 0);

  const cashSales = parseFloat(sessionData.currentCashSales || 0);
  const digitalSales = parseFloat(sessionData.currentDigitalSales || 0);
  const creditSales = parseFloat(sessionData.currentCreditSales || 0);
  const totalRevenue = parseFloat(sessionData.totalRevenue || 0);

  const cashOutflow = parseFloat(sessionData.currentCashOutflow || 0);
  const digitalOutflow = parseFloat(sessionData.currentDigitalOutflow || 0);
  const creditOutflow = parseFloat(sessionData.currentCreditOutflow || 0);
  const totalPurchases = parseFloat(sessionData.totalPurchases || 0);

  const openedAt = sessionData.openedAt ? new Date(sessionData.openedAt).toLocaleString() : "N/A";
  const closedAt = sessionData.closedAt ? new Date(sessionData.closedAt).toLocaleString() : new Date().toLocaleString();
  const openedByName = sessionData.openedBy?.name || "Staff";
  const closedByName = sessionData.closedBy?.name || openedByName;

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;

    const winPrint = window.open("", "_blank", "width=800,height=900");
    if (!winPrint) return;

    winPrint.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daily Session Summary - #${sessionData.id?.substring(0, 8)}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 78mm;
              margin: 0 auto;
              padding: 10px;
              color: #000;
              font-size: 11px;
              line-height: 1.3;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
            .border-top { border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; }
            .double-border-bottom { border-bottom: 3px double #000; padding-bottom: 6px; margin-bottom: 6px; }
            .flex { display: flex; justify-content: space-between; }
            .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
            .section-title { font-size: 11px; font-weight: bold; margin-top: 8px; margin-bottom: 4px; text-transform: uppercase; }
            .small { font-size: 9px; }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    winPrint.document.close();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" noPadding>
      <div className="flex flex-col h-full max-h-[90vh] bg-white rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Daily Session Summary Report
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono">
                Session #{sessionData.id?.substring(0, 8)} • Status: {sessionData.status}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/50">
          <div className="max-w-md mx-auto bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
            
            {/* Printable Thermal Receipt HTML structure */}
            <div ref={printRef} className="space-y-4 text-xs font-mono text-zinc-800">
              
              {/* Store Header */}
              <div className="text-center border-b border-dashed border-zinc-300 pb-3">
                <h2 className="text-base font-black uppercase text-zinc-900 tracking-tight">{storeName}</h2>
                {storeAddress && <p className="text-[11px] text-zinc-600">{storeAddress}</p>}
                {storePhone && <p className="text-[11px] text-zinc-600">Tel: {storePhone}</p>}
                <div className="mt-2 pt-2 border-t border-dotted border-zinc-200">
                  <p className="font-bold uppercase text-[12px] tracking-wider text-zinc-900">DAILY SESSION REPORT</p>
                  <p className="text-[10px] text-zinc-500 font-mono">Session #{sessionData.id?.substring(0, 8)}</p>
                </div>
              </div>

              {/* Session Meta */}
              <div className="space-y-1 border-b border-dashed border-zinc-300 pb-3 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Opened:</span>
                  <span className="font-semibold">{openedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Closed:</span>
                  <span className="font-semibold">{closedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Opened By:</span>
                  <span className="font-semibold">{openedByName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Closed By:</span>
                  <span className="font-semibold">{closedByName}</span>
                </div>
              </div>

              {/* Cash Drawer & Reconciliation */}
              <div className="border-b border-dashed border-zinc-300 pb-3 space-y-1.5">
                <p className="font-bold text-[11px] uppercase tracking-wider text-zinc-900 mb-1">
                  CASH DRAWER RECONCILIATION
                </p>
                <div className="flex justify-between">
                  <span>Opening Cash:</span>
                  <span className="font-semibold">{currency} {openingBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Sales (+):</span>
                  <span className="font-semibold text-emerald-600">+{currency} {cashSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Purchases (-):</span>
                  <span className="font-semibold text-rose-600">-{currency} {cashOutflow.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-dotted border-zinc-200 font-bold">
                  <span>Expected Drawer Cash:</span>
                  <span>{currency} {expectedClosingBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Actual Drawer Cash:</span>
                  <span>{currency} {actualClosingBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-dotted border-zinc-200">
                  <span>Difference:</span>
                  <span className={difference === 0 ? "text-emerald-600" : difference > 0 ? "text-blue-600" : "text-rose-600"}>
                    {difference > 0 ? "+" : ""}{currency} {difference.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Sales Revenue Breakdown */}
              <div className="border-b border-dashed border-zinc-300 pb-3 space-y-1.5">
                <p className="font-bold text-[11px] uppercase tracking-wider text-zinc-900 mb-1">
                  SALES REVENUE BREAKDOWN
                </p>
                <div className="flex justify-between">
                  <span>- Cash Sales:</span>
                  <span>{currency} {(sessionData.salesByMethod?.CASH ?? cashSales).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>- QR Code Sales:</span>
                  <span>{currency} {(sessionData.salesByMethod?.QR ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>- eSewa / Wallet Sales:</span>
                  <span>{currency} {(sessionData.salesByMethod?.ESEWA ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>- Card Payment Sales:</span>
                  <span>{currency} {(sessionData.salesByMethod?.CARD ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>- Bank Transfer Sales:</span>
                  <span>{currency} {(sessionData.salesByMethod?.BANK_TRANSFER ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>- Credit / Ledger Sales:</span>
                  <span className="font-semibold text-blue-600">{currency} {(sessionData.salesByMethod?.CREDIT ?? creditSales).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-[12px] pt-1.5 border-t border-dotted border-zinc-200 text-zinc-900">
                  <span>TOTAL SALES REVENUE:</span>
                  <span className="text-emerald-600">{currency} {totalRevenue.toFixed(2)}</span>
                </div>
              </div>

              {/* Purchases Outflow Breakdown (Temporarily commented out as requested)
              <div className="border-b border-dashed border-zinc-300 pb-3 space-y-1.5">
                <p className="font-bold text-[11px] uppercase tracking-wider text-zinc-900 mb-1">
                  PURCHASES & EXPENSES BREAKDOWN
                </p>
                <div className="flex justify-between">
                  <span>- Cash Purchases:</span>
                  <span>{currency} {(sessionData.purchaseByMethod?.CASH ?? cashOutflow).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>- QR Code Purchases:</span>
                  <span>{currency} {(sessionData.purchaseByMethod?.QR ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>- eSewa / Wallet Purchases:</span>
                  <span>{currency} {(sessionData.purchaseByMethod?.ESEWA ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>- Card Purchases:</span>
                  <span>{currency} {(sessionData.purchaseByMethod?.CARD ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>- Bank Transfer Purchases:</span>
                  <span>{currency} {(sessionData.purchaseByMethod?.BANK_TRANSFER ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>- Credit / Supplier Ledger Purchases:</span>
                  <span className="font-semibold text-rose-600">{currency} {(sessionData.purchaseByMethod?.CREDIT ?? creditOutflow).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-[12px] pt-1.5 border-t border-dotted border-zinc-200 text-zinc-900">
                  <span>TOTAL PURCHASES:</span>
                  <span className="text-rose-600">-{currency} {totalPurchases.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-zinc-300 pb-3 space-y-1 bg-zinc-50 p-2.5 rounded-lg">
                <div className="flex justify-between font-bold text-[12px]">
                  <span>NET SALES - PURCHASES:</span>
                  <span>{currency} {(totalRevenue - totalPurchases).toFixed(2)}</span>
                </div>
              </div>

              {sessionData.purchases && sessionData.purchases.length > 0 && (
                <div className="border-b border-dashed border-zinc-300 pb-3 space-y-2">
                  <p className="font-bold text-[11px] uppercase tracking-wider text-zinc-900">
                    PURCHASE TRANSACTIONS ({sessionData.purchases.length})
                  </p>
                  <div className="space-y-1 text-[10px]">
                    {sessionData.purchases.map((p: any, idx: number) => (
                      <div key={p.id || idx} className="flex justify-between border-b border-dotted border-zinc-200 pb-1">
                        <div>
                          <span className="font-bold">#{p.referenceNumber || `PUR-${idx + 1}`}</span>
                          <span className="text-zinc-500 block">{p.supplier?.fullName || "General Vendor"} ({p.paymentMode || "CASH"})</span>
                        </div>
                        <span className="font-bold text-rose-600">-{currency} {parseFloat(p.totalAmount || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              */}

              {/* Notes */}
              {sessionData.notes && (
                <div className="border-b border-dashed border-zinc-300 pb-3 space-y-1">
                  <p className="font-bold text-[10px] uppercase text-zinc-500">Session Notes:</p>
                  <p className="text-[10px] italic text-zinc-700 whitespace-pre-wrap">{sessionData.notes}</p>
                </div>
              )}

              {/* Signatures */}
              <div className="pt-6 space-y-8 text-center text-[10px]">
                <div className="flex justify-between px-4">
                  <div className="border-t border-zinc-400 pt-1 w-28">
                    <span>Cashier Sign</span>
                  </div>
                  <div className="border-t border-zinc-400 pt-1 w-28">
                    <span>Manager Sign</span>
                  </div>
                </div>
                <p className="text-[9px] text-zinc-400">Generated on {new Date().toLocaleString()}</p>
              </div>

            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-zinc-100 flex items-center justify-between gap-4">
          <Button
            variant="secondary"
            onClick={onClose}
            className="px-6 h-12 rounded-xl text-xs font-bold uppercase tracking-wider"
          >
            Close
          </Button>
          <Button
            onClick={handlePrint}
            className="px-8 h-12 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-zinc-200"
          >
            <Printer size={16} /> Print Thermal Receipt / PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}
