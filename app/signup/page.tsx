"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { useRouter } from "next/navigation";
import { registerAction } from "@/app/actions/auth";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";

// Hardcoded to match your bg-plum value exactly (rgb(74 36 71)),
// bypassing the theme config since bg-plum wasn't rendering in this file.
const PLUM = "#4A2447";
const PLUM_DARK = "#371A34";

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <div className="flex min-h-screen w-full bg-white">
      {/* --- LEFT: form --- */}
      <div className="flex w-full flex-col px-8 py-6 sm:px-16 sm:py-8 md:w-[55%] lg:w-[50%]">
        {/* Top bar: logo + sign-in pill button, like the reference */}
        <div className="flex items-center justify-between">
          <span className="font-display text-2xl font-bold tracking-tight text-ink">
            Xola<span style={{ color: PLUM }}>Cloud</span>
          </span>
          <div className="hidden items-center gap-3 sm:flex">
            <span className="text-sm text-ink/60">Already have an account?</span>
            <Link
              href="/login"
              className="rounded-full border px-4 py-1.5 text-sm font-semibold transition hover:bg-black/[0.03]"
              style={{ borderColor: PLUM, color: PLUM }}
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Form */}
        <div className="mt-10 flex-1">
          <div className="mx-auto w-full max-w-sm">
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-ink/60">
              Register your business and start running every branch from one login.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-700"
                  >
                    <AlertCircle size={18} className="shrink-0" />
                    <p className="text-xs font-semibold">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">
                  Email <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
                  />
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="Enter your email"
                    className="w-full rounded-lg border border-transparent bg-zinc-100 py-3.5 pl-11 pr-4 text-sm text-ink placeholder:text-ink/40 outline-none transition focus:bg-white focus:ring-2"
                    style={{ ["--tw-ring-color" as any]: `${PLUM}33` }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = PLUM)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "transparent")}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">
                  Password <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
                  />
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-transparent bg-zinc-100 py-3.5 pl-11 pr-11 text-sm text-ink placeholder:text-ink/40 outline-none transition focus:bg-white focus:ring-2"
                    style={{ ["--tw-ring-color" as any]: `${PLUM}33` }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = PLUM)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "transparent")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-ink">
                  Confirm password <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
                  />
                  <input
                    {...register("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-transparent bg-zinc-100 py-3.5 pl-11 pr-11 text-sm text-ink placeholder:text-ink/40 outline-none transition focus:bg-white focus:ring-2"
                    style={{ ["--tw-ring-color" as any]: `${PLUM}33` }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = PLUM)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "transparent")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <label className="flex items-start gap-2.5 text-xs leading-relaxed text-ink/60">
                <input type="checkbox" required className="mt-0.5 h-4 w-4 shrink-0 rounded border-line" />
                <span>
                  I accept the{" "}
                  <Link href="/terms" className="font-medium hover:underline" style={{ color: PLUM }}>
                    terms &amp; conditions
                  </Link>
                </span>
              </label>

              <p className="text-xs leading-relaxed text-ink/50">
                This site is protected by reCAPTCHA and the Google{" "}
                <Link href="/privacy" className="hover:underline" style={{ color: PLUM }}>
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link href="/terms" className="hover:underline" style={{ color: PLUM }}>
                  Terms of Service
                </Link>{" "}
                apply.
              </p>

              <button
                disabled={isLoading}
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: PLUM }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = PLUM_DARK)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = PLUM)}
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Sign up"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink/60 sm:hidden">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold hover:underline" style={{ color: PLUM }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* --- RIGHT: solid plum panel with the real product screenshot bleeding off the edge --- */}
      <div
        className="relative hidden overflow-hidden md:block md:w-[45%] lg:w-[50%]"
        style={{ backgroundColor: PLUM }}
      >
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-black/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="absolute ml-10 inset-0 flex w-[150%] items-center right-[-35%]">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-h-[92%] w-full overflow-hidden rounded-xl border border-white/10 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <div>
                <p className="font-display text-sm font-semibold text-ink">Outside Table-01</p>
                <p className="text-xs text-ink/40">Menu &amp; active order</p>
              </div>
            </div>
            <div className="max-h-[calc(92vh-64px)] overflow-hidden m">
              <Image
                src="/screenshots/order-menu.png"
                alt="Xola order screen showing the coffee menu and active order panel"
                width={1660}
                height={903}
                className="h-auto w-full"
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}