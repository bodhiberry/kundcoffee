"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { printerService } from "@/lib/bluetooth-printer";
import {
  Order,
  OrderItem,
  KOTType,
  PrinterRole,
  PrinterInfo,
  ReceiptTotals,
} from "@/lib/types";

// -----------------------------------------------------------
// Context Type
// -----------------------------------------------------------

interface PrinterContextType {
  /** Status of each printer slot. */
  printers: Record<PrinterRole, PrinterInfo>;
  /** Whether the Web Bluetooth API is available. */
  isSupported: boolean;
  /** Open the browser Bluetooth picker and assign a device to a role. */
  pairPrinter: (role: PrinterRole) => Promise<void>;
  /** Disconnect and forget a printer for a role. */
  disconnectPrinter: (role: PrinterRole) => void;
  /** Save a network printer configuration. */
  saveNetworkPrinter: (role: PrinterRole, ipAddress: string, port: number) => void;
  /**
   * Print a KOT ticket.
   * Routes to the correct printer based on type, or falls back.
   */
  printKOT: (order: Order, items: OrderItem[], type: KOTType) => Promise<void>;
  /**
   * Print a provisional bill (from OrderDetailView).
   * Routes to the bill printer, or falls back.
   */
  printBill: (order: Order, settings: Record<string, string>) => Promise<void>;
  /**
   * Print a checkout receipt (from CheckoutModal).
   * Routes to the bill printer, or falls back.
   */
  printReceipt: (
    order: Order,
    settings: Record<string, string>,
    totals: ReceiptTotals,
    activeItems: OrderItem[]
  ) => Promise<void>;
  /** Send a test page to a specific printer. */
  testPrint: (role: PrinterRole) => Promise<void>;
}

const defaultPrinterInfo: PrinterInfo = {
  deviceId: null,
  name: null,
  status: "not_paired",
};

const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

// -----------------------------------------------------------
// Fallback: open a window and print via browser dialog
// -----------------------------------------------------------

function fallbackWindowPrint(htmlContent: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

function buildKOTHtmlFallback(
  order: Order,
  items: OrderItem[],
  type: KOTType
): string {
  const tableName = order.table?.name || "N/A";
  const orderId = order.id.slice(-6).toUpperCase();
  const now = new Date();

  const itemsHtml = items
    .map(
      (item) => `
      <tr style="border-bottom: 0.5px dashed #999;">
        <td style="padding: 6px 0; font-size: 13px; font-weight: bold;">
          ${item.dish?.name || item.combo?.name || "Item"}
          ${item.remarks ? `<div style="font-size: 10px; font-weight: normal; color: #555; margin-top: 2px;">Note: ${item.remarks}</div>` : ""}
        </td>
        <td style="padding: 6px 0; font-size: 15px; font-weight: bold; text-align: right;">
          x${item.quantity}
        </td>
      </tr>`
    )
    .join("");

  return `
    <html>
      <head>
        <title>KOT - ${type}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { font-family: 'Courier New', monospace; width: 80mm; margin: 0; padding: 5mm; font-size: 12px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 2px dashed #000; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 18px;">*** KOT ***</div>
        <div class="center" style="font-size: 10px; text-transform: uppercase;">${type}</div>
        <div class="divider"></div>
        <div class="bold" style="font-size: 14px; text-align: center;">TABLE: ${tableName}</div>
        <div style="font-size: 11px; text-align: center;">Order: #${orderId}</div>
        <div class="divider"></div>
        <div style="display: flex; justify-content: space-between; font-size: 10px;">
          <span>Date: ${now.toLocaleDateString()}</span>
          <span>Time: ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div class="divider"></div>
        <table>
          <thead>
            <tr style="border-bottom: 1.5px solid #000;">
              <th style="text-align: left; font-size: 11px;">Item</th>
              <th style="text-align: right; font-size: 11px;">Qty</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="divider"></div>
        <div class="center bold" style="font-size: 11px;">
          Total Items: ${items.reduce((s, i) => s + i.quantity, 0)}
        </div>
        <div class="center" style="font-size: 9px; color: #666; margin-top: 5px;">
          Printed: ${now.toLocaleString()}
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>`;
}

// -----------------------------------------------------------
// Provider Component
// -----------------------------------------------------------

export const PrinterProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [printers, setPrinters] = useState<Record<PrinterRole, PrinterInfo>>({
    kitchen: { ...defaultPrinterInfo },
    bar: { ...defaultPrinterInfo },
    bill: { ...defaultPrinterInfo },
  });
  const [isSupported, setIsSupported] = useState(false);

  // Refresh status from the service
  const refreshStatus = useCallback(() => {
    const roles: PrinterRole[] = ["kitchen", "bar", "bill"];
    const updated: Record<PrinterRole, PrinterInfo> = {} as any;
    for (const role of roles) {
      updated[role] = printerService.getPrinterInfo(role);
    }
    setPrinters(updated);
  }, []);

  // Initialize on mount
  useEffect(() => {
    const supported = printerService.isSupported();
    setIsSupported(supported);

    // Register status-change callback
    printerService.onStatusChange = refreshStatus;

    // Initial status read
    refreshStatus();

    // Attempt to reconnect previously paired/configured printers
    const roles: PrinterRole[] = ["kitchen", "bar", "bill"];
    roles.forEach(async (role) => {
      try {
        await printerService.reconnectPrinter(role);
      } catch {
        // Silent fail
      }
    });

    return () => {
      printerService.onStatusChange = undefined;
    };
  }, [refreshStatus]);



  // -----------------------------------------------------------
  // Actions
  // -----------------------------------------------------------

  const pairPrinter = async (role: PrinterRole) => {
    await printerService.pairPrinter(role);
    refreshStatus();
  };

  const disconnectPrinter = (role: PrinterRole) => {
    printerService.disconnectPrinter(role);
    refreshStatus();
  };

  const saveNetworkPrinter = (role: PrinterRole, ipAddress: string, port: number) => {
    printerService.saveNetworkPrinter(role, ipAddress, port);
    refreshStatus();
  };

  /**
   * Resolve which printer role to actually send to.
   * - If the ideal role is connected, use it.
   * - Otherwise, if only 1 printer is connected, use that one (fallback).
   * - Otherwise, return null (will trigger window.print fallback).
   */
  const resolveRole = (idealRole: PrinterRole): PrinterRole | null => {
    if (printerService.isConnected(idealRole)) return idealRole;
    const fallback = printerService.getAnyConnectedRole();
    return fallback;
  };

  const printKOT = async (
    order: Order,
    items: OrderItem[],
    type: KOTType
  ) => {
    const idealRole: PrinterRole = type === "KITCHEN" ? "kitchen" : "bar";
    const targetRole = resolveRole(idealRole);

    if (targetRole) {
      const data = printerService.buildKOTReceipt(order, items, type);
      await printerService.sendData(targetRole, data);
    } else {
      // Fallback to browser print
      fallbackWindowPrint(buildKOTHtmlFallback(order, items, type));
    }
  };

  const printBill = async (
    order: Order,
    settings: Record<string, string>
  ) => {
    const targetRole = resolveRole("bill");

    if (targetRole) {
      const data = printerService.buildBillReceipt(order, settings);
      await printerService.sendData(targetRole, data);
    } else {
      // Fallback: the calling component's existing HTML print handles this
      // We signal the fallback by throwing so the caller can use its own HTML.
      // Actually, let's build a simple fallback here instead.
      const activeItems = order.items.filter(
        (i) => (i.status || "PENDING") !== "CANCELLED"
      );
      const currency = settings.currency || "Rs.";
      const subtotal = activeItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );

      const itemsHtml = activeItems
        .map(
          (item) => `
          <tr style="border-bottom: 0.5px solid #eee;">
            <td style="padding: 5px 0; font-size: 11px;">
              ${item.quantity}x ${item.dish?.name || item.combo?.name || "Item"}
            </td>
            <td style="padding: 5px 0; font-size: 11px; text-align: right;">
              ${currency} ${(item.quantity * item.unitPrice).toFixed(2)}
            </td>
          </tr>`
        )
        .join("");

      fallbackWindowPrint(`
        <html>
          <head>
            <title>Bill - ${order.table?.name || "Direct"}</title>
            <style>
              @page { size: 80mm auto; margin: 0; }
              * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
              html, body { margin: 0; padding: 0; width: 80mm; background: #fff; }
              body { font-family: Arial, sans-serif; padding: 5mm; font-size: 11px; color: #000; line-height: 1.4; }
              .center { text-align: center; }
              .right { text-align: right; }
              .bold { font-weight: bold; }
              .divider { border-top: 1px dashed #000; margin: 8px 0; width: 100%; }
              table { width: 100%; border-collapse: collapse; margin: 5px 0; }
              .footer { margin-top: 15px; font-size: 10px; padding-bottom: 10mm; }
              @media print { body { margin: 0; } .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="center">
              <div class="bold" style="font-size: 15px;">${settings.name || "RESTAURANT"}</div>
              <div style="font-size: 10px;">${settings.address || ""}</div>
              <div style="font-size: 10px;">Tel: ${settings.phone || ""}</div>
              <div class="bold" style="margin-top: 10px; font-size: 12px; border: 1px solid #000; display: inline-block; padding: 2px 8px;">PROVISIONAL BILL</div>
            </div>
            <div class="divider"></div>
            <table style="font-size: 10px;">
              <tr>
                <td>ORDER: <span class="bold">#${order.id.slice(-6).toUpperCase()}</span></td>
                <td class="right">DATE: ${new Date().toLocaleDateString()}</td>
              </tr>
              <tr>
                <td>TABLE: <span class="bold">${order.table?.name || "N/A"}</span></td>
                <td class="right">TYPE: ${order.type || "DINE_IN"}</td>
              </tr>
            </table>
            <div class="divider"></div>
            <table>
              <thead><tr style="border-bottom: 1px solid #000;"><th style="text-align: left;">ITEM</th><th style="text-align: right;">AMT</th></tr></thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div class="divider"></div>
            <table style="font-size: 11px;">
              <tr class="bold" style="font-size: 13px;">
                <td>TOTAL</td><td class="right">${currency} ${subtotal.toFixed(2)}</td>
              </tr>
            </table>
            <div class="divider"></div>
            <div class="footer center">
              <div class="bold">THANK YOU!</div>
              <div style="font-size: 8px;">${new Date().toLocaleString()}</div>
            </div>
            <script>window.onload = function() { window.print(); window.close(); }</script>
          </body>
        </html>
      `);
    }
  };

  const printReceipt = async (
    order: Order,
    settings: Record<string, string>,
    totals: ReceiptTotals,
    activeItems: OrderItem[]
  ) => {
    const targetRole = resolveRole("bill");

    if (targetRole) {
      const data = printerService.buildCheckoutReceipt(
        order,
        settings,
        totals,
        activeItems
      );
      await printerService.sendData(targetRole, data);
    } else {
      // Fallback: let the calling component use its own window.print approach
      // The CheckoutModal already has a full HTML receipt builder.
      // We return without doing anything — the component will detect no BT and use its own.
      // To support this, we'll check `printerService.getConnectedCount()` in the component.
      return;
    }
  };

  const testPrint = async (role: PrinterRole) => {
    await printerService.testPrint(role);
  };

  return (
    <PrinterContext.Provider
      value={{
        printers,
        isSupported,
        pairPrinter,
        disconnectPrinter,
        saveNetworkPrinter,
        printKOT,
        printBill,
        printReceipt,
        testPrint,
      }}
    >
      {children}
    </PrinterContext.Provider>
  );
};

// -----------------------------------------------------------
// Hook
// -----------------------------------------------------------

export const usePrinter = () => {
  const context = useContext(PrinterContext);
  if (context === undefined) {
    throw new Error("usePrinter must be used within a PrinterProvider");
  }
  return context;
};

/** Check if any Bluetooth printer is connected (utility for components). */
export const hasBluetoothPrinter = () => {
  return printerService.getConnectedCount() > 0;
};
