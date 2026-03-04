"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Supplier, Stock } from "@/lib/types";
import { toast } from "sonner";
import { Trash2, Plus, User, Upload } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnModal({
  isOpen,
  onClose,
  onSuccess,
}: ReturnModalProps) {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [imageFile, setImageFile] = useState<File | string | null>(null);

  const [formData, setFormData] = useState({
    supplierId: "",
    txnDate: new Date().toISOString().split("T")[0],
    purchaseReference: "",
    items: [{ itemName: "", stockId: "", quantity: 1, rate: 0, amount: 0 }],
    taxableAmount: 0,
    totalAmount: 0,
    discount: 0,
    roundOff: 0,
    paymentStatus: "UNPAID" as "UNPAID" | "PAID",
    paymentMode: "CASH" as any,
    remark: "",
    staffId: "",
    attachment: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setFormData({
        supplierId: "",
        txnDate: new Date().toISOString().split("T")[0],
        purchaseReference: "",
        items: [{ itemName: "", stockId: "", quantity: 1, rate: 0, amount: 0 }],
        taxableAmount: 0,
        totalAmount: 0,
        discount: 0,
        roundOff: 0,
        paymentStatus: "UNPAID",
        paymentMode: "CASH",
        remark: "",
        staffId: "",
        attachment: "",
      });
      setImageFile(null);
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [suppRes, stockRes, staffRes] = await Promise.all([
        fetch("/api/suppliers"),
        fetch("/api/stocks"),
        fetch("/api/staff"),
      ]);
      const suppData = await suppRes.json();
      const stockData = await stockRes.json();
      const staffData = await staffRes.json();

      if (suppData.success) setSuppliers(suppData.data.suppliers);
      if (stockData.success) setStocks(stockData.data);
      if (staffData.success) setStaff(staffData.data);
    } catch (error) {
      toast.error("Failed to load data");
    }
  };

  const calculateTotals = (
    items: any[],
    discount: number,
    roundOff: number,
  ) => {
    const taxable = items.reduce((sum, item) => sum + item.amount, 0);
    const total = taxable - discount + roundOff;
    setFormData((prev) => ({
      ...prev,
      items,
      taxableAmount: taxable,
      totalAmount: total,
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "quantity" || field === "rate") {
      newItems[index].amount =
        (newItems[index].quantity || 0) * (newItems[index].rate || 0);
    }

    if (field === "stockId") {
      const selectedStock = stocks.find((s) => s.id === value);
      if (selectedStock) {
        newItems[index].itemName = selectedStock.name;
      }
    }

    calculateTotals(newItems, formData.discount, formData.roundOff);
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { itemName: "", stockId: "", quantity: 1, rate: 0, amount: 0 },
      ],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    calculateTotals(newItems, formData.discount, formData.roundOff);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId) return toast.error("Please select a supplier");
    if (formData.items.some((it) => !it.itemName || it.amount <= 0))
      return toast.error("Please fill all items correctly");

    setLoading(true);
    try {
      let attachmentUrl = formData.attachment;

      if (imageFile instanceof File) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);
        uploadFormData.append("folder", "returns");
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          attachmentUrl = uploadData.url;
        }
      }

      const res = await fetch("/api/purchases/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, attachment: attachmentUrl }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Purchase return recorded and stock decreased");
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || "Failed to record return");
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
      title="Purchase Return (Debit Note)"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-8 text-zinc-950">
        <div className="bg-rose-50/30 p-6 rounded-3xl border border-rose-100/50 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-inner">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">
              Select Supplier *
            </label>
            <div className="relative group">
              <select
                className="w-full h-11 pl-4 pr-10 border border-zinc-200 rounded-xl bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all appearance-none font-semibold text-zinc-900 shadow-sm group-hover:border-zinc-300"
                value={formData.supplierId}
                onChange={(e) =>
                  setFormData({ ...formData, supplierId: e.target.value })
                }
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                <Plus className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div className="space-y-1.5 font-sans">
            <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">
              Return Date *
            </label>
            <input
              type="date"
              className="w-full h-11 px-4 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all font-semibold text-zinc-900 shadow-sm"
              value={formData.txnDate}
              onChange={(e) =>
                setFormData({ ...formData, txnDate: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-1.5 font-sans">
            <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">
              Authorizing Staff
            </label>
            <div className="relative group">
              <select
                className="w-full h-11 pl-4 pr-10 border border-zinc-200 rounded-xl bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all appearance-none font-semibold text-zinc-900 shadow-sm group-hover:border-zinc-300"
                value={formData.staffId}
                onChange={(e) =>
                  setFormData({ ...formData, staffId: e.target.value })
                }
              >
                <option value="">Select Staff</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role || "Staff"})
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                <User className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div className="md:col-span-2 space-y-1.5 font-sans">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
              Purchase Reference / Bill Context (Optional)
            </label>
            <input
              placeholder="e.g. Origin Bill PUR-001 or specific reason context..."
              className="w-full h-11 px-4 border border-zinc-200 rounded-xl bg-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all font-medium text-zinc-900 shadow-sm"
              value={formData.purchaseReference}
              onChange={(e) =>
                setFormData({ ...formData, purchaseReference: e.target.value })
              }
            />
          </div>
        </div>

        <div className="bg-rose-50/10 p-6 rounded-2xl border border-rose-100">
          <ImageUpload
            label="Return Bill / Credit Note Scan"
            value={typeof imageFile === "string" ? imageFile : undefined}
            onChange={setImageFile}
          />
        </div>

        <div className="space-y-4 font-sans">
          <div className="px-1 flex justify-between items-center text-zinc-950">
            <div>
              <h4 className="text-sm font-black uppercase tracking-tight text-zinc-900">
                Items to Return
              </h4>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Specify stock items being sent back
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-xl font-bold bg-white border border-rose-100 shadow-sm hover:bg-rose-50/50"
              onClick={addItem}
            >
              <Plus className="h-4 w-4 mr-1.5 text-rose-600" /> Add Return Item
            </Button>
          </div>

          <div className="border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    Stock Item / Description
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest w-24">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest w-32">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-black text-zinc-400 uppercase tracking-widest w-32">
                    Amount
                  </th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {formData.items.map((item, idx) => (
                  <tr
                    key={idx}
                    className="bg-white group hover:bg-rose-50/10 transition-colors"
                  >
                    <td className="px-3 py-3">
                      <div className="space-y-1">
                        <select
                          className="w-full p-2 border border-zinc-50 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-semibold text-zinc-800 transition-all"
                          value={item.stockId}
                          onChange={(e) =>
                            handleItemChange(idx, "stockId", e.target.value)
                          }
                        >
                          <option value="">
                            Select from stock inventory...
                          </option>
                          {stocks.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.unit?.shortName || "no unit"})
                            </option>
                          ))}
                        </select>
                        {!item.stockId && (
                          <input
                            placeholder="Type item name manually..."
                            className="w-full p-2 text-xs border border-zinc-100 rounded-lg italic focus:ring-2 focus:ring-rose-500 outline-none"
                            value={item.itemName}
                            onChange={(e) =>
                              handleItemChange(idx, "itemName", e.target.value)
                            }
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        step="any"
                        className="w-full p-2 border border-zinc-100 rounded-lg font-black text-center focus:ring-2 focus:ring-rose-500 outline-none"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "quantity",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        step="any"
                        className="w-full p-2 border border-zinc-100 rounded-lg font-black text-center focus:ring-2 focus:ring-rose-500 outline-none"
                        value={item.rate}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "rate",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-black text-rose-600 font-mono">
                      {item.amount.toLocaleString()}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <button
                        type="button"
                        className="p-2 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        onClick={() => removeItem(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start font-sans">
          <div className="flex-1 space-y-4 w-full">
            <div className="space-y-1.5 font-sans">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
                Reason for Return / Dispute Notes
              </label>
              <textarea
                placeholder="Mention reasons like damaged goods, expired stock, or incorrect delivery..."
                className="w-full p-4 border border-zinc-200 rounded-2xl min-h-[140px] outline-none focus:ring-2 focus:ring-rose-500 transition-all shadow-sm"
                value={formData.remark}
                onChange={(e) =>
                  setFormData({ ...formData, remark: e.target.value })
                }
              />
            </div>
          </div>

          <div className="w-96 p-6 bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-black uppercase tracking-widest">
                Base Amount
              </span>
              <span className="font-bold text-white font-mono">
                Rs. {formData.taxableAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs space-x-4">
              <span className="text-zinc-500 font-black uppercase tracking-widest">
                Discount Adjusted
              </span>
              <input
                type="number"
                className="w-24 h-8 px-2 bg-zinc-800 border-none rounded-lg text-white text-right font-black focus:ring-1 focus:ring-rose-500 outline-none"
                value={formData.discount}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setFormData({ ...formData, discount: val });
                  calculateTotals(formData.items, val, formData.roundOff);
                }}
              />
            </div>
            <div className="flex justify-between items-center text-xs space-x-4">
              <span className="text-zinc-500 font-black uppercase tracking-widest font-sans">
                Round Off
              </span>
              <input
                type="number"
                className="w-24 h-8 px-2 bg-zinc-800 border-none rounded-lg text-white text-right font-black focus:ring-1 focus:ring-rose-500 outline-none"
                value={formData.roundOff}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setFormData({ ...formData, roundOff: val });
                  calculateTotals(formData.items, formData.discount, val);
                }}
              />
            </div>
            <div className="border-t border-zinc-800 pt-4 flex flex-col gap-1">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] leading-none mb-1">
                Return Credit Value
              </span>
              <span className="text-3xl font-black text-white font-mono tracking-tighter">
                Rs. {formData.totalAmount.toLocaleString()}
              </span>
            </div>

            <div className="pt-6 border-t border-zinc-800 space-y-4">
              <label
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                  formData.paymentStatus === "PAID"
                    ? "bg-rose-500/10 border-rose-500/50 text-rose-400"
                    : "bg-zinc-800/50 border-zinc-800 text-zinc-400"
                }`}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={formData.paymentStatus === "PAID"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentStatus: e.target.checked ? "PAID" : "UNPAID",
                    })
                  }
                />
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.paymentStatus === "PAID" ? "bg-rose-500 border-rose-500" : "border-zinc-700"}`}
                >
                  {formData.paymentStatus === "PAID" && (
                    <Plus className="h-3 w-3 text-zinc-900" />
                  )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Cash / Bank Refunded
                </span>
              </label>

              {formData.paymentStatus === "PAID" && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1 font-sans">
                    Refund Route
                  </label>
                  <select
                    className="w-full h-10 px-3 bg-zinc-800 border-none rounded-xl text-white text-xs font-bold outline-none focus:ring-1 focus:ring-rose-500 transition-all font-sans"
                    value={formData.paymentMode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMode: e.target.value as any,
                      })
                    }
                  >
                    <option value="BANK_TRANSFER">Bank Settlement</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
          <Button
            type="button"
            variant="ghost"
            className="px-6 font-bold"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="px-10 rounded-xl font-black shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
          >
            {loading ? "Recording..." : "Save Return Bill"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
