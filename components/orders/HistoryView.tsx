// components/orders/HistoryView.tsx
"use client";

import { useEffect, useState } from "react";
import { Order } from "@/lib/types";
import { getOrderHistory } from "@/services/order";
import { Search, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

export function HistoryView({ onViewDetails }: { onViewDetails: (o: Order) => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadHistory();
  }, [page, search]);

  const loadHistory = async () => {
    setLoading(true);
    const res = await getOrderHistory(page, 15, search);
    if (res.success) {
      setOrders(res.data);
      setTotalPages(res.pagination.totalPages);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input
            type="text"
            placeholder="Search by ID or Table name..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            onChange={(e) => {
               setSearch(e.target.value);
               setPage(1); // Reset to page 1 on search
            }}
          />
        </div>
      </div>

      <div className="border rounded-xl bg-white overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-zinc-400">Loading History...</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b">
              <tr>
                <th className="p-4 font-bold uppercase tracking-widest text-zinc-400">Date</th>
                <th className="p-4 font-bold uppercase tracking-widest text-zinc-400">Order ID</th>
                <th className="p-4 font-bold uppercase tracking-widest text-zinc-400">Table</th>
                <th className="p-4 font-bold uppercase tracking-widest text-zinc-400">Total</th>
                <th className="p-4 font-bold uppercase tracking-widest text-zinc-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50">
                  <td className="p-4">{format(new Date(order.createdAt), "dd MMM yyyy HH:mm")}</td>
                  <td className="p-4 font-bold">#{order.invoiceNumber ? String(order.invoiceNumber).padStart(3, '0') : order.id.slice(-6).toUpperCase()}</td>
                  <td className="p-4">{order.table?.name || "Takeaway"}</td>
                  <td className="p-4 font-bold">${order.total.toFixed(2)}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => onViewDetails(order)} className="p-2 hover:bg-zinc-200 rounded">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center px-2">
        <p className="text-[10px] uppercase font-bold text-zinc-400">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            className="p-2 border rounded disabled:opacity-30"
          ><ChevronLeft size={16}/></button>
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
            className="p-2 border rounded disabled:opacity-30"
          ><ChevronRight size={16}/></button>
        </div>
      </div>
    </div>
  );
}