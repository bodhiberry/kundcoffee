import { Space } from "lucide-react";

export type spaceType = {
  id: string;
  name: string;
  sortOrder?: number;
  description?: string;
  tables: Table[];
  createdAt: Date;
};

export type TableType = {
  id: string;
  name: string;
  tables: Table[];
};

export type Table = {
  id: string;
  name: string;
  sortOrder?: number;
  tableTypeId: string;
  tableType?: TableType | null;
  capacity: number;
  space?: spaceType | null;
  status: "ACTIVE" | "OCCUPIED" | "INACTIVE";
  spaceId?: string | null;
  createdAt: Date;
  sessions: TableSession[];
  qrCode?: QRCode | null;
};

export type Space = {
  id: string;
  name: string;
  description?: string;
  sortOrder?: number;
};
export type QRCode = {
  id: string;
  tableId: string;
  value: string;
  assigned: boolean;
  createdAt: Date;
};

export type Params = Promise<{ id: string }>;

// Menu Module Types

export type Category = {
  id: string;
  name: string;
  image?: string | null;
  description?: string | null;
  dishes?: Dish[];
  combos?: any[]; // Replace with Combo type when defined
  createdAt?: Date;
  sortOrder?: number;
  showInOrderingApp?: boolean;
  isActive?: boolean;
};

export type Dish = {
  id: string;
  name: string;
  hscode?: string | null;
  image: string[];
  sortOrder: number;
  preparationTime: number;
  description?: string | null;
  categoryId: string;
  category?: Category;
  subMenuId?: string | null;
  type: "VEG" | "NON_VEG" | "SNACK" | "DRINK";
  kotType: "KITCHEN" | "BAR";
  isAvailable: boolean;
  showInOrderingApp: boolean;
  price?: Price | null;
  stocks?: StockConsumption[];
  createdAt: Date;
};

export type Price = {
  id?: string;
  actualPrice: number;
  discountPrice?: number;
  listedPrice: number;
  cogs: number;
  grossProfit: number;
};

export type MeasuringUnit = {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  createdAt: string;
};

export type Stock = {
  id: string;
  name: string;
  unitId?: string | null;
  groupId?: string | null;
  unit?: MeasuringUnit | null;
  quantity: number;
  costPrice: number;
  amount: number;
};

export type StockConsumption = {
  id?: string;
  stockId: string;
  stock?: Stock;
  quantity: number;
};
// ... (Previous types)

export type SubMenu = {
  id: string;
  name: string;
  image?: string | null;
  isActive: boolean;
  categoryId?: string | null;
  dishes?: Dish[];
  createdAt: Date;
};

export type AddOn = {
  id: string;
  name: string;
  image?: string | null;
  description?: string | null;
  type: "EXTRA" | "ADDON";
  isAvailable: boolean;
  categoryId?: string | null;
  price?: Price | null;
  sortOrder?: number;
  stocks?: StockConsumption[];
  createdAt: Date;
};

export type MenuSet = {
  id: string;
  name: string;
  service: string;
  isActive: boolean;
  subMenus?: SubMenu[]; // Through implicit relation or fetch
  createdAt: Date;
};

export type ComboOffer = {
  id: string;
  name: string;
  image: string[];
  sortOrder?: number;
  hscode?: string | null;
  preparationTime: number;
  description?: string | null;
  categoryId: string;
  subMenuId?: string | null;
  kotType: "KITCHEN" | "BAR";
  isAvailable: boolean;
  price?: Price | null;
  stocks?: StockConsumption[];
  items?: {
    dishId: string;
    quantity: number;
    unitPrice: number;
  }[];
  createdAt: Date;
};

export type KOTType = "KITCHEN" | "BAR";

// --- Order Module Types ---

export type OrderStatus =
  | "PENDING"
  | "PREPARING"
  | "READYTOPICK"
  | "SERVED"
  | "COMPLETED"
  | "CANCELLED";

export type OrderType =
  | "DINE_IN"
  | "PICKUP"
  | "DELIVERY"
  | "RESERVATION"
  | "QUICK_BILLING"
  | "TAKE_AWAY";

export type OrderItem = {
  id: string;
  orderId: string;
  dishId?: string | null;
  dish?: Dish | null;
  comboId?: string | null;
  combo?: ComboOffer | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedAddOns?: OrderItemAddOn[];
  status?: OrderStatus;
  remarks?: string;
};

export type OrderItemAddOn = {
  id: string;
  orderItemId: string;
  addOnId: string;
  addOn: AddOn;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  sessionId: any;
  id: string;
  tableId?: string | null;
  table?: Table | null;
  customerId?: string | null;
  customer?: Customer | null;
  items: OrderItem[];
  type: OrderType;
  total: number;
  status: OrderStatus;
  staffId?: string | null;
  staff?: any; // Add Staff type if needed
  guests?: number | null;
  kotRemarks?: string | null;
  createdAt: Date;
  invoiceNumber?: number | null;
};

export type Customer = {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  dob?: string;
  loyaltyId?: string;
  openingBalance: number;
  creditLimit?: number;
  creditTermDays?: number;
  loyaltyPoints: number;
  loyaltyDiscount: number;
  legalName?: string;
  taxNumber?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  dueAmount?: number;
};

export type CustomerLedger = {
  id: string;
  customerId: string;
  txnNo: string;
  type:
    | "SALE"
    | "PAYMENT_IN"
    | "PAYMENT_OUT"
    | "RETURN"
    | "ADJUSTMENT"
    | "OPENING_BALANCE";
  amount: number;
  closingBalance: number;
  referenceId?: string;
  remarks?: string;
  createdAt: string;
};

export type TableSession = {
  id: string;
  tableId: string;
  table?: Table;
  startedAt: string;
  endedAt?: string | null;
  total: number;
  serviceCharge: number;
  tax: number;
  grandTotal: number;
  isActive: boolean;
};

export type PaymentMethod =
  | "CASH"
  | "ESEWA"
  | "QR"
  | "BANK_TRANSFER"
  | "CREDIT";

export type ReturnPaymentStatus = "PAID" | "UNPAID" | "CREDIT";

export type SalesReturn = {
  id: string;
  referenceNumber: string;
  customerId?: string | null;
  customer?: Customer | null;
  txnDate: Date;
  billReference: string;
  salesStaff?: string | null;
  items: SalesReturnItem[];
  taxableAmount: number;
  totalAmount: number;
  roundOff: number;
  discount: number;
  attachment?: string | null;
  remark?: string | null;
  paymentStatus: ReturnPaymentStatus;
  paymentMode?: PaymentMethod | null;
  createdAt: Date;
  isDeleted: boolean;
};

export type SalesReturnItem = {
  id: string;
  salesReturnId: string;
  dishName: string;
  quantity: number;
  rate: number;
  amount: number;
};

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export type Sale = {
  date: string;
  total: string;
};

// Procurement Module Types

export type BalanceType = "DEBIT" | "CREDIT";

export type Supplier = {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  legalName?: string;
  taxNumber?: string;
  address?: string;
  openingBalance: number;
  openingBalanceType: BalanceType;
  createdAt: string;
};

export type SupplierLedgerType =
  | "PURCHASE"
  | "PAYMENT"
  | "RETURN"
  | "ADJUSTMENT"
  | "OPENING_BALANCE";

export type SupplierLedger = {
  id: string;
  supplierId: string;
  txnNo: string;
  type: SupplierLedgerType;
  amount: number;
  closingBalance: number;
  referenceId?: string;
  remarks?: string;
  createdAt: string;
};

export type Purchase = {
  id: string;
  referenceNumber: string;
  supplierId: string;
  supplier?: Supplier;
  txnDate: string;
  items: PurchaseItem[];
  taxableAmount: number;
  totalAmount: number;
  discount: number;
  roundOff: number;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "CREDIT";
  paymentMode?: PaymentMethod;
  remark?: string;
  attachment?: string;
  createdAt: string;
};

export type PurchaseItem = {
  id: string;
  purchaseId: string;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
  stockId?: string;
};

export type PurchaseReturn = {
  id: string;
  referenceNumber: string;
  supplierId: string;
  supplier?: Supplier;
  txnDate: string;
  purchaseReference?: string;
  items: PurchaseReturnItem[];
  taxableAmount: number;
  totalAmount: number;
  discount: number;
  roundOff: number;
  paymentStatus: ReturnPaymentStatus;
  paymentMode?: PaymentMethod;
  remark?: string;
  attachment?: string;
  createdAt: string;
};

export type PurchaseReturnItem = {
  id: string;
  purchaseReturnId: string;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
  stockId?: string;
};

// --- Bluetooth & Network Printer Types ---

export type PrinterRole = "kitchen" | "bar" | "bill";
export type PrinterConnectionMethod = "bluetooth" | "network" | "rawbt";

export interface PrinterInfo {
  connectionMethod?: PrinterConnectionMethod;
  deviceId: string | null;
  name: string | null;
  status: "connected" | "disconnected" | "not_paired";
  ipAddress?: string | null;
  port?: number | null;
}

export interface ReceiptTotals {
  subtotal: number;
  discount: number;
  loyaltyDiscount: number;
  tax: number;
  serviceCharge: number;
  grandTotal: number;
  paymentMethod: string;
  tenderAmount?: number;
  customerName?: string;
  complimentaryItems?: Record<string, number>;
  itemPrices?: Record<string, number>;
}
