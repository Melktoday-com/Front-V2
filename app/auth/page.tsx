
"use client";

import { authImage1, authImage2, authImage3, authImage4 } from "@/assets/auth";
import { useRequestOtp, useVerifyOtp } from "@/hooks/useAuth";
import { normalizeApiError } from "@/lib/api/error-handler";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Auth() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(59);
  const [error, setError] = useState<string | null>(null);

  const requestOtpMutation = useRequestOtp();
  const verifyOtpMutation = useVerifyOtp();

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
    setError(null);
    const normalizedPhone = normalizePhone(phone);

    try {
      await requestOtpMutation.mutateAsync({ mobileNumber: normalizedPhone });
      setStep("otp");
      setTimer(59);
    } catch (err: any) {
      setError(normalizeApiError(err));
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const normalizedPhone = normalizePhone(phone);

    try {
      await verifyOtpMutation.mutateAsync({
        mobileNumber: normalizedPhone,
        otp: otp,
      });
    } catch (err: any) {
      setError(normalizeApiError(err));
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center p-6 text-right">
      {/* Visual Header - House/Property Images Grid */}
      <div className="grid grid-cols-2 gap-2 mb-12 mt-6 w-full max-w-85">
        <div className="aspect-square bg-primary/10 rounded-xl overflow-hidden flex items-center justify-center text-primary text-4xl shadow-sm relative">
          <Image src={authImage1} alt="Property 1" fill className="object-cover" />
        </div>
        <div className="aspect-square bg-[#252B5C]/5 rounded-xl overflow-hidden flex items-center justify-center text-brand text-4xl shadow-sm relative">
          <Image src={authImage2} alt="Property 2" fill className="object-cover" />
        </div>
        <div className="aspect-square bg-[#252B5C]/5 rounded-xl overflow-hidden flex items-center justify-center text-brand text-4xl shadow-sm relative">
          <Image src={authImage3} alt="Property 3" fill className="object-cover" />
        </div>
        <div className="aspect-square bg-primary/10 rounded-xl overflow-hidden flex items-center justify-center text-primary text-4xl shadow-sm relative">
          <Image src={authImage4} alt="Property 4" fill className="object-cover" />
        </div>
      </div>

      <div className="w-full max-w-85">
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl text-xs font-bold mb-6 text-center">
            {error}
          </div>
        )}

        {step === "phone" ? (
          <div className="transition-all duration-500 transform">
            <h1 className="text-2xl font-bold text-brand mb-3">بزن بریم!</h1>
            <p className="text-text-light mb-10 text-sm leading-relaxed">
              برای شروع ماجراجویی در پیدا کردن ملک، شماره موبایلت رو وارد کن.
            </p>

            <form onSubmit={handleRequestOtp} className="space-y-8">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-brand/60 mr-1">شماره موبایل</label>
                <input
                  type="tel"
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-soft-bg border-2 border-transparent focus:border-primary/20 rounded-2xl p-4 text-brand font-bold placeholder:text-text-light/30 focus:bg-white outline-none transition-all"
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
          <div className="animate-in fade-in duration-700">
            <button
              onClick={() => setStep("phone")}
              className="mb-8 flex items-center gap-2 text-text-light hover:text-brand transition-colors group"
            >
              <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
              <span className="text-sm font-bold">تغییر شماره ({phone})</span>
            </button>

            <h1 className="text-2xl font-bold text-brand mb-3">تایید شماره</h1>
            <p className="text-text-light mb-10 text-sm leading-relaxed">
              کد ۶ رقمی که برات اس‌ام‌اس کردیم رو اینجا بنویس.
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
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-soft-bg border-2 border-transparent focus:border-primary/20 rounded-2xl p-4 text-brand text-center text-2xl tracking-[0.5em] font-black placeholder:text-text-light/30 focus:bg-white outline-none transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={verifyOtpMutation.isPending}
                className="w-full bg-primary text-white py-4 rounded-button font-bold text-lg shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                {verifyOtpMutation.isPending ? "در حال تایید..." : "بزن بریم تو!"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

