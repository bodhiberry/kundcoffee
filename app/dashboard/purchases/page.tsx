"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageHeaderAction } from "@/components/ui/PageHeaderAction";
import { MetricCard } from "@/components/ui/MetricCard";
import { CustomTable } from "@/components/ui/CustomTable";
import { Purchase } from "@/lib/types";
import { Package, TrendingUp, UserCheck, Trash2, Printer, Search } from "lucide-react";
import PurchaseModal from "@/components/procurement/PurchaseModal";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { DateRangeSelector } from "@/components/ui/DateRangeSelector";
import { SidePanel } from "@/components/ui/SidePanel";
import PurchaseDetailView from "@/components/procurement/PurchaseDetailView";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [metrics, setMetrics] = useState({
    totalPurchaseCount: 0,
    totalAmount: 0,
    leadingSupplier: "N/A",
  });
  const [todayMetrics, setTodayMetrics] = useState({
    total: 0,
    cash: 0,
    digital: 0,
    credit: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);

  const [dateFilter, setDateFilter] = useState("this_month");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  );

  const fetchPurchases = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (selectedDate) {
        queryParams.append("date", selectedDate);
      } else if (selectedMonth && selectedYear) {
        queryParams.append("month", selectedMonth);
        queryParams.append("year", selectedYear);
      } else if (dateFilter) {
        queryParams.append("filter", dateFilter);
      }

      const res = await fetch(`/api/purchases?${queryParams.toString()}`, { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        setPurchases(data.data.purchases);
        setFilteredPurchases(data.data.purchases);
        setMetrics(data.data.metrics);
        setTodayMetrics(data.data.todayMetrics);
      }
    } catch (error) {
      console.error("Failed to fetch purchases", error);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [dateFilter, selectedDate, selectedMonth, selectedYear]);

  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();
    setFilteredPurchases(
      purchases.filter(
        (p) =>
          p.referenceNumber.toLowerCase().includes(lowerQuery) ||
          p.supplier.toLowerCase().includes(lowerQuery),
      ),
    );
  }, [searchQuery, purchases]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/purchases/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Purchase deleted and stock reverted");
        fetchPurchases();
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch (error) {
      toast.error("Error deleting purchase");
    } finally {
      setDeleteId(null);
    }
  };

  const handleExport = () => {
    const headers = [
      "Invoice No",
      "Supplier",
      "Amount",
      "Status",
      "Mode",
      "Date",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredPurchases.map((p) =>
        [
          p.referenceNumber,
          p.supplier,
          p.totalAmount,
          p.paymentStatus,
          p.paymentMode,
          new Date(p.txnDate).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "purchases.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-8 bg-zinc-50 min-h-screen">
      <PageHeaderAction
        title="Purchases"
        description="Track incoming stock and vendor bills"
        onExport={handleExport}
        actionButton={
          <Button onClick={() => setIsModalOpen(true)}>New Purchase</Button>
        }
      />

      {/* Premium Today's Summary Card */}
      <div className="bg-zinc-900 text-white p-8 rounded-3xl shadow-2xl border border-white/5 relative overflow-hidden group">
        {/* Subtle Background Pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 space-y-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Today purchase</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              <span className="text-zinc-500 text-2xl mr-2">Rs.</span>
              {todayMetrics.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>

          <div className="h-px bg-white/10 w-full" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">CASH Purchase</p>
              <p className="text-xl font-black">
                <span className="text-xs text-zinc-600 mr-1">Rs.</span>
                {todayMetrics.cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">DIGITAL Purchase</p>
              <p className="text-xl font-black text-emerald-400">
                <span className="text-xs text-emerald-900 mr-1">Rs.</span>
                {todayMetrics.digital.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Credit Purchase</p>
              <p className="text-xl font-black text-emerald-400">
                <span className="text-xs text-emerald-900 mr-1">Rs.</span>
                {todayMetrics.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Overall Purchases"
          value={metrics.totalPurchaseCount}
          icon={Package}
          trend="Total Bills"
        />
        <MetricCard
          title="Overall Spending"
          value={`Rs. ${metrics.totalAmount.toLocaleString()}`}
          icon={TrendingUp}
          trend="Total Value"
        />
        <MetricCard
          title="Total Quantity"
          value={(metrics as any).totalQuantityPurchased?.toLocaleString() || 0}
          icon={Package}
          trend="Pieces/Units"
        />
        <MetricCard
          title="Lead Supplier"
          value={metrics.leadingSupplier}
          icon={UserCheck}
          trend="Top Vendor"
        />
      </div>

      <div className="flex flex-col gap-6 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group w-80">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors"
                size={14}
              />
              <input
                type="text"
                placeholder="Search invoices or suppliers..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-medium focus:border-zinc-900 transition-all outline-none h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-44">
              <CustomDropdown
                options={[
                  { id: "today", name: "Today" },
                  { id: "yesterday", name: "Yesterday" },
                  { id: "this_month", name: "This Month" },
                  { id: "this_year", name: "This Year" },
                ]}
                value={dateFilter}
                onChange={(val) => {
                  setDateFilter(val);
                  setSelectedDate("");
                  setSelectedMonth("");
                }}
                placeholder="Quick Filters"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-50 pt-6">
          <DateRangeSelector
            onDateChange={(val) => {
              setSelectedDate(val);
              setDateFilter("");
              setSelectedMonth("");
            }}
            onMonthChange={(val) => {
              setSelectedMonth(val);
              setDateFilter("");
              setSelectedDate("");
            }}
            onYearChange={setSelectedYear}
            currentDate={selectedDate}
            currentMonth={selectedMonth}
            currentYear={selectedYear}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">
            Purchase Register
          </h3>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
                Most Purchased:{" "}
              </span>
              <span className="text-xs font-bold text-emerald-700 ml-1">
                {(metrics as any).mostPurchasedItem || "N/A"}
              </span>
            </div>
            <span className="text-xs text-zinc-400 font-medium">
              {filteredPurchases.length} invoices found
            </span>
          </div>
        </div>
        <CustomTable
          columns={[
            { header: "SN", accessor: (_, i) => i + 1 },
            {
              header: "Invoice No",
              accessor: (p: any) => (
                <div className="flex flex-col">
                  <span className="font-mono text-xs uppercase font-black text-zinc-900 tracking-tighter">
                    {p.referenceNumber}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    {new Date(p.txnDate).toLocaleDateString()}
                  </span>
                </div>
              ),
            },
            {
              header: "Supplier",
              accessor: (p: any) => (
                <span className="font-bold text-zinc-700">{p.supplier}</span>
              ),
            },
            {
              header: "Total Amount",
              accessor: (p: any) => (
                <span className="font-black text-zinc-900 font-sans">
                  Rs. {p.totalAmount.toLocaleString()}
                </span>
              ),
            },
            {
              header: "Status",
              accessor: (p: any) => (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                    p.paymentStatus === "PAID"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : "bg-amber-50 text-amber-600 border-amber-100"
                  }`}
                >
                  {p.paymentStatus}
                </span>
              ),
            },
            {
              header: "Actions",
              accessor: (p: any) => (
                <div
                  className="flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="none"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-zinc-100 rounded-full transition-colors"
                  >
                    <Printer className="h-4 w-4 text-zinc-500" />
                  </Button>
                  <Button
                    variant="none"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-rose-50 rounded-full transition-colors"
                    onClick={() => setDeleteId(p.id)}
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredPurchases}
          onRowClick={(row) => setSelectedPurchase(row)}
        />
      </div>

      <SidePanel
        isOpen={!!selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
        title="Purchase Detail"
      >
        {selectedPurchase && <PurchaseDetailView id={selectedPurchase.id} />}
      </SidePanel>

      <PurchaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPurchases}
      />

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Purchase Bill"
        message="Are you sure you want to delete this purchase? This will revert the stock quantities."
        confirmVariant="danger"
      />
    </div>
  );
}
