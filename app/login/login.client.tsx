"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coffee,
  User,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        if (result.error === "USER_NOT_VERIFIED") {
          toast.error("Please verify your email before logging in.");
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
        } else {
          setError("Invalid email or password");
        }
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col md:flex-row overflow-hidden selection:bg-zinc-100">
      {/* --- LEFT SIDE: THE BRAND EXPERIENCE --- */}
      <div className="hidden md:flex md:w-[45%] lg:w-[50%] bg-zinc-950 relative overflow-hidden">
        {/* Subtle high-end image with heavy vignette */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/login-hero.png"
            alt="Professional Coffee Environment"
            fill
            className="object-cover opacity-40 grayscale-[0.2]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-950/60 to-transparent" />
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
              <span className="text-xl font-bold text-white tracking-tight leading-none uppercase">
                Bodhi
              </span>
              <span className="text-[10px] font-semibold text-red-600 tracking-[0.2em] uppercase">
                berry
              </span>

            </div>
          </motion.div>

          {/* Value Prop */}
          <div className="max-w-md">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <h3 className="text-4xl lg:text-5xl font-semibold text-white leading-tight tracking-tight">
                Take Full Control of Your Café  <br />
                <span className="text-zinc-400">with Confidence</span>
              </h3>
              <p className="text-zinc-400 text-lg leading-relaxed font-light">
                Secure access to your café dashboard. Manage order, 
                staff, ingredients, and daily operations with precision.
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
                <span>Secure, bank-grade POS</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <CheckCircle2 size={18} className="text-red-700" />
                <span>Real-time order sync</span>
              </div>
            </motion.div>
          </div>

          <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-widest">
            © © 2026 BodhiBerry • Café POS System
          </p>
        </div>
      </div>

      {/* --- RIGHT SIDE: CLEAN AUTHENTICATION --- */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 bg-[#ffffff]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile-only Logo */}
          

          <div className="mb-10">
            <h2 className="text-3xl font-semibold text-zinc-900 tracking-tight mb-2">
              Welcome back
            </h2>
            <p className="text-zinc-500 text-sm">
              Please enter your details to sign in.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  Work Email
                </label>
                <div className="relative">
                  <input
                    {...register("email")}
                    type="email"
                    className={`w-full h-12 px-4 bg-white border ${
                      errors.email
                        ? "border-red-600 shadow-sm shadow-red-50"
                        : "border-zinc-200"
                    } rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 placeholder:text-zinc-400`}
                    placeholder="info@bodhiberry.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] text-red-700 font-medium mt-1 ml-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-semibold text-zinc-700">
                    Password
                  </label>
                  <Link
                    href="#"
                    className="text-[11px] font-semibold text-red-800 hover:text-red-600 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    {...register("password")}
                    type="password"
                    className={`w-full h-12 px-4 bg-white border ${
                      errors.password
                        ? "border-red-600 shadow-sm shadow-red-50"
                        : "border-zinc-200"
                    } rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 placeholder:text-zinc-400`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="text-[11px] text-red-700 font-medium mt-1 ml-1">
                    {errors.password.message}
                  </p>
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
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-zinc-100 flex flex-col items-center gap-6">
            <p className="text-zinc-500 text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-zinc-900 font-semibold hover:underline decoration-red-700 underline-offset-4"
              >
                Create access request
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
