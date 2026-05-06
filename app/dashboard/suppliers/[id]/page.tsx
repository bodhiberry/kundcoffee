"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MetricCard } from "@/components/ui/MetricCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CustomTable } from "@/components/ui/CustomTable";
import { Supplier, SupplierLedger } from "@/lib/types";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  History,
} from "lucide-react";
import { toast } from "sonner";

export default function SupplierProfile() {
  const { id } = useParams();
  const router = useRouter();
  const supplierId = Array.isArray(id) ? id[0] : id;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [ledger, setLedger] = useState<SupplierLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState<SupplierLedger | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "CASH",
    remarks: "",
    date: new Date().toISOString().split("T")[0],
  });

  const fetchSupplierData = async () => {
    if (!supplierId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/suppliers/${supplierId}`);
      const data = await res.json();
      if (data.success) {
        setSupplier(data.data);
        setLedger(data.data.ledgers || []);
      } else {
        toast.error("Supplier not found");
        router.push("/dashboard/suppliers");
      }
    } catch (error) {
      toast.error("Failed to fetch supplier details");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/suppliers/${supplierId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Payment recorded successfully");
        setIsPaymentModalOpen(false);
        setPaymentForm({
          amount: "",
          paymentMethod: "CASH",
          remarks: "",
          date: new Date().toISOString().split("T")[0],
        });
        fetchSupplierData();
      } else {
        toast.error(data.message || "Failed to record payment");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchSupplierData();
  }, [supplierId]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!supplier) return <div className="p-8">Supplier not found</div>;

  return (
    <div className="p-8 space-y-8 bg-zinc-50 min-h-screen">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/suppliers")}
          className="hover:bg-zinc-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Suppliers
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Purchases"
          value={`Rs. ${(supplier as any).metrics?.totalPurchases?.toLocaleString() || 0}`}
          icon={FileText}
          trend="Total Value"
        />
        <MetricCard
          title="Total Returns"
          value={`Rs. ${(supplier as any).metrics?.totalReturns?.toLocaleString() || 0}`}
          icon={History}
          trend="Returns"
        />
        <MetricCard
          title="Payments Out"
          value={`Rs. ${(supplier as any).metrics?.totalPaymentsOut?.toLocaleString() || 0}`}
          icon={ArrowLeft}
          trend="Money Paid"
        />
        <MetricCard
          title="Payments In"
          value={`Rs. ${(supplier as any).metrics?.totalPaymentsIn?.toLocaleString() || 0}`}
          icon={User}
          trend="Refunds"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 space-y-6">
            <div className="flex items-center gap-4 py-2 border-b border-zinc-50 mb-4">
              <div className="h-14 w-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-inner">
                <User className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-zinc-900 tracking-tight leading-none">
                  {supplier.fullName}
                </h2>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                  {supplier.legalName || "Standard Vendor"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm group">
                <div className="p-2 bg-zinc-50 rounded-lg group-hover:bg-emerald-50 transition-colors">
                  <Phone className="h-4 w-4 text-zinc-400 group-hover:text-emerald-600" />
                </div>
                <span className="font-semibold text-zinc-700">
                  {supplier.phone || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm group">
                <div className="p-2 bg-zinc-50 rounded-lg group-hover:bg-emerald-50 transition-colors">
                  <Mail className="h-4 w-4 text-zinc-400 group-hover:text-emerald-600" />
                </div>
                <span className="font-semibold text-zinc-700">
                  {supplier.email || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm group">
                <div className="p-2 bg-zinc-50 rounded-lg group-hover:bg-emerald-50 transition-colors">
                  <FileText className="h-4 w-4 text-zinc-400 group-hover:text-emerald-600" />
                </div>
                <span className="font-semibold text-zinc-700 uppercase tracking-tighter">
                  Tax: {supplier.taxNumber || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm group">
                <div className="p-2 bg-zinc-50 rounded-lg group-hover:bg-emerald-50 transition-colors">
                  <MapPin className="h-4 w-4 text-zinc-400 group-hover:text-emerald-600" />
                </div>
                <span className="font-semibold text-zinc-700 italic">
                  {supplier.address || "No address provided"}
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100">
              <div className="p-4 bg-zinc-900 rounded-2xl shadow-lg border border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                  Closing Balance
                </p>
                <p
                  className={`text-2xl font-black font-mono ${(supplier as any).dueAmount > 0 ? "text-rose-400" : (supplier as any).dueAmount < 0 ? "text-emerald-400" : "text-zinc-500"}`}
                >
                  Rs.{" "}
                  {Math.abs((supplier as any).dueAmount || 0).toLocaleString()}
                  <span className="ml-2 text-xs opacity-50 font-sans uppercase">
                    {(supplier as any).dueAmount > 0
                      ? "Payable"
                      : (supplier as any).dueAmount < 0
                        ? "Receivable"
                        : "Settled"}
                  </span>
                </p>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                className="flex-1 rounded-xl font-bold"
                variant="secondary"
                size="sm"
              >
                Edit Profile
              </Button>
              <Button
                className="flex-1 rounded-xl font-bold"
                variant="secondary"
                size="sm"
              >
                Statements
              </Button>
              <Button
                className="flex-1 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setIsPaymentModalOpen(true)}
                size="sm"
              >
                Record Payment
              </Button>
            </div>
          </div>
        </div>

        {/* Ledger */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h3 className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight text-zinc-900">
                <History className="h-4 w-4" />
                Transaction Ledger
              </h3>
              <span className="text-[10px] font-bold text-zinc-400 uppercase">
                Recent Activity
              </span>
            </div>
            <CustomTable
              columns={[
                {
                  header: "Date",
                  accessor: (l: SupplierLedger) =>
                    new Date(l.createdAt).toLocaleDateString(),
                },
                { header: "Txn No", accessor: (l: SupplierLedger) => l.txnNo },
                {
                  header: "Type",
                  accessor: (l: SupplierLedger) => (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-100 rounded text-zinc-500 uppercase tracking-tighter">
                      {l.type?.replace("_", " ")}
                    </span>
                  ),
                },
                {
                  header: "Amount",
                  accessor: (l: SupplierLedger) => (
                    <span
                      className={`font-mono font-bold ${
                        l.type === "PURCHASE"
                          ? "text-amber-600"
                          : l.type === "PAYMENT" || l.type === "RETURN"
                            ? "text-emerald-600"
                            : "text-zinc-900"
                      }`}
                    >
                      {l.amount.toLocaleString()}
                    </span>
                  ),
                },
                {
                  header: "Balance",
                  accessor: (l: SupplierLedger) => (
                    <span className="font-mono text-zinc-400 font-bold">
                      {l.closingBalance?.toLocaleString() || "-"}
                    </span>
                  ),
                },
              ]}
              data={ledger}
              onRowClick={(l: SupplierLedger) => setSelectedTxn(l)}
            />
          </div>
        </div>
      </div>

      {selectedTxn && (
        <Modal
          isOpen={!!selectedTxn}
          onClose={() => setSelectedTxn(null)}
          title="Transaction Details"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                  Transaction No
                </p>
                <p className="font-bold text-zinc-900">{selectedTxn.txnNo}</p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                  Date
                </p>
                <p className="font-bold text-zinc-900">
                  {new Date(selectedTxn.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                  Type
                </p>
                <p className="font-bold text-zinc-900 uppercase">
                  {selectedTxn.type}
                </p>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                  Amount
                </p>
                <p className="font-black text-rose-600">
                  Rs. {selectedTxn.amount.toLocaleString()}
                </p>
              </div>
              {selectedTxn.referenceId && (
                <div className="col-span-2 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    Reference ID
                  </p>
                  <p className="text-xs font-mono text-zinc-500 break-all">
                    {selectedTxn.referenceId}
                  </p>
                </div>
              )}
              {selectedTxn.remarks && (
                <div className="col-span-2 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    Remarks
                  </p>
                  <p className="text-sm text-zinc-600 font-medium">
                    {selectedTxn.remarks}
                  </p>
                </div>
              )}
            </div>
            <div className="pt-4 flex justify-end">
              <Button
                variant="secondary"
                className="rounded-xl px-8 font-bold"
                onClick={() => setSelectedTxn(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Supplier Payment"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                Payment Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400">Rs.</span>
                <input
                  type="number"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full h-12 pl-12 pr-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-bold"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                Payment Method
              </label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all appearance-none font-semibold"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="ESEWA">eSewa</option>
                <option value="QR">QR Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                Transaction Date
              </label>
              <input
                type="date"
                required
                value={paymentForm.date}
                onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                Remarks
              </label>
              <textarea
                value={paymentForm.remarks}
                onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all h-32 resize-none font-medium"
                placeholder="Optional notes about this payment..."
              />
            </div>
          </div>

          <div className="pt-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-zinc-900 hover:bg-black text-white font-black rounded-xl shadow-lg transition-all active:scale-[0.98] uppercase tracking-widest"
            >
              {isSubmitting ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
