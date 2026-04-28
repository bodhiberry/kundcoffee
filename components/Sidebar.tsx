"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Table2,
  ChevronDown,
  UtensilsCrossed,
  QrCode,
  Map,
  Settings,
  LogOut,
  Coffee,
  Database,
  Tag,
  Layers,
  Puzzle,
  Package,
  Users,
  TrendingUp,
  CreditCard,
  Circle,
  RefreshCcw,
  Scale,
  History,
  Shield,
} from "lucide-react";
import { useSettings } from "@/components/providers/SettingsProvider";

export default function Sidebar() {
  const { data: session } = useSession();
  const { settings } = useSettings();
  const pathname = usePathname();

  const userPermissions = (session?.user?.permissions as string[]) || [];
  const userRole = session?.user?.role;
  const isAdmin = userRole === "ADMIN";

  const hasAccess = (permission: string) => {
    if (isAdmin) return true;
    return userPermissions.includes(permission);
  };

  const [openSection, setOpenSection] = useState<string | null>(
    pathname.includes("menu")
      ? "menu"
      : pathname.includes("tables") ||
          pathname.includes("spaces") ||
          pathname.includes("qrcodes")
        ? "core"
        : pathname.includes("customer")
          ? "customer"
          : pathname.includes("suppliers") || pathname.includes("purchases")
            ? "procurement"
            : pathname.includes("staff")
              ? "staffs"
              : null,
  );

  const isActive = (path: string) => pathname === path;

  const NavItem = ({
    href,
    icon: Icon,
    label,
    isChild = false,
    permission,
  }: {
    href: string;
    icon: any;
    label: string;
    isChild?: boolean;
    permission?: string;
  }) => {
    if (permission && !hasAccess(permission)) return null;

    const active = isActive(href);
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 group relative ${
          active
            ? "text-zinc-900 bg-zinc-100/80"
            : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
        } ${isChild ? "ml-4" : ""}`}
      >
        {active && (
          <div className="absolute left-0 w-1 h-4 bg-zinc-900 rounded-r-full" />
        )}
        <Icon
          size={isChild ? 14 : 18}
          strokeWidth={active ? 2.5 : 2}
          className={
            active ? "text-zinc-900" : "text-zinc-400 group-hover:text-zinc-600"
          }
        />
        <span className="flex-1">{label}</span>
      </Link>
    );
  };

  const AccordionItem = ({
    id,
    label,
    icon: Icon,
    children,
    permission,
  }: {
    id: string;
    label: string;
    icon: any;
    children: React.ReactNode;
    permission?: string;
  }) => {
    if (permission && !hasAccess(permission)) return null;
    
    // Also hide if all children are hidden (though difficult to check here, we'll manually apply to AccordionItems)

    const isOpen = openSection === id;
    const isChildActive = pathname.includes(id === "core" ? "tables" : id);

    return (
      <div className="space-y-1">
        <button
          onClick={() => setOpenSection(isOpen ? null : id)}
          className={`w-full flex items-center justify-between px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
            isOpen || isChildActive
              ? "text-zinc-900 bg-zinc-50"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon
              size={18}
              className={
                isOpen || isChildActive ? "text-zinc-900" : "text-zinc-400"
              }
            />
            {label}
          </div>
          <ChevronDown
            size={14}
            className={`transition-transform duration-300 opacity-50 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="ml-4 mt-1 border-l border-zinc-100 space-y-1">
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <aside className="w-64 h-screen sticky top-0 bg-white border-r border-zinc-200 flex flex-col z-30">
      {/* Brand Header */}
      <Link href="/dashboard" className="h-20 flex items-center px-6 border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors cursor-pointer group/logo">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white shadow-sm overflow-hidden border border-zinc-100/10 group-hover/logo:scale-105 transition-transform">
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Coffee size={18} strokeWidth={2.5} />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-zinc-900 uppercase tracking-tighter leading-none">
              {settings.name || "Bodhiberry"} ERP
            </span>
            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-[0.2em] mt-1">
              System Active
            </span>
          </div>
        </div>
      </Link>

      {/* Navigation Area */}
      <div className="flex-1 overflow-y-auto px-3 py-6 space-y-8 custom-scrollbar">
        {/* Overview Section */}
        <section className="space-y-1">
          <label className="px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2 block">
            Main
          </label>
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem 
            href="/dashboard/orders" 
            icon={Package} 
            label="Orders" 
            permission="pos_access"
          />
        </section>

        {/* Management Section */}
        <section className="space-y-1">
          <label className="px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2 block">
            Operations
          </label>

          <AccordionItem id="menu" label="Menu" icon={UtensilsCrossed} permission="manage_menu">
            <NavItem
              href="/dashboard/menu/categories"
              icon={Tag}
              label="Categories"
              isChild
            />
            <NavItem
              href="/dashboard/menu/sub-menus"
              icon={Layers}
              label="Sub-Categories"
              isChild
            />
            <NavItem
              href="/dashboard/menu/dishes"
              icon={Circle}
              label="Dish List"
              isChild
            />
            <NavItem
              href="/dashboard/menu/addons"
              icon={Puzzle}
              label="Modifiers"
              isChild
            />
            <NavItem
              href="/dashboard/menu/combos"
              icon={Package}
              label="Bundle Sets"
              isChild
            />
          </AccordionItem>

          <AccordionItem id="core" label="Floor Plan" icon={Database} permission="manage_core">
            <NavItem
              href="/dashboard/spaces"
              icon={Map}
              label="Spaces"
              isChild
            />
            <NavItem
              href="/dashboard/tables"
              icon={Table2}
              label="Tables"
              isChild
            />
            <NavItem
              href="/dashboard/qrcodes"
              icon={QrCode}
              label="Table IDs"
              isChild
            />
          </AccordionItem>

          <AccordionItem id="customer" label="CRM" icon={Users} permission="manage_customers">
            <NavItem
              href="/dashboard/customers/add-customer"
              icon={Users}
              label="Add Customers"
              isChild
            />
            <NavItem
              href="/dashboard/customers"
              icon={Users}
              label="Customers"
              isChild
            />
          </AccordionItem>

          <AccordionItem id="staffs" label="Team" icon={Users} permission="manage_staff">
            <NavItem
              href="/dashboard/staff"
              icon={Users}
              label="Staff Directory"
              isChild
            />
          </AccordionItem>

          <AccordionItem id="procurement" label="Procurement" icon={Package} permission="manage_inventory">
            <NavItem
              href="/dashboard/purchases"
              icon={CreditCard}
              label="Purchases"
              isChild
            />
            <NavItem
              href="/dashboard/purchases/returns"
              icon={RefreshCcw}
              label="Purchase Returns"
              isChild
            />
          </AccordionItem>

          <AccordionItem id="inventory" label="Inventory" icon={Database} permission="manage_inventory">
            <NavItem
              href="/dashboard/inventory/stocks"
              icon={Package}
              label="Stock List"
              isChild
            />
            <NavItem
              href="/dashboard/inventory/groups"
              icon={Layers}
              label="Stock Groups"
              isChild
            />
            <NavItem
              href="/dashboard/inventory/consumption"
              icon={TrendingUp}
              label="Consumption"
              isChild
            />
            <NavItem
              href="/dashboard/inventory/history"
              icon={History}
              label="Stock History"
              isChild
            />
            <NavItem
              href="/dashboard/inventory/measuring-units"
              icon={Scale}
              label="Measuring Units"
              isChild
            />
            <NavItem
              href="/dashboard/suppliers"
              icon={Users}
              label="Suppliers"
              isChild
            />
          </AccordionItem>

          <NavItem
            href="/dashboard/finance"
            icon={TrendingUp}
            label="Sales Analytics"
            permission="view_finance"
          />
        </section>

        {/* Settings Section */}
        <section className="space-y-1">
          <label className="px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2 block">
            System
          </label>
          {isAdmin && (
            <NavItem
              href="/dashboard/settings/users"
              icon={Shield}
              label="User Access"
            />
          )}
          <NavItem
            href="/dashboard/settings"
            icon={Settings}
            label="Settings"
            permission="manage_settings"
          />
        </section>
      </div>

      {/* User & Footer */}
      <div className="p-4 border-t border-zinc-100 bg-zinc-50/30">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white border border-zinc-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] mb-3">
          <div className="w-9 h-9 bg-zinc-900 rounded-lg flex items-center justify-center text-white text-[10px] font-bold">
            {session?.user?.email?.substring(0, 2).toUpperCase() || "AD"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-zinc-900 truncate">
              {session?.user?.name || session?.user?.email || "Administrator"}
            </span>
            <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-wider">
              {session?.user?.role || "Manager"}
            </span>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-red-600 hover:bg-red-50/50 transition-colors group"
        >
          <LogOut size={16} className="opacity-70 group-hover:opacity-100" />
          Logout
        </button>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f4f4f5;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #e4e4e7;
        }
      `}</style>
    </aside>
  );
}
