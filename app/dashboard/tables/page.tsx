"use client";
import { useEffect, useState } from "react";
import { ApiResponse, Table, TableType, spaceType } from "@/lib/types";
import {
  getTables,
  getTableTypes,
  addTable,
  addTableType,
  updateTable,
  deleteTable,
} from "@/services/table";
import { getSpaces, addSpace } from "@/services/space";
import { PageHeaderAction } from "@/components/ui/PageHeaderAction";
import { MetricCard } from "@/components/ui/MetricCard";
import { Button } from "@/components/ui/Button";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { Modal } from "@/components/ui/Modal";
import { SidePanel } from "@/components/ui/SidePanel";
import { useRouter } from "next/navigation";
import { Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

export default function TablesPage() {
  const router = useRouter();

  // --- Data States ---
  const [tables, setTables] = useState<Table[]>([]);
  const [tableTypes, setTableTypes] = useState<TableType[]>([]);
  const [spaces, setSpaces] = useState<spaceType[]>([]);

  // Filtering & Sorting State
  const [filteredTables, setFilteredTables] = useState<Table[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "name" | "type" | "space" | "capacity" | "status"
  >("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // --- UI & Logic States ---
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Form Input States ---
  const [tableName, setTableName] = useState("");
  const [tableCapacity, setTableCapacity] = useState("");
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | undefined>(
    undefined,
  );
  const [selectedTypeId, setSelectedTypeId] = useState<string | undefined>(
    undefined,
  );
  const [sortOrder, setSortOrder] = useState(0);

  // --- Inline Editing State (Row #) ---
  const [editingValue, setEditingValue] = useState<number>(0);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  // Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // --- Nested Form States ---
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDesc, setNewSpaceDesc] = useState("");
  const [newTypeName, setNewTypeName] = useState("");

  // Initial Fetch
  useEffect(() => {
    const fetchData = async () => {
      const [tData, typeData, sData] = await Promise.all([
        getTables(),
        getTableTypes(),
        getSpaces(),
      ]);
      setTables(tData);
      setFilteredTables(tData);
      setTableTypes(typeData);
      setSpaces(sData);
    };
    fetchData();
  }, []);

  // --- Search & Sort Logic (Matches SpacesPage) ---
  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();

    // 1. Filter
    let filtered = tables.filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.space?.name.toLowerCase().includes(lowerQuery) ||
        t.tableType?.name.toLowerCase().includes(lowerQuery),
    );

    // 2. Sort
    filtered = [...filtered].sort((a, b) => {
      // Cast to any to safely access sortOrder if strictly typed
      const aSortOrder = (a as any).sortOrder ?? 0;
      const bSortOrder = (b as any).sortOrder ?? 0;

      // Primary Sort: Sort Order (Ascending)
      if (aSortOrder !== bSortOrder) {
        return aSortOrder - bSortOrder;
      }

      // Secondary Sort: Selected Column
      const mult = sortDir === "asc" ? 1 : -1;
      let va: string | number = "";
      let vb: string | number = "";

      switch (sortBy) {
        case "name":
          va = a.name;
          vb = b.name;
          break;
        case "type":
          va = a.tableType?.name || "";
          vb = b.tableType?.name || "";
          break;
        case "space":
          va = a.space?.name || "";
          vb = b.space?.name || "";
          break;
        case "capacity":
          va = a.capacity;
          vb = b.capacity;
          break;
        case "status":
          va = a.status;
          vb = b.status;
          break;
        default:
          va = a.name;
          vb = b.name;
      }

      // String vs Number Comparison
      if (typeof va === "string") {
        return mult * String(va).localeCompare(String(vb));
      }
      return mult * (Number(va) - Number(vb));
    });

    setFilteredTables(filtered);
  }, [searchQuery, tables, sortBy, sortDir]);

  // --- Handlers ---

  const closePanel = () => {
    setIsPanelOpen(false);
  };

  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setTableName("");
    setTableCapacity("");
    setSelectedSpaceId(undefined);
    setSelectedTypeId(undefined);
    setSortOrder(0);
    setIsPanelOpen(true);
  };

  const openEdit = (table: Table) => {
    setIsEditing(true);
    setEditingId(table.id);
    setTableName(table.name);
    setTableCapacity(table.capacity.toString());
    setSelectedSpaceId(table.spaceId || table.space?.id);
    setSelectedTypeId(table.tableTypeId || table.tableType?.id);
    setSortOrder((table as any).sortOrder ?? 0);
    setIsPanelOpen(true);
  };

  // --- Inline Sort Order Logic ---

  const handleSortOrderClick = (table: Table, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRowId(table.id);
    setEditingValue((table as any).sortOrder ?? 0);
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    if (editingValue === 0 && newVal.length > 1 && newVal.startsWith("0")) {
      setEditingValue(parseInt(newVal.substring(1)) || 0);
    } else {
      setEditingValue(parseInt(newVal) || 0);
    }
  };

  const handleSortOrderKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    tableId: string,
  ) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setEditingRowId(null);
    }
  };

  const handleSortOrderBlur = async (tableId: string) => {
    // Only update if value actually changed
    const currentTable = tables.find((t) => t.id === tableId);
    if (currentTable && (currentTable as any).sortOrder === editingValue) {
      setEditingRowId(null);
      return;
    }

    setIsLoading(true);
    try {
      // Assuming updateTable service accepts partial updates including sortOrder
      const res = await updateTable({ id: tableId, sortOrder: editingValue });

      if (res.success) {
        // Force refresh to ensure sort logic picks up new values
        const updated = await fetch("/api/tables?t=" + Date.now(), {
          cache: "no-store",
        })
          .then((r) => r.json())
          .then((data) => (data.success ? data.data : []));

        setTables(updated);
        toast.success("Sort order updated");
      } else {
        toast.error(res.message ?? "Failed to update sort order");
      }
    } catch (error) {
      console.error("Failed to update sort order:", error);
      toast.error("Failed to update sort order");
    } finally {
      setEditingRowId(null);
      setIsLoading(false);
    }
  };

  // --- CRUD Handlers ---

  const handleSubmit = async () => {
    if (!tableName || !tableCapacity || !selectedSpaceId || !selectedTypeId) {
      toast.error("All fields are required");
      return;
    }

    setIsLoading(true);

    try {
      let res: ApiResponse<Table>;

      if (isEditing && editingId) {
        res = await updateTable({
          id: editingId,
          name: tableName,
          capacity: parseInt(tableCapacity),
          spaceId: selectedSpaceId,
          tableTypeId: selectedTypeId,
          sortOrder,
        });
      } else {
        res = await addTable(
          tableName,
          parseInt(tableCapacity),
          selectedSpaceId,
          selectedTypeId,
          sortOrder,
        );
      }

      if (!res.success || !res.data) {
        toast.error(res.message ?? "Failed to save table");
        return;
      }

      toast.success(
        res.message ?? (isEditing ? "Table updated" : "Table created"),
      );

      // Refresh list
      const updatedTables = await getTables();
      setTables(updatedTables);

      closePanel();
      router.refresh();
    } catch (error) {
      console.error("Failed to save table", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId) return;

    setIsLoading(true);
    try {
      const res = await deleteTable(editingId);
      if (res.success) {
        toast.success("Table deleted");
        const updatedTables = await getTables();
        setTables(updatedTables);
        setIsDeleteModalOpen(false);
        closePanel();
        router.refresh();
      } else {
        toast.error(res.message ?? "Failed to delete table");
      }
    } catch (error) {
      console.error("Failed to delete table", error);
      toast.error("Failed to delete table");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Nested Modal Handlers ---

  const handleCreateSpace = async () => {
    if (!newSpaceName) {
      toast.error("Space name is required");
      return;
    }
    const res = await addSpace(newSpaceName, newSpaceDesc);
    if (!res.success || !res.data) {
      toast.error(res.message ?? "Failed to create space");
      return;
    }
    const space = res.data;
    setSpaces([...spaces, space]);
    setSelectedSpaceId(space.id);
    setIsSpaceModalOpen(false);
    setNewSpaceName("");
    setNewSpaceDesc("");
    toast.success(`Space "${space.name}" created`);
  };

  const handleCreateType = async () => {
    if (!newTypeName) return;
    const res = await addTableType(newTypeName);
    if (!res.success || !res.data) {
      toast.error(res.message ?? "Failed to create type");
      return;
    }
    const tableType = res.data;
    setTableTypes([...tableTypes, tableType]);
    setSelectedTypeId(tableType.id);
    setIsTypeModalOpen(false);
    setNewTypeName("");
    toast.success(`Type "${tableType.name}" created`);
  };

  const handleExport = () => {
    const headers = ["Row #", "Name", "Type", "Space", "Capacity", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredTables.map((t) =>
        [
          (t as any).sortOrder ?? 0,
          t.name,
          t.tableType?.name || "",
          t.space?.name || "",
          t.capacity,
          t.status,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "tables_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics
  const totalTables = tables.length;
  const activeTables = tables.filter((t) => t.status === "ACTIVE").length;
  const occupiedTables = tables.filter((t) => t.status === "OCCUPIED").length;

  return (
    <div className="px-6 py-10">
      <PageHeaderAction
        title="Tables"
        description="Manage all your restaurant tables"
        onSearch={setSearchQuery}
        onExport={handleExport}
        actionButton={
          <Button
            onClick={openCreate}
            className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-sm"
          >
            <span className="flex items-center gap-2">Add Table</span>
          </Button>
        }
      />

      <div className="grid grid-cols-4 gap-6 mb-8">
        <MetricCard title="Total Tables" value={totalTables} />
        <MetricCard title="Active Tables" value={activeTables} />
        <MetricCard title="Occupied Tables" value={occupiedTables} />
        <MetricCard title="Table Types" value={tableTypes.length} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-tight">
            Floor Map & Table Register
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-400 font-medium">
              {filteredTables.length} tables configured
            </span>
          </div>
        </div>

        <table className="w-full text-left text-sm text-zinc-600">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest w-24">
                Row #
              </th>
              <th className="px-6 py-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">
                Name
              </th>
              <th className="px-6 py-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">
                Type
              </th>
              <th className="px-6 py-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">
                Space
              </th>
              <th className="px-6 py-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">
                Cap.
              </th>
              <th className="px-6 py-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">
                Status
              </th>
              <th className="px-6 py-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredTables.map((table) => (
              <tr
                key={table.id}
                onClick={() => openEdit(table)}
                className="hover:bg-zinc-50 transition-colors cursor-pointer group border-b border-zinc-100 last:border-0"
              >
                <td
                  className="px-6 py-4"
                  onClick={(e) => handleSortOrderClick(table, e)}
                >
                  {editingRowId === table.id ? (
                    <input
                      type="number"
                      value={editingValue}
                      onChange={handleSortOrderChange}
                      onBlur={() => handleSortOrderBlur(table.id)}
                      onKeyDown={(e) => handleSortOrderKeyDown(e, table.id)}
                      className="w-16 px-2 py-1 text-sm border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="font-mono text-xs font-black text-zinc-400 group-hover:text-zinc-900 transition-colors">
                      {((table as any).sortOrder ?? 0)
                        .toString()
                        .padStart(2, "0")}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 font-black text-zinc-900">
                  {table.name}
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    {table.tableType?.name || "Standard"}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-600 font-bold text-xs uppercase">
                  {table.space?.name || "-"}
                </td>
                <td className="px-6 py-4 text-zinc-900 font-mono font-black">
                  {table.capacity}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                      table.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : table.status === "OCCUPIED"
                          ? "bg-rose-50 text-rose-600 border-rose-100"
                          : "bg-amber-50 text-amber-600 border-amber-100"
                    }`}
                  >
                    {table.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="none"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-zinc-100 rounded-full transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(table);
                      }}
                    >
                      <Pencil className="h-4 w-4 text-zinc-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredTables.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-zinc-400">
                  No tables found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <SidePanel
        isOpen={isPanelOpen}
        onClose={closePanel}
        title={isEditing ? `Edit Table: ${tableName}` : "Add New Table"}
      >
        <div className="space-y-6 pb-20">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Table Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. T-01"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 transition-all"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Capacity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="e.g. 4"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 transition-all"
              value={tableCapacity}
              onChange={(e) => setTableCapacity(e.target.value)}
            />
          </div>
          <div>
            <CustomDropdown
              label="Space"
              options={spaces.map((s) => ({ id: s.id, name: s.name }))}
              value={selectedSpaceId}
              onChange={setSelectedSpaceId}
              placeholder="Select Space"
              onAddNew={() => setIsSpaceModalOpen(true)}
              addNewLabel="Add New Space"
            />
          </div>
          <div>
            <CustomDropdown
              label="Table Type"
              options={tableTypes.map((t) => ({ id: t.id, name: t.name }))}
              value={selectedTypeId}
              onChange={setSelectedTypeId}
              placeholder="Select Type"
              onAddNew={() => setIsTypeModalOpen(true)}
              addNewLabel="Add New Type"
            />
          </div>

          {/* Display Order Field */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Display Order (Row #)
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 transition-all font-mono"
              placeholder="e.g. 1"
              value={sortOrder}
              onChange={(e) => {
                const newVal = e.target.value;
                if (
                  sortOrder === 0 &&
                  newVal.length > 1 &&
                  newVal.startsWith("0")
                ) {
                  setSortOrder(parseInt(newVal.substring(1)) || 0);
                } else {
                  setSortOrder(parseInt(newVal) || 0);
                }
              }}
            />
            <p className="mt-1.5 text-xs text-zinc-500 italic">
              Leave as 0 to automatically place at the end.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 flex items-center gap-3">
          {isEditing && (
            <Button
              onClick={() => setIsDeleteModalOpen(true)}
              variant="secondary"
              className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
              disabled={isLoading}
            >
              <Trash2 size={20} />
            </Button>
          )}
          <Button
            onClick={closePanel}
            variant="secondary"
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white"
            disabled={
              !tableName ||
              !tableCapacity ||
              !selectedSpaceId ||
              !selectedTypeId ||
              isLoading
            }
          >
            {isLoading
              ? "Saving..."
              : isEditing
                ? "Update Table"
                : "Create Table"}
          </Button>
        </div>
      </SidePanel>

      {/* --- NESTED MODALS --- */}
      <Modal
        isOpen={isSpaceModalOpen}
        onClose={() => setIsSpaceModalOpen(false)}
        title="Create New Space"
      >
        <div className="flex flex-col gap-4 p-2">
          <input
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-zinc-900 focus:outline-none"
            placeholder="Space Name"
            value={newSpaceName}
            onChange={(e) => setNewSpaceName(e.target.value)}
          />
          <textarea
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-zinc-900 focus:outline-none"
            placeholder="Description"
            value={newSpaceDesc}
            onChange={(e) => setNewSpaceDesc(e.target.value)}
          />
          <Button
            onClick={handleCreateSpace}
            className="w-full bg-zinc-900 text-white uppercase font-bold text-[10px] tracking-widest"
          >
            Save Space
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        title="Create Table Type"
      >
        <div className="flex flex-col gap-4 p-2">
          <input
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-zinc-900 focus:outline-none"
            placeholder="Type Name"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
          />
          <Button
            onClick={handleCreateType}
            className="w-full bg-zinc-900 text-white uppercase font-bold text-[10px] tracking-widest"
          >
            Save Type
          </Button>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Table"
        message={`Are you sure you want to delete table "${tableName}"?`}
        isLoading={isLoading}
      />
    </div>
  );
}
