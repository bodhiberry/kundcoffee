"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronRight } from "lucide-react";
import { useSettings } from "@/components/providers/SettingsProvider";

type ChartDataPoint = {
  date: string;
  total: number;
};

export default function SalesLineChart() {
  const { settings } = useSettings();
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Interaction states
  const [selectedPoint, setSelectedPoint] = useState<ChartDataPoint | null>(
    null,
  );

  useEffect(() => {
    async function fetchChartData() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("type", "chart");
        
        // No dates appended, defaults to session hourly data from the updated API
        const res = await fetch(`/api/dashboard/metrics?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          if (json.data.length > 0 && !selectedPoint) {
            setSelectedPoint(json.data[json.data.length - 1]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch chart data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchChartData();
    const interval = setInterval(fetchChartData, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">Session Sales Trend</h3>
          <p className="text-xs text-zinc-500 font-medium italic">
            Hourly performance in current session
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Area */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm min-h-[350px]">
          {loading && data.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : data.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                      setSelectedPoint(
                        e.activePayload[0].payload as ChartDataPoint,
                      );
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f4f4f5"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#71717a" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#71717a" }}
                    tickFormatter={(value) =>
                      `${settings.currency}${value.toLocaleString()}`
                    }
                    dx={-10}
                  />
                  <Tooltip
                    cursor={{
                      stroke: "#10b981",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      border: "none",
                      fontSize: "12px",
                    }}
                    formatter={(value: number | undefined) => [
                      `${settings.currency} ${(value || 0).toLocaleString()}`,
                      "Sales",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    activeDot={{
                      r: 6,
                      strokeWidth: 0,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400">
              <p>No activity yet in this session</p>
            </div>
          )}
        </div>

        {/* Detailed View */}
        <div className="lg:col-span-1">
          {selectedPoint ? (
            <div className="bg-zinc-900 text-white p-8 rounded-3xl h-full flex flex-col justify-between shadow-xl shadow-zinc-200">
              <div>
                <h4 className="text-zinc-400 font-bold text-xs uppercase tracking-widest mb-2">
                  Selected Hour
                </h4>
                <p className="text-2xl font-bold">
                  {selectedPoint.date}
                </p>
              </div>

              <div className="my-8">
                <h4 className="text-zinc-400 font-bold text-xs uppercase tracking-widest mb-2">
                  Sales at this Hour
                </h4>
                <p className="text-5xl font-black tracking-tighter text-emerald-400">
                  {settings.currency} {selectedPoint.total.toLocaleString()}
                </p>
              </div>

              <div className="bg-zinc-800/50 rounded-2xl p-4 flex items-center justify-between group cursor-pointer hover:bg-zinc-800 transition-colors">
                <span className="text-sm font-medium text-zinc-300">
                  Real-time tracking
                </span>
                <ChevronRight
                  size={16}
                  className="text-zinc-500"
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 p-8 rounded-3xl h-full flex items-center justify-center border border-slate-200 border-dashed">
              <p className="text-zinc-400 text-center text-sm font-medium uppercase tracking-widest">
                Analytics for current session
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
