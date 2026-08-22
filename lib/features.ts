export interface FeatureDefinition {
  key: string;
  name: string;
  description: string;
  category: "Core" | "Management" | "Growth" | "Advanced";
}

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
  },
];
