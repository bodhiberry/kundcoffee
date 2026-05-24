"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Popover } from "@/components/ui/Popover";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { Modal } from "@/components/ui/Modal";
import { MetricCard } from "@/components/ui/MetricCard";
import DashboardMetrics from "@/components/dashboard/DashboardMetrics";
import TopPerformers from "@/components/dashboard/TopPerformers";
import { spaceType, Table, TableType } from "@/lib/types";
import { addSpace } from "@/services/space";
import { addTable, addTableType } from "@/services/table";
import { useRouter } from "next/navigation";
import SalesLineChart from "@/components/dashboard/analytics/SalesLineChart";
import { Plus, Trash2, Printer, Receipt, ShoppingBag, Loader2 } from "lucide-react";
import PurchaseModal from "@/components/procurement/PurchaseModal";
import SaleModal from "@/components/dashboard/SaleModal";
import { CustomTable } from "@/components/ui/CustomTable";
import { SidePanel } from "@/components/ui/SidePanel";
import PurchaseDetailView from "@/components/procurement/PurchaseDetailView";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useSettings } from "@/components/providers/SettingsProvider";
import { toast } from "sonner";

interface DashboardClientProps {
  initialSpaces: spaceType[];
  initialTables: Table[];
  initialTableTypes: TableType[];
  initialCustomers: any[];
}

export default function DashboardClient({
  initialSpaces,
  initialTables,
  initialTableTypes,
  initialCustomers,
}: DashboardClientProps) {
  const router = useRouter();
  const [spaces, setSpaces] = useState<spaceType[]>(initialSpaces);
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [tableTypes, setTableTypes] = useState<TableType[]>(initialTableTypes);
  const [customers, setCustomers] = useState<any[]>(initialCustomers);

  // Popover States
  const [isSpacePopoverOpen, setIsSpacePopoverOpen] = useState(false);
  const [isTablePopoverOpen, setIsTablePopoverOpen] = useState(false);
  const [isQRPopoverOpen, setIsQRPopoverOpen] = useState(false);
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  const [isStaffPopoverOpen, setIsStaffPopoverOpen] = useState(false);

  // Modal States
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  // Form States
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDesc, setNewSpaceDesc] = useState("");

  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState("");
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | undefined>(
    undefined,
  );
  const [selectedTypeId, setSelectedTypeId] = useState<string | undefined>(
    undefined,
  );

  const [newTypeName, setNewTypeName] = useState("");

  const [newCustomer, setNewCustomer] = useState({
    fullName: "",
    phone: "",
    email: "",
    openingBalance: 0,
  });

  const [newStaff, setNewStaff] = useState({
    name: "",
    role: "Waiter",
    phone: "",
    email: "",
  });

  const { settings } = useSettings();
  const [todaySales, setTodaySales] = useState<any[]>([]);
  const [todayPurchases, setTodayPurchases] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [activeActivityTab, setActiveActivityTab] = useState<"sales" | "purchases">("sales");

  // Modals & Panels
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [deleteSaleId, setDeleteSaleId] = useState<string | null>(null);
  const [deletePurchaseId, setDeletePurchaseId] = useState<string | null>(null);

  const fetchTodayActivity = async () => {
    setLoadingActivity(true);
    try {
      const [salesRes, purchasesRes] = await Promise.all([
        fetch("/api/finance/sales?filter=today", { cache: "no-store" }),
        fetch("/api/purchases?filter=today", { cache: "no-store" }),
      ]);
      const salesData = await salesRes.json();
      const purchasesData = await purchasesRes.json();

      if (salesData.success) {
        setTodaySales(salesData.data.transactions || []);
      }
      if (purchasesData.success) {
        setTodayPurchases(purchasesData.data.purchases || []);
      }
    } catch (error) {
      console.error("Failed to fetch today's activity", error);
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    fetchTodayActivity();
  }, []);

  const handleDeleteSale = async () => {
    if (!deleteSaleId) return;
    try {
      const res = await fetch(`/api/finance/sales/${deleteSaleId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Sale record deleted successfully");
        fetchTodayActivity();
        router.refresh();
      } else {
        toast.error(data.message || "Failed to delete sale record");
      }
    } catch (error) {
      toast.error("Error deleting sale record");
    } finally {
      setDeleteSaleId(null);
    }
  };

  const handleDeletePurchase = async () => {
    if (!deletePurchaseId) return;
    try {
      const res = await fetch(`/api/purchases/${deletePurchaseId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Purchase deleted and stock reverted");
        fetchTodayActivity();
        router.refresh();
      } else {
        toast.error(data.message || "Failed to delete purchase record");
      }
    } catch (error) {
      toast.error("Error deleting purchase record");
    } finally {
      setDeletePurchaseId(null);
    }
  };

  const handlePrint = (txn: any) => {
    const printContent = document.getElementById(`receipt-${txn.id}`);
    if (!printContent) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Print Receipt</title>
          <style>
            body { font-family: monospace; padding: 20px; width: 300px; margin: 0 auto; }
            .text-center { text-align: center; }
            .flex { display: flex; }
            .justify-between { display: flex; justify-content: space-between; }
            .border-b { border-bottom: 1px dashed #ccc; }
            .pb-4 { padding-bottom: 16px; }
            .pt-4 { padding-top: 16px; }
            .mt-4 { margin-top: 16px; }
            .uppercase { text-transform: uppercase; }
            .font-bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div style="font-size: 12px; line-height: 1.5;">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // Handlers
  const handleAddSpace = async () => {
    if (!newSpaceName) return;
    const res = await addSpace(newSpaceName, newSpaceDesc);
    if (res.success && res.data) {
      setSpaces([...spaces, res.data]);
      setNewSpaceName("");
      setNewSpaceDesc("");
      setIsSpacePopoverOpen(false);
      router.refresh();
    }
  };

  const handleAddTableType = async () => {
    if (!newTypeName) return;
    const res = await addTableType(newTypeName);
    if (res.success && res.data) {
      setTableTypes([...tableTypes, res.data]);
      setSelectedTypeId(res.data.id);
      setNewTypeName("");
      setIsTypeModalOpen(false);
    }
  };

  const handleAddTable = async () => {
    if (
      !newTableName ||
      !newTableCapacity ||
      !selectedSpaceId ||
      !selectedTypeId
    )
      return;
    const res = await addTable(
      newTableName,
      parseInt(newTableCapacity),
      selectedSpaceId,
      selectedTypeId,
    );
    if (res.success && res.data) {
      setTables([...tables, res.data]);
      setNewTableName("");
      setNewTableCapacity("");
      setSelectedSpaceId(undefined);
      setSelectedTypeId(undefined);
      setIsTablePopoverOpen(false);
      router.refresh();
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.fullName) return;
    const res = await fetch("/api/customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCustomer),
    });
    const data = await res.json();
    if (data.success) {
      setCustomers([...customers, data.data]);
      setNewCustomer({
        fullName: "",
        phone: "",
        email: "",
        openingBalance: 0,
      });
      setIsCustomerPopoverOpen(false);
      router.refresh();
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name) return;
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStaff), 
      });
      const data = await res.json();
      if (data.success) {
        setNewStaff({ name: "", role: "Waiter", phone: "", email: "" });
        setIsStaffPopoverOpen(false);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Popover Contents
  // const SpacePopoverContent = (
  //   <div className="flex flex-col gap-4 p-2">
  //     <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 uppercase text-xs tracking-wider">
  //       Add New Space
  //     </h3>
  //     <div className="space-y-4">
  //       <div>
  //         <label className="text-xs font-semibold text-gray-700 block mb-1.5">
  //           Name
  //         </label>
  //         <input
  //           type="text"
  //           className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-gray-400"
  //           placeholder="e.g. Main Hall"
  //           value={newSpaceName}
  //           onChange={(e) => setNewSpaceName(e.target.value)}
  //         />
  //       </div>
  //       <div>
  //         <label className="text-xs font-semibold text-gray-700 block mb-1.5">
  //           Description
  //         </label>
  //         <textarea
  //           className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-gray-400"
  //           placeholder="Optional description"
  //           value={newSpaceDesc}
  //           onChange={(e) => setNewSpaceDesc(e.target.value)}
  //         />
  //       </div>
  //       <Button
  //         size="sm"
  //         onClick={handleAddSpace}
  //         className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 border-none"
  //       >
  //         Create Space
  //       </Button>
  //     </div>
  //   </div>
  // );

  // const TablePopoverContent = (
  //   <div className="flex flex-col gap-4 p-2">
  //     <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 uppercase text-xs tracking-wider">
  //       Add New Table
  //     </h3>
  //     <div className="space-y-4">
  //       <div>
  //         <label className="text-xs font-semibold text-gray-700 block mb-1.5">
  //           Table Name
  //         </label>
  //         <input
  //           type="text"
  //           className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-gray-400"
  //           placeholder="e.g. T-01"
  //           value={newTableName}
  //           onChange={(e) => setNewTableName(e.target.value)}
  //         />
  //       </div>
  //       <div>
  //         <label className="text-xs font-semibold text-gray-700 block mb-1.5">
  //           Capacity
  //         </label>
  //         <input
  //           type="number"
  //           className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-gray-400"
  //           placeholder="e.g. 4"
  //           value={newTableCapacity}
  //           onChange={(e) => setNewTableCapacity(e.target.value)}
  //         />
  //       </div>

  //       <CustomDropdown
  //         label="Space"
  //         options={spaces.map((s) => ({ id: s.id, name: s.name }))}
  //         value={selectedSpaceId}
  //         onChange={setSelectedSpaceId}
  //         placeholder="Select Space"
  //       />

  //       <CustomDropdown
  //         label="Table Type"
  //         options={tableTypes.map((t) => ({ id: t.id, name: t.name }))}
  //         value={selectedTypeId}
  //         onChange={setSelectedTypeId}
  //         placeholder="Select Type"
  //         onAddNew={() => {
  //           setIsTablePopoverOpen(false); // Close popover temporarily or keep open?
  //           setIsTypeModalOpen(true);
  //         }}
  //         addNewLabel="Add New Type"
  //       />

  //       <Button
  //         size="sm"
  //         onClick={handleAddTable}
  //         className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 border-none"
  //       >
  //         Create Table
  //       </Button>
  //     </div>
  //   </div>
  // );

  // const QRPopoverContent = (
  //   <div className="flex flex-col gap-4 p-2">
  //     <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 uppercase text-xs tracking-wider">
  //       QR Management
  //     </h3>
  //     <div className="text-sm text-gray-500 space-y-2">
  //       <p>Manage QR codes for tables here.</p>
  //       <p className="text-[10px] font-medium text-red-600 italic">
  //         Select a table to generate specialized QR.
  //       </p>
  //     </div>
  //     {/* Placeholder for QR logic */}
  //     <Button size="sm" variant="secondary" className="w-full">
  //       Generate All QRs
  //     </Button>
  //   </div>
  // );

  // const CustomerPopoverContent = (
  //   <div className="flex flex-col gap-4 p-2">
  //     <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 uppercase text-xs tracking-wider">
  //       Quick Add Customer
  //     </h3>
  //     <div className="space-y-4">
  //       <div>
  //         <label className="text-xs font-semibold text-gray-700 block mb-1.5">
  //           Full Name
  //         </label>
  //         <input
  //           type="text"
  //           className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-gray-400"
  //           placeholder="e.g. John Doe"
  //           value={newCustomer.fullName}
  //           onChange={(e) =>
  //             setNewCustomer({ ...newCustomer, fullName: e.target.value })
  //           }
  //         />
  //       </div>
  //       <div>
  //         <label className="text-xs font-semibold text-gray-700 block mb-1.5">
  //           Phone
  //         </label>
  //         <input
  //           type="text"
  //           className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-gray-400"
  //           placeholder="Phone Number"
  //           value={newCustomer.phone}
  //           onChange={(e) =>
  //             setNewCustomer({ ...newCustomer, phone: e.target.value })
  //           }
  //         />
  //       </div>
  //       <Button
  //         size="sm"
  //         onClick={handleAddCustomer}
  //         className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 border-none"
  //       >
  //         Add Customer
  //       </Button>
  //     </div>
  //   </div>
  // );

  // const StaffPopoverContent = (
  //   <div className="flex flex-col gap-4 p-2">
  //     <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 uppercase text-xs tracking-wider">
  //       Add New Staff
  //     </h3>
  //     <div className="space-y-4">
  //       <div>
  //         <label className="text-xs font-semibold text-gray-700 block mb-1.5">
  //           Name
  //         </label>
  //         <input
  //           type="text"
  //           className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-gray-400"
  //           placeholder="e.g. Alice Smith"
  //           value={newStaff.name}
  //           onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
  //         />
  //       </div>
  //       <div>
  //         <label className="text-xs font-semibold text-gray-700 block mb-1.5">
  //           Role
  //         </label>
  //         <input
  //           type="text"
  //           className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-gray-400"
  //           placeholder="e.g. Waiter"
  //           value={newStaff.role}
  //           onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
  //         />
  //       </div>
  //       <div>
  //         <label className="text-xs font-semibold text-gray-700 block mb-1.5">
  //           Phone
  //         </label>
  //         <input
  //           type="text"
  //           className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all placeholder:text-gray-400"
  //           placeholder="Phone Number"
  //           value={newStaff.phone}
  //           onChange={(e) =>
  //             setNewStaff({ ...newStaff, phone: e.target.value })
  //           }
  //         />
  //       </div>
  //       <Button
  //         size="sm"
  //         onClick={handleAddStaff}
  //         className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 border-none"
  //       >
  //         Add Staff
  //       </Button>
  //     </div>
  //   </div>
  // );

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-full">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 font-medium italic">
            Monitor and manage your restaurant floor in real-time
          </p>
        </div>
        {/* <div className="flex items-center gap-3">
          <Popover
            trigger={
              <Button
                variant="secondary"
                className="bg-white hover:bg-gray-50 border-gray-200"
              >
                Add Staff
              </Button>
            }
            content={StaffPopoverContent}
            isOpen={isStaffPopoverOpen}
            setIsOpen={setIsStaffPopoverOpen}
            align="right"
          />
          <Popover
            trigger={
              <Button
                variant="secondary"
                className="bg-white hover:bg-gray-50 border-gray-200"
              >
                Add Customer
              </Button>
            }
            content={CustomerPopoverContent}
            isOpen={isCustomerPopoverOpen}
            setIsOpen={setIsCustomerPopoverOpen}
            align="right"
          />
          <Popover
            trigger={
              <Button
                variant="secondary"
                className="bg-white hover:bg-gray-50 border-gray-200"
              >
                Add Space
              </Button>
            }
            content={SpacePopoverContent}
            isOpen={isSpacePopoverOpen}
            setIsOpen={setIsSpacePopoverOpen}
            align="right"
          />
          <Popover
            trigger={
              <Button
                variant="secondary"
                className="bg-white hover:bg-gray-50 border-gray-200"
              >
                Add Table
              </Button>
            }
            content={TablePopoverContent}
            isOpen={isTablePopoverOpen}
            setIsOpen={setIsTablePopoverOpen}
            align="right"
          />
          <Popover
            trigger={
              <Button
                variant="secondary"
                className="bg-white hover:bg-gray-50 border-gray-200"
              >
                QR Codes
              </Button>
            }
            content={QRPopoverContent}
            isOpen={isQRPopoverOpen}
            setIsOpen={setIsQRPopoverOpen}
            align="right"
          />
        </div> */}
      </div>

      {/* Metrics Section */}
      <DashboardMetrics />

      {/* Top Performers Section */}


      {/* Today's Activity Register */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-md overflow-hidden transition-all duration-300">
        <div className="px-8 py-6 border-b border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-50/50">
          <div>
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-[0.1em]">
              Today's Activity Register
            </h3>
            <p className="text-[11px] text-zinc-400 font-medium">
              Monitor individual transactions logged today
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-zinc-100/80 p-1 rounded-xl flex gap-1 border border-zinc-200/50">
              <button
                onClick={() => setActiveActivityTab("sales")}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                  activeActivityTab === "sales"
                    ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/10"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Today's Sales
              </button>
              <button
                onClick={() => setActiveActivityTab("purchases")}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                  activeActivityTab === "purchases"
                    ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/10"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Today's Purchases
              </button>
            </div>
            
            <Button
              onClick={() => {
                if (activeActivityTab === "sales") {
                  setIsSaleModalOpen(true);
                } else {
                  setIsPurchaseModalOpen(true);
                }
              }}
              className="bg-zinc-900 text-white hover:bg-black font-black text-[10px] uppercase tracking-wider h-10 px-4 rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus size={14} /> New {activeActivityTab === "sales" ? "Sale" : "Purchase"}
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-2">
          {loadingActivity ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-zinc-400" size={28} />
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Loading Today's Activity...</p>
            </div>
          ) : activeActivityTab === "sales" ? (
            todaySales.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <Receipt className="mx-auto text-zinc-300" size={40} />
                <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest">No Sales Logged Today</h4>
                <p className="text-[11px] text-zinc-400 font-medium">Record a sale by clicking 'New Sale' above.</p>
              </div>
            ) : (
              <CustomTable
                columns={[
                  { header: "SN", accessor: (_, i) => i + 1 },
                  {
                    header: "Invoice / Ref",
                    accessor: (row: any) => (
                      <div className="flex flex-col">
                        <span className="font-mono text-xs uppercase font-black text-zinc-900 tracking-tighter">
                          #{row.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                          {new Date(row.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ),
                  },
                  {
                    header: "Customer",
                    accessor: (row: any) => (
                      <span className="font-bold text-zinc-700">{row.customer || "Guest"}</span>
                    ),
                  },
                  {
                    header: "Billing Particulars",
                    accessor: (row: any) => (
                      <span className="text-xs text-zinc-500 font-medium max-w-[200px] truncate block">
                        {row.items?.[0]?.dishName || "Quick Sale"}
                      </span>
                    ),
                  },
                  {
                    header: "Payment Method",
                    accessor: (row: any) => (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 uppercase tracking-widest">
                        {row.mode}
                      </span>
                    ),
                  },
                  {
                    header: "Amount",
                    accessor: (row: any) => (
                      <span className="font-black text-zinc-900">
                        {settings.currency} {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    ),
                  },
                  {
                    header: "Actions",
                    accessor: (row: any) => (
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="none"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-zinc-100 rounded-full transition-colors"
                          onClick={() => {
                            setSelectedSale(row);
                          }}
                        >
                          <Printer className="h-4 w-4 text-zinc-500" />
                        </Button>
                        <Button
                          variant="none"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-rose-50 rounded-full transition-colors"
                          onClick={() => setDeleteSaleId(row.id)}
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    ),
                  },
                ]}
                data={todaySales}
                onRowClick={(row) => setSelectedSale(row)}
              />
            )
          ) : todayPurchases.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <ShoppingBag className="mx-auto text-zinc-300" size={40} />
              <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest">No Purchases Logged Today</h4>
              <p className="text-[11px] text-zinc-400 font-medium">Record a purchase bill by clicking 'New Purchase' above.</p>
            </div>
          ) : (
            <CustomTable
              columns={[
                { header: "SN", accessor: (_, i) => i + 1 },
                {
                  header: "Invoice No",
                  accessor: (row: any) => (
                    <div className="flex flex-col">
                      <span className="font-mono text-xs uppercase font-black text-zinc-900 tracking-tighter">
                        {row.referenceNumber}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                        {new Date(row.txnDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ),
                },
                {
                  header: "Supplier",
                  accessor: (row: any) => (
                    <span className="font-bold text-zinc-700">{row.supplier}</span>
                  ),
                },
                {
                  header: "Payment Method",
                  accessor: (row: any) => (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 uppercase tracking-widest">
                      {row.paymentMode}
                    </span>
                  ),
                },
                {
                  header: "Total Amount",
                  accessor: (row: any) => (
                    <span className="font-black text-zinc-900">
                      {settings.currency} {row.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  ),
                },
                {
                  header: "Status",
                  accessor: (row: any) => (
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                        row.paymentStatus === "PAID"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-amber-50 text-amber-600 border-amber-100"
                      }`}
                    >
                      {row.paymentStatus}
                    </span>
                  ),
                },
                {
                  header: "Actions",
                  accessor: (row: any) => (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="none"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-zinc-100 rounded-full transition-colors"
                        onClick={() => setSelectedPurchase(row)}
                      >
                        <Printer className="h-4 w-4 text-zinc-500" />
                      </Button>
                      <Button
                        variant="none"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-rose-50 rounded-full transition-colors"
                        onClick={() => setDeletePurchaseId(row.id)}
                      >
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                  ),
                },
              ]}
              data={todayPurchases}
              onRowClick={(row) => setSelectedPurchase(row)}
            />
          )}
        </div>
      </div>

            <TopPerformers />

      <SalesLineChart/>{/* Original Quick Metrics (Tables/Spaces) - Maybe keep or move? */}
      {/* Moving below as secondary information */}
      <div className="pt-8 border-t border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Floor Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Total Customers" value={customers.length} />
          <MetricCard title="Total Spaces" value={spaces.length} />
          <MetricCard title="Total Tables" value={tables.length} />
          <MetricCard
            title="Active Tables"
            value={tables.filter((t) => t.status === "ACTIVE").length}
          />
        </div>
      </div>

      {/* Add Table Type Modal */}
      <Modal
        isOpen={isTypeModalOpen}
        onClose={() => {
          setIsTypeModalOpen(false);
          setIsTablePopoverOpen(true); // Re-open table popover so user can continue
        }}
        title="Create Table Type"
      >
        <div className="flex flex-col gap-6 py-2">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Type Name
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
              placeholder="e.g. VIP Lounge"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setIsTypeModalOpen(false);
                setIsTablePopoverOpen(true);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTableType}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200"
            >
              Save Type
            </Button>
          </div>
        </div>
      </Modal>

      {/* Sales Detail Side Panel */}
      <SidePanel
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title="Sale Detail"
      >
        {selectedSale && (
          <div className="space-y-6 p-6 overflow-y-auto max-h-screen custom-scrollbar pb-24 text-zinc-900">
            {/* Receipt Summary Grid */}
            <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                    Status
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border inline-block ${
                      selectedSale.status === "PAID" ||
                      selectedSale.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : "bg-amber-50 text-amber-600 border-amber-100"
                    }`}
                  >
                    {selectedSale.status}
                  </span>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                    Payment Mode
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 uppercase tracking-widest inline-block">
                    {selectedSale.mode}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                    Reference
                  </span>
                  <p className="text-xs font-bold text-zinc-900">
                    #{selectedSale.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                    Billed By
                  </span>
                  <p className="text-xs font-bold text-zinc-900">
                    {selectedSale.billedBy}
                  </p>
                </div>
              </div>
            </div>

            {/* Print Section for Receipt */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6 relative overflow-hidden">
              <div id={`receipt-${selectedSale.id}`} className="space-y-6">
                {/* Receipt Header Style */}
                <div className="text-center space-y-2 pb-6 border-b border-dashed border-zinc-200">
                  {settings.logo && (
                    <img src={settings.logo} alt="Logo" className="h-12 mx-auto mb-2 object-contain" />
                  )}
                  <h3 className="text-sm font-black text-zinc-900 uppercase tracking-[0.3em]">
                    {settings.name || "KUND COFFEE"}
                  </h3>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">
                    {settings.address || "Quality & Comfort"}
                  </p>
                </div>

                {/* Bill Meta */}
                <div className="grid grid-cols-2 gap-y-4 pt-2">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">
                      Tax Invoice
                    </span>
                    <p className="text-[11px] font-bold text-zinc-900">
                      #{selectedSale.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">
                      Date & Time
                    </span>
                    <p className="text-[11px] font-bold text-zinc-900">
                      {new Date(selectedSale.date).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">
                      Customer
                    </span>
                    <p className="text-[11px] font-bold text-zinc-900">
                      {selectedSale.customer || "Walking Guest"}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">
                      Order Type
                    </span>
                    <p className="text-[11px] font-bold text-zinc-900">
                      {selectedSale.orderType || "Quick Billing"}
                    </p>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-4 pt-4 border-t border-zinc-100">
                  <div className="flex justify-between items-center text-[9px] font-black text-zinc-400 uppercase tracking-widest pb-1 border-b border-zinc-50">
                    <span>Particulars</span>
                    <span>Amount</span>
                  </div>
                  <div className="space-y-3">
                    {selectedSale.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-bold text-zinc-900 uppercase">
                            {item.dishName}
                          </p>
                          <p className="text-[9px] text-zinc-400 font-bold">
                            {item.quantity} x {settings.currency}{" "}
                            {(item.amount / item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <span className="text-[11px] font-black text-zinc-900">
                          {settings.currency} {item.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals Section */}
                <div className="pt-6 border-t border-dashed border-zinc-200 space-y-2">
                  <div className="flex justify-between text-[11px] font-bold text-zinc-600">
                    <span className="uppercase tracking-widest">Subtotal</span>
                    <span>
                      {settings.currency} {(selectedSale.amount ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-zinc-400">
                    <span className="uppercase tracking-widest text-[9px]">
                      VAT Compliance (13%)
                    </span>
                    <span>Included</span>
                  </div>
                  <div className="pt-4 flex justify-between items-center border-t border-zinc-100">
                    <span className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em]">
                      Grand Total
                    </span>
                    <span className="text-2xl font-black text-zinc-900 tracking-tighter">
                      {settings.currency} {(selectedSale.amount ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Receipt Footer */}
                <div className="text-center pt-8 opacity-50">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                    Thank you for visiting!
                  </p>
                  <div className="mt-4 flex justify-center gap-1">
                    {[...Array(15)].map((_, i) => (
                      <div key={i} className="w-1 h-1 bg-zinc-200 rounded-full" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Print Action */}
              <div className="pt-6 border-t border-zinc-100">
                <Button
                  onClick={() => handlePrint(selectedSale)}
                  className="w-full h-12 bg-zinc-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 border-none"
                >
                  <Printer size={16} /> Print Official Receipt
                </Button>
              </div>
            </div>
          </div>
        )}
      </SidePanel>

      {/* Purchases Detail Side Panel */}
      <SidePanel
        isOpen={!!selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
        title="Purchase Detail"
      >
        {selectedPurchase && <PurchaseDetailView id={selectedPurchase.id} />}
      </SidePanel>

      {/* Creation Modals */}
      <SaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        onSuccess={fetchTodayActivity}
      />

      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onSuccess={fetchTodayActivity}
      />

      {/* Deletion Confirmations */}
      <ConfirmationModal
        isOpen={!!deleteSaleId}
        onClose={() => setDeleteSaleId(null)}
        onConfirm={handleDeleteSale}
        title="Delete Sale Record"
        message="Are you sure you want to delete this sale transaction? This action will void the record."
        confirmVariant="danger"
      />

      <ConfirmationModal
        isOpen={!!deletePurchaseId}
        onClose={() => setDeletePurchaseId(null)}
        onConfirm={handleDeletePurchase}
        title="Delete Purchase Bill"
        message="Are you sure you want to delete this purchase? This will revert the stock quantities."
        confirmVariant="danger"
      />
    </div>
  );
}
