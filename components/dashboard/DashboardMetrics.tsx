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

type MetricType =
  | "SALES"
  | "PURCHASE"
  | "Differnece";

export default function DashboardMetrics() {
  const { settings } = useSettings();
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<MetricType>("SALES");
  const [isSessionData, setIsSessionData] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      try {
        // Fetch metrics without parameters - API defaults to active session
        const res = await fetch(`/api/dashboard/metrics`);
        const data = await res.json();
        if (data.success) {
          setMetrics(data.data);
          setIsSessionData(data.isSessionData);
          setHasActiveSession(data.hasActiveSession);
        }
      } catch (error) {
        console.error("Failed to fetch metrics", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
    
    // Refresh interval for live data (every minute)
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  const metricConfig: Record<MetricType, any> = {
    SALES: {
      label: "Total Sales",
      value: metrics.sales,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    PURCHASE: {
      label: "Total Purchase",
      value: metrics.purchases,
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    Differnece: {
      label: "Difference",
      value: (metrics.income || 0) - (metrics.purchases || 0),
      icon: Wallet,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(metricConfig) as MetricType[]).map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                  activeType === type
                    ? "bg-zinc-900 text-white border-zinc-900 shadow-lg shadow-zinc-200"
                    : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                {type?.replace("_", " ")}
              </button>
            ))}
          </div>
          {isSessionData && hasActiveSession && (
            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full w-fit">
              <Clock size={12} className="animate-pulse" />
              Live Session Metrics
            </div>
          )}
        </div>
      </div>

      {/* Main Metric Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="col-span-1 md:col-span-2 lg:col-span-4">
          <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm flex items-center justify-between relative overflow-hidden">
            {loading && !metrics.sales && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
              </div>
            )}
            <div className="space-y-2">
              <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">
                {metricConfig[activeType].label}
              </h3>
              <p className="text-4xl font-black text-zinc-900 tracking-tight">
                {settings.currency}{" "}
                {(metricConfig[activeType].value || 0).toLocaleString()}
              </p>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                {hasActiveSession ? "Current Active Session" : "No Active Session"}
              </p>
            </div>
            <div className={`p-6 rounded-2xl ${metricConfig[activeType].bg}`}>
              {(() => {
                const Icon = metricConfig[activeType].icon;
                return (
                  <Icon size={32} className={metricConfig[activeType].color} />
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Overview (Mini Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {(Object.entries(metricConfig) as [MetricType, any][]).map(
          ([key, config]) => {
            if (key === activeType) return null;
            const Icon = config.icon;
            return (
              <div
                key={key}
                onClick={() => setActiveType(key)}
                className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm cursor-pointer hover:border-zinc-200 transition-all group relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`p-2 rounded-lg ${config.bg} group-hover:scale-110 transition-transform`}
                  >
                    <Icon size={14} className={config.color} />
                  </div>
                </div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest truncate">
                  {config.label}
                </p>
                <p className="text-sm font-bold text-zinc-900 mt-1">
                  {settings.currency} {(config.value || 0).toLocaleString()}
                </p>
              </div>
            );
          },
        )}
      </div>

      {!hasActiveSession && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-4 text-amber-800">
          <AlertCircle className="shrink-0" size={20} />
          <p className="text-xs font-bold uppercase tracking-widest">
            No active session. Start a new day session in Finance to begin tracking today's data.
          </p>
        </div>
      )}
    </div>
  );
}
