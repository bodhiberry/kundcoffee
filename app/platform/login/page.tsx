"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Key, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function PlatformLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("Invalid credentials or unauthorized access.");
        toast.error("Access Denied");
      } else {
        toast.success("Platform Authorized");
        router.push("/dashboard");
      }
    } catch (err) {
      setError("System connection failure");
      toast.error("Internal Error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center relative overflow-hidden selection:bg-slate-200 selection:text-slate-900">
      
      {/* Main Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[440px] px-8 py-12 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 relative z-10 flex flex-col gap-8"
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm">
            <Shield size={26} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              XolaCloud SaaS
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">
              Platform Admin Console
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-red-50 border-l-4 border-red-500 p-4 flex gap-3 items-center text-red-800 rounded-r"
              >
                <AlertCircle size={18} className="shrink-0 text-red-600" />
                <p className="text-xs font-semibold">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                Admin Username
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-medium placeholder:text-slate-400"
                  placeholder="admin@xolacloud.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                Security Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all font-medium placeholder:text-slate-400"
                  placeholder="••••••••"
                  required
                />
                <Key size={14} className="absolute right-4 top-4 text-slate-400" />
              </div>
            </div>
          </div>

          <button
            disabled={isLoading}
            type="submit"
            className="w-full h-13 py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                Authenticate Console
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-[0.2em] mt-4">
          Secured Connection • System Admin Only
        </p>
      </motion.div>
    </div>
  );
}