"use client";

import { useEffect, useState } from "react";
import { Loader2, Package, Calendar, User, CreditCard, Hash, Info, FileText } from "lucide-react";
import { useSettings } from "@/components/providers/SettingsProvider";

interface PurchaseDetailViewProps {
  id: string;
}

export default function PurchaseDetailView({ id }: PurchaseDetailViewProps) {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState<any>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/purchases/${id}`);
        const data = await res.json();
        if (data.success) {
          setPurchase(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch purchase details", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-4">
        <Loader2 className="animate-spin text-zinc-900" size={32} />
        <p className="text-sm text-zinc-500 font-medium animate-pulse">Loading details...</p>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
          <Info className="text-zinc-400" size={24} />
        </div>
        <p className="text-sm text-zinc-500 font-medium">Purchase not found or failed to load.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Summary Card */}
      <div className="bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
              Payment Status
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border inline-block ${
                purchase.paymentStatus === "PAID"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-amber-50 text-amber-600 border-amber-100"
              }`}
            >
              {purchase.paymentStatus}
            </span>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
              Payment Mode
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 uppercase tracking-widest inline-block">
              {purchase.paymentMode || "N/A"}
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block flex items-center gap-1">
              <Hash size={10} /> Reference
            </span>
            <p className="text-xs font-bold text-zinc-900">
              {purchase.referenceNumber}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block flex items-center gap-1 justify-end">
              <Calendar size={10} /> Date
            </span>
            <p className="text-xs font-bold text-zinc-900">
              {new Date(purchase.txnDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Supplier & Basic Info */}
      <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg border border-zinc-200 flex items-center justify-center shadow-sm">
            <User size={14} className="text-zinc-400" />
          </div>
          <div className="flex-1">
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Supplier</span>
            <p className="text-xs font-bold text-zinc-900">{purchase.supplier?.fullName}</p>
          </div>
        </div>
        
        {purchase.remark && (
          <div className="flex items-start gap-3 border-t border-zinc-200/50 pt-3">
            <div className="w-8 h-8 bg-white rounded-lg border border-zinc-200 flex items-center justify-center shadow-sm">
              <FileText size={14} className="text-zinc-400" />
            </div>
            <div className="flex-1">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Remark</span>
              <p className="text-[11px] text-zinc-600 leading-relaxed italic">
                "{purchase.remark}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Items Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <Package size={12} /> Items List
          </h3>
          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
            {purchase.items?.length || 0} Items
          </span>
        </div>

        <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-4 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest">Item</th>
                <th className="px-4 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-center">Qty</th>
                <th className="px-4 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {purchase.items?.map((item: any, idx: number) => (
                <tr key={idx} className="group hover:bg-zinc-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-xs font-bold text-zinc-900 group-hover:text-black transition-colors">{item.itemName}</p>
                    <p className="text-[9px] text-zinc-400 font-medium">Rate: {settings.currency} {item.rate.toFixed(2)}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-black text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md">
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-black text-zinc-900">
                      {settings.currency} {item.amount.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Totals */}
      <div className="bg-zinc-900 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors" />
        
        <div className="space-y-3 relative z-10">
          <div className="flex justify-between items-center text-zinc-400">
            <span className="text-[10px] font-bold uppercase tracking-widest">Subtotal</span>
            <span className="text-xs font-bold">{settings.currency} {purchase.taxableAmount.toFixed(2)}</span>
          </div>
          
          {purchase.discount > 0 && (
            <div className="flex justify-between items-center text-emerald-400">
              <span className="text-[10px] font-bold uppercase tracking-widest">Discount (-)</span>
              <span className="text-xs font-bold">{settings.currency} {purchase.discount.toFixed(2)}</span>
            </div>
          )}

          {Math.abs(purchase.roundOff) > 0 && (
            <div className="flex justify-between items-center text-zinc-500">
              <span className="text-[10px] font-bold uppercase tracking-widest">Round Off</span>
              <span className="text-xs font-bold">{settings.currency} {purchase.roundOff.toFixed(2)}</span>
            </div>
          )}

          <div className="pt-3 border-t border-white/10 flex justify-between items-end">
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">Grand Total</p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-white">{settings.currency}</span>
                <span className="text-2xl font-black text-white tracking-tighter">
                  {purchase.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            
            <div className="bg-white/5 p-2 rounded-lg border border-white/10">
              <CreditCard size={16} className="text-zinc-500" />
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
