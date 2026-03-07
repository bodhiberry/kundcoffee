"use client";
import { useEffect, useState } from "react";
import { Customer } from "@/lib/types";
import { getCustomerSummary, addCustomer } from "@/services/customer";
import { PageHeaderAction } from "@/components/ui/PageHeaderAction";
import { MetricCard } from "@/components/ui/MetricCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { useSettings } from "@/components/providers/SettingsProvider";

export default function CustomersPage() {
  const { settings } = useSettings();
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    toReceive: 0,
    toPay: 0,
    netToReceive: 0,
  });
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    dob: "",
    loyaltyId: "",
    openingBalance: 0,
    loyaltyDiscount: 0,
  });

  const fetchData = async () => {
    const res = await getCustomerSummary();
    if (res.success) {
      setCustomers(res.data);
      setFilteredCustomers(res.data);
      setMetrics(res.metrics);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(lowerQuery) ||
        (c.phone && c.phone.toLowerCase().includes(lowerQuery)) ||
        (c.email && c.email.toLowerCase().includes(lowerQuery)) ||
        (c.loyaltyId && c.loyaltyId.toLowerCase().includes(lowerQuery)),
    );
    setFilteredCustomers(filtered);
  }, [searchQuery, customers]);

  const handleExport = () => {
    const headers = [
      "SN",
      "Name",
      "Email",
      "Phone",
      "DOB",
      "Loyalty ID",
      "Due Amount",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredCustomers.map((c, index) =>
        [
          index + 1,
          c.fullName,
          c.email || "",
          c.phone || "",
          c.dob ? new Date(c.dob).toLocaleDateString() : "",
          c.loyaltyId || "",
          c.dueAmount.toFixed(2),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "customers_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateCustomer = async () => {
    if (!formData.fullName) return;
    const res = await addCustomer(formData);
    if (res.success) {
      setIsAddModalOpen(false);
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        dob: "",
        loyaltyId: "",
        openingBalance: 0,
        loyaltyDiscount: 0,
      });
      fetchData();
    } else {
      alert(res.message || "Failed to add customer");
    }
  };

  return (
    <div className="px-6 py-10">
      <PageHeaderAction
        title="Customers"
        description="Manage your customer base and loyalty"
        onSearch={setSearchQuery}
        onExport={handleExport}
        actionButton={
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
          >
            <span className="flex items-center gap-2">Add Customer</span>
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="To Receive"
          value={`${settings.currency} ${metrics.toReceive.toLocaleString()}`}
        />
        <MetricCard
          title="To Pay"
          value={`${settings.currency} ${metrics.toPay.toLocaleString()}`}
        />
        <MetricCard
          title="Net To Receive"
          value={`${settings.currency} ${metrics.netToReceive.toLocaleString()}`}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 flex-wrap">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
            Customer Directory
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 font-medium">
              {filteredCustomers.length} registered customers
            </span>
          </div>
        </div>

        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-slate-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-black text-gray-500 uppercase text-[10px] tracking-widest w-20">
                SN
              </th>
              <th className="px-6 py-4 font-black text-gray-500 uppercase text-[10px] tracking-widest">
                Name
              </th>
              <th className="px-6 py-4 font-black text-gray-500 uppercase text-[10px] tracking-widest">
                Category / Info
              </th>
              <th className="px-6 py-4 font-black text-gray-500 uppercase text-[10px] tracking-widest">
                Contact
              </th>
              <th className="px-6 py-4 font-black text-gray-500 uppercase text-[10px] tracking-widest">
                Loyalty ID
              </th>
              <th className="px-6 py-4 font-black text-gray-500 uppercase text-[10px] tracking-widest text-right">
                Due Balance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCustomers.map((customer, index) => (
              <tr
                key={customer.id}
                className="hover:bg-red-50/50 transition-colors cursor-pointer group border-b border-gray-100 last:border-0"
                onClick={() =>
                  router.push(`/dashboard/customers/${customer.id}`)
                }
              >
                <td className="px-6 py-4 font-mono text-xs font-black text-gray-400 group-hover:text-red-600 transition-colors">
                  {(index + 1).toString().padStart(3, "0")}
                </td>
                <td className="px-6 py-4">
                  <span className="font-black text-gray-900 block truncate">
                    {customer.fullName}
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">
                    {customer.email || "No Email"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded">
                    {customer.dob
                      ? new Date(customer.dob).toLocaleDateString()
                      : "No DOB"}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-gray-600 text-xs">
                  {customer.phone || "-"}
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-xs font-black text-gray-400 group-hover:text-gray-900">
                    {customer.loyaltyId || "-"}
                  </span>
                </td>
                <td
                  className={`px-6 py-4 text-right font-black font-mono transition-colors ${
                    customer.dueAmount > 0
                      ? "text-rose-600 bg-rose-50/30"
                      : customer.dueAmount < 0
                        ? "text-emerald-600 bg-emerald-50/30"
                        : "text-gray-400"
                  }`}
                >
                  {settings.currency} {customer.dueAmount.toLocaleString()}
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Customer"
      >
        <div className="space-y-6 pb-4">
          {/* Profile Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                Customer Profile
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none transition-all"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9841..."
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none transition-all"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. john@example.com"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none transition-all"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none transition-all"
                    value={formData.dob}
                    onChange={(e) =>
                      setFormData({ ...formData, dob: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">
                    Loyalty ID
                  </label>
                  <input
                    type="text"
                    placeholder="Optional"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none transition-all font-mono"
                    value={formData.loyaltyId}
                    onChange={(e) =>
                      setFormData({ ...formData, loyaltyId: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Account Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                Financial Setup
              </h3>
            </div>
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">
                    Opening Balance
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">
                      {settings.currency}
                    </span>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 py-3 text-sm focus:border-red-500 focus:outline-none transition-all font-mono font-black"
                      value={formData.openingBalance}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          openingBalance: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">
                    Loyalty Discount (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:border-red-500 focus:outline-none transition-all font-mono font-black text-right pr-8"
                      value={formData.loyaltyDiscount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          loyaltyDiscount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Button
            onClick={handleCreateCustomer}
            className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest text-[10px]"
          >
            Register Customer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
