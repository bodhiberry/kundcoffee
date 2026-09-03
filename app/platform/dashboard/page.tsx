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
  Loader2,
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Sliders,
  Check,
  Hash,
  Infinity as InfinityIcon
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { FeatureDefinition, LimitDefinition, ALL_LIMITS } from "@/lib/features";

interface StoreUser {
  id: string;
  name: string | null;
  email: string;
}

interface SubscriptionFeature {
  id: string;
  key: string;
  enabled: boolean;
}

interface SubscriptionLimit {
  id: string;
  key: string;
  value: number;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  durationDay: number;
  features: SubscriptionFeature[];
  limits?: SubscriptionLimit[];
  _count?: {
    stores: number;
  };
}

interface PlatformStore {
  id: string;
  name: string;
  ownerId: string;
  status: "TRIAL" | "ACTIVE" | "EXPIRED" | "SUSPENDED";
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  subscriptionId: string | null;
  subscription?: {
    id: string;
    name: string;
    features: SubscriptionFeature[];
    limits?: SubscriptionLimit[];
  } | null;
  isSuspended: boolean;
  createdAt: string;
  users: StoreUser[];
}

export default function PlatformDashboard() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"stores" | "plans">("stores");
  
  // Stores state
  const [stores, setStores] = useState<PlatformStore[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<PlatformStore | null>(null);

  // Plans state
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [availableFeatures, setAvailableFeatures] = useState<FeatureDefinition[]>([]);
  const [availableLimits, setAvailableLimits] = useState<LimitDefinition[]>(ALL_LIMITS);
  const [plansLoading, setPlansLoading] = useState(true);
  
  // Modals state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // Store subscription form state
  const [newPlanId, setNewPlanId] = useState<string>("");
  const [newTrialEndsAt, setNewTrialEndsAt] = useState("");
  const [newSubscriptionEndsAt, setNewSubscriptionEndsAt] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Plan creation/edit form state
  const [planFormName, setPlanFormName] = useState("");
  const [planFormPrice, setPlanFormPrice] = useState<number>(0);
  const [planFormDuration, setPlanFormDuration] = useState<number>(30);
  const [planFormFeatures, setPlanFormFeatures] = useState<string[]>([]);
  const [planFormLimits, setPlanFormLimits] = useState<Record<string, number>>({});

  const [actionLoading, setActionLoading] = useState(false);

  const fetchStores = async () => {
    try {
      setStoresLoading(true);
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
      setStoresLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const res = await fetch("/api/platform/plans");
      const data = await res.json();
      if (data.success) {
        setPlans(data.data.plans);
        setAvailableFeatures(data.data.availableFeatures);
        if (data.data.availableLimits) {
          setAvailableLimits(data.data.availableLimits);
        }
      } else {
        toast.error(data.message || "Failed to fetch plans");
      }
    } catch (err) {
      toast.error("Network connection error loading plans");
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
    fetchPlans();
  }, []);

  // Compute store metrics
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
    setNewPlanId(store.subscriptionId || store.subscription?.id || "");
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
          subscriptionId: newPlanId || null,
          trialEndsAt: newTrialEndsAt || null,
          subscriptionEndsAt: newSubscriptionEndsAt || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Store subscription updated");
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

  // Plan Form handlers
  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanFormName("");
    setPlanFormPrice(0);
    setPlanFormDuration(30);
    setPlanFormFeatures(["pos_orders", "menu_management", "table_qr"]);
    
    // Default initial limits from basic template
    const initialLimits: Record<string, number> = {};
    availableLimits.forEach((l) => {
      initialLimits[l.key] = l.defaultBasic;
    });
    setPlanFormLimits(initialLimits);
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setPlanFormName(plan.name);
    setPlanFormPrice(plan.price);
    setPlanFormDuration(plan.durationDay);
    setPlanFormFeatures(plan.features.map(f => f.key));

    const currentLimits: Record<string, number> = {};
    availableLimits.forEach((l) => {
      const match = plan.limits?.find((pl) => pl.key === l.key);
      currentLimits[l.key] = match !== undefined ? match.value : l.defaultBasic;
    });
    setPlanFormLimits(currentLimits);
    setIsPlanModalOpen(true);
  };

  const handleToggleFeature = (key: string) => {
    setPlanFormFeatures(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleLimitChange = (key: string, value: number) => {
    setPlanFormLimits(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleToggleUnlimitedLimit = (key: string) => {
    setPlanFormLimits(prev => {
      const current = prev[key];
      const limitDef = availableLimits.find(l => l.key === key);
      return {
        ...prev,
        [key]: current === -1 ? (limitDef?.defaultBasic || 10) : -1,
      };
    });
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planFormName.trim()) {
      toast.error("Plan name is required");
      return;
    }

    setActionLoading(true);
    try {
      const isEdit = !!editingPlan;
      const res = await fetch("/api/platform/plans", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPlan?.id,
          name: planFormName,
          price: planFormPrice,
          durationDay: planFormDuration,
          featureKeys: planFormFeatures,
          limits: planFormLimits,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Plan saved successfully");
        setIsPlanModalOpen(false);
        fetchPlans();
      } else {
        toast.error(data.message || "Failed to save plan");
      }
    } catch (err) {
      toast.error("Network error while saving plan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePlan = async (plan: SubscriptionPlan) => {
    if (!confirm(`Are you sure you want to delete plan "${plan.name}"?`)) return;

    try {
      const res = await fetch(`/api/platform/plans?id=${plan.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Plan deleted successfully");
        fetchPlans();
      } else {
        toast.error(data.message || "Failed to delete plan");
      }
    } catch (err) {
      toast.error("Error deleting plan");
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

        {/* Top Nav Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab("stores")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "stores"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Store size={14} />
            Stores ({stores.length})
          </button>
          <button
            onClick={() => setActiveTab("plans")}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "plans"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Layers size={14} />
            Subscription Plans ({plans.length})
          </button>
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
        
        {/* ================= STORES TAB ================= */}
        {activeTab === "stores" && (
          <>
            {/* Title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tight">
                  Tenant Registry
                </h2>
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1 font-bold">
                  Manage client stores, assigned tier plans, trial periods, and account access
                </p>
              </div>
              <button 
                onClick={fetchStores}
                id="refresh-stores-btn"
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCcw size={13} className={storesLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            {/* Metrics Section */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl flex flex-col gap-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Total Stores</span>
                <span className="text-2xl font-black text-slate-900">{storesLoading ? "-" : totalStores}</span>
              </div>
              <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl flex flex-col gap-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Active Billing</span>
                <span className="text-2xl font-black text-emerald-600">{storesLoading ? "-" : activeStores}</span>
              </div>
              <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl flex flex-col gap-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Trial Stores</span>
                <span className="text-2xl font-black text-slate-900">{storesLoading ? "-" : trialStores}</span>
              </div>
              <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl flex flex-col gap-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Suspended</span>
                <span className="text-2xl font-black text-red-600">{storesLoading ? "-" : suspendedStores}</span>
              </div>
              <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl flex flex-col gap-2 col-span-2 md:col-span-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Subscriptions Expired</span>
                <span className="text-2xl font-black text-amber-600">{storesLoading ? "-" : expiredStores}</span>
              </div>
            </div>

            {/* Stores Table Panel */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              {storesLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 size={36} className="animate-spin text-slate-900" />
                  <span className="text-xs uppercase tracking-widest font-black">Loading Stores...</span>
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
                        <th className="py-5 px-6">Assigned Plan</th>
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
                        const planName = store.subscription?.name || "Standard (Default)";
                        const featuresCount = store.subscription?.features?.length ?? 0;
                        return (
                          <tr key={store.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="py-5 px-6">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 transition-colors">{store.name}</span>
                                <span className="text-[10px] text-slate-500 italic mt-0.5">ID: {store.id}</span>
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex flex-col items-start gap-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider text-gray-700 bg-slate-100">
                                  {planName}
                                </span>
                                {featuresCount > 0 && (
                                  <span className="text-[10px] text-slate-500 font-semibold">
                                    {featuresCount} features unlocked
                                  </span>
                                )}
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
                                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Calendar size={11} /> Plan & Dates
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
          </>
        )}

        {/* ================= PLANS & FEATURES TAB ================= */}
        {activeTab === "plans" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tight">
                  Subscription Plans & Granular Limits
                </h2>
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1 font-bold">
                  Create, customize, and configure pricing, module permissions, and entity limits for each tier
                </p>
              </div>
              <button 
                onClick={handleOpenCreatePlan}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white shadow-md rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                <Plus size={14} />
                Create New Plan
              </button>
            </div>

            {plansLoading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500 bg-white rounded-3xl border border-slate-200">
                <Loader2 size={36} className="animate-spin text-slate-900" />
                <span className="text-xs uppercase tracking-widest font-black">Loading Plans...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const activeKeys = plan.features.map(f => f.key);
                  const isBasic = plan.name.toLowerCase().includes("basic");
                  const isPremium = plan.name.toLowerCase().includes("premium") || plan.name.toLowerCase().includes("pro");

                  return (
                    <div 
                      key={plan.id}
                      className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                    >
                      {/* Top Header Card */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                            isPremium 
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : isBasic
                                ? "bg-slate-100 text-slate-700 border-slate-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}>
                            {plan.durationDay} Days Cycle
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditPlan(plan)}
                              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                              title="Edit Plan"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan)}
                              className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete Plan"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                            {plan.name}
                          </h3>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-2xl font-black text-slate-900">
                              {plan.price === 0 ? "Free / Custom" : `$${plan.price}`}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                              / {plan.durationDay} days
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 block mt-1">
                            Active on {plan._count?.stores || 0} store(s)
                          </span>
                        </div>

                        <hr className="border-slate-100 my-2" />

                        {/* Granular Limits Snapshot */}
                        <div className="space-y-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                            <Hash size={11} /> Configured Resource Limits
                          </span>
                          <div className="grid grid-cols-2 gap-1.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                            {availableLimits.slice(0, 6).map((l) => {
                              const match = plan.limits?.find(pl => pl.key === l.key);
                              const val = match !== undefined ? match.value : l.defaultBasic;
                              return (
                                <div key={l.key} className="flex items-center justify-between text-[11px] py-0.5">
                                  <span className="text-slate-500 truncate mr-1">{l.name.replace("Max ", "")}:</span>
                                  <span className="font-bold text-slate-800">
                                    {val === -1 ? (
                                      <span className="text-emerald-600 font-extrabold flex items-center gap-0.5">
                                        <InfinityIcon size={12} />
                                      </span>
                                    ) : (
                                      val
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Feature Checklist List */}
                        <div className="space-y-2.5">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                            Included Modules ({activeKeys.length}/{availableFeatures.length})
                          </span>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {availableFeatures.map((feature) => {
                              const isIncluded = activeKeys.includes(feature.key);
                              return (
                                <div
                                  key={feature.key}
                                  className={`flex items-center gap-2.5 text-xs py-1 px-2 rounded-lg transition-colors ${
                                    isIncluded
                                      ? "text-slate-800 font-semibold bg-slate-50"
                                      : "text-slate-400 font-normal line-through opacity-60"
                                  }`}
                                >
                                  {isIncluded ? (
                                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                                  )}
                                  <span className="truncate">{feature.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-6 mt-4 border-t border-slate-100">
                        <button
                          onClick={() => handleOpenEditPlan(plan)}
                          className="w-full py-2.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Sliders size={13} />
                          Configure Plan & Limits
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
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
              <span className="font-bold">Caution:</span> Resetting the password will update the primary login credentials for the store owner.
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

      {/* MODAL 2: EDIT SUBSCRIPTION DATES & ASSIGN PLAN */}
      <Modal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        title="Manage Store Subscription Plan & Access"
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

            {/* Plan Selector Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Assigned Subscription Plan (Access Tier)
              </label>
              <select
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                value={newPlanId}
                onChange={(e) => setNewPlanId(e.target.value)}
              >
                <option value="">Default Plan (Unassigned)</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.price} / {p.durationDay} days - {p.features.length} features included)
                  </option>
                ))}
              </select>
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
              * Assigning a plan determines exactly which modules this store can access and enforces their maximum entity quotas (tables, staff, menu items, etc.) on the backend.
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

      {/* MODAL 3: CREATE / EDIT SUBSCRIPTION PLAN WITH GRANULAR LIMITS & FEATURES */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title={editingPlan ? `Edit Plan: ${editingPlan.name}` : "Create Custom Subscription Plan"}
        size="lg"
      >
        <div className="bg-white text-slate-900 p-6 space-y-6 max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSavePlan} className="space-y-6">
            
            {/* Top Config Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1 md:col-span-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Plan Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basic / Standard / Pro"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  value={planFormName}
                  onChange={(e) => setPlanFormName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Price ($ / Period)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  value={planFormPrice}
                  onChange={(e) => setPlanFormPrice(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                  value={planFormDuration}
                  onChange={(e) => setPlanFormDuration(parseInt(e.target.value) || 30)}
                />
              </div>
            </div>

            {/* SECTION 1: GRANULAR RESOURCE LIMITS */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-1.5">
                    <Hash size={13} className="text-slate-700" />
                    Resource Limits & Quotas (Server-Enforced)
                  </label>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Configure exact caps for each entity. Toggle Unlimited for unconstrained access.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-2 border border-slate-200/80 rounded-2xl bg-slate-50/60">
                {availableLimits.map((limit) => {
                  const val = planFormLimits[limit.key] !== undefined ? planFormLimits[limit.key] : limit.defaultBasic;
                  const isUnlimited = val === -1;

                  return (
                    <div
                      key={limit.key}
                      className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">{limit.name}</span>
                          <span className="text-[9px] text-slate-500 font-medium block">{limit.description}</span>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {limit.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="0"
                            disabled={isUnlimited}
                            value={isUnlimited ? "" : val}
                            placeholder={isUnlimited ? "Unlimited" : "0"}
                            onChange={(e) => handleLimitChange(limit.key, parseInt(e.target.value) || 0)}
                            className={`w-full px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                              isUnlimited
                                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed italic"
                                : "bg-white border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                            }`}
                          />
                          {!isUnlimited && (
                            <span className="absolute right-2.5 top-2 text-[9px] font-bold text-slate-400">
                              {limit.unit}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleUnlimitedLimit(limit.key)}
                          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                            isUnlimited
                              ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <InfinityIcon size={12} />
                          {isUnlimited ? "Unlimited" : "Set Cap"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: MODULE FEATURE PERMISSIONS */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-900">
                    Feature Module Access (Check to Enable)
                  </label>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    Toggle which navigation sections and functional modules are visible
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {planFormFeatures.length} of {availableFeatures.length} enabled
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2 border border-slate-200/80 rounded-2xl bg-slate-50/60">
                {availableFeatures.map((feature) => {
                  const isChecked = planFormFeatures.includes(feature.key);
                  return (
                    <div
                      key={feature.key}
                      onClick={() => handleToggleFeature(feature.key)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? "bg-white border-slate-900 shadow-sm"
                          : "bg-white/60 border-slate-200 hover:border-slate-300 opacity-70"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isChecked ? "bg-slate-900 text-white" : "border border-slate-300"
                      }`}>
                        {isChecked && <Check size={12} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{feature.name}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">
                            {feature.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                onClick={() => setIsPlanModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white shadow-sm rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : editingPlan ? "Save Changes" : "Create Plan"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

    </div>
  );
}