/**
 * BluetoothPrinterService
 *
 * Manages Web Bluetooth connections to ESC/POS thermal printers and provides
 * methods to generate and send receipt data. Supports multiple simultaneous
 * printer connections assigned to different roles (kitchen, bar, bill).
 */

import { Order, OrderItem, KOTType, PrinterRole, PrinterInfo, ReceiptTotals, PrinterConnectionMethod } from "./types";
import { Capacitor } from '@capacitor/core';

// --- Web Bluetooth Typings for compiler support ---
declare global {
  interface Navigator {
    bluetooth: {
      requestDevice(options?: any): Promise<BluetoothDevice>;
      getDevices(): Promise<BluetoothDevice[]>;
    };
  }

  interface BluetoothDevice extends EventTarget {
    id: string;
    name?: string;
    gatt?: BluetoothRemoteGATTServer;
  }

  interface BluetoothRemoteGATTServer {
    connected: boolean;
    device: BluetoothDevice;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: string | number): Promise<BluetoothRemoteGATTService>;
    getPrimaryServices(service?: string | number): Promise<BluetoothRemoteGATTService[]>;
  }

  interface BluetoothRemoteGATTService extends EventTarget {
    device: BluetoothDevice;
    uuid: string;
    isPrimary: boolean;
    getCharacteristic(characteristic: string | number): Promise<BluetoothRemoteGATTCharacteristic>;
    getCharacteristics(characteristic?: string | number): Promise<BluetoothRemoteGATTCharacteristic[]>;
  }

  interface BluetoothRemoteGATTCharacteristic extends EventTarget {
    service: BluetoothRemoteGATTService;
    uuid: string;
    properties: {
      write: boolean;
      writeWithoutResponse: boolean;
      notify: boolean;
      indicate: boolean;
      broadcast: boolean;
      read: boolean;
      authenticatedSignedWrites: boolean;
    };
    value?: DataView;
    readValue(): Promise<DataView>;
    writeValue(value: BufferSource): Promise<void>;
    writeValueWithResponse(value: BufferSource): Promise<void>;
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
  }
}

// --- BLE Service / Characteristic UUIDs ---
const KNOWN_SERVICE_UUIDS: string[] = [
  "000018f0-0000-1000-8000-00805f9b34fb", 
  "0000ff00-0000-1000-8000-00805f9b34fb", 
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2", 
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", 
];

const KNOWN_WRITE_CHARACTERISTIC_UUIDS: string[] = [
  "00002af1-0000-1000-8000-00805f9b34fb", 
  "0000ff02-0000-1000-8000-00805f9b34fb", 
  "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f", 
  "49535343-8841-43f4-a8d4-ecbe34729bb3", 
];

const STORAGE_KEY = "bt_printers";
const CHUNK_SIZE = 512; 
const CHUNK_DELAY_MS = 50; 

// --- ESC/POS Command Constants ---
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const CMD = {
  INIT: new Uint8Array([ESC, 0x40]),
  BOLD_ON: new Uint8Array([ESC, 0x45, 0x01]),
  BOLD_OFF: new Uint8Array([ESC, 0x45, 0x00]),
  ALIGN_CENTER: new Uint8Array([ESC, 0x61, 0x01]),
  ALIGN_LEFT: new Uint8Array([ESC, 0x61, 0x00]),
  ALIGN_RIGHT: new Uint8Array([ESC, 0x61, 0x02]),
  DOUBLE_HEIGHT: new Uint8Array([ESC, 0x21, 0x10]),
  DOUBLE_WIDTH: new Uint8Array([ESC, 0x21, 0x20]),
  DOUBLE_SIZE: new Uint8Array([ESC, 0x21, 0x30]),
  NORMAL_SIZE: new Uint8Array([ESC, 0x21, 0x00]),
  CUT: new Uint8Array([GS, 0x56, 0x00]),
  PARTIAL_CUT: new Uint8Array([GS, 0x56, 0x01]),
  LINE_FEED: new Uint8Array([LF]),
};

const encoder = new TextEncoder();

interface StoredPrinter {
  connectionMethod?: PrinterConnectionMethod;
  deviceId?: string;
  name?: string;
  ipAddress?: string;
  port?: number;
}

type StoredPrinters = Partial<Record<PrinterRole, StoredPrinter>>;

interface ActiveConnection {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  characteristic: BluetoothRemoteGATTCharacteristic;
}

class BluetoothPrinterService {
  private connections: Partial<Record<PrinterRole, ActiveConnection>> = {};
  private _onStatusChange?: () => void;

  set onStatusChange(cb: (() => void) | undefined) {
    this._onStatusChange = cb;
  }

  private getStoredPrinters(): StoredPrinters {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private setStoredPrinters(data: StoredPrinters) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  isSupported(): boolean {
    if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
      return true;
    }
    return typeof navigator !== "undefined" && !!navigator.bluetooth;
  }

  async pairPrinter(role: PrinterRole): Promise<string> {
    if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
      throw new Error("Use native picker for Capacitor platform");
    }
    if (!this.isSupported()) throw new Error("Web Bluetooth is not supported in this browser.");

    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: KNOWN_SERVICE_UUIDS,
    });

    if (!device) throw new Error("No device selected.");

    const connection = await this.connectToDevice(device);
    this.connections[role] = connection;

    const stored = this.getStoredPrinters();
    stored[role] = {
      connectionMethod: "bluetooth",
      deviceId: device.id,
      name: device.name || "Thermal Printer"
    };
    this.setStoredPrinters(stored);

    device.addEventListener("gattserverdisconnected", () => {
      delete this.connections[role];
      this._onStatusChange?.();
    });

    this._onStatusChange?.();
    return device.name || "Thermal Printer";
  }

  saveCapacitorPrinter(role: PrinterRole, name: string, address: string) {
    const stored = this.getStoredPrinters();
    stored[role] = {
      connectionMethod: "bluetooth",
      deviceId: address,
      name: name || "Thermal Printer"
    };
    this.setStoredPrinters(stored);
    this._onStatusChange?.();
  }

  saveNetworkPrinter(role: PrinterRole, ipAddress: string, port: number) {
    const stored = this.getStoredPrinters();
    stored[role] = {
      connectionMethod: "network",
      ipAddress,
      port,
    };
    this.setStoredPrinters(stored);
    this._onStatusChange?.();
  }

  saveRawBTPrinter(role: PrinterRole) {
    const stored = this.getStoredPrinters();
    stored[role] = {
      connectionMethod: "rawbt",
      deviceId: "rawbt-intent",
      name: "RawBT Printer"
    };
    this.setStoredPrinters(stored);
    this._onStatusChange?.();
  }

  async reconnectPrinter(role: PrinterRole): Promise<boolean> {
    const stored = this.getStoredPrinters();
    const info = stored[role];
    if (!info) return false;

    if (info.connectionMethod === "network") return true;
    if (typeof window !== "undefined" && Capacitor.isNativePlatform()) return true;

    try {
      const devices = await navigator.bluetooth.getDevices();
      const device = devices.find((d) => d.id === info.deviceId);
      if (!device) return false;

      const connection = await this.connectToDevice(device);
      this.connections[role] = connection;

      device.addEventListener("gattserverdisconnected", () => {
        delete this.connections[role];
        this._onStatusChange?.();
      });

      this._onStatusChange?.();
      return true;
    } catch {
      return false;
    }
  }

  disconnectPrinter(role: PrinterRole) {
    if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
      const stored = this.getStoredPrinters();
      delete stored[role];
      this.setStoredPrinters(stored);
      this._onStatusChange?.();
      return;
    }

    const conn = this.connections[role];
    if (conn) {
      try { conn.server.disconnect(); } catch {}
      delete this.connections[role];
    }

    const stored = this.getStoredPrinters();
    delete stored[role];
    this.setStoredPrinters(stored);

    this._onStatusChange?.();
  }

  getPrinterInfo(role: PrinterRole): PrinterInfo {
    const stored = this.getStoredPrinters();
    const info = stored[role];
    const conn = this.connections[role];

    if (!info) return { deviceId: null, name: null, status: "not_paired" };

    const method = info.connectionMethod || "bluetooth";

    if (method === "network") {
      return {
        connectionMethod: "network",
        deviceId: null,
        name: info.ipAddress ? `Network (${info.ipAddress})` : "Network Printer",
        status: info.ipAddress ? "connected" : "not_paired",
        ipAddress: info.ipAddress || null,
        port: info.port || 9100,
      };
    }

    if (method === "rawbt") {
      return {
        connectionMethod: "rawbt",
        deviceId: "rawbt-intent",
        name: "RawBT Printer",
        status: "connected",
      };
    }

    if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
      return {
        connectionMethod: "bluetooth",
        deviceId: info.deviceId || null,
        name: info.name || null,
        status: info.deviceId ? "connected" : "disconnected",
      };
    }

    return {
      connectionMethod: "bluetooth",
      deviceId: info.deviceId || null,
      name: info.name || null,
      status: conn ? "connected" : "disconnected",
    };
  }

  getConnectedCount(): number {
    const stored = this.getStoredPrinters();
    let count = Object.keys(this.connections).length;

    for (const role of ["kitchen", "bar", "bill"] as PrinterRole[]) {
      const info = stored[role];
      if (info && info.connectionMethod === "network" && info.ipAddress) {
        count++;
      }
    }
    return count;
  }

  getAnyConnectedRole(): PrinterRole | null {
    const roles: PrinterRole[] = ["kitchen", "bar", "bill"];
    return roles.find((r) => this.isConnected(r)) || null;
  }

  isConnected(role: PrinterRole): boolean {
    const info = this.getPrinterInfo(role);
    if (info.connectionMethod === "network") return info.status === "connected";
    if (info.connectionMethod === "rawbt") return true;
    if (typeof window !== "undefined" && Capacitor.isNativePlatform()) return info.status === "connected";
    return !!this.connections[role];
  }

  private async connectToDevice(device: BluetoothDevice): Promise<ActiveConnection> {
    const server = await device.gatt!.connect();
    let characteristic: BluetoothRemoteGATTCharacteristic | null = null;

    for (const serviceUUID of KNOWN_SERVICE_UUIDS) {
      try {
        const service = await server.getPrimaryService(serviceUUID);
        for (const charUUID of KNOWN_WRITE_CHARACTERISTIC_UUIDS) {
          try {
            characteristic = await service.getCharacteristic(charUUID);
            break;
          } catch { continue; }
        }
        if (characteristic) break;

        const chars = await service.getCharacteristics();
        for (const c of chars) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            characteristic = c;
            break;
          }
        }
        if (characteristic) break;
      } catch { continue; }
    }

    if (!characteristic) {
      server.disconnect();
      throw new Error("Could not find a writable characteristic on this device.");
    }

    return { device, server, characteristic };
  }

  private isPrivateIp(ip: string): boolean {
    if (!ip) return false;
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4) return false;
    return (
      parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      parts[0] === 127
    );
  }

  private isCloudDeployment(): boolean {
    if (typeof window === "undefined") return false;
    const hostname = window.location.hostname;
    return (
      hostname !== "localhost" &&
      hostname !== "127.0.0.1" &&
      !hostname.startsWith("192.168.") &&
      !hostname.startsWith("10.") &&
      !hostname.endsWith(".local")
    );
  }

  async sendData(role: PrinterRole, data: Uint8Array): Promise<void> {
    const info = this.getPrinterInfo(role);

    if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
      if (info.connectionMethod === "bluetooth" && info.deviceId) {
        try {
          const pluginName = 'capacitor-thermal-printer';
          const { CapacitorThermalPrinter } = await import(pluginName);
          const connected = await CapacitorThermalPrinter.isConnected();
          if (!connected) await CapacitorThermalPrinter.connect({ address: info.deviceId });
          await CapacitorThermalPrinter.begin().raw(data).write();
          return;
        } catch (error) { console.error("Native BT failed:", error); }
      }
    }

    if (info.connectionMethod === "rawbt") {
      const base64Data = this.uint8ArrayToBase64(data);
      const intentUrl = `intent:#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;S.base64=${base64Data};end`;
      window.location.href = intentUrl;
      return;
    }

    if (info.connectionMethod === "network") {
      if (!info.ipAddress) throw new Error("No IP config.");
      const base64Data = this.uint8ArrayToBase64(data);
      const response = await fetch("/api/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipAddress: info.ipAddress, port: info.port || 9100, base64Data }),
      });
      if (!response.ok) throw new Error("Failed to print to network printer");
      return;
    }

    const conn = this.connections[role];
    if (!conn) throw new Error("Printer not connected.");

    const { characteristic } = conn;
    for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
      const chunk = data.slice(offset, offset + CHUNK_SIZE);
      if (characteristic.properties.writeWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      } else {
        await characteristic.writeValueWithResponse(chunk);
      }
      if (offset + CHUNK_SIZE < data.length) {
        await new Promise((r) => setTimeout(r, CHUNK_DELAY_MS));
      }
    }
  }

  private uint8ArrayToBase64(arr: Uint8Array): string {
    let binary = "";
    const len = arr.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(arr[i]);
    return window.btoa(binary);
  }

  private text(str: string): Uint8Array {
    return encoder.encode(str);
  }

  private concat(...arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, a) => sum + a.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }

  // ============================================================================
  // FORMATTING HELPERS (Strictly 48 Width for 80mm Printers)
  // ============================================================================

  private dividerLine(char = "-", width = 48): Uint8Array {
    return this.text(char.repeat(width) + "\n");
  }

  private padLine(left: string, right: string, width = 48): Uint8Array {
    const gap = width - left.length - right.length;
    const spaces = gap > 0 ? " ".repeat(gap) : " ";
    return this.text(left + spaces + right + "\n");
  }

  private formatItemLine(name: string, qty: number, width = 48): Uint8Array {
    const qtyStr = `x${qty}`;
    const maxNameLen = width - qtyStr.length - 1; 
    const cleanName = name.length > maxNameLen ? name.substring(0, maxNameLen) : name;
    return this.padLine(cleanName, qtyStr, width);
  }

  private formatBillLine(qty: number, name: string, amt: string, width = 48): Uint8Array {
    const qtyStr = `${qty}x `;
    const amtStr = ` ${amt}`;
    const maxNameLen = width - qtyStr.length - amtStr.length;
    
    let cleanName = name;
    if (cleanName.length > maxNameLen) {
      cleanName = cleanName.substring(0, maxNameLen);
    } else {
      cleanName = cleanName.padEnd(maxNameLen, " ");
    }
    
    return this.text(qtyStr + cleanName + amtStr + "\n");
  }

  // ============================================================================
  // TEMPLATES
  // ============================================================================

  buildKOTReceipt(order: Order, items: OrderItem[], type: KOTType): Uint8Array {
    const tableName = order.table?.name || "N/A";
    const orderId = order.id.slice(-6).toUpperCase();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB'); 
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

    const parts: Uint8Array[] = [];

    parts.push(
      CMD.INIT,
      CMD.ALIGN_CENTER,
      CMD.DOUBLE_SIZE,
      CMD.BOLD_ON,
      this.text(`*** KOT ***\n`),
      CMD.NORMAL_SIZE,
      CMD.BOLD_OFF,
      CMD.LINE_FEED,
      this.text(`${type === "KITCHEN" ? "KITCHEN" : "BAR"} ORDER TICKET\n`),
      CMD.LINE_FEED
    );

    parts.push(
      CMD.ALIGN_LEFT,
      this.dividerLine("-"),
      this.padLine(`Order: #${orderId}`, `${dateStr}`),
      this.padLine(`TABLE: ${tableName}`, `${timeStr}`),
      this.text(`Type: ${order.type?.replace("_", " ") || "DINE IN"}\n`),
      this.dividerLine("-")
    );

    parts.push(
      CMD.BOLD_ON,
      this.padLine("ITEM", "QTY"),
      CMD.BOLD_OFF,
      this.dividerLine("-")
    );

    for (const item of items) {
      const name = item.dish?.name || item.combo?.name || "Item";
      parts.push(CMD.BOLD_ON, this.formatItemLine(name, item.quantity), CMD.BOLD_OFF);
      
      if (item.remarks) {
        let rmk = `    Note: ${item.remarks}`;
        if (rmk.length > 48) rmk = rmk.substring(0, 48); 
        parts.push(this.text(rmk + "\n"));
      }
      parts.push(CMD.LINE_FEED);
    }

    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    parts.push(
      this.dividerLine("-"),
      CMD.ALIGN_CENTER,
      CMD.BOLD_ON,
      this.text(`Total Items: ${totalItems}\n`),
      CMD.BOLD_OFF,
      this.text("\n\n\n\n\n\n\n\n"), // 8 lines gap for tearing safely
      CMD.PARTIAL_CUT
    );

    return this.concat(...parts);
  }

  buildBillReceipt(order: Order, settings: Record<string, string>): Uint8Array {
    const orderId = order.id.slice(-6).toUpperCase();
    const tableName = order.table?.name || "N/A";
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB'); 
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    const currency = settings.currency || "Rs.";
    const activeItems = order.items.filter((i) => (i.status || "PENDING") !== "CANCELLED");
    const subtotal = activeItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const parts: Uint8Array[] = [];

    parts.push(
      CMD.INIT,
      CMD.ALIGN_CENTER,
      CMD.DOUBLE_SIZE,
      CMD.BOLD_ON,
      this.text(`${settings.name || "RESTAURANT"}\n`),
      CMD.NORMAL_SIZE,
      CMD.BOLD_OFF
    );

    if (settings.address) parts.push(this.text(`${settings.address}\n`));
    if (settings.phone) parts.push(this.text(`Tel: ${settings.phone}\n`));
    if (settings.panNumber) parts.push(this.text(`PAN: ${settings.panNumber}\n`));

    parts.push(
      CMD.LINE_FEED,
      CMD.DOUBLE_HEIGHT,
      CMD.BOLD_ON,
      this.text(`*** PROVISIONAL BILL ***\n`),
      CMD.NORMAL_SIZE,
      CMD.BOLD_OFF,
      CMD.LINE_FEED
    );

    parts.push(
      CMD.ALIGN_LEFT,
      this.dividerLine("-"),
      this.padLine(`ORD: #${orderId}`, `DATE: ${dateStr}`),
      this.padLine(`TBL: ${tableName}`, `TIME: ${timeStr}`),
      this.dividerLine("-")
    );

    parts.push(CMD.BOLD_ON, this.padLine("ITEM", "AMT"), CMD.BOLD_OFF, this.dividerLine("-"));

    for (const item of activeItems) {
      const name = item.dish?.name || item.combo?.name || "Item";
      const amt = `${currency} ${(item.quantity * item.unitPrice).toFixed(2)}`;
      parts.push(this.formatBillLine(item.quantity, name, amt));
    }

    parts.push(
      this.dividerLine("-"),
      CMD.BOLD_ON,
      CMD.DOUBLE_HEIGHT,
      this.padLine("TOTAL", `${currency} ${subtotal.toFixed(2)}`),
      CMD.NORMAL_SIZE,
      CMD.BOLD_OFF,
      this.dividerLine("-")
    );

    parts.push(
      CMD.ALIGN_CENTER,
      CMD.BOLD_ON,
      this.text("*** THANK YOU ***\n"),
      CMD.BOLD_OFF,
      this.text(`Powered by ${settings.name || "POS"} ERP\n`),
      this.text(`${now.toLocaleString('en-GB')}\n`),
      this.text("\n\n\n\n\n\n\n\n"), // 8 lines gap for tearing safely
      CMD.PARTIAL_CUT
    );

    return this.concat(...parts);
  }

  buildCheckoutReceipt(order: Order, settings: Record<string, string>, totals: ReceiptTotals, activeItems: OrderItem[]): Uint8Array {
    const orderId = order.id.slice(-6).toUpperCase();
    const tableName = order.table?.name || "N/A";
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB'); 
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    const currency = settings.currency || "Rs.";

    const parts: Uint8Array[] = [];

    // Header
    parts.push(
      CMD.INIT,
      CMD.ALIGN_CENTER,
      CMD.DOUBLE_SIZE,
      CMD.BOLD_ON,
      this.text(`${settings.name || "RESTAURANT"}\n`),
      CMD.NORMAL_SIZE,
      CMD.BOLD_OFF
    );

    if (settings.address) parts.push(this.text(`${settings.address}\n`));
    if (settings.phone) parts.push(this.text(`Tel: ${settings.phone}\n`));
    if (settings.panNumber) parts.push(this.text(`PAN/VAT: ${settings.panNumber}\n`));

    parts.push(
      CMD.LINE_FEED,
      CMD.DOUBLE_HEIGHT,
      CMD.BOLD_ON,
      this.text(`*** TAX INVOICE ***\n`),
      CMD.NORMAL_SIZE,
      CMD.BOLD_OFF,
      CMD.LINE_FEED
    );

    // Metadata
    parts.push(
      CMD.ALIGN_LEFT,
      this.dividerLine("-"),
      this.padLine(`INV: #${orderId}`, `DATE: ${dateStr}`),
      this.padLine(`TBL: ${tableName}`, `TIME: ${timeStr}`)
    );

    if (totals.customerName) parts.push(this.text(`CUST: ${totals.customerName}\n`));
    parts.push(this.text(`MODE: ${totals.paymentMethod}\n`));
    parts.push(this.dividerLine("-"));

    // Items
    parts.push(CMD.BOLD_ON, this.padLine("ITEM", "AMT"), CMD.BOLD_OFF, this.dividerLine("-"));

    for (const item of activeItems) {
      // Logic for complimentary items pricing calculation
      const compQty = totals.complimentaryItems?.[item.id] || 0;
      const paidQty = Math.max(0, item.quantity - compQty);
      const unitPrice = totals.itemPrices?.[item.id] ?? item.unitPrice;
      const cost = (paidQty * unitPrice).toFixed(2);
      const name = item.dish?.name || item.combo?.name || "Item";
      const amt = `${currency} ${cost}`;

      parts.push(this.formatBillLine(item.quantity, name, amt));
      
      if (compQty > 0) {
        parts.push(this.text(`    (FREE: ${compQty})\n`));
      }
    }

    // Totals Block
    parts.push(this.dividerLine("-"));
    parts.push(this.padLine("Subtotal", `${currency} ${totals.subtotal.toFixed(2)}`));

    if (totals.discount > 0) parts.push(this.padLine("Discount", `-${totals.discount.toFixed(2)}`));
    if (totals.loyaltyDiscount > 0) parts.push(this.padLine("Loyalty Disc.", `-${totals.loyaltyDiscount.toFixed(2)}`));
    if (totals.tax > 0) parts.push(this.padLine("VAT (13%)", `${totals.tax.toFixed(2)}`));
    if (totals.serviceCharge > 0) parts.push(this.padLine("Service Chg", `${totals.serviceCharge.toFixed(2)}`));

    parts.push(
      this.dividerLine("="),
      CMD.BOLD_ON,
      CMD.DOUBLE_HEIGHT,
      this.padLine("GRAND TOTAL", `${currency} ${totals.grandTotal.toFixed(2)}`),
      CMD.NORMAL_SIZE,
      CMD.BOLD_OFF,
      this.dividerLine("-")
    );

    // Footer
    parts.push(
      CMD.ALIGN_CENTER,
      CMD.BOLD_ON,
      this.text("*** THANK YOU, VISIT AGAIN ***\n"),
      CMD.BOLD_OFF,
      this.text(`Powered by ${settings.name || "POS"} ERP\n`),
      this.text(`${now.toLocaleString('en-GB')}\n`),
      
      // Explicit 8-line gap for safe tearing before RawBT watermark
      this.text("\n\n\n\n\n\n\n\n"),
      CMD.PARTIAL_CUT
    );

    return this.concat(...parts);
  }

  async testPrint(role: PrinterRole): Promise<void> {
    const now = new Date();
    const data = this.concat(
      CMD.INIT,
      CMD.ALIGN_CENTER,
      CMD.DOUBLE_SIZE,
      CMD.BOLD_ON,
      this.text("PRINTER TEST\n"),
      CMD.NORMAL_SIZE,
      CMD.BOLD_OFF,
      CMD.LINE_FEED,
      this.dividerLine("-"),
      this.text(`Role: ${role.toUpperCase()}\n`),
      this.text(`Time: ${now.toLocaleString()}\n`),
      this.dividerLine("-"),
      this.text("If you can read this,\n"),
      this.text("the printer is working!\n"),
      this.dividerLine("="),
      CMD.LINE_FEED,
      CMD.BOLD_ON,
      this.text("*** TEST COMPLETE ***\n"),
      CMD.BOLD_OFF,
      this.text("\n\n\n\n\n\n\n\n"),
      CMD.PARTIAL_CUT
    );
    await this.sendData(role, data);
  }
}

export const printerService = new BluetoothPrinterService();