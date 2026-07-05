"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { printerService } from "@/lib/bluetooth-printer";
import { Capacitor } from '@capacitor/core';
import {
  Order,
  OrderItem,
  KOTType,
  PrinterRole,
  PrinterInfo,
  ReceiptTotals,
} from "@/lib/types";

interface NativeBluetoothDevice {
  name: string;
  address: string;
}

// -----------------------------------------------------------
// Context Type
// -----------------------------------------------------------

interface PrinterContextType {
  /** Status of each printer slot. */
  printers: Record<PrinterRole, PrinterInfo>;
  /** Whether the Web Bluetooth API is available. */
  isSupported: boolean;
  /** Whether running on a native Capacitor platform. */
  isNative: boolean;
  /** Open the browser Bluetooth picker and assign a device to a role. */
  pairPrinter: (role: PrinterRole) => Promise<void>;
  /** Disconnect and forget a printer for a role. */
  disconnectPrinter: (role: PrinterRole) => void;
  /** Save a network printer configuration. */
  saveNetworkPrinter: (role: PrinterRole, ipAddress: string, port: number) => void;
  /** Save a RawBT printer configuration. */
  saveRawBTPrinter: (role: PrinterRole) => void;
  /** Start scanning for native Bluetooth printers (Capacitor only). */
  scanNativePrinters: () => Promise<void>;
  /** Stop scanning for native Bluetooth printers. */
  stopNativeScan: () => Promise<void>;
  /** Connect a discovered native device to a printer role. */
  connectNativePrinter: (role: PrinterRole, device: NativeBluetoothDevice) => Promise<void>;
  /** List of discovered native Bluetooth devices. */
  nativeDevices: NativeBluetoothDevice[];
  /** Whether native scanning is in progress. */
  isScanning: boolean;
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
// Fallback: open a window and print via browser dialog or native printHtml
// -----------------------------------------------------------

// Guard to prevent concurrent print attempts
let _isPrintingFallback = false;

async function fallbackWindowPrint(htmlContent: string, docName: string = "Document") {
  // Prevent duplicate calls while a print dialog is already open
  if (_isPrintingFallback) {
    console.warn("fallbackWindowPrint: Already printing, ignoring duplicate call.");
    return;
  }
  _isPrintingFallback = true;

  const isNativeApp = typeof window !== 'undefined' && (window as any).Capacitor;

  if (isNativeApp) {
    console.log("Confirmed: Running inside native mobile app wrapper. Using Capgo Printer.");
    try {
      const pluginName = '@capgo/capacitor-printer';
      const { Printer } = await import(pluginName);
      await Printer.printHtml({
        name: docName,
        html: htmlContent
      });
    } catch (error) {
      console.error("Native system printer failed:", error);
    } finally {
      _isPrintingFallback = false;
    }
  } else {
    // Strip any inline <script> tags from the HTML to prevent them from
    // independently triggering window.print() (which caused triple-popup).
    const safeHtml = htmlContent.replace(/<script[\s\S]*?<\/script>/gi, "");

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      _isPrintingFallback = false;
      return;
    }
    printWindow.document.write(safeHtml);
    printWindow.document.close();

    // Wait for images/content to load, then trigger print exactly once
    const triggerPrint = () => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        console.warn("Print failed:", e);
      }

      // Close the print window and reset the guard after print dialog closes
      const cleanup = () => {
        _isPrintingFallback = false;
        try { printWindow.close(); } catch {}
      };

      // Use afterprint event if available, otherwise close after a delay
      if ('onafterprint' in printWindow) {
        printWindow.onafterprint = cleanup;
      } else {
        setTimeout(cleanup, 1000);
      }
    };

    // Small delay to let document finish rendering
    setTimeout(triggerPrint, 400);
  }
}

function buildKOTHtmlFallback(
  order: Order,
  items: OrderItem[],
  type: KOTType
): string {
  const tableName = order.table?.name || "N/A";
  const orderId = order.invoiceNumber ? String(order.invoiceNumber).padStart(3, '0') : order.id.slice(-6).toUpperCase();
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
  const [isNative, setIsNative] = useState(false);
  const [nativeDevices, setNativeDevices] = useState<NativeBluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);

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

    const native = typeof window !== "undefined" && Capacitor.isNativePlatform();
    setIsNative(native);

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
    if (isNative) {
      // On native, start scanning if not already and let the user pick from nativeDevices
      throw new Error("On native platform, use scanNativePrinters + connectNativePrinter instead.");
    }
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

  const saveRawBTPrinter = (role: PrinterRole) => {
    printerService.saveRawBTPrinter(role);
    refreshStatus();
  };

  // --- Native Capacitor scanning ---
  const scanNativePrinters = async () => {
    if (!isNative) return;
    setNativeDevices([]);
    setIsScanning(true);

    const pluginName = 'capacitor-thermal-printer';
    const { CapacitorThermalPrinter } = await import(pluginName);

    await CapacitorThermalPrinter.addListener('discoverDevices', (data: { devices: NativeBluetoothDevice[] }) => {
      setNativeDevices(data.devices);
    });

    await CapacitorThermalPrinter.addListener('discoveryFinish', () => {
      setIsScanning(false);
    });

    await CapacitorThermalPrinter.startScan();
  };

  const stopNativeScan = async () => {
    if (!isNative) return;
    const pluginName = 'capacitor-thermal-printer';
    const { CapacitorThermalPrinter } = await import(pluginName);
    await CapacitorThermalPrinter.stopScan();
    setIsScanning(false);
  };

  const connectNativePrinter = async (role: PrinterRole, device: NativeBluetoothDevice) => {
    const pluginName = 'capacitor-thermal-printer';
    const { CapacitorThermalPrinter } = await import(pluginName);
    const result = await CapacitorThermalPrinter.connect({ address: device.address });
    if (!result) {
      throw new Error(`Failed to connect to ${device.name || device.address}`);
    }
    // Save to storage so sendData knows the address for this role
    printerService.saveCapacitorPrinter(role, device.name, device.address);
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
      fallbackWindowPrint(buildKOTHtmlFallback(order, items, type), `KOT-${type}-${order.invoiceNumber ? String(order.invoiceNumber).padStart(3, '0') : order.id.slice(-6).toUpperCase()}`);
    }
  };

  const printBill = async (
    order: Order,
    settings: Record<string, string>
  ) => {
    const targetRole = resolveRole("bill");
    let printed = false;

    if (targetRole) {
      try {
        const data = printerService.buildBillReceipt(order, settings);
        await printerService.sendData(targetRole, data);
        printed = true;
      } catch (err) {
        console.warn("Direct network/bluetooth print failed, trying HTML fallback:", err);
      }
    }

    if (!printed) {
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

      await fallbackWindowPrint(`
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
                <td>ORDER: <span class="bold">#${order.invoiceNumber ? String(order.invoiceNumber).padStart(3, '0') : order.id.slice(-6).toUpperCase()}</span></td>
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
          </body>
        </html>
      `, `Bill-${order.table?.name || "Direct"}-${order.invoiceNumber ? String(order.invoiceNumber).padStart(3, '0') : order.id.slice(-6).toUpperCase()}`);
    }
  };

  const printReceipt = async (
    order: Order,
    settings: Record<string, string>,
    totals: ReceiptTotals,
    activeItems: OrderItem[]
  ) => {
    const targetRole = resolveRole("bill");
    let printed = false;

    if (targetRole) {
      try {
        const data = printerService.buildCheckoutReceipt(
          order,
          settings,
          totals,
          activeItems
        );
        await printerService.sendData(targetRole, data);
        printed = true;
      } catch (err) {
        console.warn("Direct network/bluetooth print failed, trying HTML fallback:", err);
      }
    }

    if (!printed) {
      const currency = settings.currency || "Rs.";
      const itemsHtml = activeItems
          .map(
            (item) => {
              const compQty = totals.complimentaryItems?.[item.id] || 0;
              const paidQty = Math.max(0, item.quantity - compQty);
              const unitPrice = totals.itemPrices?.[item.id] ?? item.unitPrice;
              const cost = (paidQty * unitPrice).toFixed(2);
              return `
              <tr style="border-bottom: 0.5px solid #eee;">
                <td style="padding: 5px 0; font-size: 11px;">
                  ${item.quantity}x ${item.dish?.name || item.combo?.name || "Item"}
                  ${compQty > 0 ? `<br/><small style="font-weight: bold;">(FREE: ${compQty})</small>` : ""}
                </td>
                <td style="padding: 5px 0; font-size: 11px; text-align: right;">
                  ${currency} ${cost}
                </td>
              </tr>`;
            }
          )
          .join("");

      await fallbackWindowPrint(`
        <html>
          <head>
            <title>Receipt - Order ${order.id.slice(-6).toUpperCase()}</title>
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
              ${settings.panNumber ? `<div style="font-size: 10px;">PAN/VAT: ${settings.panNumber}</div>` : ""}
              <div class="bold" style="margin-top: 10px; font-size: 12px; border: 1px solid #000; display: inline-block; padding: 2px 8px;">ESTIMATE INVOICE</div>
            </div>
            <div class="divider"></div>
            <table style="font-size: 10px;">
              <tr>
                <td>INV: <span class="bold">#${order.invoiceNumber ? String(order.invoiceNumber).padStart(3, '0') : order.id.slice(-6).toUpperCase()}</span></td>
                <td class="right">DATE: ${new Date().toLocaleDateString()}</td>
              </tr>
              <tr>
                <td>TABLE: <span class="bold">${order.table?.name || "N/A"}</span></td>
                <td class="right">TIME: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
              ${totals.customerName ? `<tr><td colspan="2">CUST: ${totals.customerName}</td></tr>` : ""}
              <tr>
                <td colspan="2">MODE: <span class="bold">${totals.paymentMethod}</span></td>
              </tr>
            </table>
            <div class="divider"></div>
            <table>
              <thead><tr style="border-bottom: 1px solid #000;"><th style="text-align: left;">ITEM</th><th style="text-align: right;">AMT</th></tr></thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div class="divider"></div>
            <table style="font-size: 11px;">
              <tr>
                <td>Subtotal</td>
                <td class="right">${currency} ${totals.subtotal.toFixed(2)}</td>
              </tr>
              ${totals.discount > 0 ? `
              <tr>
                <td>Discount</td>
                <td class="right">-${totals.discount.toFixed(2)}</td>
              </tr>
              ` : ""}
              ${totals.loyaltyDiscount > 0 ? `
              <tr>
                <td>Loyalty Disc.</td>
                <td class="right">-${totals.loyaltyDiscount.toFixed(2)}</td>
              </tr>
              ` : ""}
              ${totals.tax > 0 ? `
              <tr>
                <td>VAT (13%)</td>
                <td class="right">${totals.tax.toFixed(2)}</td>
              </tr>
              ` : ""}
              ${totals.serviceCharge > 0 ? `
              <tr>
                <td>Service Charge</td>
                <td class="right">${totals.serviceCharge.toFixed(2)}</td>
              </tr>
              ` : ""}
              <tr class="bold" style="font-size: 13px;">
                <td style="padding-top: 5px;">GRAND TOTAL</td>
                <td class="right" style="padding-top: 5px;">${currency} ${totals.grandTotal.toFixed(2)}</td>
              </tr>
            </table>
            <div class="divider"></div>
            <div class="footer center">
              <div class="bold">THANK YOU FOR YOUR VISIT!</div>
              <div style="font-size: 8px;">${new Date().toLocaleString()}</div>
            </div>
          </body>
        </html>
      `, `Receipt-${order.invoiceNumber ? String(order.invoiceNumber).padStart(3, '0') : order.id.slice(-6).toUpperCase()}`);
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
        isNative,
        pairPrinter,
        disconnectPrinter,
        saveNetworkPrinter,
        saveRawBTPrinter,
        scanNativePrinters,
        stopNativeScan,
        connectNativePrinter,
        nativeDevices,
        isScanning,
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
