"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { useRouter } from "next/navigation";
import { registerAction } from "@/app/actions/auth";
import Link from "next/link";
import { toast } from "sonner";
import AuthNavbar from "@/components/auth/AuthNavbar";
import AuthFooter from "@/components/auth/AuthFooter";

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
    <div className="flex min-h-screen flex-col bg-white">
      <AuthNavbar />

      {/* Centered form area */}
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[420px]"
        >
          <div className="mb-10 text-center">
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
      </main>

      <AuthFooter />
    </div>
  );
}