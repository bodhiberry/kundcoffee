"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  ShoppingCart,
  Wallet,
  CreditCard,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { useSettings } from "@/components/providers/SettingsProvider";
import { DateRangeSelector } from "@/components/ui/DateRangeSelector";

type MetricType =
  | "SALES"
  | "PURCHASE"
  | "Differnece"
  // | "EXPENSES"
  // | "PAYMENT_IN"
  // | "PAYMENT_OUT";

export default function DashboardMetrics() {
  const { settings } = useSettings();
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<MetricType>("SALES");
  const [isSessionData, setIsSessionData] = useState(false);

  // Date states
  const [currentDate, setCurrentDate] = useState("");
  const [currentMonth, setCurrentMonth] = useState(
    (new Date().getMonth() + 1).toString(),
  );
  const [currentYear, setCurrentYear] = useState(
    new Date().getFullYear().toString(),
  );

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        
        // If no filter is provided, the API will default to current session
        if (currentDate) {
          params.append("date", currentDate);
          params.append("filter", "custom");
        } else if (currentMonth && currentYear) {
          const isCurrentMonth = (new Date().getMonth() + 1).toString() === currentMonth && 
                                 new Date().getFullYear().toString() === currentYear;
          
          // Only show session data if no specific month/year is selected or if current month is selected
          if (!isCurrentMonth) {
            params.append("month", currentMonth);
            params.append("year", currentYear);
            params.append("filter", "custom");
          }
        }

        const res = await fetch(`/api/dashboard/metrics?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setMetrics(data.data);
          setIsSessionData(data.isSessionData);
        }
      } catch (error) {
        console.error("Failed to fetch metrics", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, [currentDate, currentMonth, currentYear]);

  const metricConfig = {
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
      value: metrics.income - metrics.purchases,
      icon: Wallet,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    // EXPENSES: {
    //   label: "Total Expenses",
    //   value: metrics.expenses,
    //   icon: CreditCard,
    //   color: "text-red-600",
    //   bg: "bg-red-50",
    // },
    // PAYMENT_IN: {
    //   label: "Payment In",
    //   value: metrics.paymentIn,
    //   icon: ArrowDownLeft,
    //   color: "text-green-600",
    //   bg: "bg-green-50",
    // },
    // PAYMENT_OUT: {
    //   label: "Payment Out",
    //   value: metrics.paymentOut,
    //   icon: ArrowUpRight,
    //   color: "text-orange-600",
    //   bg: "bg-orange-50",
    // },
  };

  const getFilterLabel = () => {
    if (isSessionData) return "Current Active Session";
    if (currentDate) return new Date(currentDate).toLocaleDateString();
    if (currentMonth && currentYear) {
      const monthName = new Date(
        parseInt(currentYear),
        parseInt(currentMonth) - 1,
      ).toLocaleString("default", { month: "long" });
      return `${monthName} ${currentYear}`;
    }
    return "This Month";
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
          {isSessionData && (
            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full w-fit">
              <Clock size={12} className="animate-pulse" />
              Live Session Metrics
            </div>
          )}
        </div>
        <DateRangeSelector
          currentDate={currentDate}
          currentMonth={currentMonth}
          currentYear={currentYear}
          onDateChange={setCurrentDate}
          onMonthChange={(m) => {
            setCurrentMonth(m);
            setCurrentDate("");
          }}
          onYearChange={(y) => {
            setCurrentYear(y);
            setCurrentDate("");
          }}
        />
      </div>

      {/* Main Metric Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Primary Selected Metric */}
        <div className="col-span-1 md:col-span-2 lg:col-span-4">
          <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm flex items-center justify-between relative overflow-hidden">
            {loading && (
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
              <p className="text-xs font-bold text-zinc-400">
                {getFilterLabel()}
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
                {loading && (
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] z-10" />
                )}
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

      {!isSessionData && !currentDate && currentMonth === (new Date().getMonth() + 1).toString() && !metrics.hasActiveSession && (
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-4 text-amber-800">
          <AlertCircle className="shrink-0" size={20} />
          <p className="text-xs font-bold uppercase tracking-widest">
            Showing partial monthly data. Start a new day session to see live tracking.
          </p>
        </div>
      )}
    </div>
  );
}
