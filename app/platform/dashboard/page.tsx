"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { 
  Shield, 
  Store, 
  Lock, 
  RefreshCcw, 
  Power, 
  LogOut,
  Calendar,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";

interface StoreUser {
  id: string;
  name: string | null;
  email: string;
}

interface PlatformStore {
  id: string;
  name: string;
  ownerId: string;
  status: "TRIAL" | "ACTIVE" | "EXPIRED" | "SUSPENDED";
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  isSuspended: boolean;
  createdAt: string;
  users: StoreUser[];
}

export default function PlatformDashboard() {
  const { data: session } = useSession();
  const [stores, setStores] = useState<PlatformStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<PlatformStore | null>(null);
  
  // Modals state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  
  // Form states
  const [newPassword, setNewPassword] = useState("");
  const [newTrialEndsAt, setNewTrialEndsAt] = useState("");
  const [newSubscriptionEndsAt, setNewSubscriptionEndsAt] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/platform/stores");
      const data = await res.json();
      if (data.success) {
        setStores(data.data);
      } else {
        toast.error(data.message || "Failed to fetch stores");
      }
    } catch (err) {
      toast.error("Network connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  // Compute metrics
  const totalStores = stores.length;
  const activeStores = stores.filter(s => s.status === "ACTIVE").length;
  const trialStores = stores.filter(s => s.status === "TRIAL").length;
  const suspendedStores = stores.filter(s => s.isSuspended).length;
  const expiredStores = stores.filter(s => s.status === "EXPIRED").length;

  const handleOpenPasswordModal = (store: PlatformStore) => {
    setSelectedStore(store);
    setNewPassword("");
    setIsPasswordModalOpen(true);
  };

  const handleOpenSubscriptionModal = (store: PlatformStore) => {
    setSelectedStore(store);
    setNewTrialEndsAt(store.trialEndsAt ? store.trialEndsAt.substring(0, 10) : "");
    setNewSubscriptionEndsAt(store.subscriptionEndsAt ? store.subscriptionEndsAt.substring(0, 10) : "");
    setIsSubscriptionModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore || !newPassword) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/platform/stores/${selectedStore.id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Password reset successfully for ${selectedStore.name}`);
        setIsPasswordModalOpen(false);
      } else {
        toast.error(data.message || "Password reset failed");
      }
    } catch (err) {
      toast.error("Request failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/platform/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: selectedStore.id,
          action: "update_subscription",
          trialEndsAt: newTrialEndsAt || null,
          subscriptionEndsAt: newSubscriptionEndsAt || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Subscription dates updated");
        setIsSubscriptionModalOpen(false);
        fetchStores();
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (err) {
      toast.error("Request failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuspension = async (store: PlatformStore) => {
    const action = store.isSuspended ? "unsuspend" : "suspend";
    const confirmMessage = store.isSuspended 
      ? `Are you sure you want to unsuspend store "${store.name}"?`
      : `Are you sure you want to suspend store "${store.name}"? This will block access for all its users.`;

    if (!confirm(confirmMessage)) return;

    try {
      const res = await fetch("/api/platform/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: store.id,
          action,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(store.isSuspended ? "Store activated" : "Store suspended");
        fetchStores();
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch (err) {
      toast.error("Request failed");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shadow-sm">
            Active
          </span>
        );
      case "TRIAL":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full shadow-sm">
            Trialing
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full shadow-sm">
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shadow-sm">
            Expired
          </span>
        );
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans relative overflow-x-hidden selection:bg-slate-200">
      
      {/* Top Header */}
      <header className="h-20 border-b border-slate-200 bg-white px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-md">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-md font-black tracking-tight text-slate-900 uppercase leading-none">
              XolaCloud SaaS
            </h1>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 block">
              Platform Admin Console
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-xl">
            <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white uppercase">
              {session?.user?.email?.substring(0, 2) || "SA"}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                {session?.user?.name || "System Admin"}
              </span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                {session?.user?.role || "SUPER_ADMIN"}
              </span>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            id="admin-logout-btn"
            className="p-2.5 bg-white border border-slate-200 shadow-sm hover:bg-red-50 hover:border-red-200 rounded-xl text-slate-500 hover:text-red-600 transition-all cursor-pointer"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-8 py-10 space-y-10 relative z-10">
        
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tight">
              Tenant Registry
            </h2>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1 font-bold">
              Manage client stores, trial periods, and account security
            </p>
          </div>
          <button 
            onClick={fetchStores}
            id="refresh-stores-btn"
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCcw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Metrics Section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl flex flex-col gap-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Total Stores</span>
            <span className="text-2xl font-black text-slate-900">{loading ? "-" : totalStores}</span>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl flex flex-col gap-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Active Billing</span>
            <span className="text-2xl font-black text-emerald-600">{loading ? "-" : activeStores}</span>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl flex flex-col gap-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Trial Stores</span>
            <span className="text-2xl font-black text-slate-900">{loading ? "-" : trialStores}</span>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl flex flex-col gap-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Suspended</span>
            <span className="text-2xl font-black text-red-600">{loading ? "-" : suspendedStores}</span>
          </div>
          <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl flex flex-col gap-2 col-span-2 md:col-span-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Subscriptions Expired</span>
            <span className="text-2xl font-black text-amber-600">{loading ? "-" : expiredStores}</span>
          </div>
        </div>

        {/* Stores Table Panel */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 size={36} className="animate-spin text-slate-900" />
              <span className="text-xs uppercase tracking-widest font-black">Connecting Database...</span>
            </div>
          ) : stores.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Store size={36} className="text-slate-300" />
              <span className="text-xs uppercase tracking-widest font-black">No Stores Registered</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    <th className="py-5 px-6">Store Details</th>
                    <th className="py-5 px-6">Owner Account</th>
                    <th className="py-5 px-6">Billing Status</th>
                    <th className="py-5 px-6">Trial Ends</th>
                    <th className="py-5 px-6">Subscription Ends</th>
                    <th className="py-5 px-6 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stores.map((store) => {
                    const owner = store.users.find(u => u.id === store.ownerId) || store.users[0];
                    return (
                      <tr key={store.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-5 px-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 transition-colors">{store.name}</span>
                            <span className="text-[10px] text-slate-500 italic mt-0.5">ID: {store.id}</span>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700">{owner?.name || "No Owner Assigned"}</span>
                            <span className="text-[10px] text-slate-500 mt-0.5">{owner?.email || "-"}</span>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          {getStatusBadge(store.status)}
                        </td>
                        <td className="py-5 px-6 text-slate-600 text-xs font-medium">
                          {formatDate(store.trialEndsAt)}
                        </td>
                        <td className="py-5 px-6 text-slate-600 text-xs font-medium">
                          {formatDate(store.subscriptionEndsAt)}
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenSubscriptionModal(store)}
                              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                            >
                              <Calendar size={11} /> Plan
                            </button>
                            <button
                              onClick={() => handleOpenPasswordModal(store)}
                              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                            >
                              <Lock size={11} /> Creds
                            </button>
                            <button
                              onClick={() => handleToggleSuspension(store)}
                              className={`px-3 py-1.5 border text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer ${
                                store.isSuspended
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                              }`}
                            >
                              <Power size={11} /> {store.isSuspended ? "Active" : "Suspend"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL 1: RESET PASSWORD */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Reset Tenant Owner Password"
        size="md"
      >
        <div className="bg-white text-slate-900 p-6 space-y-6">
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded text-amber-900 flex gap-3">
            <AlertTriangle className="shrink-0 text-amber-600" size={20} />
            <div className="text-xs">
              <span className="font-bold">Caution:</span> Resetting the password will update the primary login credentials for the store owner. Please communicate the new password securely.
            </div>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Store Name</label>
              <input
                type="text"
                disabled
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600"
                value={selectedStore?.name || ""}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">New Password</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                placeholder="e.g. TempPass123!"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : "Reset Password"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* MODAL 2: EDIT SUBSCRIPTION DATES */}
      <Modal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        title="Manage Tenant Subscription & Trial"
        size="md"
      >
        <div className="bg-white text-slate-900 p-6 space-y-6">
          <form onSubmit={handleUpdateSubscription} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Store Name</label>
              <input
                type="text"
                disabled
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600"
                value={selectedStore?.name || ""}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Trial Expiry Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-slate-800"
                  value={newTrialEndsAt}
                  onChange={(e) => setNewTrialEndsAt(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Subscription Expiry Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all text-slate-800"
                  value={newSubscriptionEndsAt}
                  onChange={(e) => setNewSubscriptionEndsAt(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-slate-600 text-[11px] leading-relaxed">
              * The store status is dynamically computed. If there is an active subscription date set in the future, status will resolve to <span className="font-bold text-emerald-600">Active</span>. If only the trial date is set in the future, it resolves to <span className="font-bold text-slate-900">Trialing</span>. Otherwise, it resolves to <span className="font-bold text-amber-600">Expired</span>.
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                onClick={() => setIsSubscriptionModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white shadow-sm rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}