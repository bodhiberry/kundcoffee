"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import AuthNavbar from "@/components/auth/AuthNavbar";
import AuthFooter from "@/components/auth/AuthFooter";

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
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black uppercase tracking-widest text-zinc-900">
              Sign In
            </h2>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
              Enter your credentials to access terminal
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
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
                    placeholder="info@xolacloud.com"
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
      </main>

      <AuthFooter />
    </div>
  );
}
