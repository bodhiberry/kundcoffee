"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Download,
  Trash2,
  Filter,
  Plus,
  ArrowLeftRight,
  TrendingUp,
  CreditCard,
  History,
  Receipt,
  Printer,
  ChevronRight,
  RefreshCcw,
  MoreVertical,
  Package,
  ShoppingCart,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { Modal } from "@/components/ui/Modal";
import { Popover } from "@/components/ui/Popover";
import { SidePanel } from "@/components/ui/SidePanel";
import { toast } from "sonner";
import { DateRangeSelector } from "@/components/ui/DateRangeSelector";
import { PaymentMethod, ReturnPaymentStatus, SalesReturn } from "@/lib/types";
import { useSettings } from "@/components/providers/SettingsProvider";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

import { DailySessionManager } from "@/components/finance/DailySessionManager";

type Tab = "SALES" | "RETURNS" | "DAILY_SESSIONS";

export default function FinancePage() {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>("SALES");
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<any>({
    metrics: {},
    transactions: [],
  });
  const [returnsData, setReturnsData] = useState<any>({
    metrics: {},
    returns: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("this_month");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  );
  const [selectedTxn, setSelectedTxn] = useState<any>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [deleteTxn, setDeleteTxn] = useState<{
    id: string;
    type: "SALES" | "RETURNS";
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedDate) {
        queryParams.append("date", selectedDate);
      } else if (selectedMonth && selectedYear) {
        queryParams.append("month", selectedMonth);
        queryParams.append("year", selectedYear);
      } else {
        queryParams.append("filter", dateFilter);
      }

      if (activeTab === "SALES") {
        const res = await fetch(`/api/finance/sales?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) setSalesData(data.data);
      } else {
        const res = await fetch(
          `/api/finance/returns?${queryParams.toString()}`,
        );
        const data = await res.json();
        if (data.success) setReturnsData(data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch finance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, dateFilter, selectedDate, selectedMonth, selectedYear]);

  const handleExport = () => {
    const data =
      activeTab === "SALES" ? salesData.transactions : returnsData.returns;
    const csvContent =
      "data:text/csv;charset=utf-8," +
      (activeTab === "SALES"
        ? "ID,Order Type,Amount,Mode,Status,Date,Customer\n"
        : "ID,Parties,Amount,Mode,Status,Date\n") +
      data
        .map((row: any) =>
          activeTab === "SALES"
            ? `${row.id},${row.orderType},${row.amount},${row.mode},${row.status},${row.date},${row.customer}`
            : `${row.id},${row.parties},${row.txnAmount},${row.mode},${row.status},${row.txnDate}`,
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeTab.toLowerCase()}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = (txn: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = txn.items
      ?.map(
        (it: any) => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px;">
        <span>${it.dishName} x ${it.quantity}</span>
        <span>${settings.currency} ${it.amount.toFixed(2)}</span>
      </div>
    `,
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${txn.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #000; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
            .meta { margin-bottom: 15px; font-size: 12px; }
            .items { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
            .totals { font-weight: bold; font-size: 14px; }
            @media print {
              body { padding: 0; }
              @page { size: 80mm auto; margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>BODHIBERRY</h2>
            <p>TAX INVOICE</p>
          </div>
          <div class="meta">
            <p>ID: ${txn.id.toUpperCase()}</p>
            <p>Date: ${new Date(txn.date || txn.txnDate).toLocaleString()}</p>
            <p>Customer: ${txn.customer || "Walking Guest"}</p>
          </div>
          <div class="items">
            ${itemsHtml}
          </div>
          <div class="totals">
            <div style="display: flex; justify-content: space-between;">
              <span>GRAND TOTAL</span>
              <span>${settings.currency} ${txn.amount.toFixed(2)}</span>
            </div>
          </div>
          <div style="text-align: center; margin-top: 30px; font-size: 10px;">
            <p>Thank you for visiting!</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const moveToTrash = async (id: string, tab: "SALES" | "RETURNS") => {
    try {
      const endpoint =
        tab === "SALES" ? `/api/finance/sales/${id}` : `/api/finance/returns/${id}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(
          tab === "SALES"
            ? "Sale deleted successfully"
            : "Return deleted successfully",
        );
        fetchData();
      } else {
        toast.error(data.message || "Failed to delete record");
      }
    } catch (error) {
      toast.error("Failed to delete record");
    } finally {
      setDeleteTxn(null);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-zinc-50 min-h-screen">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-normal text-zinc-900 tracking-tight">
              Finance
            </h1>
            <div className="bg-zinc-100 p-1 rounded-lg flex items-center gap-1">
              <button
                onClick={() => setActiveTab("SALES")}
                className={`px-4 py-1.5 rounded-md text-[10px] font-medium uppercase tracking-widest transition-all ${
                  activeTab === "SALES"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                Sales
              </button>
              <button
                onClick={() => setActiveTab("RETURNS")}
                className={`px-4 py-1.5 rounded-md text-[10px] font-medium uppercase tracking-widest transition-all ${
                  activeTab === "RETURNS"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                Sales Return
              </button>
              <button
                onClick={() => setActiveTab("DAILY_SESSIONS")}
                className={`px-4 py-1.5 rounded-md text-[10px] font-medium uppercase tracking-widest transition-all ${
                  activeTab === "DAILY_SESSIONS"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                Daily Sessions
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {activeTab !== "DAILY_SESSIONS" && (
              <Button
                onClick={handleExport}
                className="h-10 px-6 uppercase tracking-widest text-[10px] border-zinc-200 text-zinc-600 bg-white hover:bg-zinc-50"
              >
                <Download size={14} className="mr-2" />
                Export
              </Button>
            )}
            {activeTab === "RETURNS" && (
              <Button
                onClick={() => setShowReturnModal(true)}
                className="bg-red-600 text-white h-10 px-6 uppercase tracking-widest text-[10px]"
              >
                <Plus size={14} className="mr-2" />
                Add New Return
              </Button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "DAILY_SESSIONS" ? (
            <DailySessionManager />
          ) : (
            <div className="h-full flex flex-col gap-6">
              {/* Metrics Section */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {activeTab === "SALES" ? (
                  <>
                    <MetricCard
                      title="Total Sales"
                      value={`${settings.currency} ${salesData.metrics.totalSales || 0}`}
                      icon={TrendingUp}
                    />
                    <MetricCard
                      title="Total Purchase"
                      value={`${settings.currency} ${salesData.metrics.purchases || 0}`}
                      icon={ShoppingCart}
                    />
                    <MetricCard
                      title="Total Income"
                      value={`${settings.currency} ${salesData.metrics.income || 0}`}
                      icon={Wallet}
                    />
                    <MetricCard
                      title="Total Expenses"
                      value={`${settings.currency} ${salesData.metrics.expenses || 0}`}
                      icon={CreditCard}
                    />
                    <MetricCard
                      title="Payment In"
                      value={`${settings.currency} ${salesData.metrics.paymentIn || 0}`}
                      icon={ArrowDownLeft}
                    />
                    <MetricCard
                      title="Payment Out"
                      value={`${settings.currency} ${salesData.metrics.paymentOut || 0}`}
                      icon={ArrowUpRight}
                    />
                  </>
                ) : (
                  <>
                    <MetricCard
                      title="Total Return"
                      value={returnsData.metrics.totalReturnCount || 0}
                      icon={RefreshCcw}
                    />
                    <MetricCard
                      title="Total Amount"
                      value={`${settings.currency} ${returnsData.metrics.totalAmount || 0}`}
                      icon={TrendingUp}
                    />
                    <MetricCard
                      title="Most Returned"
                      value={returnsData.metrics.mostReturned || "N/A"}
                      icon={ArrowLeftRight}
                    />
                  </>
                )}
              </div>

              {/* Filters and Table */}
              <div className="space-y-4">
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
                          placeholder="Search transactions..."
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

                <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-visible">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-100">
                        <th className="px-6 py-4 text-xs font-bold text-zinc-600 uppercase tracking-widest">
                          SN
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-600 uppercase tracking-widest">
                          ID
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-600 uppercase tracking-widest">
                          {activeTab === "SALES" ? "Type" : "Parties"}
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-600 uppercase tracking-widest">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-600 uppercase tracking-widest">
                          Mode
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-600 uppercase tracking-widest">
                          Status
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-600 uppercase tracking-widest">
                          Date
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-600 uppercase tracking-widest">
                          Billed By
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-zinc-600 uppercase tracking-widest text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {(activeTab === "SALES"
                        ? salesData.transactions
                        : returnsData.returns
                      ).map((txn: any, i: number) => (
                        <tr
                          key={txn.id}
                          className="hover:bg-zinc-50 cursor-pointer transition-colors group"
                          onClick={() => setSelectedTxn(txn)}
                        >
                          <td className="px-6 py-4 text-xs font-medium text-zinc-900">
                            {i + 1}
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-zinc-500">
                            {txn.id.slice(0, 8)}
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-zinc-900">
                            {activeTab === "SALES" ? txn.orderType : txn.parties}
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-zinc-900">
                            {settings.currency}{" "}
                            {activeTab === "SALES" ? txn.amount : txn.txnAmount}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-black px-2 py-1 rounded bg-zinc-100 text-zinc-600 uppercase tracking-widest">
                              {activeTab === "SALES" ? txn.mode : txn.mode}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest border ${
                                txn.status === "PAID" || txn.status === "COMPLETED"
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  : "bg-amber-50 text-amber-600 border-amber-100"
                              }`}
                            >
                              {txn.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-zinc-500">
                            {new Date(
                              activeTab === "SALES" ? txn.date : txn.txnDate,
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-xs text-zinc-500">
                            {txn.billedBy}
                          </td>
                          <td
                            className="px-6 py-4 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="none"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-zinc-100 rounded-full transition-colors"
                                onClick={() => setSelectedTxn(txn)}
                              >
                                <History className="h-4 w-4 text-zinc-500" />
                              </Button>
                              <Button
                                variant="none"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-zinc-100 rounded-full transition-colors"
                                onClick={() => handlePrint(txn)}
                              >
                                <Printer className="h-4 w-4 text-zinc-500" />
                              </Button>
                              <Button
                                variant="none"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-rose-50 rounded-full transition-colors"
                                onClick={() =>
                                  setDeleteTxn({
                                    id: txn.id,
                                    type: activeTab === "SALES" ? "SALES" : "RETURNS",
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4 text-rose-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sales/Return Detail Side Panel */}
      <SidePanel
        isOpen={!!selectedTxn}
        onClose={() => setSelectedTxn(null)}
        title={activeTab === "SALES" ? "Sale Detail" : "Return Detail"}
      >
        {selectedTxn && (
          <div className="space-y-6 p-6 overflow-y-auto max-h-screen custom-scrollbar pb-24">
            {/* Original Summary Grid */}
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                    Status
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border inline-block ${
                      selectedTxn.status === "PAID" ||
                      selectedTxn.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-amber-50 text-amber-600 border-amber-100"
                    }`}
                  >
                    {selectedTxn.status}
                  </span>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                    Payment Mode
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 uppercase tracking-widest inline-block">
                    {selectedTxn.mode}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                    Reference #{activeTab === "SALES" ? "Invoice" : "Return"}
                  </span>
                  <p className="text-xs font-bold text-zinc-900">
                    {selectedTxn.id.toUpperCase()}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                    Billed By
                  </span>
                  <p className="text-xs font-bold text-zinc-900">
                    {selectedTxn.billedBy}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative py-2">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <div className="w-full border-t border-zinc-100"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-zinc-50 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                  Generated Bill
                </span>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6 relative overflow-hidden">
              {/* Receipt Header Style */}
              <div className="text-center space-y-2 pb-6 border-b border-dashed border-zinc-200">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl">
                  <Package size={28} />
                </div>
                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-[0.3em]">
                  BODHIBERRY
                </h3>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                  Quality & Comfort
                </p>
              </div>

              {/* Bill Meta */}
              <div className="grid grid-cols-2 gap-y-4 pt-2">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">
                    Tax Invoice
                  </span>
                  <p className="text-[11px] font-bold text-zinc-900">
                    #{selectedTxn.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">
                    Date & Time
                  </span>
                  <p className="text-[11px] font-bold text-zinc-900">
                    {new Date(
                      selectedTxn.date || selectedTxn.txnDate,
                    ).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">
                    Customer
                  </span>
                  <p className="text-[11px] font-bold text-zinc-900">
                    {selectedTxn.customer ||
                      selectedTxn.parties ||
                      "Walking Guest"}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">
                    Order Type
                  </span>
                  <p className="text-[11px] font-bold text-zinc-900">
                    {selectedTxn.orderType || "Dine In"}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center text-[9px] font-black text-zinc-400 uppercase tracking-widest pb-1 border-b border-zinc-50">
                  <span>Particulars</span>
                  <span>Amount</span>
                </div>
                <div className="space-y-3">
                  {selectedTxn.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-bold text-zinc-900 uppercase">
                          {item.dishName}
                        </p>
                        <p className="text-[9px] text-zinc-400 font-bold">
                          {item.quantity} x {settings.currency}{" "}
                          {(item.amount / item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <span className="text-[11px] font-black text-zinc-900">
                        {settings.currency} {item.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Section */}
              <div className="pt-6 border-t border-dashed border-zinc-200 space-y-2">
                <div className="flex justify-between text-[11px] font-bold text-zinc-600">
                  <span className="uppercase tracking-widest">Subtotal</span>
                  <span>
                    {settings.currency} {selectedTxn.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-zinc-400">
                  <span className="uppercase tracking-widest text-[9px]">
                    VAT Compliance (13%)
                  </span>
                  <span>Included</span>
                </div>
                <div className="pt-4 flex justify-between items-center">
                  <span className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em]">
                    Grand Total
                  </span>
                  <span className="text-2xl font-black text-zinc-900 tracking-tighter">
                    {settings.currency} {selectedTxn.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="text-center pt-8 opacity-50">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                  Thank you for visiting!
                </p>
                <div className="mt-4 flex justify-center gap-1">
                  {[...Array(15)].map((_, i) => (
                    <div key={i} className="w-1 h-1 bg-zinc-200 rounded-full" />
                  ))}
                </div>
              </div>
            </div>

            {/* Print Action */}
            <div className="pt-2">
              <Button
                onClick={() => handlePrint(selectedTxn)}
                className="w-full h-14 bg-zinc-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-zinc-200 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                <Printer size={18} /> Print Official Receipt
              </Button>
            </div>
          </div>
        )}
      </SidePanel>

      {/* Sales Return Modal - Place holder for now, logic to be added */}
      <Modal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        title="Add New Sales Return (Credit Note)"
        size="5xl"
      >
        <div className="p-6">
          <SalesReturnForm
            onCancel={() => setShowReturnModal(false)}
            onSuccess={() => {
              setShowReturnModal(false);
              fetchData();
            }}
          />
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={!!deleteTxn}
        onClose={() => setDeleteTxn(null)}
        onConfirm={() => {
          if (!deleteTxn) return;
          moveToTrash(deleteTxn.id, deleteTxn.type);
        }}
        title={deleteTxn?.type === "SALES" ? "Delete Sale Record" : "Delete Return Record"}
        message={
          deleteTxn?.type === "SALES"
            ? "Are you sure you want to delete this sale record?"
            : "Are you sure you want to delete this return record?"
        }
        confirmVariant="danger"
      />
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-zinc-50 rounded-xl">
          <Icon size={20} className="text-zinc-500" />
        </div>
        {trend && (
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
          {title}
        </p>
        <p className="text-2xl font-normal text-zinc-900">{value}</p>
      </div>
    </div>
  );
}

function SalesReturnForm({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const { settings } = useSettings();
  const [items, setItems] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customerId: "",
    txnDate: new Date().toISOString().split("T")[0],
    billReference: "",
    salesStaff: "Admin",
    remark: "",
    paymentStatus: "UNPAID",
    paymentMode: "CASH",
  });

  const addItem = () => {
    setItems([...items, { dishName: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === "quantity" || field === "rate") {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const taxableAmount = items.reduce((acc, item) => acc + item.amount, 0);
  const discount = 0; // Simplified for now
  const totalAmount = taxableAmount - discount;

  const handleSubmit = async () => {
    if (!formData.billReference || items.length === 0) {
      toast.error("Please fill bill reference and add at least one item");
      return;
    }
    try {
      const res = await fetch("/api/finance/returns", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          items,
          taxableAmount,
          totalAmount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Return created successfully");
        onSuccess();
      }
    } catch (error) {
      toast.error("Failed to create return");
    }
  };

  return (
    <div className="grid grid-cols-3 gap-8">
      <div className="col-span-2 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Customer (Optional)
            </label>
            <input
              type="text"
              className="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-3 text-xs outline-none"
              placeholder="Search customer..."
              value={formData.customerId}
              onChange={(e) =>
                setFormData({ ...formData, customerId: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Return Date
            </label>
            <input
              type="date"
              className="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-3 text-xs outline-none"
              value={formData.txnDate}
              onChange={(e) =>
                setFormData({ ...formData, txnDate: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Bill Ref # (Required)
            </label>
            <input
              type="text"
              className="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-3 text-xs outline-none"
              placeholder="Enter Bill Number"
              value={formData.billReference}
              onChange={(e) =>
                setFormData({ ...formData, billReference: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Sales Staff
            </label>
            <input
              type="text"
              className="w-full bg-zinc-50 border border-zinc-100 rounded-lg p-3 text-xs outline-none"
              value={formData.salesStaff}
              onChange={(e) =>
                setFormData({ ...formData, salesStaff: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-widest">
              Return Items
            </h4>
            <Button
              onClick={addItem}
              className="h-8 px-4 text-[9px] uppercase tracking-widest bg-zinc-900 text-white"
            >
              Add Item
            </Button>
          </div>
          <div className="bg-zinc-50 rounded-xl border border-zinc-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-200">
                  <th className="p-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                    Item Name
                  </th>
                  <th className="p-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                    Qty
                  </th>
                  <th className="p-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                    Rate
                  </th>
                  <th className="p-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                    Amount
                  </th>
                  <th className="p-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className="p-2">
                      <input
                        type="text"
                        className="w-full bg-white border border-zinc-100 rounded px-2 py-1 text-xs outline-none"
                        value={item.dishName}
                        onChange={(e) =>
                          updateItem(i, "dishName", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-2 w-20">
                      <input
                        type="number"
                        className="w-full bg-white border border-zinc-100 rounded px-2 py-1 text-xs outline-none"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(i, "quantity", parseInt(e.target.value))
                        }
                      />
                    </td>
                    <td className="p-2 w-24">
                      <input
                        type="number"
                        className="w-full bg-white border border-zinc-100 rounded px-2 py-1 text-xs outline-none"
                        value={item.rate}
                        onChange={(e) =>
                          updateItem(i, "rate", parseFloat(e.target.value))
                        }
                      />
                    </td>
                    <td className="p-2 w-24 text-xs font-bold font-zinc-900">
                      {settings.currency} {item.amount}
                    </td>
                    <td className="p-2 text-right">
                      <button onClick={() => removeItem(i)}>
                        <Trash2
                          size={12}
                          className="text-zinc-400 hover:text-red-500"
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
            <span>Taxable Amount</span>
            <span className="text-zinc-900">
              {settings.currency} {taxableAmount}
            </span>
          </div>
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
            <span>Discount</span>
            <span className="text-zinc-900">
              {settings.currency} {discount}
            </span>
          </div>
          <div className="pt-4 border-t border-zinc-200">
            <div className="flex justify-between text-lg font-normal text-zinc-900">
              <span className="text-[10px] font-black uppercase tracking-widest self-center">
                Grand Total
              </span>
              <span>
                {settings.currency} {totalAmount}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Payment Status
            </label>
            <select
              className="w-full bg-white border border-zinc-100 rounded-lg p-3 text-xs outline-none"
              value={formData.paymentStatus}
              onChange={(e) =>
                setFormData({ ...formData, paymentStatus: e.target.value })
              }
            >
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="CREDIT">Credit</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Payment Mode
            </label>
            <select
              className="w-full bg-white border border-zinc-100 rounded-lg p-3 text-xs outline-none"
              value={formData.paymentMode}
              onChange={(e) =>
                setFormData({ ...formData, paymentMode: e.target.value })
              }
            >
              <option value="CASH">Cash</option>
              <option value="QR">QR</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-200 grid grid-cols-2 gap-4">
          <Button
            onClick={onCancel}
            className="h-12 border-zinc-100 text-zinc-500 hover:bg-zinc-50 uppercase tracking-widest text-[9px] font-black"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="h-12 bg-red-600 text-black uppercase tracking-widest text-[9px] font-black"
          >
            Save Return
          </Button>
        </div>
      </div>
    </div>
  );
}
