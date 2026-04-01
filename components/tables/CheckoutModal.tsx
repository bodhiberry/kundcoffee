"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Customer, Table } from "@/lib/types";
import { getCustomers, addCustomer } from "@/services/customer";
import { processCheckout, getCheckoutDetails } from "@/services/checkout";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import {
  Printer,
  QrCode,
  UserPlus,
  Loader2,
  CreditCard,
  Gift,
  PlusCircle,
  X,
  Search,
  LayoutGrid,
  Banknote,
  Plus,
  Check,
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
  const [creditAmount, setCreditAmount] = useState<string>("");
  const [includeTax, setIncludeTax] = useState(
    settings.includeTaxByDefault === "true",
  );
  const [includeServiceCharge, setIncludeServiceCharge] = useState(
    settings.includeServiceChargeByDefault === "true",
  );

  // New Customer Form
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerLoyaltyDiscount, setNewCustomerLoyaltyDiscount] =
    useState<number>(0);

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
        loyaltyDiscount: newCustomerLoyaltyDiscount,
      });
      if (res.success) {
        setCustomers([...customers, res.data]);
        setSelectedCustomerId(res.data.id);
        setIsAddingCustomer(false);
        setNewCustomerName("");
        setNewCustomerPhone("");
        setNewCustomerLoyaltyDiscount(0);
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
          { method: "CREDIT", amount: parseFloat(creditAmount) || 0 },
        ].filter((p) => p.amount > 0);
        // For legacy support in backend if needed
        finalMethod =
          paymentsPayload.length === 1 ? paymentsPayload[0].method : "SPLIT";
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
    const serviceCharge = includeServiceCharge ? netSubtotal * 0.1 : 0;

    const standardTax = includeTax ? netSubtotal * 0.13 : 0;
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
          <Loader2 className="animate-spin text-zinc-900" size={40} />
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
      <>
        <div className="flex flex-col gap-4 p-2 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
            {/* Left Column: Items List & Customer/Discount */}
            <div className="flex flex-col gap-4 overflow-hidden">
              {/* Order Items */}
              <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex flex-col flex-1 max-h-[45vh]">
                <div className="flex justify-between items-center mb-3 shrink-0">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Bill Items
                  </h3>
                  <button
                    onClick={() => setIsSelectingFreeItems(true)}
                    className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 hover:text-zinc-900 flex items-center gap-1.5"
                  >
                    <PlusCircle size={12} /> Free Items
                  </button>
                </div>
                <div className="overflow-y-auto custom-scrollbar pr-2 flex-1 space-y-2">
                  {checkoutData?.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-2 py-2 border-b border-zinc-100 last:border-0"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-semibold text-zinc-900 text-xs truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            {settings.currency} {item.unitPrice.toFixed(2)} x{" "}
                            {item.quantity}
                          </p>
                        </div>
                        <div className="text-right font-bold text-zinc-900 text-xs">
                          {settings.currency}{" "}
                          {(
                            (item.quantity -
                              (complimentaryItems[item.id] || 0)) *
                            item.unitPrice
                          ).toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start">
                        <label className="text-[10px] text-zinc-400 font-medium">
                          Comp Qty:
                        </label>
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
                          className="w-12 h-6 pos-input text-center text-[10px]"
                        />
                      </div>
                    </div>
                  ))}

                  {extraFreeItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-sm py-3 border-b border-zinc-100 bg-zinc-50 rounded-lg px-2 last:border-0 mb-2"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <Gift size={10} className="text-zinc-400" />
                          <p className="font-bold text-zinc-900 truncate text-xs">
                            {item.name}
                          </p>
                        </div>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                          {item.quantity} x Free
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => removeFreeItem(item.id)}
                          className="p-1 text-zinc-300 hover:text-zinc-900"
                        >
                          <X size={14} />
                        </button>
                        <div className="text-right font-bold text-zinc-900 w-16 text-xs">
                          {settings.currency}0.00
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff & Customer info */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 shrink-0 space-y-4">
                <div className="space-y-2">
                  <label className="pos-label text-[10px]">
                    Handled By Staff
                  </label>
                  <div className="bg-white rounded">
                    <CustomDropdown
                      options={staff.map((s) => ({
                        id: s.id,
                        name: s.name,
                      }))}
                      value={selectedStaffId}
                      onChange={setSelectedStaffId}
                      placeholder="Select staff..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="pos-label text-[10px]">
                    Customer Information
                  </label>
                  {!isAddingCustomer ? (
                    <div className="space-y-3">
                      <div className="bg-white rounded">
                        <CustomDropdown
                          options={customers.map((c) => ({
                            id: c.id,
                            name: `${c.fullName} (${c.phone || "No Phone"})`,
                          }))}
                          value={selectedCustomerId}
                          onChange={setSelectedCustomerId}
                          placeholder="Select customer..."
                        />
                      </div>
                      <button
                        onClick={() => setIsAddingCustomer(true)}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                      >
                        <UserPlus size={12} /> Add New Customer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 bg-white p-3 rounded border border-zinc-200 shadow-sm">
                      <Input
                        placeholder="Customer Name"
                        className="h-8 text-xs"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Phone No"
                          className="h-8 text-xs"
                          value={newCustomerPhone}
                          onChange={(e) => setNewCustomerPhone(e.target.value)}
                        />
                        <Input
                          placeholder="Loyalty %"
                          type="number"
                          className="h-8 text-xs"
                          value={newCustomerLoyaltyDiscount}
                          onChange={(e) =>
                            setNewCustomerLoyaltyDiscount(
                              parseFloat(e.target.value) || 0,
                            )
                          }
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button
                          onClick={handleCreateCustomer}
                          className="flex-1 h-7 text-[10px] font-bold"
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setIsAddingCustomer(false)}
                          className="flex-1 h-7 text-[10px] font-bold"
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
            <div className="flex flex-col gap-4 bg-zinc-50 border border-zinc-200 p-5 rounded-xl place-content-start overflow-y-auto custom-scrollbar">
              <div className="text-center mb-4">
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Payment Method
                </h3>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex bg-zinc-200/50 p-1 rounded-lg border border-zinc-200 mb-2">
                  <button
                    onClick={() => {
                      setPaymentMode("SINGLE");
                      setCashAmount("");
                      setQrAmount("");
                      setCreditAmount("");
                    }}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${paymentMode === "SINGLE" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                  >
                    Quick Pay
                  </button>
                  <button
                    onClick={() => {
                      setPaymentMode("SPLIT");
                      const total = calculateSummary().grandTotal;
                      setCashAmount((total / 2).toFixed(2));
                      setQrAmount((total / 2).toFixed(2));
                      setCreditAmount("");
                    }}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${paymentMode === "SPLIT" ? "bg-zinc-900 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}
                  >
                    Split Bill
                  </button>
                </div>

                {paymentMode === "SINGLE" ? (
                  <div className="space-y-3">
                    <button
                      disabled={loading}
                      onClick={() => handleFinalize("CASH")}
                      className="w-full flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-lg hover:border-zinc-900 transition-all group active:scale-[0.98] text-left"
                    >
                      <div className="w-10 h-10 shrink-0 rounded bg-zinc-50 flex items-center justify-center group-hover:bg-zinc-100 transition-colors border border-zinc-100">
                        <Banknote
                          size={18}
                          className="text-zinc-400 group-hover:text-zinc-900"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-zinc-900 text-xs uppercase">
                          Cash Payment
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          Instant completion
                        </span>
                      </div>
                    </button>

                    <button
                      disabled={loading}
                      onClick={() => handleFinalize("QR")}
                      className="w-full flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-lg hover:border-zinc-900 transition-all group active:scale-[0.98] text-left"
                    >
                      <div className="w-10 h-10 shrink-0 rounded bg-zinc-50 flex items-center justify-center group-hover:bg-zinc-100 transition-colors border border-zinc-100">
                        <QrCode
                          size={18}
                          className="text-zinc-400 group-hover:text-zinc-900"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-zinc-900 text-xs uppercase">
                          Scan & Pay
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          Full amount via QR
                        </span>
                      </div>
                    </button>

                    <button
                      disabled={loading || !selectedCustomerId}
                      onClick={() => handleFinalize("CREDIT")}
                      className={`w-full flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-lg transition-all group text-left active:scale-[0.98] ${!selectedCustomerId ? "opacity-40 cursor-not-allowed" : "hover:border-zinc-900"}`}
                    >
                      <div className="w-10 h-10 shrink-0 rounded bg-zinc-50 flex items-center justify-center group-hover:bg-zinc-100 transition-colors border border-zinc-100">
                        <CreditCard
                          size={18}
                          className="text-zinc-400 group-hover:text-zinc-900"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-zinc-900 text-xs uppercase">
                          Store Credit
                        </span>
                        <span className="text-[10px] text-zinc-500 block">
                          {!selectedCustomerId
                            ? "Requires saved customer"
                            : "Save to account"}
                        </span>
                      </div>
                    </button>

                    {qrData?.image?.[0] && (
                      <div className="bg-zinc-900 p-4 rounded-xl shadow-xl flex flex-col items-center gap-3 border border-zinc-800 mt-2">
                        <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                          Scan QR Code
                        </p>
                        <div className="p-2 bg-white rounded-lg">
                          <img
                            src={qrData.image[0]}
                            alt="Payment QR Code"
                            className="w-40 h-40 object-contain"
                          />
                        </div>
                        <p className="text-[9px] text-zinc-500 text-center">
                          Confirm receipt after scan
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase">
                          Presets
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const total = calculateSummary().grandTotal;
                              setCashAmount((total / 2).toFixed(2));
                              setQrAmount((total / 2).toFixed(2));
                              setCreditAmount("");
                            }}
                            className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 rounded text-[9px] font-bold uppercase transition-colors"
                          >
                            50:50 Cash:QR
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Banknote size={14} className="text-zinc-400" />
                            <span className="text-[10px] font-bold uppercase text-zinc-500">
                              Cash Part
                            </span>
                          </div>
                          <Input
                            type="number"
                            className="h-10 text-lg font-bold"
                            value={cashAmount}
                            onChange={(e) => setCashAmount(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <QrCode size={14} className="text-zinc-400" />
                            <span className="text-[10px] font-bold uppercase text-zinc-500">
                              QR Part
                            </span>
                          </div>
                          <Input
                            type="number"
                            className="h-10 text-lg font-bold"
                            value={qrAmount}
                            onChange={(e) => setQrAmount(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CreditCard size={14} className="text-zinc-400" />
                            <span className="text-[10px] font-bold uppercase text-zinc-500">
                              Credit Part
                            </span>
                          </div>
                          <Input
                            type="number"
                            className="h-10 text-lg font-bold"
                            value={creditAmount}
                            disabled={!selectedCustomerId}
                            onChange={(e) => setCreditAmount(e.target.value)}
                            placeholder={
                              !selectedCustomerId
                                ? "Select customer first"
                                : "0"
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {qrData?.image?.[0] && parseFloat(qrAmount) > 0 && (
                      <div className="bg-zinc-900 p-4 rounded-xl shadow-xl flex flex-col items-center gap-3 border border-zinc-800 mt-2">
                        <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                          Scan QR for Split
                        </p>
                        <div className="p-2 bg-white rounded-lg">
                          <img
                            src={qrData.image[0]}
                            alt="Split Payment QR Code"
                            className="w-40 h-40 object-contain"
                          />
                        </div>
                      </div>
                    )}

                    <div className="bg-zinc-100 p-4 rounded-xl border border-zinc-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold uppercase text-zinc-500">
                          Entered Total
                        </span>
                        <span className="text-lg font-bold text-zinc-900">
                          {settings.currency}{" "}
                          {(
                            (parseFloat(cashAmount) || 0) +
                            (parseFloat(qrAmount) || 0) +
                            (parseFloat(creditAmount) || 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                      {Math.abs(
                        (parseFloat(cashAmount) || 0) +
                          (parseFloat(qrAmount) || 0) +
                          (parseFloat(creditAmount) || 0) -
                          calculateSummary().grandTotal,
                      ) >= 0.01 && (
                        <div className="flex justify-between items-center pt-2 border-t border-zinc-200 mt-2">
                          <span className="text-[10px] font-bold uppercase text-rose-500">
                            Remaining
                          </span>
                          <span className="text-sm font-bold text-rose-600">
                            {settings.currency}{" "}
                            {(
                              calculateSummary().grandTotal -
                              ((parseFloat(cashAmount) || 0) +
                                (parseFloat(qrAmount) || 0) +
                                (parseFloat(creditAmount) || 0))
                            ).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        disabled={
                          loading ||
                          Math.abs(
                            (parseFloat(cashAmount) || 0) +
                              (parseFloat(qrAmount) || 0) +
                              (parseFloat(creditAmount) || 0) -
                              calculateSummary().grandTotal,
                          ) >= 0.01 ||
                          (parseFloat(creditAmount) > 0 && !selectedCustomerId)
                        }
                        onClick={() => handleFinalize("SPLIT")}
                        className="w-full h-12 bg-zinc-900 text-white rounded-lg font-bold uppercase tracking-widest text-xs shadow-sm active:scale-95 disabled:opacity-30"
                      >
                        Process Split Bill
                      </Button>

                      {Math.abs(
                        calculateSummary().grandTotal -
                          ((parseFloat(cashAmount) || 0) +
                            (parseFloat(qrAmount) || 0)),
                      ) >= 0.01 &&
                        selectedCustomerId && (
                          <button
                            onClick={() => {
                              const remaining =
                                calculateSummary().grandTotal -
                                ((parseFloat(cashAmount) || 0) +
                                  (parseFloat(qrAmount) || 0));
                              setCreditAmount(remaining.toFixed(2));
                            }}
                            className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest hover:text-zinc-900 transition-colors py-2 bg-zinc-100 rounded border border-zinc-200"
                          >
                            Set remaining to credit
                          </button>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Grand Total & Bill Summary */}
            <div className="flex flex-col bg-zinc-900 rounded-xl p-5 text-white shadow-xl relative overflow-hidden">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-6 shrink-0 z-10">
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
                  <div className="space-y-3 mb-8 flex-1 z-10 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between text-xs font-medium text-zinc-400">
                      <span>Subtotal</span>
                      <span className="text-white">
                        {settings.currency} {summary.subtotal.toFixed(2)}
                      </span>
                    </div>
                    {settings.includeServiceChargeByDefault === "true" && (
                      <div 
                        className="flex justify-between text-xs font-medium text-zinc-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => setIncludeServiceCharge(!includeServiceCharge)}
                      >
                        <span className="flex items-center gap-2">
                          {includeServiceCharge ? <Check size={12} className="text-blue-500" /> : <div className="w-3 h-3 border border-white/20 rounded" />}
                          Service Charge (10%)
                        </span>
                        <span className={includeServiceCharge ? "text-white" : "text-zinc-600 line-through"}>
                          {settings.currency} {summary.serviceCharge.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {settings.includeTaxByDefault === "true" && (
                      <div 
                        className="flex justify-between text-xs font-medium text-zinc-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => setIncludeTax(!includeTax)}
                      >
                        <span className="flex items-center gap-2">
                          {includeTax ? <Check size={12} className="text-blue-500" /> : <div className="w-3 h-3 border border-white/20 rounded" />}
                          VAT (13%)
                        </span>
                        <span className={includeTax ? "text-white" : "text-zinc-600 line-through"}>
                          {settings.currency}{" "}
                          {(summary.subtotal * 0.13).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {customTaxes.map((tax, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-xs font-medium text-zinc-400"
                      >
                        <span>
                          {tax.name} ({tax.percentage}%)
                        </span>
                        <span className="text-white">
                          {settings.currency}{" "}
                          {(summary.subtotal * (tax.percentage / 100)).toFixed(
                            2,
                          )}
                        </span>
                      </div>
                    ))}
                    {summary.complimentaryValue > 0 && (
                      <div className="flex justify-between text-xs font-bold text-blue-400">
                        <span>Complimentary</span>
                        <span>
                          -{settings.currency}{" "}
                          {summary.complimentaryValue.toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-white/10">
                      {!isAddingTax ? (
                        <button
                          onClick={() => setIsAddingTax(true)}
                          className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-wider flex items-center gap-1.5"
                        >
                          <Plus size={12} /> Add Custom Tax
                        </button>
                      ) : (
                        <div className="space-y-2 bg-white/5 p-3 rounded border border-white/10">
                          <input
                            placeholder="Tax Name"
                            className="text-[10px] h-8 px-2 rounded bg-black/50 border border-white/10 focus:border-blue-500 text-white outline-none w-full"
                            value={newTaxName}
                            onChange={(e) => setNewTaxName(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <input
                              placeholder="%"
                              type="number"
                              className="text-[10px] h-8 px-2 rounded bg-black/50 border border-white/10 focus:border-blue-500 text-white outline-none w-16"
                              value={newTaxPercent}
                              onChange={(e) => setNewTaxPercent(e.target.value)}
                            />
                            <button
                              onClick={handleAddTax}
                              className="bg-blue-600 text-white h-8 px-3 rounded flex-1 font-bold text-[10px] uppercase"
                            >
                              Apply
                            </button>
                            <button
                              onClick={() => setIsAddingTax(false)}
                              className="bg-white/10 text-white h-8 w-8 flex items-center justify-center rounded hover:bg-white/20"
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

              <div className="border-t border-white/10 pt-6 mb-6 z-10 shrink-0">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Total Payable
                  </span>
                  <span className="text-3xl font-bold tracking-tight text-white leading-none">
                    {settings.currency}{" "}
                    {checkoutData
                      ? calculateSummary().grandTotal.toFixed(2)
                      : "0.00"}
                  </span>
                </div>
              </div>

              <div className="shrink-0 z-10">
                <Button
                  onClick={() => window.print()}
                  className="w-full h-12 bg-white hover:bg-zinc-100 text-zinc-900 border-none uppercase tracking-widest font-bold text-[10px] shadow-sm flex items-center justify-center gap-2"
                >
                  <Printer size={16} /> Print Receipt
                </Button>
              </div>
            </div>
          </div>

          <div className="hidden">
            {checkoutData && (
              <div className="bg-white printable-area">
                <div className="text-center mb-6">
                  {settings.logo && (
                    <div className="flex justify-center mb-2">
                       <img src={settings.logo} alt="Logo" className="h-10 w-auto object-contain" />
                    </div>
                  )}
                  <h2 className="text-xl font-black tracking-tight text-zinc-900">
                    {settings.name || "BODHIBERRY"}
                  </h2>
                  <p className="text-[10px] uppercase">{settings.address || "Kathmandu, Nepal"}</p>
                  <p className="text-[10px]">PAN/VAT: {settings.panNumber || "123456789"}</p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] mt-2">
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
                {includeServiceCharge && (
                  <div className="flex justify-between text-xs">
                    <span>Service Charge (10%)</span>
                    <span>{settings.currency} {calculateSummary().serviceCharge.toFixed(2)}</span>
                  </div>
                )}
                {includeTax && (
                  <div className="flex justify-between text-xs">
                    <span>VAT (13%)</span>
                    <span>{settings.currency} {(calculateSummary().subtotal * 0.13).toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-4 text-sm font-bold flex justify-between">
                  <span>Total</span>
                  <span>
                    {settings.currency}{" "}
                    {calculateSummary().grandTotal.toFixed(2)}
                  </span>
                </div>
                
                {qrData?.image && (
                  <div className="flex flex-col items-center mt-6 pt-4 border-t border-dashed">
                    <img src={qrData.image} alt="Payment QR" className="w-32 h-32 object-contain" />
                    <p className="text-[8px] font-bold mt-1 uppercase">Scan to Pay</p>
                  </div>
                )}

                <div className="text-center mt-4 pt-2 border-t border-dashed space-y-1">
                  <p className="font-bold text-xs uppercase tracking-widest">Thank you for your visit!</p>
                  <p className="text-[8px]">POWERED BY {settings.name || "BODHIBERRY"} ERP</p>
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
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors"
                size={16}
              />
              <input
                type="text"
                placeholder="Search dishes, addons, combos..."
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:border-zinc-900 outline-none transition-all"
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
                      className="group bg-white border border-zinc-100 rounded-xl p-3 shadow-sm hover:border-zinc-900 hover:shadow-md transition-all flex flex-col items-start gap-2 text-left active:scale-[0.98]"
                    >
                      <div className="w-full aspect-square bg-zinc-50 rounded-lg overflow-hidden border border-zinc-50 flex items-center justify-center relative">
                        {item.image?.[0] ? (
                          <img
                            src={item.image[0]}
                            alt={item.name}
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
                        <h4 className="text-[11px] font-bold text-zinc-900 group-hover:text-zinc-900 transition-colors truncate w-full">
                          {item.name}
                        </h4>
                        <p className="text-[10px] font-black text-zinc-900">
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
                          className="text-zinc-300 group-hover:text-zinc-900"
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
      </>
    </Modal>
  );
}
