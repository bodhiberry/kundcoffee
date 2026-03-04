"use client";

import { useState, useMemo, useEffect } from "react";
import { Order, Customer } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  User,
  Printer,
  X,
  Loader2,
  Check,
  Receipt,
  Info,
  Users,
} from "lucide-react";
import { CustomDropdown } from "../ui/CustomDropdown";
import { addCustomer, getCustomerSummary } from "@/services/customer";
import { useSettings } from "@/components/providers/SettingsProvider";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onCheckoutComplete: (result: any) => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  order,
  onCheckoutComplete,
}: CheckoutModalProps) {
  const { settings } = useSettings();
  const [step, setStep] = useState<"PREPARE" | "SUCCESS">("PREPARE");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    order.customer || null,
  );
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QR" | "CREDIT">(
    "CASH",
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [includeTax, setIncludeTax] = useState(
    settings.includeTaxByDefault === "true",
  );
  const [includeServiceCharge, setIncludeServiceCharge] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");

  // Settlement States
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [tenderAmount, setTenderAmount] = useState<number>(0);
  const [complimentaryItems, setComplimentaryItems] = useState<
    Record<string, number>
  >({});
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"PERCENT" | "AMOUNT">(
    "PERCENT",
  );

  // Customer Management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", phone: "" });

  useEffect(() => {
    const fetchData = async () => {
      const [custRes, staffRes] = await Promise.all([
        getCustomerSummary(),
        fetch("/api/staff"),
      ]);
      if (custRes.success) setCustomers(custRes.data);
      const staffData = await staffRes.json();
      if (staffData.success) setStaff(staffData.data);
    };
    if (isOpen) fetchData();
  }, [isOpen]);

  useEffect(() => {
    setPaymentReceived(false);
  }, [paymentMethod]);

  // --- Calculations Logic ---
  const calculatedSubtotal = useMemo(() => {
    return order.items.reduce((sum, item) => {
      const compQty = complimentaryItems[item.id] || 0;
      const paidQty = Math.max(0, item.quantity - compQty);
      return sum + paidQty * item.unitPrice;
    }, 0);
  }, [order.items, complimentaryItems]);

  const manualDiscountAmount = useMemo(() => {
    if (discountType === "PERCENT") {
      return (calculatedSubtotal * discountValue) / 100;
    }
    return discountValue;
  }, [calculatedSubtotal, discountValue, discountType]);

  const loyaltyDiscountAmount = useMemo(() => {
    // Loyalty logic: Apply the customer's specific discount rate to the subtotal
    const rate = selectedCustomer?.loyaltyDiscount || 0;
    return (calculatedSubtotal * rate) / 100;
  }, [calculatedSubtotal, selectedCustomer]);

  const totalDiscount = useMemo(() => {
    return Math.min(
      manualDiscountAmount + loyaltyDiscountAmount,
      calculatedSubtotal,
    );
  }, [manualDiscountAmount, loyaltyDiscountAmount, calculatedSubtotal]);

  const subtotalAfterDiscount = calculatedSubtotal - totalDiscount;

  const taxAmount = includeTax ? subtotalAfterDiscount * 0.13 : 0;
  const serviceChargeAmount = includeServiceCharge
    ? subtotalAfterDiscount * 0.1
    : 0;
  const grandTotal = subtotalAfterDiscount + taxAmount + serviceChargeAmount;

  const canSettle = useMemo(() => {
    if (paymentMethod === "CASH") return tenderAmount >= grandTotal - 0.01;
    if (paymentMethod === "QR") return paymentReceived;
    if (paymentMethod === "CREDIT") return !!selectedCustomer;
    return false;
  }, [
    paymentMethod,
    tenderAmount,
    grandTotal,
    paymentReceived,
    selectedCustomer,
  ]);

  const handleProcessCheckout = async () => {
    if (!canSettle) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: order.tableId,
          sessionId: order.sessionId,
          paymentMethod,
          amount: grandTotal,
          customerId: selectedCustomer?.id,
          subtotal: calculatedSubtotal,
          tax: taxAmount,
          serviceCharge: serviceChargeAmount,
          discount: totalDiscount,
          complimentaryItems,
          staffId: selectedStaffId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("SUCCESS");
        setTimeout(() => {
          onCheckoutComplete(data.data);
          onClose();
        }, 1500);
      }
    } catch (e) {
      alert("Settlement Error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!formData.fullName) return;
    const res = await addCustomer({ ...formData, openingBalance: 0 });
    if (res.success) {
      setSelectedCustomer(res.data);
      setIsAddModalOpen(false);
      const refresh = await getCustomerSummary();
      setCustomers(refresh.data);
    }
  };

  if (step === "SUCCESS") {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="" size="md">
        <div className="flex flex-col items-center py-12">
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mb-6">
            <Check size={32} />
          </div>
          <h3 className="text-xl font-black uppercase tracking-widest">
            Transaction Settled
          </h3>
          <p className="text-[10px] text-zinc-400 font-bold uppercase mt-2">
            Inventory Updated & Invoice Saved
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settle Bill" size="6xl">
      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- LEFT COLUMN: PROFESSIONAL STANDARDIZED BILL --- */}
        <div className="flex flex-col h-[760px] border border-black rounded-sm overflow-hidden bg-white">
          <div className="p-3 border-b border-black flex justify-between items-center bg-zinc-50">
            <span className="text-[10px] font-black uppercase tracking-tighter flex items-center gap-2">
              <Receipt size={14} /> Invoice Preview
            </span>
          </div>

          <div
            className="flex-1 overflow-y-auto p-6 font-mono text-[10px] leading-tight"
            id="printable-bill"
          >
            {/* Store Header */}
            <div className="text-center mb-4 space-y-1">
              <h2 className="text-sm font-black uppercase leading-none">
                {settings.name || "KUND COFFEE"}
              </h2>
              <p className="uppercase">
                {settings.address || "Kathmandu, Nepal"}
              </p>
              <p>Phone: {settings.phone || "+977 XXXXXXXXXX"}</p>
              <p className="font-bold">PAN/VAT: 123456789</p>
            </div>

            {/* Bill Info */}
            <div className="border-y border-black border-dashed py-2 mb-4 space-y-1">
              <div className="flex justify-between">
                <span>Invoice: #{order.id.slice(-6).toUpperCase()}</span>
                <span>Date: {new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Table: {order.table?.name || "N/A"}</span>
                <span>
                  Time:{" "}
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {selectedCustomer && (
                <div className="flex justify-between font-bold border-t border-black border-dotted mt-1 pt-1">
                  <span>Customer: {selectedCustomer.fullName}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <table className="w-full mb-4">
              <thead>
                <tr className="border-b border-black text-left">
                  <th className="pb-1 font-black">ITEM</th>
                  <th className="pb-1 text-center font-black">QTY</th>
                  <th className="pb-1 text-right font-black">AMT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {order.items.map((item) => {
                  const compQty = complimentaryItems[item.id] || 0;
                  return (
                    <tr key={item.id}>
                      <td className="py-2 pr-2">
                        {item.dish?.name || item.combo?.name}
                        {compQty > 0 && (
                          <span className="block text-[8px] italic font-bold">
                            (FREE: {compQty})
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">
                        {((item.quantity - compQty) * item.unitPrice).toFixed(
                          2,
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Final Calculations */}
            <div className="border-t border-black pt-2 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{calculatedSubtotal.toFixed(2)}</span>
              </div>

              {manualDiscountAmount > 0 && (
                <div className="flex justify-between">
                  <span>Manual Discount</span>
                  <span>-{manualDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              {loyaltyDiscountAmount > 0 && (
                <div className="flex justify-between font-bold">
                  <span>
                    Loyalty Reward ({selectedCustomer?.loyaltyDiscount}%)
                  </span>
                  <span>-{loyaltyDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-black border-dotted my-1"></div>

              {includeTax && (
                <div className="flex justify-between">
                  <span>VAT (13%)</span>
                  <span>{taxAmount.toFixed(2)}</span>
                </div>
              )}
              {includeServiceCharge && (
                <div className="flex justify-between">
                  <span>Service Charge (10%)</span>
                  <span>{serviceChargeAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="mt-2 pt-2 border-t-2 border-black flex justify-between items-center font-black text-base uppercase tracking-tighter">
                <span>Grand Total</span>
                <span>
                  {settings.currency} {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="text-center mt-6 pt-4 border-t border-black border-dashed space-y-1">
              <p className="font-bold">THANK YOU FOR YOUR VISIT!</p>
              <p className="text-[8px]">POWERED BY KUND ERP</p>
            </div>
          </div>

          {/* Payment Interaction Area */}
          <div className="p-4 bg-zinc-50 border-t border-black space-y-3">
            <div className="flex border border-black p-0.5">
              {["CASH", "QR", "CREDIT"].map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m as any)}
                  className={`flex-1 py-1.5 text-[9px] font-black transition-colors ${
                    paymentMethod === m
                      ? "bg-black text-white"
                      : "hover:bg-zinc-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="h-[130px] flex flex-col justify-center bg-white border border-black p-3">
              {paymentMethod === "CASH" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black uppercase">
                      Tendered
                    </label>
                    <input
                      type="number"
                      value={tenderAmount || ""}
                      onChange={(e) =>
                        setTenderAmount(Number(e.target.value) || 0)
                      }
                      className="w-1/2 border-b border-black text-right text-base font-black outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-black bg-zinc-100 p-2">
                    <span>Return Change</span>
                    <span className="text-base">
                      {Math.max(0, tenderAmount - grandTotal).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === "QR" && (
                <div className="flex flex-col items-center gap-2">
                  <div className="border border-black p-1 bg-white">
                    <img
                      src="/merchant-qr.jpg"
                      alt="QR"
                      className="w-16 h-16"
                    />
                  </div>
                  <button
                    onClick={() => setPaymentReceived(!paymentReceived)}
                    className={`w-full py-2 text-[8px] font-black uppercase border border-black transition-all ${
                      paymentReceived
                        ? "bg-black text-white"
                        : "bg-white hover:bg-zinc-100"
                    }`}
                  >
                    {paymentReceived
                      ? "Payment Confirmed ✓"
                      : "Confirm Payment Received"}
                  </button>
                </div>
              )}

              {paymentMethod === "CREDIT" && (
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase">
                    Store Credit
                  </p>
                  <p className="text-[9px] mt-1 border-t border-zinc-200 pt-1">
                    {selectedCustomer
                      ? `Post to account: ${selectedCustomer.fullName}`
                      : "Error: Select Customer First"}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button
                disabled={!canSettle || isProcessing}
                onClick={handleProcessCheckout}
                className={`h-10 rounded-none text-[10px] font-black uppercase tracking-widest border-2 ${
                  canSettle
                    ? "bg-black text-white border-black"
                    : "bg-white text-zinc-300 border-zinc-200"
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  "Complete Settlement"
                )}
              </Button>
              <Button
                onClick={() => window.print()}
                variant="secondary"
                className="h-10 rounded-none text-[10px] font-black uppercase tracking-widest border-black hover:bg-zinc-100"
              >
                <Printer size={14} className="mr-2" /> Print Receipt
              </Button>
            </div>
          </div>
        </div>

        {/* --- MIDDLE COLUMN: ADJUSTMENTS & CUSTOMER --- */}
        <div className="flex flex-col gap-6">
          <div className="p-6 border border-black bg-white space-y-6">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border-b border-black pb-2">
                <Info size={12} /> Discount Settings
              </h4>
              <div className="flex border border-black p-0.5">
                <button
                  onClick={() => setDiscountType("PERCENT")}
                  className={`flex-1 py-2 text-[9px] font-black transition-colors ${discountType === "PERCENT" ? "bg-black text-white" : ""}`}
                >
                  %
                </button>
                <button
                  onClick={() => setDiscountType("AMOUNT")}
                  className={`flex-1 py-2 text-[9px] font-black transition-colors ${discountType === "AMOUNT" ? "bg-black text-white" : ""}`}
                >
                  AMT
                </button>
              </div>
              <input
                type="number"
                value={discountValue || ""}
                onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                className="w-full border border-black px-4 py-3 text-sm font-black outline-none focus:ring-1 focus:ring-black"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setIncludeTax(!includeTax)}
                className={`w-full py-3 px-4 border border-black text-[9px] font-black uppercase flex justify-between items-center transition-colors ${includeTax ? "bg-black text-white" : "bg-white text-black hover:bg-zinc-50"}`}
              >
                Add VAT (13%) {includeTax && <Check size={14} />}
              </button>
              <button
                onClick={() => setIncludeServiceCharge(!includeServiceCharge)}
                className={`w-full py-3 px-4 border border-black text-[9px] font-black uppercase flex justify-between items-center transition-colors ${includeServiceCharge ? "bg-black text-white" : "bg-white text-black hover:bg-zinc-50"}`}
              >
                Add Service Chg (10%){" "}
                {includeServiceCharge && <Check size={14} />}
              </button>
            </div>
          </div>

          <div className="p-6 border border-black bg-white space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest border-b border-black pb-2">
              Link Customer
            </h4>
            {!selectedCustomer ? (
              <CustomDropdown
                label="Search Profiles"
                options={customers.map((c) => ({ id: c.id, name: c.fullName }))}
                value={undefined}
                onChange={(val) =>
                  setSelectedCustomer(
                    customers.find((c) => c.id === val) ?? null,
                  )
                }
                placeholder="Search..."
                onAddNew={() => setIsAddModalOpen(true)}
              />
            ) : (
              <div className="flex items-center justify-between border-2 border-black p-3 bg-zinc-50">
                <div className="flex items-center gap-3">
                  <User size={16} />
                  <div>
                    <span className="text-[10px] font-black uppercase block leading-none">
                      {selectedCustomer.fullName}
                    </span>
                    <span className="text-[8px] font-bold text-zinc-500 uppercase">
                      Loyalty Tier: {selectedCustomer.loyaltyDiscount}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-zinc-500 hover:text-black transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="p-6 border border-black bg-white space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest border-b border-black pb-2">
              Link Staff / Server
            </h4>
            <div className="relative">
              <Users
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                size={14}
              />
              <select
                className="w-full pl-9 pr-4 py-3 bg-white border border-black text-sm font-bold outline-none focus:ring-1 focus:ring-black appearance-none"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
              >
                <option value="">Select Staff</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: ORDER ITEMS & COMPLIMENTARY --- */}
        <div className="bg-white border border-black p-6 flex flex-col h-[760px]">
          <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-black pb-3 mb-6 shrink-0">
            Line Items
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full">
              <tbody className="divide-y divide-zinc-200">
                {order.items.map((item) => {
                  const compQty = complimentaryItems[item.id] || 0;
                  return (
                    <tr key={item.id}>
                      <td className="py-4 pr-2">
                        <p className="text-[11px] font-black uppercase leading-tight">
                          {item.dish?.name || item.combo?.name}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-[9px] font-bold uppercase">
                            Qty: {item.quantity}
                          </span>
                          <div className="flex items-center border border-black px-2 py-0.5">
                            <span className="text-[8px] font-black uppercase mr-2 text-zinc-500">
                              Free
                            </span>
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={compQty}
                              onChange={(e) =>
                                setComplimentaryItems({
                                  ...complimentaryItems,
                                  [item.id]: Math.min(
                                    item.quantity,
                                    parseInt(e.target.value) || 0,
                                  ),
                                })
                              }
                              className="w-8 bg-transparent text-center text-[10px] font-black outline-none"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-right align-top">
                        <p
                          className={`text-[11px] font-black ${compQty >= item.quantity ? "line-through text-zinc-300" : ""}`}
                        >
                          {(item.quantity * item.unitPrice).toFixed(2)}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer Quick Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="New Customer"
        size="lg"
      >
        <div className="p-8 space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full border border-black px-4 py-3 rounded-none text-sm font-bold outline-none"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Phone"
            className="w-full border border-black px-4 py-3 rounded-none text-sm font-bold outline-none"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
          <Button
            onClick={handleCreateCustomer}
            className="w-full h-12 bg-black text-white font-black uppercase tracking-widest text-[10px] rounded-none"
          >
            Create & Link Profile
          </Button>
        </div>
      </Modal>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-bill,
          #printable-bill * {
            visibility: visible;
          }
          #printable-bill {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            padding: 10mm;
          }
        }
      `}</style>
    </Modal>
  );
}
