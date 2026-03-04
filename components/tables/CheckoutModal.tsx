"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Customer, Table } from "@/lib/types";
import { getCustomers, addCustomer } from "@/services/customer";
import { processCheckout, getCheckoutDetails } from "@/services/checkout";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import {
  Printer,
  CheckCircle2,
  Wallet,
  QrCode,
  UserPlus,
  ArrowRight,
  Loader2,
  CreditCard,
  Gift,
  PlusCircle,
  X,
  Search,
  LayoutGrid,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCategories,
  getDishes,
  getAddOns,
  getCombos,
} from "@/services/menu";
import { useSettings } from "@/components/providers/SettingsProvider";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table;
  onSuccess: () => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  table,
  onSuccess,
}: CheckoutModalProps) {
  const { settings } = useSettings();
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Customer, 2: Bill/Print, 3: Payment
  const [loading, setLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<
    string | undefined
  >(undefined);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [complimentaryItems, setComplimentaryItems] = useState<
    Record<string, number>
  >({});
  const [customTaxes, setCustomTaxes] = useState<
    { name: string; percentage: number }[]
  >([]);
  const [newTaxName, setNewTaxName] = useState("");
  const [newTaxPercent, setNewTaxPercent] = useState("");
  const [isAddingTax, setIsAddingTax] = useState(false);
  const [isSelectingFreeItems, setIsSelectingFreeItems] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [extraFreeItems, setExtraFreeItems] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [qrData, setQrData] = useState<any>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>(
    undefined,
  );
  const [paymentMode, setPaymentMode] = useState<"SINGLE" | "SPLIT">("SINGLE");
  const [cashAmount, setCashAmount] = useState<string>("");
  const [qrAmount, setQrAmount] = useState<string>("");

  // New Customer Form
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchCheckoutDetails();
      fetchCustomers();
      fetchStaff();
      fetchQrData();
    }
  }, [isOpen, table.id]);

  const fetchQrData = async () => {
    try {
      const res = await fetch("/api/qr-payment");
      const data = await res.json();
      if (data.success) {
        setQrData(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch QR data:", err);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      if (data.success) {
        setStaff(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch staff:", err);
    }
  };

  const fetchCheckoutDetails = async () => {
    try {
      setLoading(true);
      const data = await getCheckoutDetails(table.id);
      setCheckoutData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    const data = await getCustomers();
    setCustomers(data);
  };

  const fetchMenuData = async () => {
    try {
      const [catData, dishData, addonData, comboData] = await Promise.all([
        getCategories(),
        getDishes(),
        getAddOns(),
        getCombos(),
      ]);
      setCategories(catData);
      setAvailableItems([
        ...dishData.map((d: any) => ({ ...d, type: "DISH" })),
        ...addonData.map((a: any) => ({ ...a, type: "ADDON" })),
        ...comboData.map((c: any) => ({ ...c, type: "COMBO" })),
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isSelectingFreeItems) {
      fetchMenuData();
    }
  }, [isSelectingFreeItems]);

  const handleCreateCustomer = async () => {
    if (!newCustomerName) return;
    try {
      const res = await addCustomer({
        fullName: newCustomerName,
        phone: newCustomerPhone,
      });
      if (res.success) {
        setCustomers([...customers, res.data]);
        setSelectedCustomerId(res.data.id);
        setIsAddingCustomer(false);
        setNewCustomerName("");
        setNewCustomerPhone("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    // Basic print functionality
    window.print();
    // After printing, move to payment step
    setStep(3);
  };

  const handleFinalize = async (method: "CASH" | "QR" | "CREDIT" | "SPLIT") => {
    try {
      setLoading(true);
      const summary = calculateSummary();

      let paymentsPayload = undefined;
      let finalMethod = method as any;

      if (method === "SPLIT") {
        paymentsPayload = [
          { method: "CASH", amount: parseFloat(cashAmount) || 0 },
          { method: "QR", amount: parseFloat(qrAmount) || 0 },
        ];
        // For legacy support in backend if needed
        finalMethod = "CASH";
      }

      await processCheckout({
        tableId: table.id,
        sessionId: checkoutData.sessionId,
        paymentMethod: finalMethod,
        payments: paymentsPayload,
        amount: summary.grandTotal,
        customerId: selectedCustomerId,
        subtotal: summary.subtotal,
        tax: summary.tax,
        serviceCharge: summary.serviceCharge,
        discount: summary.totalDiscount,
        complimentaryItems,
        extraFreeItems,
        staffId: selectedStaffId,
      } as any);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = () => {
    if (!checkoutData)
      return {
        subtotal: 0,
        tax: 0,
        serviceCharge: 0,
        grandTotal: 0,
        totalDiscount: 0,
      };

    const rawSubtotal = checkoutData.items.reduce(
      (sum: number, item: any) => sum + item.totalPrice,
      0,
    );

    const complimentaryValue = checkoutData.items.reduce(
      (sum: number, item: any) => {
        const compQty = complimentaryItems[item.id] || 0;
        return sum + compQty * item.unitPrice;
      },
      0,
    );

    const extraFreeValue = extraFreeItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const netSubtotal = Math.max(
      0,
      rawSubtotal - complimentaryValue - (checkoutData.summary.discount || 0),
    );
    const serviceCharge = netSubtotal * 0.1; // Assuming fixed 10% for now

    const standardTax = netSubtotal * 0.13; // Assuming fixed 13% for now
    const customTaxesTotal = customTaxes.reduce(
      (sum, tax) => sum + netSubtotal * (tax.percentage / 100),
      0,
    );
    const totalTax = standardTax + customTaxesTotal;

    const grandTotal = netSubtotal + serviceCharge + totalTax;

    return {
      subtotal: netSubtotal,
      tax: totalTax,
      serviceCharge,
      grandTotal,
      totalDiscount: complimentaryValue + (checkoutData.summary.discount || 0),
      complimentaryValue,
    };
  };

  const setCompQty = (itemId: string, qty: number, maxQty: number) => {
    const safeQty = Math.max(0, Math.min(qty, maxQty));
    setComplimentaryItems((prev) => ({ ...prev, [itemId]: safeQty }));
  };

  const addFreeItem = (menuItem: any) => {
    setExtraFreeItems((prev) => {
      const existing = prev.find((i) => i.id === menuItem.id);
      if (existing) {
        return prev.map((i) =>
          i.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          id: menuItem.id,
          name: menuItem.name,
          unitPrice: menuItem.price?.listedPrice || 0,
          quantity: 1,
        },
      ];
    });
  };

  const removeFreeItem = (itemId: string) => {
    setExtraFreeItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleAddTax = () => {
    if (!newTaxName || !newTaxPercent) return;
    setCustomTaxes([
      ...customTaxes,
      { name: newTaxName, percentage: parseFloat(newTaxPercent) },
    ]);
    setNewTaxName("");
    setNewTaxPercent("");
    setIsAddingTax(false);
  };

  if (!checkoutData && loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Preparing Checkout">
        <div className="flex flex-col items-center justify-center p-12 gap-4">
          <Loader2 className="animate-spin text-emerald-500" size={40} />
          <p className="text-sm text-zinc-500 font-medium animate-pulse">
            Calculating totals...
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Checkout - Table ${table.name}`}
      size="5xl"
    >
      <div className="flex flex-col gap-6 p-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full -p-2">
          {/* Left Column: Items List & Customer/Discount */}
          <div className="flex flex-col gap-4">
            {/* Order Items */}
            <div className="bg-white border-2 border-dashed border-zinc-200 rounded-3xl p-5 shadow-sm flex flex-col flex-1 max-h-[50vh]">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Order Items
                </h3>
                <Button
                  onClick={() => setIsSelectingFreeItems(true)}
                  variant="secondary"
                  className="h-8 px-3 text-[10px] font-black uppercase tracking-widest border-2 border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                >
                  <PlusCircle size={14} className="mr-1.5" /> Free Items
                </Button>
              </div>
              <div className="overflow-y-auto custom-scrollbar pr-2 flex-1">
                {checkoutData?.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 py-3 border-b border-zinc-50 last:border-0"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-bold text-zinc-800 text-sm truncate">
                          {item.name}
                        </p>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                          {settings.currency} {item.unitPrice.toFixed(2)} x{" "}
                          {item.quantity}
                        </p>
                      </div>
                      <div className="text-right font-black text-zinc-900 text-sm">
                        {settings.currency}{" "}
                        {(
                          (item.quantity - (complimentaryItems[item.id] || 0)) *
                          item.unitPrice
                        ).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-50/50 p-1.5 rounded-lg border border-emerald-100/50 self-start">
                      <span className="text-[9px] uppercase font-black text-emerald-600">
                        Comp. Qty
                      </span>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={complimentaryItems[item.id] || 0}
                        onChange={(e) =>
                          setCompQty(
                            item.id,
                            parseInt(e.target.value) || 0,
                            item.quantity,
                          )
                        }
                        className="w-10 h-6 bg-white border border-emerald-100 rounded text-center text-[10px] font-black text-emerald-700 outline-none"
                      />
                    </div>
                  </div>
                ))}

                {extraFreeItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-sm py-3 border-b border-emerald-50 bg-emerald-50/30 rounded-lg px-2 last:border-0 mb-2"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <Gift size={10} className="text-emerald-500" />
                        <p className="font-bold text-emerald-700 truncate">
                          {item.name}
                        </p>
                      </div>
                      <p className="text-[9px] text-emerald-600/60 font-bold uppercase tracking-widest">
                        {item.quantity} x Free
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => removeFreeItem(item.id)}
                        className="p-1 text-zinc-300 hover:text-emerald-500"
                      >
                        <X size={14} />
                      </button>
                      <div className="text-right font-black text-emerald-600 w-16">
                        {settings.currency}0.00
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff & Customer info */}
            <div className="bg-zinc-50 p-5 rounded-3xl border border-zinc-100 shrink-0 space-y-6">
              <div>
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">
                  Handle By (Staff)
                </h3>
                <CustomDropdown
                  label="Select Staff"
                  options={staff.map((s) => ({
                    id: s.id,
                    name: s.name,
                  }))}
                  value={selectedStaffId}
                  onChange={setSelectedStaffId}
                  placeholder="Select staff..."
                />
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">
                  Customer Info
                </h3>
                {!isAddingCustomer ? (
                  <div className="space-y-4">
                    <CustomDropdown
                      label="Select Customer"
                      options={customers.map((c) => ({
                        id: c.id,
                        name: `${c.fullName} (${c.phone || "No"})`,
                      }))}
                      value={selectedCustomerId}
                      onChange={setSelectedCustomerId}
                      placeholder="Search customer..."
                    />
                    <button
                      onClick={() => setIsAddingCustomer(true)}
                      className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:text-emerald-700 ml-1"
                    >
                      <UserPlus size={14} /> Add New
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 bg-white p-3 rounded-xl border border-zinc-200">
                    <input
                      placeholder="Full Name"
                      className="w-full bg-zinc-50 border-none rounded-lg p-2.5 text-xs focus:ring-1 ring-emerald-500"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                    />
                    <input
                      placeholder="Phone"
                      className="w-full bg-zinc-50 border-none rounded-lg p-2.5 text-xs focus:ring-1 ring-emerald-500"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreateCustomer}
                        className="flex-1 bg-zinc-900 text-white text-[10px] uppercase h-8"
                      >
                        Save
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setIsAddingCustomer(false)}
                        className="flex-1 text-[10px] uppercase h-8"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle Column: Payment Form */}
          <div className="flex flex-col gap-4 bg-zinc-50/50 p-5 rounded-3xl border border-zinc-100 place-content-center">
            <div className="text-center mb-6">
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">
                Payment Method
              </h3>
              <p className="text-[10px] text-zinc-500 mt-2 font-medium">
                Select to finalize transaction
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex bg-white p-1 rounded-2xl border-2 border-zinc-100 mb-2">
                <button
                  onClick={() => setPaymentMode("SINGLE")}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${paymentMode === "SINGLE" ? "bg-zinc-900 text-white shadow-lg" : "text-zinc-400 hover:text-zinc-600"}`}
                >
                  Single Payment
                </button>
                <button
                  onClick={() => {
                    setPaymentMode("SPLIT");
                    const total = calculateSummary().grandTotal;
                    setCashAmount((total / 2).toFixed(2));
                    setQrAmount((total / 2).toFixed(2));
                  }}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${paymentMode === "SPLIT" ? "bg-emerald-500 text-white shadow-lg" : "text-zinc-400 hover:text-zinc-600"}`}
                >
                  Split (Cash+QR)
                </button>
              </div>

              {paymentMode === "SINGLE" ? (
                <>
                  <button
                    disabled={loading}
                    onClick={() => handleFinalize("CASH")}
                    className="flex items-center gap-5 p-5 bg-white border-2 border-zinc-100 rounded-3xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group shadow-sm active:scale-95 text-left"
                  >
                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-zinc-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <Banknote
                        size={26}
                        className="text-zinc-400 group-hover:text-emerald-600"
                      />
                    </div>
                    <div>
                      <span className="font-black text-zinc-900 text-sm uppercase tracking-widest block">
                        Cash
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Receive physical currency
                      </span>
                    </div>
                  </button>

                  <div className="space-y-3">
                    <button
                      disabled={loading}
                      onClick={() => handleFinalize("QR")}
                      className="w-full flex items-center gap-5 p-5 bg-white border-2 border-zinc-100 rounded-3xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group shadow-sm active:scale-95 text-left"
                    >
                      <div className="w-14 h-14 shrink-0 rounded-2xl bg-zinc-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                        <QrCode
                          size={26}
                          className="text-zinc-400 group-hover:text-emerald-600"
                        />
                      </div>
                      <div>
                        <span className="font-black text-zinc-900 text-sm uppercase tracking-widest block">
                          Scan QR
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          Digital wallet payment
                        </span>
                      </div>
                    </button>
                    {qrData?.image?.[0] && (
                      <div className="bg-zinc-50 p-4 rounded-3xl border border-dashed border-zinc-200 flex flex-col items-center gap-3">
                        <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">
                          Scan to Pay
                        </p>
                        <img
                          src={qrData.image[0]}
                          alt="Store QR"
                          className="w-40 h-40 object-contain rounded-xl shadow-sm bg-white p-2"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    disabled={loading || !selectedCustomerId}
                    onClick={() => handleFinalize("CREDIT")}
                    className={`flex items-center gap-5 p-5 bg-white border-2 border-zinc-100 rounded-3xl transition-all group shadow-sm text-left active:scale-95 ${!selectedCustomerId ? "opacity-50 cursor-not-allowed" : "hover:border-emerald-500 hover:bg-emerald-50"}`}
                  >
                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-zinc-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <CreditCard
                        size={26}
                        className="text-zinc-400 group-hover:text-emerald-600"
                      />
                    </div>
                    <div>
                      <span className="font-black text-zinc-900 text-sm uppercase tracking-widest block">
                        Store Credit
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {!selectedCustomerId
                          ? "Requires customer"
                          : "Add to ledger"}
                      </span>
                    </div>
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1">
                      Split Payment Guide
                    </p>
                    <p className="text-[10px] text-emerald-600 leading-relaxed font-medium">
                      Enter the amount received in Cash and the amount paid via
                      QR. The total must equal the grand total of{" "}
                      {settings.currency}{" "}
                      {calculateSummary().grandTotal.toLocaleString()}.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-3xl border-2 border-emerald-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Banknote size={16} className="text-emerald-600" />
                        <span className="text-[9px] font-black uppercase text-zinc-400">
                          Cash Amount
                        </span>
                      </div>
                      <input
                        type="number"
                        className="w-full bg-transparent border-none text-xl font-black text-zinc-900 outline-none p-0"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                      />
                    </div>
                    <div className="bg-white p-4 rounded-3xl border-2 border-emerald-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <QrCode size={16} className="text-emerald-600" />
                        <span className="text-[9px] font-black uppercase text-zinc-400">
                          QR Amount
                        </span>
                      </div>
                      <input
                        type="number"
                        className="w-full bg-transparent border-none text-xl font-black text-zinc-900 outline-none p-0"
                        value={qrAmount}
                        onChange={(e) => setQrAmount(e.target.value)}
                      />
                    </div>
                  </div>

                  {qrData?.image?.[0] && (
                    <div className="bg-zinc-50 p-4 rounded-3xl border border-dashed border-zinc-200 flex flex-col items-center gap-3">
                      <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">
                        Scan QR below for the QR part
                      </p>
                      <img
                        src={qrData.image[0]}
                        alt="Store QR"
                        className="w-32 h-32 object-contain rounded-xl shadow-sm bg-white p-2"
                      />
                    </div>
                  )}

                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-black uppercase text-emerald-600 block">
                        Total Entered
                      </span>
                      <span className="text-lg font-black text-emerald-700">
                        {settings.currency}{" "}
                        {(
                          (parseFloat(cashAmount) || 0) +
                          (parseFloat(qrAmount) || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                    {Math.abs(
                      (parseFloat(cashAmount) || 0) +
                        (parseFloat(qrAmount) || 0) -
                        calculateSummary().grandTotal,
                    ) < 0.01 ? (
                      <CheckCircle2 size={24} className="text-emerald-500" />
                    ) : (
                      <div className="text-right">
                        <span className="text-[9px] font-black uppercase text-rose-500 block">
                          Remaining
                        </span>
                        <span className="text-sm font-black text-rose-600">
                          {settings.currency}{" "}
                          {(
                            calculateSummary().grandTotal -
                            ((parseFloat(cashAmount) || 0) +
                              (parseFloat(qrAmount) || 0))
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    disabled={
                      loading ||
                      Math.abs(
                        (parseFloat(cashAmount) || 0) +
                          (parseFloat(qrAmount) || 0) -
                          calculateSummary().grandTotal,
                      ) >= 0.01
                    }
                    onClick={() => handleFinalize("SPLIT")}
                    className="w-full h-16 bg-zinc-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 disabled:opacity-30"
                  >
                    Complete split payment
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Grand Total & Bill */}
          <div className="flex flex-col bg-zinc-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
            {/* decorative blob */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6 shrink-0 z-10">
              Bill Summary
            </h3>

            {(() => {
              const summary = checkoutData
                ? calculateSummary()
                : {
                    subtotal: 0,
                    serviceCharge: 0,
                    grandTotal: 0,
                    complimentaryValue: 0,
                  };
              return (
                <div className="space-y-4 mb-8 flex-1 z-10">
                  <div className="flex justify-between text-[11px] font-bold text-zinc-400 tracking-wider">
                    <span>Subtotal</span>
                    <span className="text-white">
                      {settings.currency} {summary.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-zinc-400 tracking-wider">
                    <span>Service Charge (10%)</span>
                    <span className="text-white">
                      {settings.currency} {summary.serviceCharge.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-zinc-400 tracking-wider">
                    <span>VAT (13%)</span>
                    <span className="text-white">
                      {settings.currency} {(summary.subtotal * 0.13).toFixed(2)}
                    </span>
                  </div>
                  {customTaxes.map((tax, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-[11px] font-bold text-zinc-400 tracking-wider"
                    >
                      <span>
                        {tax.name} ({tax.percentage}%)
                      </span>
                      <span className="text-white">
                        {settings.currency}{" "}
                        {(summary.subtotal * (tax.percentage / 100)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {summary.complimentaryValue > 0 && (
                    <div className="flex justify-between text-[11px] font-bold text-emerald-400 tracking-wider">
                      <span>Comp Discount</span>
                      <span>
                        -{settings.currency}{" "}
                        {summary.complimentaryValue.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-white/10 z-10 w-full mb-6 relative">
                    {/* Add Custom tax Trigger inside black box */}
                    {!isAddingTax ? (
                      <button
                        onClick={() => setIsAddingTax(true)}
                        className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-wider flex items-center gap-1"
                      >
                        + Add Custom Tax
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-xl backdrop-blur-md border border-white/10">
                        <input
                          placeholder="Tax Name"
                          className="text-[10px] p-2 rounded-lg bg-black/50 border border-white/10 focus:border-emerald-500 text-white outline-none w-full"
                          value={newTaxName}
                          onChange={(e) => setNewTaxName(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <input
                            placeholder="%"
                            type="number"
                            className="text-[10px] p-2 rounded-lg bg-black/50 border border-white/10 focus:border-emerald-500 text-white outline-none w-16"
                            value={newTaxPercent}
                            onChange={(e) => setNewTaxPercent(e.target.value)}
                          />
                          <button
                            onClick={handleAddTax}
                            className="bg-emerald-500 text-white p-2 rounded-lg shadow-sm hover:bg-emerald-600 flex-1 flex items-center justify-center font-bold text-[10px] uppercase tracking-widest"
                          >
                            Apply
                          </button>
                          <button
                            onClick={() => setIsAddingTax(false)}
                            className="bg-white/10 text-white p-2 text-xs rounded-lg hover:bg-white/20 px-3"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="border-t border-white/10 pt-6 mb-6 shrink-0 z-10">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Grand Total
                </span>
                <span className="text-4xl font-black tracking-tighter text-emerald-400 drop-shadow-md">
                  {settings.currency}{" "}
                  {checkoutData
                    ? calculateSummary().grandTotal.toFixed(2)
                    : "0.00"}
                </span>
              </div>
            </div>

            <div className="space-y-4 mt-auto shrink-0 z-10">
              <Button
                onClick={() => window.print()}
                className="w-full h-14 bg-white hover:bg-zinc-200 text-zinc-900 border-none uppercase tracking-[0.2em] font-black text-[10px] shadow-lg"
              >
                <Printer size={16} className="mr-2" /> Print Bill
              </Button>
            </div>
          </div>
        </div>

        {/* Hidden area for printing the physical ticket */}
        <div className="hidden">
          {checkoutData && (
            <div className="bg-white printable-area">
              <div className="text-center mb-6">
                <h2 className="text-xl font-black tracking-tight text-zinc-900">
                  KUND COFFEE
                </h2>
                <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em]">
                  Table Summary Receipt
                </p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em]">
                  Table {table.name}
                </p>
              </div>

              <div className="space-y-2 mb-6 text-sm">
                {checkoutData.items.map((item: any) => {
                  const comp = complimentaryItems[item.id] || 0;
                  const cost = (
                    (item.quantity - comp) *
                    item.unitPrice
                  ).toFixed(2);
                  return (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.quantity}x {item.name}{" "}
                        {comp > 0 ? `(${comp} Comp)` : ""}
                      </span>
                      <span>
                        {settings.currency} {cost}
                      </span>
                    </div>
                  );
                })}
                {extraFreeItems.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.quantity}x {item.name} (Free)
                    </span>
                    <span>{settings.currency} 0.00</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 text-sm font-bold flex justify-between">
                <span>Total</span>
                <span>
                  {settings.currency} {calculateSummary().grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isSelectingFreeItems}
        onClose={() => setIsSelectingFreeItems(false)}
        title="Add Complimentary Items"
        size="lg"
      >
        <div className="flex flex-col gap-6 p-2 max-h-[70vh]">
          <div className="relative group">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-600 transition-colors"
              size={16}
            />
            <input
              type="text"
              placeholder="Search dishes, addons, combos..."
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:border-emerald-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {availableItems
                .filter((item) =>
                  item.name.toLowerCase().includes(searchQuery.toLowerCase()),
                )
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      addFreeItem(item);
                      // Visual feedback could be added here
                    }}
                    className="group bg-white border border-zinc-100 rounded-xl p-3 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-start gap-2 text-left active:scale-[0.98]"
                  >
                    <div className="w-full aspect-square bg-zinc-50 rounded-lg overflow-hidden border border-zinc-50 flex items-center justify-center relative">
                      {item.image?.[0] ? (
                        <img
                          src={item.image[0]}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <LayoutGrid size={24} className="text-zinc-200" />
                      )}
                      <div className="absolute top-1 right-1 bg-white/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[7px] font-black border border-zinc-100 uppercase tracking-widest text-zinc-500">
                        {item.type}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-zinc-900 group-hover:text-emerald-700 transition-colors truncate w-full">
                        {item.name}
                      </h4>
                      <p className="text-[10px] font-black text-emerald-600">
                        {settings.currency} 0.00{" "}
                        <span className="text-[8px] text-zinc-300 line-through ml-1">
                          {settings.currency}{" "}
                          {(item.price?.listedPrice || 0).toFixed(2)}
                        </span>
                      </p>
                    </div>
                    <div className="mt-auto pt-2 border-t border-zinc-50 w-full flex items-center justify-between">
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">
                        Add Free
                      </span>
                      <PlusCircle
                        size={14}
                        className="text-zinc-300 group-hover:text-emerald-500"
                      />
                    </div>
                  </button>
                ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-end">
            <Button
              onClick={() => setIsSelectingFreeItems(false)}
              className="bg-zinc-900 text-white uppercase tracking-widest text-[10px] h-10 px-8"
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area,
          .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </Modal>
  );
}
