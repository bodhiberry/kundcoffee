"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coffee,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Mail,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { useRouter } from "next/navigation";
import { registerAction } from "@/app/actions/auth";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await registerAction(data);
      if (result.success) {
        toast.success("Account created successfully!");
        router.push("/verify-email?email=" + encodeURIComponent(data.email));
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col md:flex-row overflow-hidden selection:bg-zinc-100">
      
      {/* --- LEFT SIDE: THE BRAND EXPERIENCE (Identical to Login) --- */}
      <div className="hidden md:flex md:w-[45%] lg:w-[50%] bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/login-hero.png" 
            alt="Professional Coffee Experience"
            fill
            className="object-cover opacity-40 grayscale-[0.2]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-950/70 to-transparent" />
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

              <span className="text-[10px] font-semibold text-red-600 tracking-[0.2em] uppercase">Coffee Group</span>
            </div>
          </motion.div>

          {/* Value Prop tailored for Signup */}
          <div className="max-w-md">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <h3 className="text-4xl lg:text-5xl font-semibold text-white leading-tight tracking-tight">
                Empowering the <br /> 
                <span className="text-zinc-400">future of service.</span>
              </h3>
              <p className="text-zinc-400 text-lg leading-relaxed font-light">
                Join the network of elite cafe operators. Access the management 
                tools required for modern high-performance hospitality.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-12 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <CheckCircle2 size={18} className="text-red-700" />
                <span>Unified enterprise dashboard access</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <CheckCircle2 size={18} className="text-red-700" />
                <span>Secure multi-store infrastructure</span>
              </div>
            </motion.div>
          </div>

          <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-widest">
            © 2026 XolaCloud Group • Built for Excellence

          </p>
        </div>
      </div>

      {/* --- RIGHT SIDE: ACCOUNT CREATION (Identical to Login) --- */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 bg-white overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile-only Logo */}
          <div className="md:hidden flex items-center gap-3 mb-10">
            <Coffee size={24} className="text-red-700" />
            <h1 className="text-lg font-bold tracking-tighter uppercase">XolaCloud</h1>

          </div>

          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-semibold text-zinc-900 tracking-tight mb-2">
              Create Account
            </h2>
            <p className="text-zinc-500 text-sm">
              Register your workspace within the XolaCloud network.

            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border-l-2 border-red-700 p-4 flex gap-3 items-center text-red-900"
                >
                  <AlertCircle size={18} className="shrink-0" />
                  <p className="text-xs font-semibold">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 ml-1">
                  Corporate Email
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className={`w-full h-12 px-4 bg-white border ${
                    errors.email ? "border-red-700 shadow-sm shadow-red-50" : "border-zinc-200"
                  } rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 placeholder:text-zinc-300`}
                  placeholder="name@company.com"
                />
                {errors.email && (
                  <p className="text-[11px] text-red-800 font-medium mt-1 ml-1">{errors.email.message}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 ml-1">
                  Create Password
                </label>
                <input
                  {...register("password")}
                  type="password"
                  className={`w-full h-12 px-4 bg-white border ${
                    errors.password ? "border-red-700 shadow-sm shadow-red-50" : "border-zinc-200"
                  } rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 placeholder:text-zinc-300`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="text-[11px] text-red-800 font-medium mt-1 ml-1">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 ml-1">
                  Confirm Password
                </label>
                <input
                  {...register("confirmPassword")}
                  type="password"
                  className={`w-full h-12 px-4 bg-white border ${
                    errors.confirmPassword ? "border-red-700 shadow-sm shadow-red-50" : "border-zinc-200"
                  } rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 placeholder:text-zinc-300`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="text-[11px] text-red-800 font-medium mt-1 ml-1">{errors.confirmPassword.message}</p>
                )}
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
                  Register Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-zinc-100 flex flex-col items-center gap-6">
            <p className="text-zinc-500 text-sm">
              Existing member?{" "}
              <Link
                href="/login"
                className="text-zinc-900 font-semibold hover:underline decoration-red-800 underline-offset-4"
              >
                Sign in to workspace
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}