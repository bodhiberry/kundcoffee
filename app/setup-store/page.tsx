"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { 
  Loader2, 
  Store, 
  LayoutDashboard, 
  Coffee, 
  CheckCircle2, 
  AlertCircle,
  Globe
} from "lucide-react";
import { storeSetupSchema, type StoreSetupInput } from "@/lib/validations/auth";
import { useRouter } from "next/navigation";
import { setupStoreAction } from "@/app/actions/auth";
import { toast } from "sonner";
import Image from "next/image";

export default function SetupStorePage() {
  const { data: session, status, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<StoreSetupInput>({
    resolver: zodResolver(storeSetupSchema),
    defaultValues: {
      name: "",
      location: "",
      currency: "NPR",
    },
  });

  // Redirect if already setup
  useEffect(() => {
    if (status === "authenticated" && session?.user?.isSetupComplete) {
      router.push("/");
    }
  }, [status, session, router]);

  const onSubmit = async (data: StoreSetupInput) => {
    const email = session?.user?.email;
    if (!email) {
      toast.error("Session invalid. Please login again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await setupStoreAction(email, data);
      if (result.success) {
        toast.success("Store setup complete!");
        
        await update({
          ...session,
          user: { ...session?.user, isSetupComplete: true }
        });

        router.push("/");
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-zinc-900" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col md:flex-row overflow-hidden selection:bg-zinc-100">
      
      {/* --- LEFT SIDE: THE BRAND EXPERIENCE (Consistent with Auth) --- */}
      <div className="hidden md:flex md:w-[45%] lg:w-[50%] bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/login-hero.png" 
            alt="Business Setup"
            fill
            className="object-cover opacity-30 grayscale-[0.5]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-950/80 to-transparent" />
        </div>

        <div className="relative z-10 w-full flex flex-col justify-between p-12 lg:p-20">
          {/* Logo Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-white flex items-center justify-center rounded-lg shadow-xl">
              <Coffee size={22} className="text-zinc-900" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white tracking-tight leading-none uppercase">XolaCloud</span>

              <span className="text-[10px] font-semibold text-red-800 tracking-[0.2em] uppercase">Coffee Group</span>
            </div>
          </motion.div>

          {/* Setup Value Prop */}
          <div className="max-w-md">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <h3 className="text-4xl lg:text-5xl font-semibold text-white leading-tight tracking-tight">
                Establish your <br /> 
                <span className="text-zinc-400">digital storefront.</span>
              </h3>
              <p className="text-zinc-400 text-lg leading-relaxed font-light">
                Configure your business identity and regional settings to 
                initialize your enterprise dashboard.
              </p>
            </motion.div>

            <div className="mt-12 space-y-4">
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="w-5 h-5 rounded-full bg-red-800/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-red-700">01</span>
                </div>
                <span>Account Verified</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white font-semibold">
                <div className="w-5 h-5 rounded-full bg-red-800 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">02</span>
                </div>
                <span>Business Identity</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-widest">
            Configuration Module • Session: {session?.user?.email?.split('@')[0]}
          </p>
        </div>
      </div>

      {/* --- RIGHT SIDE: SETUP FORM --- */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 bg-white overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile Header */}
          <div className="md:hidden flex items-center gap-3 mb-10">
            <Store size={24} className="text-red-800" />
            <h1 className="text-lg font-bold tracking-tighter uppercase">Store Setup</h1>
          </div>

          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-semibold text-zinc-900 tracking-tight mb-2">
              Business Details
            </h2>
            <p className="text-zinc-500 text-sm">
              Define the core attributes of your coffee establishment.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-red-50 border-l-2 border-red-800 p-4 flex gap-3 items-center text-red-900"
                >
                  <AlertCircle size={18} className="shrink-0" />
                  <p className="text-xs font-semibold">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {/* Store Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 ml-1">Store Name</label>
                <input
                  {...register("name")}
                  className={`w-full h-12 px-4 bg-white border ${
                    errors.name ? "border-red-700 shadow-sm shadow-red-50" : "border-zinc-200"
                  } rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 placeholder:text-zinc-300`}
                  placeholder="Resturant Name"
                />
                {errors.name && (
                  <p className="text-[11px] text-red-800 font-medium mt-1 ml-1">{errors.name.message}</p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 ml-1">Location</label>
                <input
                  {...register("location")}
                  className={`w-full h-12 px-4 bg-white border ${
                    errors.location ? "border-red-700 shadow-sm shadow-red-50" : "border-zinc-200"
                  } rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 placeholder:text-zinc-300`}
                  placeholder="Address"
                />
                {errors.location && (
                  <p className="text-[11px] text-red-800 font-medium mt-1 ml-1">{errors.location.message}</p>
                )}
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 ml-1">Reporting Currency</label>
                <div className="relative">
                  <select
                    {...register("currency")}
                    className="w-full h-12 px-4 bg-white border border-zinc-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 appearance-none"
                  >
                    <option value="NPR">NPR (Nepalese Rupee)</option>
                    <option value="USD">USD (United States Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                    <Globe size={14} />
                  </div>
                </div>
              </div>
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="w-full h-12 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-zinc-200"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Initialize Dashboard
                  <LayoutDashboard size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer Branding / Progress */}
          <div className="mt-12 pt-8 border-t border-zinc-100 flex flex-col items-center gap-6">
            <div className="flex items-center gap-4 text-zinc-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-red-800" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Global Standards</span>
              </div>
              <div className="w-1 h-1 bg-zinc-200 rounded-full" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest">Multi-Currency ready</span>
              </div>
            </div>
            
            <p className="text-[11px] text-zinc-400 font-medium italic text-center">
              Initialization will finalize your account permissions.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}