"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Supplier } from "@/lib/types";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplier?: Supplier | null;
}

export default function SupplierModal({
  isOpen,
  onClose,
  onSuccess,
  supplier,
}: SupplierModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    legalName: "",
    taxNumber: "",
    address: "",
    openingBalance: 0,
    openingBalanceType: "CREDIT" as "CREDIT" | "DEBIT",
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        fullName: supplier.fullName || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        legalName: supplier.legalName || "",
        taxNumber: supplier.taxNumber || "",
        address: supplier.address || "",
        openingBalance: supplier.openingBalance || 0,
        openingBalanceType: supplier.openingBalanceType || "CREDIT",
      });
    } else {
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        legalName: "",
        taxNumber: "",
        address: "",
        openingBalance: 0,
        openingBalanceType: "CREDIT",
      });
    }
  }, [supplier, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName) {
      toast.error("Supplier name is required");
      return;
    }

    setLoading(true);
    try {
      const url = supplier ? `/api/suppliers/${supplier.id}` : "/api/suppliers";
      const method = supplier ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(supplier ? "Supplier updated" : "Supplier added", {
          icon: <CheckCircle2 className="text-emerald-500" size={18} />,
        });
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Failed to save supplier");
      }
    } catch (error) {
      toast.error("Failed to save supplier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplier ? "Edit Supplier" : "Add New Supplier"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-8 p-4">
        {/* Contact Identity */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            Contact Identity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <Input
              label="Full Name *"
              required
              placeholder="e.g. John Doe"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />
            <Input
              label="Phone Number"
              placeholder="+977-XXXXXXXXXX"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
            <div className="md:col-span-2">
              <Input
                label="Email Address"
                type="email"
                placeholder="vendor@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            Business Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <Input
              label="Legal Entity Name"
              placeholder="e.g. ABC Trading Pvt. Ltd."
              value={formData.legalName}
              onChange={(e) =>
                setFormData({ ...formData, legalName: e.target.value })
              }
            />
            <Input
              label="Tax No (PAN/VAT)"
              placeholder="9-digit PAN or VAT"
              value={formData.taxNumber}
              onChange={(e) =>
                setFormData({ ...formData, taxNumber: e.target.value })
              }
            />
            <div className="md:col-span-2 space-y-1.5">
              <label className="pos-label">Physical Address</label>
              <textarea
                placeholder="City, Street, Ward No..."
                className="pos-input w-full min-h-[80px] py-3"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Financial Setup */}
        {!supplier && (
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Financial Setup
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-zinc-50 p-6 rounded-xl border border-zinc-100">
              <Input
                label="Opening Balance"
                type="number"
                placeholder="0.00"
                value={formData.openingBalance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    openingBalance: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <div className="space-y-1.5">
                <label className="pos-label">Balance Type</label>
                <select
                  className="pos-input w-full h-11 appearance-none bg-white"
                  value={formData.openingBalanceType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      openingBalanceType: e.target.value as any,
                    })
                  }
                >
                  <option value="CREDIT">CREDIT (Payable Balance)</option>
                  <option value="DEBIT">DEBIT (Advancce/Debit)</option>
                </select>
              </div>
              <p className="md:col-span-2 text-[10px] text-zinc-400 italic">
                * Opening balance sets the starting point for this supplier's
                ledger.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
          <Button
            type="button"
            variant="secondary"
            className="px-6"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="px-10 bg-zinc-900 text-white hover:bg-black shadow-sm"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : supplier ? (
              "Update Profile"
            ) : (
              "Create Supplier"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
