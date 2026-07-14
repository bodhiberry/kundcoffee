"use client";
import Sidebar from "@/components/Sidebar";
import { useState } from "react";
import { Menu, X, Loader2, Store, Globe, LayoutDashboard } from "lucide-react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { OrderNotificationProvider } from "@/components/providers/OrderNotificationProvider";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { storeSetupSchema, type StoreSetupInput } from "@/lib/validations/auth";
import { setupStoreAction } from "@/app/actions/auth";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<StoreSetupInput>({
    resolver: zodResolver(storeSetupSchema),
    defaultValues: {
      name: "",
      location: "",
      currency: "NPR",
    },
  });

  const onSubmit = async (data: StoreSetupInput) => {
    const email = session?.user?.email;
    if (!email) {
      toast.error("Session invalid. Please login again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await setupStoreAction(email, data);
      if (result.success) {
        toast.success("Store setup complete!");
        
        await updateSession({
          ...session,
          user: { ...session?.user, isSetupComplete: true }
        });

        router.push("/dashboard/settings");
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const showSetupReminder = session?.user && !session.user.isSetupComplete;

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

      {showSetupReminder && (
        <Modal isOpen={true} onClose={() => {}} noPadding={true} size="md">
          <div className="bg-white p-8 md:p-12 rounded-2xl flex flex-col justify-center items-center text-zinc-950 font-sans selection:bg-zinc-100">
            <div className="w-12 h-12 bg-zinc-950 text-white rounded-xl flex items-center justify-center mb-6 shadow-md">
              <Store size={22} />
            </div>
            <div className="text-center mb-8 max-w-sm">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">
                Configure Your Store
              </h2>
              <p className="text-zinc-500 text-sm">
                Please configure your business details to initialize your XolaCloud POS dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
              {error && (
                <div className="bg-red-50 border-l-2 border-red-800 p-4 flex gap-3 items-center text-red-900 rounded-lg">
                  <span className="text-xs font-semibold">{error}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Store Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 ml-1">Store Name</label>
                  <input
                    {...register("name")}
                    className={`w-full h-11 px-4 bg-white border ${
                      errors.name ? "border-red-700 shadow-sm shadow-red-50" : "border-zinc-200"
                    } rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 placeholder:text-zinc-300`}
                    placeholder="Restaurant Name"
                  />
                  {errors.name && (
                    <p className="text-[11px] text-red-800 font-medium mt-1 ml-1">{errors.name.message}</p>
                  )}
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 ml-1">Location</label>
                  <input
                    {...register("location")}
                    className={`w-full h-11 px-4 bg-white border ${
                      errors.location ? "border-red-700 shadow-sm shadow-red-50" : "border-zinc-200"
                    } rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 placeholder:text-zinc-300`}
                    placeholder="Address (e.g. Kathmandu, Nepal)"
                  />
                  {errors.location && (
                    <p className="text-[11px] text-red-800 font-medium mt-1 ml-1">{errors.location.message}</p>
                  )}
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 ml-1">Reporting Currency</label>
                  <div className="relative">
                    <select
                      {...register("currency")}
                      className="w-full h-11 px-4 bg-white border border-zinc-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 appearance-none"
                    >
                      <option value="NPR">NPR (Nepalese Rupee)</option>
                      <option value="USD">USD (United States Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                      <Globe size={14} />
                    </div>
                  </div>
                </div>
              </div>

              <button
                disabled={isLoading}
                type="submit"
                className="w-full h-11 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    Initialize Store
                    <LayoutDashboard size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
