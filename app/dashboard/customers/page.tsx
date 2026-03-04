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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-slate-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">SN</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Name</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Email</th>
              <th className="px-6 py-4 font-semibold text-gray-700">Phone</th>
              <th className="px-6 py-4 font-semibold text-gray-700">DOB</th>
              <th className="px-6 py-4 font-semibold text-gray-700">
                Loyalty ID
              </th>
              <th className="px-6 py-4 font-semibold text-gray-700 text-right">
                Due Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCustomers.map((customer, index) => (
              <tr
                key={customer.id}
                className="hover:bg-red-50/50 transition-colors cursor-pointer group"
                onClick={() =>
                  router.push(`/dashboard/customers/${customer.id}`)
                }
              >
                <td className="px-6 py-4 font-medium text-gray-500">
                  {index + 1}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {customer.fullName}
                </td>
                <td className="px-6 py-4">{customer.email || "-"}</td>
                <td className="px-6 py-4">{customer.phone || "-"}</td>
                <td className="px-6 py-4">
                  {customer.dob
                    ? new Date(customer.dob).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-6 py-4">{customer.loyaltyId || "-"}</td>
                <td
                  className={`px-6 py-4 text-right font-semibold ${customer.dueAmount > 0 ? "text-red-600" : customer.dueAmount < 0 ? "text-green-600" : "text-gray-900"}`}
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
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Full Name"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Phone
              </label>
              <input
                type="text"
                placeholder="Phone Number"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="Email Address"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                DOB
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                value={formData.dob}
                onChange={(e) =>
                  setFormData({ ...formData, dob: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Loyalty ID
              </label>
              <input
                type="text"
                placeholder="Optional"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                value={formData.loyaltyId}
                onChange={(e) =>
                  setFormData({ ...formData, loyaltyId: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Opening Balance
            </label>
            <input
              type="number"
              placeholder="0.00"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all font-bold"
              value={formData.openingBalance}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  openingBalance: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Loyalty Discount (%)
            </label>
            <input
              type="number"
              placeholder="0"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all font-bold"
              value={formData.loyaltyDiscount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  loyaltyDiscount: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <Button
            onClick={handleCreateCustomer}
            className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
          >
            Create Customer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
