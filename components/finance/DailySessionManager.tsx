"use client";

import { useEffect, useState } from "react";
import { 
  Play, 
  Square, 
  History, 
  Calculator, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  User,
  ArrowRight,
  TrendingUp,
  Banknote,
  QrCode,
  Receipt
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { useSettings } from "@/components/providers/SettingsProvider";

export function DailySessionManager() {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [openingBalance, setOpeningBalance] = useState("");
  const [actualClosingBalance, setActualClosingBalance] = useState("");
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [activeRes, allRes] = await Promise.all([
        fetch("/api/finance/daily-session?active=true"),
        fetch("/api/finance/daily-session")
      ]);
      
      const activeData = await activeRes.json();
      const allData = await allRes.json();
      
      if (activeData.success) setActiveSession(activeData.data);
      if (allData.success) setSessions(allData.data);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
      toast.error("Failed to load daily sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenSession = async () => {
    if (!openingBalance) {
      toast.error("Please enter an opening balance");
      return;
    }
    
    setActionLoading(true);
    try {
      const res = await fetch("/api/finance/daily-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openingBalance: parseFloat(openingBalance),
          notes
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Day started successfully");
        setShowOpenModal(false);
        setOpeningBalance("");
        setNotes("");
        fetchData();
      } else {
        toast.error(data.message || "Failed to start day");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!actualClosingBalance) {
      toast.error("Please enter the actual closing balance");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/finance/daily-session/${activeSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualClosingBalance: parseFloat(actualClosingBalance),
          notes
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Day closed successfully");
        setShowCloseModal(false);
        setActualClosingBalance("");
        setNotes("");
        fetchData();
      } else {
        toast.error(data.message || "Failed to close day");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCloseModal = () => {
    setActualClosingBalance(activeSession?.currentExpectedBalance?.toString() || "");
    setShowCloseModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Current Session Status */}
      <div className={`p-6 rounded-2xl border-2 transition-all ${activeSession ? 'bg-zinc-900 border-zinc-800 text-white shadow-xl' : 'bg-white border-zinc-100 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${activeSession ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`} />
              <h2 className={`text-sm font-bold uppercase tracking-widest ${activeSession ? 'text-emerald-400' : 'text-zinc-400'}`}>
                {activeSession ? 'Day in Progress' : 'No Active Session'}
              </h2>
            </div>
            <p className={`text-2xl font-black ${activeSession ? 'text-white' : 'text-zinc-900'}`}>
              {activeSession ? `Session # ${activeSession.id.substring(0, 8)}` : 'System Standby'}
            </p>
            {activeSession && (
              <div className="flex flex-wrap items-center gap-4 mt-3 text-zinc-400 text-xs font-medium">
                <span className="flex items-center gap-1.5"><Clock size={14} /> Started at: {new Date(activeSession.openedAt).toLocaleTimeString()}</span>
                <span className="flex items-center gap-1.5"><User size={14} /> By: {activeSession.openedBy?.name}</span>
                <span className="flex items-center gap-1.5"><Banknote size={14} /> Opening: {settings.currency} {activeSession.openingBalance.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!activeSession ? (
              <Button 
                onClick={() => setShowOpenModal(true)}
                className="bg-zinc-900 text-white hover:bg-zinc-800 h-14 px-8 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-zinc-200"
              >
                <Play size={18} fill="currentColor" /> Start New Day
              </Button>
            ) : (
              <Button 
                onClick={handleOpenCloseModal}
                variant="danger"
                className="h-14 px-8 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg shadow-rose-900/20"
              >
                <Square size={18} fill="currentColor" /> End Day Session
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Session History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-[0.2em] flex items-center gap-2">
            <History size={16} className="text-zinc-400" /> Session History
          </h3>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 px-3 py-1 rounded-full border border-zinc-100">
            {sessions.length} Records Found
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                  SN
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                  Session ID
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                  Date
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                  Opening
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                  Expected
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                  Actual
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                  Difference
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest italic">No session records found.</p>
                  </td>
                </tr>
              ) : (
                sessions.filter(s => s.status === 'CLOSED').map((session, i) => (
                  <tr key={session.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-zinc-900">
                      {i + 1}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        #{session.id.substring(0, 8)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-900">
                          {new Date(session.openedAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {new Date(session.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-zinc-900">
                      {settings.currency} {session.openingBalance.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-zinc-900">
                      {settings.currency} {session.expectedClosingBalance?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-zinc-900">
                      {settings.currency} {session.actualClosingBalance?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-black ${session.difference === 0 ? 'text-emerald-600' : session.difference > 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                        {session.difference > 0 ? '+' : ''}{session.difference?.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black px-2 py-1 rounded-full bg-zinc-100 text-zinc-500 uppercase tracking-widest border border-zinc-200 inline-block">
                        {session.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Start Day Modal */}
      <Modal 
        isOpen={showOpenModal} 
        onClose={() => setShowOpenModal(false)}
        title="Start Day Session"
      >
        <div className="p-6 space-y-6">
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex gap-3">
             <AlertCircle className="text-emerald-600 shrink-0" />
             <div>
               <h4 className="text-sm font-bold text-emerald-900">Opening the Cash Drawer</h4>
               <p className="text-xs text-emerald-700 leading-relaxed mt-1">
                 Please count the cash currently in the drawer and enter it as the opening balance for today.
               </p>
             </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Opening Balance ({settings.currency})</label>
              <Input 
                type="number"
                placeholder="0.00"
                className="h-14 text-xl font-black"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Notes (Optional)</label>
              <textarea 
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm focus:border-zinc-900 outline-none min-h-[100px] transition-all"
                placeholder="Shift changes, initial cash details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="secondary"
              onClick={() => setShowOpenModal(false)}
              className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-[10px]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleOpenSession}
              disabled={actionLoading}
              className="flex-1 h-12 bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl font-bold uppercase tracking-widest text-[10px]"
            >
              {actionLoading ? "Processing..." : "Start Session"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* End Day Modal */}
      <Modal 
        isOpen={showCloseModal} 
        onClose={() => setShowCloseModal(false)}
        title="End Day Session"
      >
        <div className="p-6 space-y-6">
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex gap-3">
             <Calculator className="text-rose-600 shrink-0" />
             <div>
               <h4 className="text-sm font-bold text-rose-900">Closing Reconciliation</h4>
               <p className="text-[10px] text-rose-700 leading-relaxed mt-1">
                 System calculates an expected balance of <span className="font-black underline">{settings.currency} {activeSession?.currentExpectedBalance?.toFixed(2)}</span> based on recorded cash sales.
               </p>
               <div className="mt-2 flex flex-col gap-1 border-t border-rose-100 pt-2">
                 <div className="flex justify-between text-[9px] font-bold text-rose-600 uppercase tracking-widest">
                   <span>Opening Cash</span>
                   <span>{settings.currency} {activeSession?.openingBalance?.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-[9px] font-bold text-rose-600 uppercase tracking-widest">
                   <span>Cash Sales (+)</span>
                   <span>{settings.currency} {activeSession?.currentCashSales?.toFixed(2)}</span>
                 </div>
               </div>
             </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Actual Closing Balance ({settings.currency})</label>
                <button 
                  onClick={() => setActualClosingBalance(activeSession?.currentExpectedBalance?.toString() || "0")}
                  className="text-[9px] font-black text-rose-600 uppercase tracking-widest hover:underline"
                >
                  Use Calculated
                </button>
              </div>
              <Input 
                type="number"
                placeholder="0.00"
                className="h-14 text-xl font-black"
                value={actualClosingBalance}
                onChange={(e) => setActualClosingBalance(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">End of Day Notes</label>
              <textarea 
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm focus:border-zinc-900 outline-none min-h-[100px] transition-all"
                placeholder="Any discrepancies? Notes on digital payments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="secondary"
              onClick={() => setShowCloseModal(false)}
              className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-[10px]"
            >
              Back
            </Button>
            <Button 
              onClick={handleCloseSession}
              disabled={actionLoading}
              variant="danger"
              className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-[10px]"
            >
              {actionLoading ? "Closing..." : "Close Session"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
