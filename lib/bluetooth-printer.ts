/**
 * BluetoothPrinterService
 *
 * Manages Web Bluetooth connections to ESC/POS thermal printers and provides
 * methods to generate and send receipt data. Supports multiple simultaneous
 * printer connections assigned to different roles (kitchen, bar, bill).
 *
 * Printer device assignments are persisted in localStorage so reconnection
 * can be attempted across page reloads.
 */

import { Order, OrderItem, KOTType, PrinterRole, PrinterInfo, ReceiptTotals } from "./types";

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
// These cover the most common Chinese-made Bluetooth thermal printers
// (Xprinter, GOOJPRT, MHT, POS-58/80, etc.).
// If a specific printer uses different UUIDs, add them here.
const KNOWN_SERVICE_UUIDS: string[] = [
  "000018f0-0000-1000-8000-00805f9b34fb", // Common thermal printer service
  "0000ff00-0000-1000-8000-00805f9b34fb", // Alternate service
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Nordic UART-like
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // Microchip BLE
];

const KNOWN_WRITE_CHARACTERISTIC_UUIDS: string[] = [
  "00002af1-0000-1000-8000-00805f9b34fb", // Common write characteristic
  "0000ff02-0000-1000-8000-00805f9b34fb", // Alternate write
  "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f", // Nordic UART TX
  "49535343-8841-43f4-a8d4-ecbe34729bb3", // Microchip write
];

const STORAGE_KEY = "bt_printers";
const CHUNK_SIZE = 512; // Max bytes per BLE write
const CHUNK_DELAY_MS = 50; // Delay between chunks to avoid BLE congestion

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
  FEED_LINES: (n: number) => new Uint8Array([ESC, 0x64, n]),
  CUT: new Uint8Array([GS, 0x56, 0x00]),
  PARTIAL_CUT: new Uint8Array([GS, 0x56, 0x01]),
  LINE_FEED: new Uint8Array([LF]),
};

// --- Text Encoder ---
const encoder = new TextEncoder();

interface StoredPrinter {
  connectionMethod?: "bluetooth" | "network";
  // bluetooth
  deviceId?: string;
  name?: string;
  // network
  ipAddress?: string;
  port?: number;
}

type StoredPrinters = Partial<Record<PrinterRole, StoredPrinter>>;

interface ActiveConnection {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  characteristic: BluetoothRemoteGATTCharacteristic;
}

// ============================================================
// MAIN SERVICE CLASS
// ============================================================

class BluetoothPrinterService {
  private connections: Partial<Record<PrinterRole, ActiveConnection>> = {};
  private _onStatusChange?: () => void;

  /** Register a callback to be notified when any printer status changes. */
  set onStatusChange(cb: (() => void) | undefined) {
    this._onStatusChange = cb;
  }

  // -----------------------------------------------------------
  // Persistence
  // -----------------------------------------------------------

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

  // -----------------------------------------------------------
  // Connection Management
  // -----------------------------------------------------------

  /** Check if Web Bluetooth is available in the current browser. */
  isSupported(): boolean {
    return typeof navigator !== "undefined" && !!navigator.bluetooth;
  }

  /** Open the browser Bluetooth picker, pair a device, and assign it to a role. */
  async pairPrinter(role: PrinterRole): Promise<string> {
    if (!this.isSupported()) throw new Error("Web Bluetooth is not supported in this browser.");

    // Request device with known thermal-printer services
    const device = await navigator.bluetooth.requestDevice({
      // Accept any device and use optional services so the picker shows all BLE devices
      acceptAllDevices: true,
      optionalServices: KNOWN_SERVICE_UUIDS,
    });

    if (!device) throw new Error("No device selected.");

    // Connect
    const connection = await this.connectToDevice(device);
    this.connections[role] = connection;

    // Persist
    const stored = this.getStoredPrinters();
    stored[role] = {
      connectionMethod: "bluetooth",
      deviceId: device.id,
      name: device.name || "Thermal Printer"
    };
    this.setStoredPrinters(stored);

    // Listen for disconnections
    device.addEventListener("gattserverdisconnected", () => {
      delete this.connections[role];
      this._onStatusChange?.();
    });

    this._onStatusChange?.();
    return device.name || "Thermal Printer";
  }

  /** Save a network printer configuration for a given role. */
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

  /** Attempt to reconnect to a previously paired device for a given role. */
  async reconnectPrinter(role: PrinterRole): Promise<boolean> {
    const stored = this.getStoredPrinters();
    const info = stored[role];
    if (!info) return false;

    if (info.connectionMethod === "network") {
      return true;
    }

    try {
      // getDevices() returns previously-permitted devices (Chrome 85+)
      const devices = await navigator.bluetooth.getDevices();
      const device = devices.find((d) => d.id === info.deviceId);
      if (!device) return false;

      // Attempt to connect
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

  /** Disconnect a printer by role. */
  disconnectPrinter(role: PrinterRole) {
    const conn = this.connections[role];
    if (conn) {
      try {
        conn.server.disconnect();
      } catch {
        // Already disconnected
      }
      delete this.connections[role];
    }

    // Also remove from stored printers
    const stored = this.getStoredPrinters();
    delete stored[role];
    this.setStoredPrinters(stored);

    this._onStatusChange?.();
  }

  /** Get status information for a role. */
  getPrinterInfo(role: PrinterRole): PrinterInfo {
    const stored = this.getStoredPrinters();
    const info = stored[role];
    const conn = this.connections[role];

    if (!info) {
      return { deviceId: null, name: null, status: "not_paired" };
    }

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

    return {
      connectionMethod: "bluetooth",
      deviceId: info.deviceId || null,
      name: info.name || null,
      status: conn ? "connected" : "disconnected",
    };
  }

  /** Get the number of currently connected printers. */
  getConnectedCount(): number {
    const stored = this.getStoredPrinters();
    let count = 0;
    
    // Count active Bluetooth connections
    count += Object.keys(this.connections).length;

    // Count configured Network printers
    for (const role of ["kitchen", "bar", "bill"] as PrinterRole[]) {
      const info = stored[role];
      if (info && info.connectionMethod === "network" && info.ipAddress) {
        count++;
      }
    }
    return count;
  }

  /** Get any single connected role (for fallback routing). */
  getAnyConnectedRole(): PrinterRole | null {
    const roles: PrinterRole[] = ["kitchen", "bar", "bill"];
    return roles.find((r) => this.isConnected(r)) || null;
  }

  /** Check if a specific role has an active connection. */
  isConnected(role: PrinterRole): boolean {
    const info = this.getPrinterInfo(role);
    if (info.connectionMethod === "network") {
      return info.status === "connected";
    }
    return !!this.connections[role];
  }

  // -----------------------------------------------------------
  // Low-level BLE connection
  // -----------------------------------------------------------

  private async connectToDevice(device: BluetoothDevice): Promise<ActiveConnection> {
    const server = await device.gatt!.connect();

    // Try each known service UUID until we find one the device supports
    let characteristic: BluetoothRemoteGATTCharacteristic | null = null;

    for (const serviceUUID of KNOWN_SERVICE_UUIDS) {
      try {
        const service = await server.getPrimaryService(serviceUUID);
        // Try each known write characteristic
        for (const charUUID of KNOWN_WRITE_CHARACTERISTIC_UUIDS) {
          try {
            characteristic = await service.getCharacteristic(charUUID);
            break;
          } catch {
            continue;
          }
        }
        if (characteristic) break;

        // If no known characteristic, try to find any writable one
        const chars = await service.getCharacteristics();
        for (const c of chars) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            characteristic = c;
            break;
          }
        }
        if (characteristic) break;
      } catch {
        continue;
      }
    }

    if (!characteristic) {
      // Last resort: try to discover all services and find any writable characteristic
      try {
        const services = await server.getPrimaryServices();
        for (const service of services) {
          const chars = await service.getCharacteristics();
          for (const c of chars) {
            if (c.properties.write || c.properties.writeWithoutResponse) {
              characteristic = c;
              break;
            }
          }
          if (characteristic) break;
        }
      } catch {
        // Ignore
      }
    }

    if (!characteristic) {
      server.disconnect();
      throw new Error("Could not find a writable characteristic on this device. It may not be a supported thermal printer.");
    }

    return { device, server, characteristic };
  }

  // -----------------------------------------------------------
  // Data Transmission
  // -----------------------------------------------------------

  /** Send raw bytes to a printer, chunked for BLE reliability or POSTed to network printer. */
  async sendData(role: PrinterRole, data: Uint8Array): Promise<void> {
    const info = this.getPrinterInfo(role);

    if (info.connectionMethod === "network") {
      if (!info.ipAddress) throw new Error(`Network printer for role "${role}" has no IP address configured.`);

      const base64Data = this.uint8ArrayToBase64(data);
      const response = await fetch("/api/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ipAddress: info.ipAddress,
          port: info.port || 9100,
          base64Data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to print to network printer at ${info.ipAddress}`);
      }
      return;
    }

    const conn = this.connections[role];
    if (!conn) throw new Error(`Printer for role "${role}" is not connected.`);

    const { characteristic } = conn;

    for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
      const chunk = data.slice(offset, offset + CHUNK_SIZE);
      try {
        if (characteristic.properties.writeWithoutResponse) {
          await characteristic.writeValueWithoutResponse(chunk);
        } else {
          await characteristic.writeValueWithResponse(chunk);
        }
      } catch (err) {
        throw new Error(`Failed to write to printer: ${err}`);
      }

      // Brief delay between chunks
      if (offset + CHUNK_SIZE < data.length) {
        await new Promise((r) => setTimeout(r, CHUNK_DELAY_MS));
      }
    }
  }

  private uint8ArrayToBase64(arr: Uint8Array): string {
    let binary = "";
    const len = arr.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(arr[i]);
    }
    return window.btoa(binary);
  }

  // -----------------------------------------------------------
  // ESC/POS Helpers
  // -----------------------------------------------------------

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

  private dividerLine(char = "-", width = 32): Uint8Array {
    return this.text(char.repeat(width) + "\n");
  }

  private padLine(left: string, right: string, width = 32): Uint8Array {
    const gap = width - left.length - right.length;
    const spaces = gap > 0 ? " ".repeat(gap) : " ";
    return this.text(left + spaces + right + "\n");
  }

  // -----------------------------------------------------------
  // Receipt Builders
  // -----------------------------------------------------------

  /** Build ESC/POS data for a KOT ticket. */
  buildKOTReceipt(
    order: Order,
    items: OrderItem[],
    type: KOTType
  ): Uint8Array {
    const tableName = order.table?.name || "N/A";
    const orderId = order.id.slice(-6).toUpperCase();
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return this.concat(
      CMD.INIT,
      // Header
      CMD.ALIGN_CENTER,
      CMD.DOUBLE_SIZE,
      CMD.BOLD_ON,
      this.text(`*** KOT ***\n`),
      CMD.NORMAL_SIZE,
      this.text(`${type}\n`),
      CMD.BOLD_OFF,
      CMD.LINE_FEED,
      // Table & Order info
      CMD.DOUBLE_HEIGHT,
      CMD.BOLD_ON,
      this.text(`TABLE: ${tableName}\n`),
      CMD.NORMAL_SIZE,
      CMD.BOLD_OFF,
      this.text(`Order: #${orderId}\n`),
      CMD.ALIGN_LEFT,
      this.dividerLine("="),
      this.padLine(`Date: ${dateStr}`, `Time: ${timeStr}`),
      this.text(`Type: ${order.type?.replace("_", " ") || "DINE IN"}\n`),
      this.dividerLine(),
      // Column headers
      CMD.BOLD_ON,
      this.padLine("ITEM", "QTY"),
      CMD.BOLD_OFF,
      this.dividerLine(),
      // Items
      ...items.map((item) => {
        const name = item.dish?.name || item.combo?.name || "Item";
        const qty = `x${item.quantity}`;
        const line = this.padLine(
          name.length > 24 ? name.substring(0, 24) : name,
          qty
        );
        const remarkLine = item.remarks
          ? this.text(`  Note: ${item.remarks}\n`)
          : new Uint8Array(0);
        return this.concat(line, remarkLine);
      }),
      // Footer
      this.dividerLine(),
      CMD.ALIGN_CENTER,
      CMD.BOLD_ON,
      this.text(`Total Items: ${items.reduce((s, i) => s + i.quantity, 0)}\n`),
      CMD.BOLD_OFF,
      this.dividerLine("-"),
      this.text(`Printed: ${now.toLocaleString()}\n`),
      CMD.LINE_FEED,
      CMD.FEED_LINES(3),
      CMD.PARTIAL_CUT
    );
  }

  /** Build ESC/POS data for a provisional bill (from OrderDetailView). */
  buildBillReceipt(
    order: Order,
    settings: Record<string, string>
  ): Uint8Array {
    const orderId = order.id.slice(-6).toUpperCase();
    const tableName = order.table?.name || "N/A";
    const now = new Date();
    const currency = settings.currency || "Rs.";

    const activeItems = order.items.filter(
      (i) => (i.status || "PENDING") !== "CANCELLED"
    );

    const subtotal = activeItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    return this.concat(
      CMD.INIT,
      // Store header
      CMD.ALIGN_CENTER,
      CMD.BOLD_ON,
      CMD.DOUBLE_HEIGHT,
      this.text(`${settings.name || "RESTAURANT"}\n`),
      CMD.NORMAL_SIZE,
      CMD.BOLD_OFF,
      settings.address ? this.text(`${settings.address}\n`) : new Uint8Array(0),
      settings.phone ? this.text(`Tel: ${settings.phone}\n`) : new Uint8Array(0),
      settings.panNumber ? this.text(`PAN: ${settings.panNumber}\n`) : new Uint8Array(0),
      CMD.LINE_FEED,
      CMD.BOLD_ON,
      this.text(`PROVISIONAL BILL\n`),
      CMD.BOLD_OFF,
      CMD.ALIGN_LEFT,
      this.dividerLine("="),
      this.padLine(`Order: #${orderId}`, `Date: ${now.toLocaleDateString()}`),
      this.padLine(`Table: ${tableName}`, `Type: ${order.type || "DINE_IN"}`),
      this.dividerLine(),
      // Column headers
      CMD.BOLD_ON,
      this.padLine("ITEM", "AMT"),
      CMD.BOLD_OFF,
      this.dividerLine(),
      // Items
      ...activeItems.map((item) => {
        const name = `${item.quantity}x ${item.dish?.name || item.combo?.name || "Item"}`;
        const amt = `${currency} ${(item.quantity * item.unitPrice).toFixed(2)}`;
        return this.padLine(
          name.length > 20 ? name.substring(0, 20) : name,
          amt
        );
      }),
      this.dividerLine("="),
      CMD.BOLD_ON,
      CMD.DOUBLE_HEIGHT,
      this.padLine("TOTAL", `${currency} ${subtotal.toFixed(2)}`),
      CMD.NORMAL_SIZE,
      CMD.BOLD_OFF,
      this.dividerLine(),
      // Footer
      CMD.ALIGN_CENTER,
      CMD.BOLD_ON,
      this.text("THANK YOU!\n"),
      CMD.BOLD_OFF,
      this.text(`Powered by ${settings.name || "POS"} ERP\n`),
      this.text(`${now.toLocaleString()}\n`),
      CMD.FEED_LINES(3),
      CMD.PARTIAL_CUT
    );
  }

  /** Build ESC/POS data for a checkout receipt (from CheckoutModal). */
  buildCheckoutReceipt(
    order: Order,
    settings: Record<string, string>,
    totals: ReceiptTotals,
    activeItems: OrderItem[]
  ): Uint8Array {
    const orderId = order.id.slice(-6).toUpperCase();
    const tableName = order.table?.name || "N/A";
    const now = new Date();
    const currency = settings.currency || "Rs.";

    const parts: Uint8Array[] = [
      CMD.INIT,
      // Store header
      CMD.ALIGN_CENTER,
      CMD.BOLD_ON,
      CMD.DOUBLE_HEIGHT,
      this.text(`${settings.name || "RESTAURANT"}\n`),
      CMD.NORMAL_SIZE,
      CMD.BOLD_OFF,
    ];

    if (settings.address) parts.push(this.text(`${settings.address}\n`));
    if (settings.phone) parts.push(this.text(`Tel: ${settings.phone}\n`));
    if (settings.panNumber) parts.push(this.text(`PAN/VAT: ${settings.panNumber}\n`));

    parts.push(
      CMD.LINE_FEED,
      CMD.BOLD_ON,
      this.text("ESTIMATE INVOICE\n"),
      CMD.BOLD_OFF,
      CMD.ALIGN_LEFT,
      this.dividerLine("="),
      this.padLine(`INV: #${orderId}`, `Date: ${now.toLocaleDateString()}`),
      this.padLine(`Table: ${tableName}`, `Time: ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`),
    );

    if (totals.customerName) {
      parts.push(this.text(`Customer: ${totals.customerName}\n`));
    }
    parts.push(this.text(`Mode: ${totals.paymentMethod}\n`));
    parts.push(this.dividerLine());

    // Column headers
    parts.push(CMD.BOLD_ON, this.padLine("ITEM", "AMT"), CMD.BOLD_OFF, this.dividerLine());

    // Items
    for (const item of activeItems) {
      const name = `${item.quantity}x ${item.dish?.name || item.combo?.name || "Item"}`;
      const amt = `${currency} ${(item.quantity * item.unitPrice).toFixed(2)}`;
      parts.push(
        this.padLine(name.length > 20 ? name.substring(0, 20) : name, amt)
      );
    }

    parts.push(this.dividerLine());

    // Totals
    parts.push(this.padLine("Subtotal", `${currency} ${totals.subtotal.toFixed(2)}`));

    if (totals.discount > 0) {
      parts.push(this.padLine("Discount", `-${totals.discount.toFixed(2)}`));
    }
    if (totals.loyaltyDiscount > 0) {
      parts.push(this.padLine("Loyalty Disc.", `-${totals.loyaltyDiscount.toFixed(2)}`));
    }
    if (totals.tax > 0) {
      parts.push(this.padLine("VAT (13%)", `${totals.tax.toFixed(2)}`));
    }
    if (totals.serviceCharge > 0) {
      parts.push(this.padLine("Service Chg", `${totals.serviceCharge.toFixed(2)}`));
    }

    parts.push(
      this.dividerLine("="),
      CMD.BOLD_ON,
      CMD.DOUBLE_HEIGHT,
      this.padLine("GRAND TOTAL", `${currency} ${totals.grandTotal.toFixed(2)}`),
      CMD.NORMAL_SIZE,
      CMD.BOLD_OFF,
      this.dividerLine(),
      CMD.ALIGN_CENTER,
      CMD.BOLD_ON,
      this.text("THANK YOU FOR YOUR VISIT!\n"),
      CMD.BOLD_OFF,
      this.text(`Powered by ${settings.name || "POS"} ERP\n`),
      this.text(`${now.toLocaleString()}\n`),
      CMD.FEED_LINES(3),
      CMD.PARTIAL_CUT
    );

    return this.concat(...parts);
  }

  /** Send a test print to verify a printer is working. */
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
      this.dividerLine("="),
      this.text(`Role: ${role.toUpperCase()}\n`),
      this.text(`Time: ${now.toLocaleString()}\n`),
      this.dividerLine(),
      this.text("If you can read this,\n"),
      this.text("the printer is working!\n"),
      this.dividerLine("="),
      CMD.LINE_FEED,
      CMD.BOLD_ON,
      this.text("*** TEST COMPLETE ***\n"),
      CMD.BOLD_OFF,
      CMD.FEED_LINES(3),
      CMD.PARTIAL_CUT
    );
    await this.sendData(role, data);
  }
}

// Export a singleton instance
export const printerService = new BluetoothPrinterService();
