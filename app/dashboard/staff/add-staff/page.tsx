"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  UserPlus, 
  Phone, 
  Mail, 
  Briefcase, 
  User, 
  CheckCircle2,
  Loader2,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function AddStaffPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    role: "Waiter",
    phone: "",
    email: "",
    joinDate: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Staff name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success("Staff member registered successfully", {
          icon: <CheckCircle2 className="text-emerald-500" size={18} />,
        });
        router.push("/dashboard/staff"); // Redirect to list
        router.refresh();
      } else {
        toast.error(data.message || "Failed to add staff");
      }
    } catch (error) {
      console.error(error);
      toast.error("A system error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">
              Staff Registry
            </h1>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">
              Onboard new team members to the system
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Info Column */}
        <div className="space-y-6">
          <div className="p-6 bg-zinc-900 rounded-3xl text-white space-y-4 shadow-xl">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <UserPlus size={24} className="text-white" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest">Role Permissions</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Assigning a role determines which parts of the ERP the staff member can access. 
              <br/><br/>
              <span className="text-emerald-400 font-bold">Managers</span> have full console access, while <span className="text-zinc-200">Waiters</span> are restricted to the Order Console.
            </p>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={12} /> Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all placeholder:text-zinc-300"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Role Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Briefcase size={12} /> Assignment / Role
                </label>
                <select
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="Waiter">Waiter / Service</option>
                  <option value="Chef">Kitchen / Chef</option>
                  <option value="Manager">Operations Manager</option>
                  <option value="Cashier">Cashier / Front Desk</option>
                  <option value="Barista">Barista / Bar</option>
                </select>
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Phone size={12} /> Primary Phone
                </label>
                <input
                  type="tel"
                  placeholder="+977 98XXXXXXXX"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all placeholder:text-zinc-300"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Mail size={12} /> Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@xolacloud.com"

                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all placeholder:text-zinc-300"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              {/* Join Date Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} /> Join Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none transition-all placeholder:text-zinc-300"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100 flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                className="h-12 px-8 text-[11px] font-bold uppercase tracking-widest border-zinc-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 px-10 bg-zinc-900 text-white hover:bg-zinc-800 text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg shadow-zinc-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "Finalize Registration"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}