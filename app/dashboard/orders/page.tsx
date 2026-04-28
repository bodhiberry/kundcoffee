"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Order,
  OrderStatus,
  OrderType,
  Table,
  spaceType,
  TableType,
  TableSession,
} from "@/lib/types";
import {
  getOrders,
  updateOrderStatus,
  updateOrderItemStatus,
  updateOrderItems,
  createOrder,
  deleteOrderItem,
} from "@/services/order";
import {
  getTables,
  getTableTypes,
  getOccupiedTable,
  updateTable,
} from "@/services/table";
import { getSpaces, updateSpace } from "@/services/space";
import { OrderCard } from "@/components/orders/OrderCard";
import { OrderDetailView } from "@/components/orders/OrderDetailView";
import { CheckoutModal } from "@/components/orders/CheckoutModal";
import { TableOrderingSystem } from "@/components/tables/TableOrderingSystem";
import { KOTCard } from "@/components/kot/KOTCard";
import { Button } from "@/components/ui/Button";
import { CustomDropdown } from "@/components/ui/CustomDropdown";
import { Modal } from "@/components/ui/Modal";
import {
  Search,
  Plus,
  Settings,
  History,
  FileText,
  Slash,
  WifiOff,
  CalendarDays,
  Users,
  ChefHat,
  Wine,
  X,
  Package,
  CreditCard,
  GripVertical,
} from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { toast } from "sonner";

// DnD Kit Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ActiveTab = "ORDERS" | "TABLES" | "KOT";

// --- Sub-Component: Sortable Table Card ---
function SortableTableCard({ table, occupiedTable, handleTableClick }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: table.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const session = occupiedTable.find((o: any) => o.tableId === table.id);
  const isOccupied = !!session;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-xl p-5 border transition-all duration-200 flex flex-col items-center gap-3 ${
        isOccupied
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-zinc-100 border-zinc-200 text-zinc-400 hover:border-emerald-500 hover:bg-white"
      }`}
    >
      {/* Table Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 p-1 cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-600 rounded"
      >
        <GripVertical size={14} />
      </div>

      <div
        onClick={() => handleTableClick(table)}
        className="flex flex-col items-center gap-3 cursor-pointer w-full"
      >
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${isOccupied ? "bg-emerald-100" : "bg-white border border-zinc-200"}`}
        >
          <Users size={18} />
        </div>
        <div className="text-center">
          <h3
            className={`font-bold text-xs uppercase tracking-tight ${isOccupied ? "text-zinc-900" : "text-zinc-600"}`}
          >
            {table.name}
          </h3>
          <p className="text-[9px] font-bold uppercase opacity-80 mt-0.5 text-zinc-500">
            {table.capacity} Seats
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Sub-Component: Sortable Space Section ---
function SortableSpaceSection({
  space,
  tables,
  occupiedTable,
  handleTableClick,
  tableLayout,
  onTableDragEnd,
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: space.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-4">
      <div className="flex items-center justify-between border-b-2 border-zinc-100 pb-2">
        <div className="flex items-center gap-3">
          {/* Area Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="p-1 cursor-grab active:cursor-grabbing text-zinc-400 hover:bg-zinc-100 rounded"
          >
            <GripVertical size={18} />
          </div>
          <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
            Area: <span className="text-zinc-900">{space.name}</span>
          </h2>
        </div>
        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-100 px-2 py-0.5 rounded">
          {tables.length} Tables
        </span>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={(e) => onTableDragEnd(e, space.id)}
      >
        <SortableContext
          items={tables.map((t: any) => t.id)}
          strategy={rectSortingStrategy}
        >
          <div
            className={`grid gap-4 ${
              tableLayout === "compact"
                ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3"
                : tableLayout === "spacious"
                  ? "grid-cols-2 lg:grid-cols-4 gap-6"
                  : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
            }`}
          >
            {tables.map((table: any) => (
              <SortableTableCard
                key={table.id}
                table={table}
                occupiedTable={occupiedTable}
                handleTableClick={handleTableClick}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>("TABLES");
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [spaces, setSpaces] = useState<spaceType[]>([]);
  const [tableTypes, setTableTypes] = useState<TableType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderType, setSelectedOrderType] = useState<string>("ALL");
  const [spaceSortOrder, setSpaceSortOrder] = useState<
    "custom" | "alphabetical" | "tableCount"
  >("custom");
  const [tableLayout, setTableLayout] = useState<
    "compact" | "default" | "spacious"
  >("default");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"active" | "all">(
    "active",
  );
  const [occupiedTable, setOccupiedTable] = useState<TableSession[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [checkoutOrder, setCheckoutOrder] = useState<Order | null>(null);
  const [activeTable, setActiveTable] = useState<Table | null>(null);
  const [existingOrderForAdding, setExistingOrderForAdding] =
    useState<Order | null>(null);
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [showOrderTypeSelector, setShowOrderTypeSelector] = useState(false);
  const [pendingTable, setPendingTable] = useState<Table | null>(null);
  const [quickMenuTable, setQuickMenuTable] = useState<Table | null>(null);

  // DnD Sensors configuration (Distance: 4 for better responsiveness)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const fetchData = async () => {
    const [oData, busyTables, tData, sData, ttData] = await Promise.all([
      getOrders(),
      getOccupiedTable(),
      getTables(),
      getSpaces(),
      getTableTypes(),
    ]);

    setOrders(oData || []);
    setOccupiedTable(busyTables || []);
    setTables(tData || []);
    setSpaces(sData || []);
    setTableTypes(ttData || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Reordering Logic ---

  const handleSpaceDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = spaces.findIndex((s) => s.id === active.id);
    const newIndex = spaces.findIndex((s) => s.id === over.id);

    const reorderedSpaces = arrayMove(spaces, oldIndex, newIndex);
    setSpaces(reorderedSpaces);

    try {
      await Promise.all(
        reorderedSpaces.map((s, idx) =>
          updateSpace({ id: s.id, sortOrder: idx }),
        ),
      );
      toast.success("Area layout updated");
    } catch (e) {
      toast.error("Failed to save space order");
    }
  };

  const handleTableDragEnd = async (event: DragEndEvent, spaceId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tables.findIndex((t) => t.id === active.id);
    const newIndex = tables.findIndex((t) => t.id === over.id);

    const reorderedTables = arrayMove(tables, oldIndex, newIndex);
    setTables(reorderedTables);

    try {
      const spaceTables = reorderedTables.filter((t) => t.spaceId === spaceId);
      await Promise.all(
        spaceTables.map((t, idx) => updateTable({ id: t.id, sortOrder: idx })),
      );
    } catch (e) {
      toast.error("Failed to save table order");
    }
  };

  const groupedTables = useMemo(() => {
    const groups = spaces
      .map((space) => {
        const spaceTables = tables.filter(
          (t) =>
            t.spaceId === space.id &&
            t.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );

        // Sort tables within the space
        const sortedTables = [...spaceTables].sort((a, b) => {
          if (spaceSortOrder === "alphabetical") {
            return a.name.localeCompare(b.name, undefined, {
              numeric: true,
              sensitivity: "base",
            });
          }
          return ((a as any).sortOrder ?? 0) - ((b as any).sortOrder ?? 0);
        });

        return {
          ...space,
          tables: sortedTables,
        };
      })
      .filter((s) => s.tables.length > 0);

    // Sort spaces themselves
    if (spaceSortOrder === "alphabetical")
      return [...groups].sort((a, b) => a.name.localeCompare(b.name));
    if (spaceSortOrder === "tableCount")
      return [...groups].sort((a, b) => b.tables.length - a.tables.length);

    return [...groups].sort(
      (a, b) => ((a as any).sortOrder ?? 0) - ((b as any).sortOrder ?? 0),
    );
  }, [spaces, tables, searchQuery, spaceSortOrder]);

  // --- Order Handlers ---
  const handleCopyOrder = () => toast.info("Copied to clipboard");

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    const success = await updateOrderStatus(orderId, status);
    if (success) fetchData();
  };

  const handleUpdateItemStatus = async (
    orderItemId: string,
    status: OrderStatus,
  ) => {
    const success = await updateOrderItemStatus(orderItemId, status);
    if (success) fetchData();
  };

  const handleEditItem = async (itemId: string, updatedData: any) => {
    if (!selectedOrder) return;
    const success = await updateOrderItems(selectedOrder.id, [
      { ...updatedData, id: itemId, action: "update" },
    ]);
    if (success) fetchData();
  };

  const handleRemoveItem = async (itemId: string) => {
    const res = await deleteOrderItem(itemId);
    if (res.success) {
      await fetchData();
      if (selectedOrder) {
        const updated = await getOrders();
        const refreshed = updated.find((o: Order) => o.id === selectedOrder.id);
        refreshed ? setSelectedOrder(refreshed) : setSelectedOrder(null);
      }
      toast.success("Item removed");
    }
  };

  const handleCreateOrder = async (
    cart: any[],
    guests: number,
    kotRemarks: string,
    staffId: string,
  ) => {
    if (!activeTable) return;
    const orderData = {
      tableId: activeTable.id === "DIRECT" ? null : activeTable.id,
      type:
        activeTable.id === "DIRECT"
          ? (activeTable.name.toUpperCase().replace(" ", "_") as OrderType)
          : "DINE_IN",
      items: cart.map((i) => ({
        dishId: i.dishId,
        comboId: i.comboId,
        quantity: i.quantity,
        addOnIds: (i.addons || []).map((a: any) => a.id),
        remarks: i.remarks,
      })),
      guests,
      kotRemarks,
      staffId,
    };
    const success = await createOrder(orderData);
    if (success) {
      setActiveTable(null);
      fetchData();
    }
  };

  const handleQuickCheckout = async (order: Order) => {
    const success = await updateOrderStatus(order.id, "COMPLETED");
    if (success) {
      setSelectedOrder(null);
      fetchData();
    }
  };

  const handleAddItemsToOrder = async (
    cart: any[],
    guests: number,
    kotRemarks: string,
    staffId: string,
  ) => {
    if (!existingOrderForAdding) return;
    const items = cart.map((i) => ({
      dishId: i.dishId,
      comboId: i.comboId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      selectedAddOns: (i.addons || []).map((a: any) => ({
        addOnId: a.id,
        quantity: 1,
        unitPrice: a.price?.listedPrice || 0,
      })),
      action: "add",
    }));
    const success = await updateOrderItems(
      existingOrderForAdding.id,
      items,
      staffId,
      guests,
      kotRemarks,
    );
    if (success) {
      setExistingOrderForAdding(null);
      fetchData();
    }
  };

  const handleTableClick = (table: Table) => {
    const session = occupiedTable.find((o) => o.tableId === table.id);
    if (session) {
      setQuickMenuTable(table);
    } else {
      // Safety check: sometimes local state might lag, but we should be safe here
      setPendingTable(table);
      setShowOrderTypeSelector(true);
    }
  };

  const handleNewOrder = (type: OrderType) => {
    setShowOrderTypeSelector(false);
    if (type === "DINE_IN") {
      pendingTable ? setActiveTable(pendingTable) : setShowTableSelector(true);
      setPendingTable(null);
    } else {
      setActiveTable({
        id: "DIRECT",
        name: type?.replace("_", " ") || "N/A",
        status: "ACTIVE",
        capacity: 0,
        spaceId: "",
        tableTypeId: "",
        createdAt: new Date(),
        sessions: [],
      });
    }
  };

  const getFilteredKOTs = () => {
    let kots: { type: "KITCHEN" | "BAR"; order: Order; items: any[] }[] = [];
    orders
      .filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED")
      .forEach((o) => {
        const kitchenItems = o.items.filter(
          (i) => i.dish?.kotType === "KITCHEN",
        );
        const barItems = o.items.filter((i) => i.dish?.kotType === "BAR");
        if (kitchenItems.length > 0)
          kots.push({ type: "KITCHEN", order: o, items: kitchenItems });
        if (barItems.length > 0)
          kots.push({ type: "BAR", order: o, items: barItems });
      });
    return kots;
  };

  const handleKOTStatusUpdate = async (
    itemIds: string[],
    status: OrderStatus,
    order: Order,
  ) => {
    try {
      // 1. Update all selected items in parallel
      await Promise.all(itemIds.map((id) => updateOrderItemStatus(id, status)));

      // 2. Refresh data
      await fetchData();

      // 3. Optional: Add logic here to check if the whole order
      // is now finished to update the main Table status.
      toast.success(`Updated to ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="p-8 space-y-8 bg-zinc-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-normal text-zinc-900 tracking-tight">
              Orders
            </h1>
            <div className="bg-zinc-100 p-1 rounded-lg flex items-center gap-1">
              {["TABLES", "KOT", "ORDERS"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as ActiveTab)}
                  className={`px-4 py-1.5 rounded-md text-[10px] font-medium uppercase tracking-widest transition-all ${
                    activeTab === tab
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-xs outline-none focus:border-emerald-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              onClick={() => setShowOrderTypeSelector(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-6 uppercase tracking-widest text-[10px]"
            >
              <Plus size={14} className="mr-2" /> Add New Order
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[60vh]">
        {activeTab === "ORDERS" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {orders
              .filter(
                (o) => orderStatusFilter === "all" || o.status !== "COMPLETED",
              )
              .map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={setSelectedOrder}
                  onQuickCheckout={setCheckoutOrder}
                  onPrint={() => {}}
                  onCopy={handleCopyOrder}
                  onAddItems={setExistingOrderForAdding}
                />
              ))}
          </div>
        )}

        {activeTab === "TABLES" && (
          <div className="space-y-10">
            {/* Ongoing Orders Section */}
            {orders.filter(
              (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED",
            ).length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b-2 border-zinc-100 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
                      <Package size={18} />
                    </div>
                    <h2 className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em]">
                      Ongoing Orders
                    </h2>
                  </div>
                  {orders.filter(
                    (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED",
                  ).length > 6 && (
                    <button
                      onClick={() => setActiveTab("ORDERS")}
                      className="text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-zinc-900 transition-colors bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200"
                    >
                      View More
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {orders
                    .filter(
                      (o) =>
                        o.status !== "COMPLETED" && o.status !== "CANCELLED",
                    )
                    .slice(0, 6)
                    .map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onClick={setSelectedOrder}
                        onQuickCheckout={setCheckoutOrder}
                    onPrint={() => {}} // Handled internally
                        onCopy={handleCopyOrder}
                        onAddItems={setExistingOrderForAdding}
                      />
                    ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-zinc-100 shadow-sm">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                Layout:
              </span>
              <select
                value={tableLayout}
                onChange={(e) => setTableLayout(e.target.value as any)}
                className="text-[10px] uppercase font-bold border-none bg-zinc-100 rounded-md px-2 py-1 outline-none"
              >
                <option value="default">Default</option>
                <option value="compact">Compact</option>
                <option value="spacious">Spacious</option>
              </select>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSpaceDragEnd}
            >
              <SortableContext
                items={spaces.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-10">
                  {groupedTables.map((space) => (
                    <SortableSpaceSection
                      key={space.id}
                      space={space}
                      tables={space.tables}
                      occupiedTable={occupiedTable}
                      handleTableClick={handleTableClick}
                      tableLayout={tableLayout}
                      onTableDragEnd={handleTableDragEnd}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {activeTab === "KOT" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b-2 border-rose-100 pb-2">
                <ChefHat className="text-rose-600" size={20} />
                <h2 className="text-sm font-black uppercase">Kitchen</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getFilteredKOTs()
                  .filter((k) => k.type === "KITCHEN")
                  .map((kot, i) => (
                    <KOTCard
                      key={kot.order.id + kot.type} // Better key than just 'i'
                      order={kot.order}
                      items={kot.items}
                      type={kot.type}
                      onUpdateStatus={(ids, status) =>
                        handleKOTStatusUpdate(ids, status, kot.order)
                      }
                      onMove={(order) => {
                        // Open your transfer modal here
                        setPendingTable(order.table || null);
                        setShowTableSelector(true);
                        toast.info(
                          `Select target table for Order #${order.id.slice(-4)}`,
                        );
                      }}
                    />
                  ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b-2 border-zinc-100 pb-2">
                <Wine className="text-zinc-600" size={20} />
                <h2 className="text-sm font-black uppercase">Bar</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getFilteredKOTs()
                  .filter((k) => k.type === "BAR")
                  .map((kot, i) => (
                    <KOTCard
                      key={kot.order.id + kot.type} // Better key than just 'i'
                      order={kot.order}
                      items={kot.items}
                      type={kot.type}
                      onUpdateStatus={(ids, status) =>
                        handleKOTStatusUpdate(ids, status, kot.order)
                      }
                      onMove={(order) => {
                        // Open your transfer modal here
                        setPendingTable(order.table || null);
                        setShowTableSelector(true);
                        toast.info(
                          `Select target table for Order #${order.id.slice(-4)}`,
                        );
                      }}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- All Modals --- */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        size="5xl"
        title=""
      >
        {selectedOrder && (
          <OrderDetailView
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdateStatus={handleUpdateStatus}
            onUpdateItemStatus={handleUpdateItemStatus}
            onEditItem={handleEditItem}
            onRemoveItem={handleRemoveItem}
            onCheckout={setCheckoutOrder}
            onAddMore={setExistingOrderForAdding}
            onPrint={() => window.print()}
          />
        )}
      </Modal>

      <Modal
        isOpen={!!activeTable}
        onClose={() => setActiveTable(null)}
        size="6xl"
        title=""
      >
        {activeTable && (
          <TableOrderingSystem
            table={activeTable}
            onClose={() => setActiveTable(null)}
            onConfirm={handleCreateOrder}
            isAddingToExisting={false}
          />
        )}
      </Modal>

      <Modal
        isOpen={!!existingOrderForAdding}
        onClose={() => setExistingOrderForAdding(null)}
        size="6xl"
        title=""
      >
        {existingOrderForAdding && (
          <TableOrderingSystem
            table={existingOrderForAdding.table || undefined}
            onClose={() => setExistingOrderForAdding(null)}
            onConfirm={handleAddItemsToOrder}
            isAddingToExisting={true}
            existingItems={existingOrderForAdding.items}
          />
        )}
      </Modal>

      {checkoutOrder && (
        <CheckoutModal
          isOpen={!!checkoutOrder}
          onClose={() => setCheckoutOrder(null)}
          order={checkoutOrder}
          onCheckoutComplete={() => {
            fetchData();
            setCheckoutOrder(null);
          }}
        />
      )}

      <Modal
        isOpen={!!quickMenuTable}
        onClose={() => setQuickMenuTable(null)}
        size="md"
        title=""
      >
        {quickMenuTable && (
          <div className="p-8 space-y-8">
            {(() => {
              const activeOrder = orders.find(
                (o) =>
                  o.tableId === quickMenuTable.id &&
                  o.status !== "COMPLETED" &&
                  o.status !== "CANCELLED",
              );
              return (
                <>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                      <Package size={22} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-zinc-900 uppercase">
                        Table {quickMenuTable.name}
                      </h3>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase mt-0.5">
                        Ongoing session
                      </p>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-emerald-100 bg-emerald-50/30">
                      <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                        Order Details
                      </h4>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      {activeOrder?.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-start gap-4 py-1"
                        >
                          <div className="space-y-0.5">
                            <p className="text-[11px] font-bold text-zinc-800 uppercase leading-tight">
                              {item.quantity} x{" "}
                              {item.dish?.name || item.combo?.name || "Item"}
                            </p>
                            {item.selectedAddOns &&
                              item.selectedAddOns.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {item.selectedAddOns.map(
                                    (addon: any, aidx: number) => (
                                      <span
                                        key={aidx}
                                        className="text-[8px] text-emerald-600 font-medium uppercase"
                                      >
                                        +{addon.addOn?.name}
                                      </span>
                                    ),
                                  )}
                                </div>
                              )}
                          </div>
                          <span className="text-[11px] font-bold text-zinc-900 shrink-0">
                            Rs. {(item.totalPrice ?? 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {(!activeOrder?.items ||
                        activeOrder.items.length === 0) && (
                        <p className="text-[10px] text-zinc-400 text-center py-4 uppercase font-medium">
                          No items in order
                        </p>
                      )}
                    </div>
                    {activeOrder && (
                      <div className="p-4 bg-emerald-100/30 border-t border-emerald-100 flex items-center justify-between">
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                          Total Amount
                        </span>
                        <span className="text-xl font-black text-zinc-900">
                          Rs. {activeOrder?.total?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={() => {
                        if (activeOrder) setExistingOrderForAdding(activeOrder);
                        setQuickMenuTable(null);
                      }}
                      className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[10px] shadow-lg shadow-emerald-200 border-none"
                    >
                      Add Item
                    </Button>
                    <Button
                      onClick={() => {
                        if (activeOrder) setCheckoutOrder(activeOrder);
                        setQuickMenuTable(null);
                      }}
                      className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase text-[10px] shadow-lg shadow-zinc-200 border-none"
                    >
                      Direct checkout
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (activeOrder) setSelectedOrder(activeOrder);
                        setQuickMenuTable(null);
                      }}
                      className="w-full h-12 border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-[10px] uppercase transition-colors"
                    >
                      View Order
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showTableSelector}
        onClose={() => setShowTableSelector(false)}
        size="4xl"
        title="Select Table"
      >
        <div className="space-y-6 p-4">
          {spaces.map((space) => (
            <div key={space.id}>
              <h2 className="text-xs font-bold uppercase text-zinc-500 mb-3">
                {space.name}
              </h2>
              <div className="grid grid-cols-4 gap-4">
                {tables
                  .filter((t) => t.spaceId === space.id)
                  .map((table) => (
                    <button
                      key={table.id}
                      onClick={() => {
                        const isOccupied = occupiedTable.some(
                          (o) => o.tableId === table.id,
                        );
                        if (isOccupied) {
                          toast.error(
                            "This table has an ongoing order. Please complete it first.",
                          );
                          return;
                        }
                        setActiveTable(table);
                        setShowTableSelector(false);
                      }}
                      disabled={occupiedTable.some(
                        (o) => o.tableId === table.id,
                      )}
                      className={`p-4 rounded-lg border transition-all font-bold text-sm ${
                        occupiedTable.some((o) => o.tableId === table.id)
                          ? "bg-zinc-50 text-zinc-300 border-zinc-100 cursor-not-allowed"
                          : "bg-white text-zinc-900 hover:border-emerald-500"
                      }`}
                    >
                      {table.name}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={showOrderTypeSelector}
        onClose={() => setShowOrderTypeSelector(false)}
        size="md"
        title="Order Type"
      >
        <div className="grid grid-cols-2 gap-4 p-4">
          {[
            { id: "DINE_IN", label: "Dine In", icon: Users },
            { id: "TAKE_AWAY", label: "Take Away", icon: Package },
            { id: "RESERVATION", label: "Reservation", icon: CalendarDays },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => handleNewOrder(t.id as any)}
              className="flex flex-col items-center p-6 bg-zinc-50 border rounded-xl hover:border-emerald-500 transition-all gap-3"
            >
              <t.icon size={24} className="text-zinc-400" />
              <span className="text-[10px] font-black uppercase">
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
