"use client";
import Sidebar from "@/components/Sidebar";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { OrderNotificationProvider } from "@/components/providers/OrderNotificationProvider";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings } = useSettings();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 relative">
      {/* Sidebar for Desktop */}
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* Sidebar Drawer Overlay for Mobile/Tablet */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div 
        className={`fixed inset-y-0 left-0 w-64 bg-white z-50 lg:hidden transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative h-full flex flex-col">
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-6 right-4 p-2 text-zinc-500 hover:text-zinc-950 z-50"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
          <div className="flex-1 overflow-y-auto" onClick={() => setIsSidebarOpen(false)}>
            <Sidebar />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile/Tablet Top Header */}
        <header className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-4 lg:hidden sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-zinc-500 hover:text-zinc-950 focus:outline-none"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-black text-zinc-900 uppercase tracking-tighter">
              {settings.name || "XolaCloud"} ERP
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white text-xs font-bold">
            {settings.name?.substring(0, 2).toUpperCase() || "XC"}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden">
          <OrderNotificationProvider>
            {children}
          </OrderNotificationProvider>
        </main>
      </div>
    </div>
  );
}
