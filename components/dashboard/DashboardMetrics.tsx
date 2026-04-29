"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  ShoppingCart,
  Wallet,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useSettings } from "@/components/providers/SettingsProvider";

type MetricType = "SALES" | "PURCHASE" | "DIFFERENCE";

export default function DashboardMetrics() {
  const { settings } = useSettings();
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<MetricType>("SALES");
  const [hasActiveSession, setHasActiveSession] = useState(false);

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/metrics`);
        const data = await res.json();
        if (data.success) {
          setMetrics(data.data);
          setHasActiveSession(data.hasActiveSession);
        }
      } catch (error) {
        console.error("Failed to fetch metrics", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
    
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  const metricConfig: Record<MetricType, any> = {
    SALES: {
      label: "Total Sales",
      value: metrics.sales || 0,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      accent: "emerald",
    },
    PURCHASE: {
      label: "Total Purchase",
      value: metrics.purchases || 0,
      icon: ShoppingCart,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
      accent: "rose",
    },
    DIFFERENCE: {
      label: "Net Difference",
      value: (metrics.sales || 0) - (metrics.purchases || 0),
      icon: Wallet,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      accent: "blue",
    },
  };

  if (loading && !metrics.sales) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white rounded-3xl border border-zinc-100 shadow-sm" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Header Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${hasActiveSession ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`} />
          <h2 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">
            {hasActiveSession ? "Current Active Session" : "No Active Session"}
          </h2>
        </div>
        {hasActiveSession && (
          <span className="text-[9px] font-bold px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
            <Clock size={10} /> Live Data Tracking
          </span>
        )}
      </div>

      {/* Main Premium Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Object.entries(metricConfig) as [MetricType, any][]).map(([key, config]) => {
          const Icon = config.icon;
          const isDifference = key === "DIFFERENCE";
          const diffValue = config.value;
          const isNegative = isDifference && diffValue < 0;

          return (
            <div
              key={key}
              className={`bg-white p-8 rounded-[32px] border ${config.border} shadow-sm relative overflow-hidden group transition-all hover:shadow-xl hover:shadow-zinc-200/50 hover:-translate-y-1`}
            >
              {/* Decorative Background Element */}
              <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-700 ${config.bg}`} />
              
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${config.bg} ${config.color}`}>
                      <Icon size={16} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      {config.label}
                    </span>
                  </div>
                  
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[11px] font-bold text-zinc-400 mb-2">{settings.currency}</span>
                      <span className={`text-3xl font-black tracking-tight ${isNegative ? 'text-rose-600' : 'text-zinc-900'}`}>
                        {Math.abs(config.value).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${hasActiveSession ? 'text-emerald-500' : 'text-zinc-400'}`}>
                        {hasActiveSession ? 'Session Live' : 'Not Tracking'}
                      </span>
                      {isDifference && config.value !== 0 && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isNegative ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {isNegative ? 'Deficit' : 'Surplus'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Credit Tracking Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 p-6 rounded-[24px] text-white flex items-center justify-between border border-zinc-800 shadow-xl">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Session Credit Sales</p>
            <p className="text-2xl font-black text-emerald-400">{settings.currency} {(metrics.creditSales || 0).toLocaleString()}</p>
            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Pending Customer Due (+)</p>
          </div>
          <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-emerald-400">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-zinc-900 p-6 rounded-[24px] text-white flex items-center justify-between border border-zinc-800 shadow-xl">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Session Credit Purchases</p>
            <p className="text-2xl font-black text-rose-400">{settings.currency} {(metrics.creditPurchases || 0).toLocaleString()}</p>
            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Pending Supplier Due (-)</p>
          </div>
          <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-rose-400">
            <ShoppingCart size={24} />
          </div>
        </div>
      </div>

      {!hasActiveSession && (
        <div className="bg-amber-50/50 border border-amber-100 p-5 rounded-3xl flex flex-col md:flex-row md:items-center gap-4 text-amber-900 shadow-sm shadow-amber-100/50">
          <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
            <AlertCircle size={20} />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-[11px] font-black uppercase tracking-widest">Session Required</h4>
            <p className="text-xs font-medium text-amber-700/80">
              Your real-time dashboard is paused. Open a new session in <span className="font-bold underline cursor-pointer" onClick={() => window.location.href='/dashboard/finance'}>Finance Management</span> to start tracking today's sales and purchases.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
