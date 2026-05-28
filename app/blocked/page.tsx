"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldAlert, LogOut, RefreshCcw, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function BlockedPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  const handleRecheckStatus = async () => {
    setChecking(true);
    try {
      // NextAuth update() triggers the JWT callback to re-fetch user & store status from the DB
      const newSession = await update();
      
      const isSuspended = newSession?.user?.storeSuspended;
      const status = newSession?.user?.storeStatus;
      const isActive = !isSuspended && status !== "SUSPENDED" && status !== "EXPIRED";

      if (isActive) {
        toast.success("Access Restored! Redirecting...");
        router.push("/dashboard");
        router.refresh();
      } else {
        toast.error("Store status is still inactive. Please contact support.");
      }
    } catch (err) {
      toast.error("Failed to update status. Please reload.");
    } finally {
      setChecking(false);
    }
  };

  const isSuspended = session?.user?.storeSuspended || session?.user?.storeStatus === "SUSPENDED";
  const isExpired = session?.user?.storeStatus === "EXPIRED";

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6 selection:bg-slate-200">
      <div className="w-full max-w-[480px] bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50 flex flex-col gap-6 text-center">
        {/* Warning Icon */}
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-red-50 text-red-500 border border-red-200 rounded-2xl flex items-center justify-center shadow-sm">
            <ShieldAlert size={28} />
          </div>
        </div>

        {/* Title and Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            {isSuspended ? "Store Access Suspended" : isExpired ? "Subscription Expired" : "Store Access Restricted"}
          </h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
            {session?.user?.storeId ? `Store ID: ${session.user.storeId}` : "Bodhiberry POS"}
          </p>
        </div>

        {/* Dynamic Detail Text */}
        <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 p-5 rounded-2xl">
          {isSuspended ? (
            "Access to your store's console has been suspended by the platform administration due to billing issues, policy violations, or system updates. Please get in touch with your administrator."
          ) : isExpired ? (
            "Your store's subscription or trialing access period has concluded. To restore access and continue managing orders, inventory, and analytics, please renew your subscription."
          ) : (
            "Your store's access has been restricted. If you believe this is an error, please try re-checking your activation status below."
          )}
        </div>

        {/* Contact Info */}
        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
          Support Contact:{" "}
          <a href="mailto:support@bodhiberry.com" className="text-slate-700 hover:underline">
            support@bodhiberry.com
          </a>
        </div>

        {/* Actions Button */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex-1 h-12 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold uppercase tracking-wider text-[10px] rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={14} /> Log Out
          </button>
          
          <button
            disabled={checking}
            onClick={handleRecheckStatus}
            className="flex-1 h-12 bg-slate-900 hover:bg-black text-white font-bold uppercase tracking-wider text-[10px] rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {checking ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <>
                <RefreshCcw size={14} /> Re-check Status
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
