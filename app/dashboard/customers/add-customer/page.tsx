"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";

export default function AddCustomerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    dob: "",
    loyaltyId: "",
    openingBalance: 0,
    creditLimit: 0,
    loyaltyDiscount: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName) {
      toast.error("Customer name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Customer profile created", {
          icon: <CheckCircle2 className="text-emerald-500" size={18} />,
        });
        router.push("/dashboard/customers");
        router.refresh();
      } else {
        toast.error(data.message || "Failed to create customer");
      }
    } catch (error) {
      console.error(error);
      toast.error("Connection error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-500"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold text-zinc-900">Add New Customer</h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-zinc-200 rounded-xl p-8 shadow-sm space-y-8"
      >
        {/* Profile Information */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            Profile Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <Input
              label="Full Name *"
              required
              placeholder="Full name of customer"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />
            <Input
              label="Contact Number"
              placeholder="Mobile or phone number"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="Email for communications"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <Input
              label="Date of Birth"
              type="date"
              value={formData.dob}
              onChange={(e) =>
                setFormData({ ...formData, dob: e.target.value })
              }
            />
          </div>
        </div>

        {/* Loyalty & Financials */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            Loyalty & Financials
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <Input
              label="Loyalty Discount (%)"
              type="number"
              placeholder="Discount percentage"
              value={formData.loyaltyDiscount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  loyaltyDiscount: parseFloat(e.target.value) || 0,
                })
              }
            />
            <Input
              label="Opening Balance (Rs.)"
              type="number"
              placeholder="0"
              value={formData.openingBalance}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  openingBalance: parseFloat(e.target.value) || 0,
                })
              }
            />
            <Input
              label="Credit Limit (Rs.)"
              type="number"
              placeholder="0"
              value={formData.creditLimit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  creditLimit: parseFloat(e.target.value) || 0,
                })
              }
            />
            <Input
              label="Custom Loyalty ID"
              placeholder="Auto-generated if blank"
              value={formData.loyaltyId}
              onChange={(e) =>
                setFormData({ ...formData, loyaltyId: e.target.value })
              }
            />
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-100 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            className="px-6"
          >
            Discard
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-8 bg-zinc-900 text-white hover:bg-black shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Save Customer"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
