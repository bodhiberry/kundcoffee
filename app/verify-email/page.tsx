"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ArrowRight,
  ShieldCheck,
  Mail,
  AlertCircle,
  Coffee,
  RefreshCcw,
} from "lucide-react";
import { verifyCodeSchema, type VerifyCodeInput } from "@/lib/validations/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEmailAction, resendCodeAction } from "@/app/actions/auth";
import { toast } from "sonner";
import { useSession, signOut } from "next-auth/react";

function VerifyEmailContent() {
  const { update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyCodeInput>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: {
      email: email || "",
      code: "",
    },
  });

  const onSubmit = async (data: VerifyCodeInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await verifyEmailAction(data.email, data.code);

      if (result.success) {
        toast.success(result.message);
        await update();
        router.refresh();
        setTimeout(() => {
          router.push("/dashboard");
        }, 150);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const onResend = async () => {
    if (!email) return setError("No email address found to resend code.");

    toast.promise(resendCodeAction(email), {
      loading: "Sending new code...",
      success: (data) => {
        if (!data.success) throw new Error(data.message);
        return data.message;
      },
      error: (err: any) => err.message || "Failed to resend code",
    });
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-red-50 text-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 mb-2">Invalid Session</h1>
          <p className="text-zinc-500 text-sm mb-6">No email address was provided for verification.</p>
          <button 
             onClick={() => router.push('/login')}
             className="text-sm font-semibold text-zinc-900 underline underline-offset-4"
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] flex flex-col items-center justify-center p-6 selection:bg-zinc-100">
      
      {/* --- LOGO HEADER --- */}
      <div className="mb-10 flex flex-col items-center gap-2">
        <div className="w-10 h-10 bg-zinc-950 flex items-center justify-center rounded-lg shadow-xl">
          <Coffee size={22} className="text-white" />
        </div>
        <div className="flex flex-col items-center text-center">
          <span className="text-sm font-bold text-zinc-900 tracking-tight leading-none uppercase">XolaCloud</span>

          <span className="text-[8px] font-semibold text-red-800 tracking-[0.2em] uppercase">Coffee Group</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] bg-white border border-zinc-200 rounded-2xl p-8 lg:p-12 shadow-sm"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight mb-2">
            Verify your identity
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            We’ve sent a secure 6-digit code to <br />
            <span className="text-zinc-900 font-semibold">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border-l-2 border-red-800 p-4 flex gap-3 items-center text-red-900"
              >
                <AlertCircle size={18} className="shrink-0" />
                <p className="text-xs font-semibold">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <input type="hidden" {...register("email")} />

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-700 ml-1">Verification Code</label>
            <input
              {...register("code")}
              type="text"
              maxLength={6}
              className={`w-full h-14 bg-white border ${
                errors.code ? "border-red-700 shadow-sm shadow-red-50" : "border-zinc-200"
              } rounded-lg text-2xl font-semibold text-center text-zinc-900 tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-950 transition-all placeholder:text-zinc-200 placeholder:tracking-normal`}
              placeholder="000000"
            />
            {errors.code && (
              <p className="text-[11px] text-red-800 font-medium mt-1 text-center">
                {errors.code.message}
              </p>
            )}
          </div>

          <div className="pt-2 space-y-4">
            <button
              disabled={isLoading}
              type="submit"
              className="w-full h-12 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-zinc-200"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Verify Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onResend}
              className="w-full flex items-center justify-center gap-2 text-[11px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-widest"
            >
              <RefreshCcw size={12} />
              Resend code
            </button>
          </div>
        </form>

        <div className="mt-10 pt-8 border-t border-zinc-100 flex flex-col items-center gap-4">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              End-to-End Secure
            </span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-[11px] font-bold text-zinc-400 hover:text-red-800 transition-colors uppercase tracking-tight"
          >
            Wrong email? <span className="underline underline-offset-4">Sign out</span>
          </button>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <footer className="mt-12 text-[10px] text-zinc-400 font-medium uppercase tracking-[0.2em]">
        Proprietary Security Module • XolaCloud Group

      </footer>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="animate-spin text-zinc-900" size={32} />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}