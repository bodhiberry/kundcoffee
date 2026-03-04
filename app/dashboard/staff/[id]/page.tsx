"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MetricCard } from "@/components/ui/MetricCard";
import { Button } from "@/components/ui/Button";
import { useSettings } from "@/components/providers/SettingsProvider";
import {
  ShoppingBag,
  CreditCard,
  RefreshCcw,
  ArrowLeft,
  User,
  Calendar,
  Mail,
  Phone,
  Shield,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

export default function StaffHistoryPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { settings } = useSettings();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "orders" | "purchases" | "returns" | "payments"
  >("orders");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/staff/${id}/history`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          toast.error(json.message || "Failed to load staff history");
        }
      } catch (error) {
        toast.error("Error connecting to server");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-zinc-500">
        <p>Staff member not found.</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const {
    staff,
    orders,
    purchases,
    purchaseReturns,
    salesReturns,
    payments,
    metrics,
  } = data;

  return (
    <div className="px-6 py-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
            Staff Performance
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            Viewing history for {staff.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                {staff.image ? (
                  <img
                    src={staff.image}
                    alt={staff.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-zinc-300" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900">
                  {staff.name}
                </h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-red-800 bg-red-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                  {staff.roleRef?.name || staff.role || "Staff"}
                </span>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-zinc-600">
                <Mail size={16} className="text-zinc-400" />
                <span className="text-sm font-medium truncate">
                  {staff.email || "No email"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-zinc-600">
                <Phone size={16} className="text-zinc-400" />
                <span className="text-sm font-medium">
                  {staff.phone || "No phone"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-zinc-600">
                <Calendar size={16} className="text-zinc-400" />
                <span className="text-sm font-medium">
                  Joined {new Date(staff.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics and Tabs */}
        <div className="lg:col-span-3 space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Orders Handled"
              value={metrics.totalOrders}
              subValue={`${settings.currency} ${metrics.ordersValue.toLocaleString()}`}
              icon={ShoppingBag}
            />
            <MetricCard
              title="Purchases Made"
              value={metrics.totalPurchases}
              subValue={`${settings.currency} ${metrics.purchasesValue.toLocaleString()}`}
              icon={CreditCard}
            />
            <MetricCard
              title="Returns"
              value={metrics.totalReturns}
              subValue={`${settings.currency} ${metrics.returnsValue.toLocaleString()}`}
              icon={RefreshCcw}
            />
            <MetricCard
              title="Payments Rec."
              value={metrics.totalPayments || 0}
              subValue={`${settings.currency} ${(metrics.paymentsValue || 0).toLocaleString()}`}
              icon={Clock}
              trend="Received"
            />
          </div>

          {/* Tabs */}
          <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="flex border-b border-zinc-50 bg-zinc-50/50 p-1">
              <TabButton
                active={activeTab === "orders"}
                onClick={() => setActiveTab("orders")}
                label="Orders"
                count={orders.length}
              />
              <TabButton
                active={activeTab === "payments"}
                onClick={() => setActiveTab("payments")}
                label="Payments"
                count={payments?.length || 0}
              />
              <TabButton
                active={activeTab === "purchases"}
                onClick={() => setActiveTab("purchases")}
                label="Purchases"
                count={purchases.length}
              />
              <TabButton
                active={activeTab === "returns"}
                onClick={() => setActiveTab("returns")}
                label="Returns"
                count={purchaseReturns.length + salesReturns.length}
              />
            </div>

            <div className="p-6">
              {activeTab === "orders" && (
                <OrdersTable orders={orders} currency={settings.currency} />
              )}
              {activeTab === "payments" && (
                <PaymentsTable
                  payments={payments}
                  currency={settings.currency}
                />
              )}
              {activeTab === "purchases" && (
                <PurchasesTable
                  purchases={purchases}
                  currency={settings.currency}
                />
              )}
              {activeTab === "returns" && (
                <ReturnsTable
                  salesReturns={salesReturns}
                  purchaseReturns={purchaseReturns}
                  currency={settings.currency}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all ${
        active
          ? "bg-white text-zinc-900 shadow-sm"
          : "text-zinc-400 hover:text-zinc-600 hover:bg-white/50"
      }`}
    >
      {label}
      <span
        className={`text-[10px] px-2 py-0.5 rounded-lg ${active ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-500"}`}
      >
        {count}
      </span>
    </button>
  );
}

function OrdersTable({
  orders,
  currency,
}: {
  orders: any[];
  currency: string;
}) {
  if (orders.length === 0)
    return <NoData message="No orders assigned to this staff member." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-50">
            <th className="pb-4 pr-4">Order ID</th>
            <th className="pb-4 px-4">Customer</th>
            <th className="pb-4 px-4">Type</th>
            <th className="pb-4 px-4">Status</th>
            <th className="pb-4 px-4">Total</th>
            <th className="pb-4 pl-4 text-right">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {orders.map((o) => (
            <tr
              key={o.id}
              className="text-sm group hover:bg-zinc-50/50 transition-colors"
            >
              <td className="py-4 pr-4 font-bold text-zinc-900 truncate max-w-[120px]">
                #{o.id.slice(0, 8)}
              </td>
              <td className="py-4 px-4 text-zinc-600 font-medium">
                {o.customer?.fullName || "Guest"}
              </td>
              <td className="py-4 px-4">
                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded uppercase">
                  {o.type.replace("_", " ")}
                </span>
              </td>
              <td className="py-4 px-4">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    o.status === "COMPLETED"
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-amber-700 bg-amber-50"
                  }`}
                >
                  {o.status}
                </span>
              </td>
              <td className="py-4 px-4 font-bold text-zinc-900">
                {currency} {o.total.toLocaleString()}
              </td>
              <td className="py-4 pl-4 text-right text-zinc-400 font-medium">
                {new Date(o.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PurchasesTable({
  purchases,
  currency,
}: {
  purchases: any[];
  currency: string;
}) {
  if (purchases.length === 0)
    return <NoData message="No purchases made by this staff member." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-50">
            <th className="pb-4 pr-4">Ref No</th>
            <th className="pb-4 px-4">Supplier</th>
            <th className="pb-4 px-4">Payment</th>
            <th className="pb-4 px-4">Total Amount</th>
            <th className="pb-4 pl-4 text-right">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {purchases.map((p) => (
            <tr
              key={p.id}
              className="text-sm hover:bg-zinc-50/50 transition-colors"
            >
              <td className="py-4 pr-4 font-bold text-zinc-900">
                {p.referenceNumber}
              </td>
              <td className="py-4 px-4 text-zinc-600 font-medium">
                {p.supplier?.fullName}
              </td>
              <td className="py-4 px-4">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    p.paymentStatus === "PAID"
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-amber-700 bg-amber-50"
                  }`}
                >
                  {p.paymentStatus}
                </span>
              </td>
              <td className="py-4 px-4 font-bold text-zinc-900">
                {currency} {p.totalAmount.toLocaleString()}
              </td>
              <td className="py-4 pl-4 text-right text-zinc-400 font-medium">
                {new Date(p.txnDate).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReturnsTable({
  salesReturns,
  purchaseReturns,
  currency,
}: {
  salesReturns: any[];
  purchaseReturns: any[];
  currency: string;
}) {
  const allReturns = [
    ...salesReturns.map((r) => ({ ...r, returnType: "Sales Return" })),
    ...purchaseReturns.map((r) => ({ ...r, returnType: "Purchase Return" })),
  ].sort(
    (a, b) =>
      new Date(b.txnDate || b.createdAt).getTime() -
      new Date(a.txnDate || a.createdAt).getTime(),
  );

  if (allReturns.length === 0)
    return <NoData message="No returns processed by this staff member." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-50">
            <th className="pb-4 pr-4">Ref No</th>
            <th className="pb-4 px-4">Type</th>
            <th className="pb-4 px-4">Party</th>
            <th className="pb-4 px-4">Amount</th>
            <th className="pb-4 pl-4 text-right">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {allReturns.map((r, i) => (
            <tr
              key={i}
              className="text-sm hover:bg-zinc-50/50 transition-colors"
            >
              <td className="py-4 pr-4 font-bold text-zinc-900">
                {r.referenceNumber}
              </td>
              <td className="py-4 px-4">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    r.returnType === "Sales Return"
                      ? "text-rose-700 bg-rose-50"
                      : "text-amber-700 bg-amber-50"
                  }`}
                >
                  {r.returnType}
                </span>
              </td>
              <td className="py-4 px-4 text-zinc-600 font-medium">
                {r.customer?.fullName || r.supplier?.fullName || "N/A"}
              </td>
              <td className="py-4 px-4 font-bold text-zinc-900">
                {currency} {r.totalAmount.toLocaleString()}
              </td>
              <td className="py-4 pl-4 text-right text-zinc-400 font-medium">
                {new Date(r.txnDate || r.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NoData({ message }: { message: string }) {
  return (
    <div className="py-12 text-center space-y-3">
      <Shield size={40} className="mx-auto text-zinc-100" />
      <p className="text-zinc-400 text-sm font-medium">{message}</p>
    </div>
  );
}

function PaymentsTable({
  payments,
  currency,
}: {
  payments: any[];
  currency: string;
}) {
  if (!payments || payments.length === 0)
    return <NoData message="No payment transactions for this staff member." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left font-sans">
        <thead>
          <tr className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-50">
            <th className="pb-4 pr-4">Method</th>
            <th className="pb-4 px-4">Amount</th>
            <th className="pb-4 px-4">Session/Table</th>
            <th className="pb-4 px-4">Status</th>
            <th className="pb-4 pl-4 text-right">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {payments.map((p) => (
            <tr
              key={p.id}
              className="text-sm group hover:bg-zinc-50/50 transition-colors"
            >
              <td className="py-4 pr-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-zinc-50 rounded-lg group-hover:bg-emerald-50 transition-colors">
                    {p.method === "CASH" ? (
                      <ShoppingBag size={14} className="text-emerald-600" />
                    ) : (
                      <RefreshCcw size={14} className="text-blue-600" />
                    )}
                  </div>
                  <span className="font-bold text-zinc-900">{p.method}</span>
                </div>
              </td>
              <td className="py-4 px-4 font-black text-zinc-900">
                {currency} {p.amount.toLocaleString()}
              </td>
              <td className="py-4 px-4 text-zinc-500 font-medium italic">
                {p.session?.table?.name
                  ? `Table ${p.session.table.name}`
                  : "Take Away"}
              </td>
              <td className="py-4 px-4">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    p.status === "PAID"
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-amber-700 bg-amber-50"
                  }`}
                >
                  {p.status}
                </span>
              </td>
              <td className="py-4 pl-4 text-right text-zinc-400 font-medium">
                {new Date(p.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
