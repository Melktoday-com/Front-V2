
"use client";

import { useAuth, useRequestOtp, useVerifyOtp } from "@/hooks/useAuth";
import { normalizeApiError } from "@/lib/api/error-handler";
import { toEnglishDigits, toOnlyDigits } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || searchParams.get("returnUrl") || "/";

  const { isLoggedIn, isLoading } = useAuth();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(59);

  const requestOtpMutation = useRequestOtp();
  const verifyOtpMutation = useVerifyOtp(redirectTarget);

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace(redirectTarget || "/");
    }
  }, [isLoggedIn, isLoading, redirectTarget, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const normalizePhone = (num: string) => {
    let normalized = num.replace(/\D/g, "");
    if (normalized.startsWith("0")) {
      normalized = normalized.substring(1);
    }
    if (!normalized.startsWith("98")) {
      normalized = "98" + normalized;
    }
    return "+" + normalized;
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = normalizePhone(phone);

    try {
      await requestOtpMutation.mutateAsync({ mobileNumber: normalizedPhone });
      setStep("otp");
      setTimer(59);
    } catch (err) {
      toast.error(normalizeApiError(err as Error));
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = normalizePhone(phone);

    try {
      await verifyOtpMutation.mutateAsync({
        mobileNumber: normalizedPhone,
        otp: otp,
      });
    } catch (err) {
      toast.error(normalizeApiError(err as Error));
    }
  };

  if (isLoading || isLoggedIn) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center font-bold text-brand">
        در حال انتقال...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center p-4 sm:p-6 text-right">
      {/* Top Header with Clean Back Button */}
      <div className="w-full max-w-sm flex items-center justify-between mt-2 mb-2">
        <button
          type="button"
          onClick={() => {
            if (step === "otp") {
              setStep("phone");
            } else if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          className="p-2 -mr-2 text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
          title="بازگشت"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Brand Header */}
      <div className="flex flex-col items-center justify-center my-6 sm:my-8 text-center">
        <Link href="/" className="inline-block mb-3 transition-transform hover:scale-105 active:scale-95">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-surface border border-soft-border/80 shadow-sm flex items-center justify-center p-3 relative overflow-hidden">
            <Image
              src="/apple-touch-icon.png"
              alt="ملک تودی"
              width={72}
              height={72}
              className="object-contain rounded-2xl"
              priority
            />
          </div>
        </Link>
        <span className="text-xl sm:text-2xl font-black text-brand tracking-tight mb-1">
          ملک <span className="text-brand-teal">تودی</span>
        </span>
        <p className="text-xs sm:text-sm text-secondary font-medium">
          سامانه هوشمند املاک و اقامتگاه‌ها
        </p>
      </div>

      <div className="w-full max-w-sm pb-10">
        {step === "phone" ? (
          <div className="transition-all duration-500 transform">
            <h2 className="text-lg sm:text-xl font-black text-brand mb-1.5 text-center sm:text-right">ورود یا ثبت‌نام</h2>
            <p className="text-text-light mb-8 text-xs sm:text-sm leading-relaxed text-center sm:text-right">
              برای ورود به حساب کاربری، شماره موبایل خود را وارد کنید.
            </p>

            <form onSubmit={handleRequestOtp} className="space-y-8">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-brand/60 mr-1">شماره موبایل</label>
                <input
                  type="tel"
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(toEnglishDigits(e.target.value))}
                  className="w-full bg-soft-bg border-2 border-transparent focus:border-primary/20 rounded-2xl p-4 text-brand font-bold placeholder:text-text-light/30 focus:bg-surface outline-none transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={requestOtpMutation.isPending}
                className="w-full bg-brand text-white py-4 rounded-button font-bold text-lg shadow-xl shadow-brand/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                {requestOtpMutation.isPending ? "در حال ارسال..." : "دریافت کد ورود"}
              </button>
            </form>

            <div className="mt-12 flex flex-col items-center gap-6">
              <div className="flex items-center gap-3 w-full text-text-light/20">
                <div className="h-px flex-1 bg-current" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-black">Melktoday</span>
                <div className="h-px flex-1 bg-current" />
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-700 pb-15">
            <button
              onClick={() => setStep("phone")}
              className="mb-6 flex items-center gap-1.5 text-secondary hover:text-brand transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="text-xs font-bold">تغییر شماره ({phone})</span>
            </button>

            <h2 className="text-lg sm:text-xl font-black text-brand mb-1.5 text-center sm:text-right">تایید شماره موبایل</h2>
            <p className="text-text-light mb-8 text-xs sm:text-sm leading-relaxed text-center sm:text-right">
              کد تایید ۶ رقمی ارسال‌شده به شماره همراه خود را وارد کنید.
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-8">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-xs font-bold text-brand/60">کد تایید</label>
                  {timer > 0 ? (
                    <span className="text-[10px] font-bold text-text-light/50">{timer} ثانیه تا ارسال مجدد</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      disabled={requestOtpMutation.isPending}
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      ارسال دوباره
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="· · · · · ·"
                  dir="ltr"
                  value={otp}
                  onChange={(e) => setOtp(toOnlyDigits(e.target.value))}
                  className="w-full bg-soft-bg border-2 border-transparent focus:border-primary/20 rounded-2xl p-4 text-brand text-center text-2xl tracking-[0.5em] font-black placeholder:text-text-light/30 focus:bg-surface outline-none transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={verifyOtpMutation.isPending}
                className="w-full bg-primary text-white py-4 rounded-button font-bold text-lg shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                {verifyOtpMutation.isPending ? "در حال تایید..." : "تایید و ورود"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

export default function Auth() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center font-bold text-brand">در حال بارگذاری...</div>}>
      <AuthContent />
    </Suspense>
  );
}

