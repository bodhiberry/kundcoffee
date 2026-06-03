"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { Button } from "@/components/ui/Button";
import {
  Settings as SettingsIcon,
  Globe,
  CreditCard,
  Save,
  RefreshCw,
  Coffee,
  Check,
  ShieldCheck,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { usePrinter } from "@/components/providers/PrinterProvider";

export default function SettingsPage() {
  const { settings, updateSetting, loading } = useSettings();
  const printer = usePrinter();
  const [currency, setCurrency] = useState(settings.currency);
  const [restaurantName, setRestaurantName] = useState(settings.name || "");
  const [address, setAddress] = useState(settings.address || "");
  const [phone, setPhone] = useState(settings.phone || "");
  const [panNumber, setPanNumber] = useState(settings.panNumber || "");
  const [email, setEmail] = useState(settings.email || "");
  const [logoFile, setLogoFile] = useState<File | string | null>(settings.logo || null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | string | null>(null);
  const [staffRoles, setStaffRoles] = useState<any[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [qrId, setQrId] = useState<string | null>(null);

  const [networkIps, setNetworkIps] = useState<Record<string, string>>({
    kitchen: "",
    bar: "",
    bill: "",
  });
  const [networkPorts, setNetworkPorts] = useState<Record<string, string>>({
    kitchen: "9100",
    bar: "9100",
    bill: "9100",
  });
  const [selectedMethods, setSelectedMethods] = useState<Record<string, "bluetooth" | "network">>({
    kitchen: "bluetooth",
    bar: "bluetooth",
    bill: "bluetooth",
  });

  // Sync printer config from printerService on mount or change
  useEffect(() => {
    if (printer.printers) {
      setNetworkIps({
        kitchen: printer.printers.kitchen.ipAddress || "",
        bar: printer.printers.bar.ipAddress || "",
        bill: printer.printers.bill.ipAddress || "",
      });
      setNetworkPorts({
        kitchen: String(printer.printers.kitchen.port || 9100),
        bar: String(printer.printers.bar.port || 9100),
        bill: String(printer.printers.bill.port || 9100),
      });
      setSelectedMethods({
        kitchen: printer.printers.kitchen.connectionMethod || "bluetooth",
        bar: printer.printers.bar.connectionMethod || "bluetooth",
        bill: printer.printers.bill.connectionMethod || "bluetooth",
      });
    }
  }, [printer.printers]);

  // Generate preview for File objects
  useEffect(() => {
    if (logoFile instanceof File) {
      const objectUrl = URL.createObjectURL(logoFile);
      setLogoPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setLogoPreview(logoFile);
    }
  }, [logoFile]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await Promise.all([
        updateSetting("currency", currency),
        updateSetting("name", restaurantName),
        updateSetting("address", address),
        updateSetting("phone", phone),
        updateSetting("panNumber", panNumber),
        updateSetting("email", email),
      ]);

      // Save Logo
      if (logoFile && logoFile instanceof File) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", logoFile);
        uploadFormData.append("folder", "settings");
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          await updateSetting("logo", uploadData.url);
          setLogoFile(uploadData.url);
        }
      } else if (typeof logoFile === "string" && logoFile !== settings.logo) {
         await updateSetting("logo", logoFile);
      }

      // Save QR image
      if (imageFile) {
        let imageUrl = typeof imageFile === "string" ? imageFile : "";

        if (imageFile instanceof File) {
          const uploadFormData = new FormData();
          uploadFormData.append("file", imageFile);
          uploadFormData.append("folder", "settings");
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: uploadFormData,
          });
          const uploadData = await uploadRes.json();
          if (uploadData.url) imageUrl = uploadData.url;
        }

        await fetch("/api/qr-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imageUrl }),
        });
      }

      toast.success("Settings updated successfully");
      setIsEditingDetails(false);
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/staff-roles");
      const data = await res.json();
      if (data.success) setStaffRoles(data.data);
    } catch (e) {
      toast.error("Failed to fetch staff roles");
    }
  };

  const fetchQrSettings = async () => {
    try {
      const res = await fetch("/api/qr-payment");
      const data = await res.json();
      if (data.success && data.data) {
        setQrId(data.data.id);
        if (data.data.image && data.data.image.length > 0) {
          setImageFile(data.data.image[0]);
        }
      }
    } catch (e) {
      console.error("Failed to fetch QR settings:", e);
    }
  };

  useState(() => {
    fetchRoles();
    fetchQrSettings();
  });

  // Sync settings when they are loaded
  useEffect(() => {
    if (!loading) {
      setRestaurantName(settings.name || "");
      setAddress(settings.address || "");
      setPhone(settings.phone || "");
      setPanNumber(settings.panNumber || "");
      setEmail(settings.email || "");
      setLogoFile(settings.logo || null);
      setCurrency(settings.currency || "Rs.");
    }
  }, [loading, settings]);

  const handleAddRole = async () => {
    if (!newRoleName) return;
    try {
      const res = await fetch("/api/staff-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoleName }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Role added");
        setNewRoleName("");
        fetchRoles();
      }
    } catch (e) {
      toast.error("Failed to add role");
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      const res = await fetch(`/api/staff-roles/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Role removed");
        fetchRoles();
      } else {
        toast.error(data.message || "Failed to remove role");
      }
    } catch (e) {
      toast.error("Error removing role");
    }
  };

  // const handleQrSubmit = async()

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-zinc-900" />
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
            Syncing System...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto space-y-10 selection:bg-zinc-100">
      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-100 pb-10">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-zinc-950 text-white rounded-xl flex items-center justify-center shadow-xl shadow-zinc-200">
            <SettingsIcon size={28} strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-red-800 uppercase tracking-widest">
                Enterprise Suite
              </span>
              <div className="w-1 h-1 bg-zinc-300 rounded-full" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                v2.0
              </span>
            </div>
            <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight">
              System Settings
            </h1>
            <p className="text-sm text-zinc-500 font-medium">
              Configure your global POS preferences and regional standards.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
          <div className="lg:pt-2">
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-tight mb-1">
              Restaurant Details
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium mb-4">
              Update your restaurant's identity and contact information for bills and invoices.
            </p>
            <Button
              onClick={() => setIsEditingDetails(!isEditingDetails)}
              variant="secondary"
              className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest border-zinc-200"
            >
              {isEditingDetails ? "Cancel Editing" : "Edit Details"}
            </Button>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                    Restaurant Name
                  </label>
                  <input
                    type="text"
                    value={restaurantName}
                    disabled={!isEditingDetails}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-zinc-900 outline-none transition-all disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                    PAN/VAT Number
                  </label>
                  <input
                    type="text"
                    value={panNumber}
                    disabled={!isEditingDetails}
                    onChange={(e) => setPanNumber(e.target.value)}
                    className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-zinc-900 outline-none transition-all disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    disabled={!isEditingDetails}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-zinc-900 outline-none transition-all disabled:opacity-60"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled={!isEditingDetails}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-zinc-900 outline-none transition-all disabled:opacity-60"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                    Physical Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    disabled={!isEditingDetails}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold focus:bg-white focus:border-zinc-900 outline-none transition-all disabled:opacity-60"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                    Restaurant Logo
                  </label>
                  {isEditingDetails ? (
                    <ImageUpload
                      label="Upload Logo"
                      value={typeof logoFile === "string" ? logoFile : undefined}
                      onChange={setLogoFile}
                    />
                  ) : (
                    <div className="w-full h-32 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-center overflow-hidden">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="h-full w-auto object-contain" />
                      ) : (
                        <span className="text-zinc-300 text-[10px] font-bold uppercase tracking-widest">No Logo Uploaded</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/*Qr Payment Confirguration Section */}
        <section className="w-full  p-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-tight mb-1">
              Qr Configuration
            </h2>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">
              Upload your QR code for transaction purposes only. This QR code
              will be used solely to process and receive payments within the
              system. Kindly ensure that the QR code is valid, active, and
              linked to the correct payment account.
            </p>
          </div>

          <ImageUpload
            label="Dish Photo"
            value={typeof imageFile === "string" ? imageFile : undefined}
            onChange={setImageFile}
          />
        </section>
        {/* --- LOCALIZATION SECTION --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:pt-2">
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-tight mb-1">
              Localization
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              Define the currency and regional formatting for your storefront.
              This affects receipts, invoices, and reports.
            </p>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block">
                  Reporting Currency
                </label>

                <div className="flex flex-wrap gap-2">
                  {["Rs.", "NPR", "$", "€", "£"].map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => setCurrency(symbol)}
                      className={`h-11 px-6 rounded-lg text-sm font-semibold transition-all border ${
                        currency === symbol
                          ? "bg-zinc-950 text-white border-zinc-950 shadow-md"
                          : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      {symbol}
                    </button>
                  ))}
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="Custom"
                    className="h-11 w-28 px-4 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-semibold focus:bg-white focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Preview Box */}
              <div className="p-6 bg-[#FAFAFA] rounded-xl border border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-400">
                    <Coffee size={14} />
                  </div>
                  <span className="text-xs font-semibold text-zinc-500">
                    Live Preview
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                    Total Transaction
                  </span>
                  <span className="text-2xl font-semibold text-zinc-900 tabular-nums tracking-tighter">
                    {currency} 1,250.00
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- TAX CONFIGURATION SECTION --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          <div className="lg:pt-2">
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-tight mb-1">
              Compliance & Tax
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              Manage how government mandates and taxes are applied to your
              customer checkout flow.
            </p>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 w-10 h-10 rounded-lg bg-red-50 text-red-800 flex items-center justify-center">
                  <CreditCard size={20} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-zinc-900 block mb-1">
                    Standard Tax (VAT 13%)
                  </label>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-sm">
                    Automatically append statutory taxes to all new orders. You
                    can override this manually per transaction.
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  updateSetting(
                    "includeTaxByDefault",
                    settings.includeTaxByDefault === "true" ? "false" : "true",
                  )
                }
                className={`w-14 h-7 rounded-full transition-all duration-300 relative shrink-0 ${
                  settings.includeTaxByDefault === "true"
                    ? "bg-red-800"
                    : "bg-zinc-200"
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm ${
                    settings.includeTaxByDefault === "true"
                      ? "left-8"
                      : "left-1"
                  } flex items-center justify-center`}
                >
                  {settings.includeTaxByDefault === "true" && (
                    <Check size={10} className="text-red-800" />
                  )}
                </div>
              </button>
            </div>

            <div className="h-px bg-zinc-100 my-6" />

            <div className="flex items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 w-10 h-10 rounded-lg bg-red-50 text-red-800 flex items-center justify-center">
                  <span className="font-bold text-sm">10%</span>
                </div>
                <div>
                  <label className="text-sm font-semibold text-zinc-900 block mb-1">
                    Service Charge (10%)
                  </label>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-sm">
                    Automatically append service charge to all new orders. You
                    can override this manually per transaction.
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  updateSetting(
                    "includeServiceChargeByDefault",
                    settings.includeServiceChargeByDefault === "true" ? "false" : "true",
                  )
                }
                className={`w-14 h-7 rounded-full transition-all duration-300 relative shrink-0 ${
                  settings.includeServiceChargeByDefault === "true"
                    ? "bg-red-800"
                    : "bg-zinc-200"
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm ${
                    settings.includeServiceChargeByDefault === "true"
                      ? "left-8"
                      : "left-1"
                  } flex items-center justify-center`}
                >
                  {settings.includeServiceChargeByDefault === "true" && (
                    <Check size={10} className="text-red-800" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* --- STAFF ROLES SECTION --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          <div className="lg:pt-2">
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-tight mb-1">
              Staff Roles
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              Create and manage administrative and operational roles for your
              team members.
            </p>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 space-y-6">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Manager, Waiter, Chef..."
                className="flex-1 h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-semibold focus:bg-white focus:border-zinc-900 outline-none transition-all"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
              <Button
                onClick={handleAddRole}
                className="h-11 px-6 bg-zinc-900 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest"
              >
                <Plus size={16} className="mr-2" /> Add Role
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {staffRoles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl group hover:border-zinc-200 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 group-hover:text-red-800 transition-colors">
                      <ShieldCheck size={16} />
                    </div>
                    <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                      {role.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="p-2 text-zinc-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {staffRoles.length === 0 && (
                <p className="col-span-2 text-center py-8 text-xs font-bold text-zinc-400 uppercase tracking-widest italic border-2 border-dashed border-zinc-100 rounded-2xl">
                  No roles defined yet.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* --- THERMAL PRINTERS SECTION --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          <div className="lg:pt-2">
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-tight mb-1">
              Thermal Printers
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              Configure Web Bluetooth or Network TCP/IP connections for kitchen, bar, and billing thermal printers.
            </p>
            {!printer.isSupported && (
              <p className="text-[10px] text-amber-600 font-bold uppercase mt-2 border border-amber-200 bg-amber-50 p-2 rounded-lg leading-relaxed">
                ⚠️ Web Bluetooth not supported in this browser. Bluetooth printing is disabled, but Network printing is still fully functional.
              </p>
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["kitchen", "bar", "bill"] as const).map((role) => {
                const info = printer.printers[role];
                const selectedMethod = selectedMethods[role] || "bluetooth";
                const isConnected = info.status === "connected";
                const isNotPaired = info.status === "not_paired";

                return (
                  <div
                    key={role}
                    className="flex flex-col justify-between p-5 bg-zinc-50 border border-zinc-100 rounded-xl group hover:border-zinc-200 transition-all relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          {role} Printer
                        </span>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isConnected
                              ? "bg-emerald-500 animate-pulse"
                              : isNotPaired
                              ? "bg-zinc-300"
                              : "bg-red-500"
                          }`}
                        />
                      </div>

                      {/* Connection Method Tabs */}
                      <div className="flex bg-zinc-200/50 p-0.5 rounded-lg mb-4">
                        <button
                          type="button"
                          onClick={() => setSelectedMethods(prev => ({ ...prev, [role]: "bluetooth" }))}
                          className={`flex-1 text-[9px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-all ${
                            selectedMethod === "bluetooth"
                              ? "bg-white text-zinc-950 shadow-sm"
                              : "text-zinc-500 hover:text-zinc-900"
                          }`}
                        >
                          Bluetooth
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedMethods(prev => ({ ...prev, [role]: "network" }))}
                          className={`flex-1 text-[9px] font-bold uppercase tracking-wider py-1.5 rounded-md transition-all ${
                            selectedMethod === "network"
                              ? "bg-white text-zinc-950 shadow-sm"
                              : "text-zinc-500 hover:text-zinc-900"
                          }`}
                        >
                          Network
                        </button>
                      </div>

                      {selectedMethod === "bluetooth" ? (
                        <div className="min-h-[90px]">
                          <h3 className="text-sm font-bold text-zinc-800 truncate mb-1">
                            {info.connectionMethod === "bluetooth" && info.name ? info.name : "Not Paired"}
                          </h3>
                          <p className="text-[9px] text-zinc-400 font-medium truncate mb-4">
                            {info.connectionMethod === "bluetooth" && info.deviceId
                              ? `ID: ${info.deviceId.substring(0, 12)}...`
                              : "Bluetooth printer disconnected"}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3 mb-4 min-h-[90px]">
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest block">
                              IP Address
                            </label>
                            <input
                              type="text"
                              placeholder="192.168.1.100"
                              value={networkIps[role] || ""}
                              onChange={(e) =>
                                setNetworkIps((prev) => ({ ...prev, [role]: e.target.value }))
                              }
                              className="w-full h-8 px-2 bg-white border border-zinc-200 rounded-lg text-xs font-semibold focus:border-zinc-900 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest block">
                              Port
                            </label>
                            <input
                              type="text"
                              placeholder="9100"
                              value={networkPorts[role] || ""}
                              onChange={(e) =>
                                setNetworkPorts((prev) => ({ ...prev, [role]: e.target.value }))
                              }
                              className="w-full h-8 px-2 bg-white border border-zinc-200 rounded-lg text-xs font-semibold focus:border-zinc-900 outline-none transition-all"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-zinc-100">
                      {selectedMethod === "bluetooth" ? (
                        info.connectionMethod === "bluetooth" && isConnected ? (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => printer.disconnectPrinter(role)}
                              variant="secondary"
                              className="flex-1 h-9 border-zinc-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg font-bold text-[9px] uppercase tracking-widest"
                            >
                              Unpair
                            </Button>
                            <Button
                              onClick={() => printer.testPrint(role)}
                              variant="secondary"
                              className="h-9 px-3 border-zinc-200 text-zinc-700 hover:bg-zinc-100 rounded-lg font-bold text-[9px] uppercase tracking-widest"
                              title="Test Print"
                            >
                              Test
                            </Button>
                          </div>
                        ) : (
                          <Button
                            disabled={!printer.isSupported}
                            onClick={() => printer.pairPrinter(role)}
                            className="w-full h-9 bg-zinc-900 text-white hover:bg-black rounded-lg font-bold text-[9px] uppercase tracking-widest"
                          >
                            Pair Printer
                          </Button>
                        )
                      ) : (
                        <div className="space-y-2 w-full">
                          <Button
                            onClick={() => {
                              const ip = networkIps[role];
                              const port = networkPorts[role] ? parseInt(networkPorts[role], 10) : 9100;
                              if (!ip) {
                                toast.error("Please enter an IP address");
                                return;
                              }
                              printer.saveNetworkPrinter(role, ip, port);
                              toast.success(`Saved network printer for ${role}`);
                            }}
                            className="w-full h-9 bg-zinc-900 text-white hover:bg-black rounded-lg font-bold text-[9px] uppercase tracking-widest"
                          >
                            Save Config
                          </Button>
                          {info.connectionMethod === "network" && isConnected && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  printer.disconnectPrinter(role);
                                  setNetworkIps((prev) => ({ ...prev, [role]: "" }));
                                  setNetworkPorts((prev) => ({ ...prev, [role]: "9100" }));
                                  toast.success(`Removed network printer for ${role}`);
                                }}
                                variant="secondary"
                                className="flex-1 h-9 border-zinc-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg font-bold text-[9px] uppercase tracking-widest"
                              >
                                Remove
                              </Button>
                              <Button
                                onClick={() => printer.testPrint(role)}
                                variant="secondary"
                                className="h-9 px-3 border-zinc-200 text-zinc-700 hover:bg-zinc-100 rounded-lg font-bold text-[9px] uppercase tracking-widest"
                                title="Test Print"
                              >
                                Test
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/*User Modification */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        <div className="lg:pt-2">
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-tight mb-1">
            System Access
          </h2>
          <p className="text-xs text-zinc-500 leading-relaxed font-medium">
            Manage system users, login credentials, and granular permission sets for your staff.
          </p>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 w-10 h-10 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <div>
                <label className="text-sm font-semibold text-zinc-900 block mb-1">
                  User Access & RBAC
                </label>
                <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-sm">
                  Control who can access this dashboard and what they can see or modify.
                </p>
              </div>
            </div>

            <Button
              onClick={() => window.location.href = "/dashboard/settings/users"}
              variant="secondary"
              className="h-10 px-6 border-zinc-200 text-zinc-900 hover:bg-zinc-50 font-bold text-[10px] uppercase tracking-widest"
            >
              Manage Users
            </Button>
          </div>
        </div>
      </section>
      {/* --- ACTION FOOTER --- */}
      <div className="flex items-center justify-between pt-10 border-t border-zinc-100">
        <div className="hidden md:flex items-center gap-2 text-zinc-400">
          <span className="text-[10px] font-bold uppercase tracking-widest underline decoration-red-800/30 underline-offset-4">
            Last Synced: Just now
          </span>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-12 px-10 bg-zinc-950 text-white hover:bg-zinc-800 rounded-lg shadow-lg shadow-zinc-200 text-xs font-bold uppercase tracking-widest flex items-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isSaving ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <>
              Apply Changes
              <Save size={16} />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
