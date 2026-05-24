"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SaleModal({
  isOpen,
  onClose,
  onSuccess,
}: SaleModalProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    customerId: "",
    amount: "",
    paymentMethod: "CASH",
    description: "Quick Sale",
    staffId: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setFormData({
        customerId: "",
        amount: "",
        paymentMethod: "CASH",
        description: "Quick Sale",
        staffId: "",
        date: new Date().toISOString().split("T")[0],
      });
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [custRes, staffRes] = await Promise.all([
        fetch("/api/customer"),
        fetch("/api/staff"),
      ]);
      const custData = await custRes.json();
      const staffData = await staffRes.json();

      if (custData.success) setCustomers(custData.data);
      if (staffData.success) setStaff(staffData.data);
    } catch (error) {
      toast.error("Failed to load customers/staff");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(formData.amount);
    
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return toast.error("Please enter a valid amount");
    }

    if (formData.paymentMethod === "CREDIT" && !formData.customerId) {
      return toast.error("Customer is required for credit sales");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/finance/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: numericAmount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Sale recorded successfully");
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Failed to record sale");
      }
    } catch (error) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Sale Bill (Quick Entry)"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-zinc-900">
        <div className="p-4 border border-zinc-200 bg-white grid grid-cols-1 md:grid-cols-2 gap-4 rounded-md">
          <div className="space-y-1">
            <label className="pos-label">Customer</label>
            <select
              className="pos-input w-full appearance-none bg-white"
              value={formData.customerId}
              onChange={(e) =>
                setFormData({ ...formData, customerId: e.target.value })
              }
            >
              <option value="">Walking Guest</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} {c.phone ? `(${c.phone})` : ""}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Sale Date *"
            type="date"
            value={formData.date}
            onChange={(e) =>
              setFormData({ ...formData, date: e.target.value })
            }
            required
          />

          <div className="space-y-1">
            <label className="pos-label">Staff / Cashier</label>
            <select
              className="pos-input w-full appearance-none bg-white"
              value={formData.staffId}
              onChange={(e) =>
                setFormData({ ...formData, staffId: e.target.value })
              }
            >
              <option value="">Admin / Current User</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="pos-label">Payment Method *</label>
            <select
              className="pos-input w-full appearance-none bg-white"
              value={formData.paymentMethod}
              onChange={(e) =>
                setFormData({ ...formData, paymentMethod: e.target.value })
              }
              required
            >
              <option value="CASH">Cash</option>
              <option value="QR">QR Payment</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CREDIT">Credit (Customer Ledger)</option>
            </select>
          </div>
        </div>

        <div className="p-4 border border-zinc-200 bg-white grid grid-cols-1 gap-4 rounded-md">
          <Input
            label="Particulars / Description *"
            placeholder="e.g. Quick Food & Beverage Sale"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
          />

          <Input
            label="Grand Total Amount (Rs.) *"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100">
          <Button
            type="button"
            variant="ghost"
            className="text-zinc-500 hover:text-zinc-900"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="px-8 bg-zinc-900 text-white hover:bg-black shadow-sm">
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Save Sale"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
