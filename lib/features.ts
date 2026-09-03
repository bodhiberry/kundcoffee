export interface FeatureDefinition {
  key: string;
  name: string;
  description: string;
  category: "Core" | "Management" | "Growth" | "Advanced";
}

export interface LimitDefinition {
  key: string;
  name: string;
  description: string;
  category: "Core" | "Management" | "Growth" | "Advanced";
  unit: string;
  defaultBasic: number; // -1 represents unlimited
  defaultStandard: number;
  defaultPremium: number;
}

export const ALL_LIMITS: LimitDefinition[] = [
  {
    key: "max_tables",
    name: "Max Tables",
    description: "Maximum number of dine-in tables allowed",
    category: "Core",
    unit: "tables",
    defaultBasic: 10,
    defaultStandard: 30,
    defaultPremium: -1,
  },
  {
    key: "max_spaces",
    name: "Max Spaces / Rooms",
    description: "Maximum seating spaces or dining areas",
    category: "Core",
    unit: "spaces",
    defaultBasic: 2,
    defaultStandard: 5,
    defaultPremium: -1,
  },
  {
    key: "max_categories",
    name: "Max Menu Categories",
    description: "Maximum food and beverage categories",
    category: "Core",
    unit: "categories",
    defaultBasic: 10,
    defaultStandard: 30,
    defaultPremium: -1,
  },
  {
    key: "max_dishes",
    name: "Max Menu Items (Dishes)",
    description: "Maximum active menu items / dishes",
    category: "Core",
    unit: "items",
    defaultBasic: 30,
    defaultStandard: 150,
    defaultPremium: -1,
  },
  {
    key: "max_staff",
    name: "Max Staff Accounts",
    description: "Maximum active employee & cashier logins",
    category: "Management",
    unit: "staff",
    defaultBasic: 2,
    defaultStandard: 10,
    defaultPremium: -1,
  },
  {
    key: "max_suppliers",
    name: "Max Suppliers",
    description: "Maximum supplier vendor accounts tracked",
    category: "Management",
    unit: "suppliers",
    defaultBasic: 5,
    defaultStandard: 25,
    defaultPremium: -1,
  },
  {
    key: "max_stock_items",
    name: "Max Stock Inventory Items",
    description: "Maximum raw materials / inventory items tracked",
    category: "Management",
    unit: "items",
    defaultBasic: 25,
    defaultStandard: 150,
    defaultPremium: -1,
  },
  {
    key: "max_customers",
    name: "Max Customers in CRM",
    description: "Maximum customer profiles and loyalty accounts",
    category: "Growth",
    unit: "customers",
    defaultBasic: 100,
    defaultStandard: 1000,
    defaultPremium: -1,
  },
  {
    key: "max_daily_orders",
    name: "Max Daily Orders",
    description: "Maximum orders that can be placed in a single day (-1 for unlimited)",
    category: "Core",
    unit: "orders/day",
    defaultBasic: 100,
    defaultStandard: 500,
    defaultPremium: -1,
  },
  {
    key: "max_qr_codes",
    name: "Max Payment QR Codes",
    description: "Maximum custom payment QR codes registered",
    category: "Core",
    unit: "QR codes",
    defaultBasic: 1,
    defaultStandard: 5,
    defaultPremium: -1,
  },
];

export const ALL_FEATURES: FeatureDefinition[] = [
  {
    key: "pos_orders",
    name: "POS & Order Management",
    description: "Take live table/takeaway orders and manage live POS operations",
    category: "Core",
  },
  {
    key: "menu_management",
    name: "Menu & Pricing",
    description: "Manage categories, dishes, submenus, add-ons, and pricing",
    category: "Core",
  },
  {
    key: "table_qr",
    name: "Tables & QR Ordering",
    description: "Table floor layout, space management, and customer QR code ordering",
    category: "Core",
  },
  {
    key: "inventory_stock",
    name: "Stock & Inventory Management",
    description: "Track raw stock items, unit conversions, waste logs, and stock alerts",
    category: "Management",
  },
  {
    key: "staff_roles",
    name: "Staff Management & Roles",
    description: "Create employee accounts, manage permissions, and assign roles",
    category: "Management",
  },
  {
    key: "procurement_suppliers",
    name: "Suppliers & Purchases",
    description: "Manage vendor contacts, supplier orders, and incoming invoices",
    category: "Management",
  },
  {
    key: "marketing_promotions",
    name: "Discounts & Combo Offers",
    description: "Set up percentage/fixed discount rules and combo meal offers",
    category: "Growth",
  },
  {
    key: "customer_loyalty",
    name: "Customers & Loyalty Points",
    description: "Customer database, order histories, rewards points, and redemptions",
    category: "Growth",
  },
  {
    key: "analytics_reports",
    name: "Advanced Reports & Analytics",
    description: "Revenue graphs, COGS profit margins, hourly peak reports, and export tools",
    category: "Advanced",
  },
  {
    key: "multi_branch",
    name: "Multi-Branch & Store Switching",
    description: "Manage multiple branch locations under one business account",
    category: "Advanced",
  },
];

export const DEFAULT_PLAN_TEMPLATES = [
  {
    name: "Basic",
    price: 0,
    durationDay: 30,
    features: ["pos_orders", "menu_management", "table_qr"],
    limits: {
      max_tables: 10,
      max_spaces: 2,
      max_categories: 10,
      max_dishes: 30,
      max_staff: 2,
      max_suppliers: 5,
      max_stock_items: 25,
      max_customers: 100,
      max_daily_orders: 100,
      max_qr_codes: 1,
    } as Record<string, number>,
  },
  {
    name: "Standard",
    price: 0,
    durationDay: 30,
    features: [
      "pos_orders",
      "menu_management",
      "table_qr",
      "inventory_stock",
      "staff_roles",
      "procurement_suppliers",
      "marketing_promotions",
    ],
    limits: {
      max_tables: 30,
      max_spaces: 5,
      max_categories: 30,
      max_dishes: 150,
      max_staff: 10,
      max_suppliers: 25,
      max_stock_items: 150,
      max_customers: 1000,
      max_daily_orders: 500,
      max_qr_codes: 5,
    } as Record<string, number>,
  },
  {
    name: "Premium",
    price: 0,
    durationDay: 30,
    features: [
      "pos_orders",
      "menu_management",
      "table_qr",
      "inventory_stock",
      "staff_roles",
      "procurement_suppliers",
      "marketing_promotions",
      "customer_loyalty",
      "analytics_reports",
      "multi_branch",
    ],
    limits: {
      max_tables: -1,
      max_spaces: -1,
      max_categories: -1,
      max_dishes: -1,
      max_staff: -1,
      max_suppliers: -1,
      max_stock_items: -1,
      max_customers: -1,
      max_daily_orders: -1,
      max_qr_codes: -1,
    } as Record<string, number>,
  },
];

