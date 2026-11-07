"use client";

import React, { useState } from "react";
import { Calculator, RotateCcw, Info } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface RentalMortgageCalculatorProps {
    depositPrice: number;
    monthlyRent: number;
}

export function RentalMortgageCalculator({ depositPrice, monthlyRent }: RentalMortgageCalculatorProps) {
    // Standard Iranian market conversion rate: 30,000 Tomans per 1,000,000 Tomans deposit (3% monthly)
    const CONVERSION_RATE = 0.03;
    const STEP = 5_000_000; // 5 Million Tomans step

    const baseDeposit = Number(depositPrice) || 0;
    const baseRent = Number(monthlyRent) || 0;

    // Equivalent full mortgage (رهن کامل)
    const fullMortgage = Math.round((baseDeposit + baseRent / CONVERSION_RATE) / STEP) * STEP;
    const minDeposit = 0;
    const maxDeposit = Math.max(fullMortgage, baseDeposit);

    const [currentDeposit, setCurrentDeposit] = useState<number>(baseDeposit);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    // Calculate adjusted monthly rent based on difference from base deposit
    const diff = currentDeposit - baseDeposit;
    const currentRent = Math.max(0, Math.round((baseRent - diff * CONVERSION_RATE) / 1000) * 1000);

    const handleReset = () => {
        setCurrentDeposit(baseDeposit);
    };

    if (baseDeposit <= 0 && baseRent <= 0) return null;

    return (
        <div className="bg-surface rounded-2xl border border-border-subtle p-4 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Calculator className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-xs sm:text-sm font-black text-brand">
                            محاسبه‌گر تبدیل رهن و اجاره
                        </h3>
                        <p className="text-[11px] text-text-light font-medium">
                            تبدیل هوشمند بر اساس عرف ۳٪ بازار (۳۰ هزار تومان به ازای هر میلیون)
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-xs font-bold text-primary hover:text-primary-hover px-2.5 py-1 rounded-lg bg-primary/5 border border-primary/15 transition-colors cursor-pointer"
                >
                    {isOpen ? "بستن ماشین‌حساب" : "تغییر ودیعه / تبدیل"}
                </button>
            </div>

            {isOpen && (
                <div className="pt-2 border-t border-border-subtle/70 space-y-4 animate-in fade-in duration-200">
                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-text-light font-bold">پیش‌فرض‌ها:</span>
                        <button
                            type="button"
                            onClick={() => setCurrentDeposit(baseDeposit)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                currentDeposit === baseDeposit
                                    ? "bg-primary text-white shadow-2xs"
                                    : "bg-surface-secondary text-text-light hover:text-brand border border-border-subtle"
                            }`}
                        >
                            قیمت اعلامی مالک
                        </button>
                        {fullMortgage > 0 && (
                            <button
                                type="button"
                                onClick={() => setCurrentDeposit(fullMortgage)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    currentDeposit === fullMortgage
                                        ? "bg-primary text-white shadow-2xs"
                                        : "bg-surface-secondary text-text-light hover:text-brand border border-border-subtle"
                                }`}
                            >
                                رهن کامل (اجاره ۰)
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setCurrentDeposit(minDeposit)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                currentDeposit === minDeposit
                                    ? "bg-primary text-white shadow-2xs"
                                    : "bg-surface-secondary text-text-light hover:text-brand border border-border-subtle"
                            }`}
                        >
                            حداقل ودیعه
                        </button>
                    </div>

                    {/* Interactive Slider */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-text-light font-medium">تنظیم مبلغ ودیعه پیشنهادی:</span>
                            <span className="font-mono font-black text-brand text-sm">
                                {formatPrice(currentDeposit)}
                            </span>
                        </div>
                        <input
                            type="range"
                            min={minDeposit}
                            max={maxDeposit}
                            step={STEP}
                            value={currentDeposit}
                            onChange={(e) => setCurrentDeposit(Number(e.target.value))}
                            className="w-full h-2 bg-surface-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex items-center justify-between text-[10px] text-text-light font-mono">
                            <span>{formatPrice(minDeposit)}</span>
                            <span>رهن کامل: {formatPrice(maxDeposit)}</span>
                        </div>
                    </div>

                    {/* Calculated Output Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-surface-secondary/70 rounded-xl border border-border-subtle">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-text-light">ودیعه محاسبه‌شده:</span>
                            <span className="text-xs sm:text-sm font-black text-brand font-mono">
                                {formatPrice(currentDeposit)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-text-light">اجاره ماهانه متناظر:</span>
                            <span className="text-xs sm:text-sm font-black text-primary font-mono">
                                {currentRent > 0 ? formatPrice(currentRent) : "بدون اجاره (رهن کامل)"}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1 text-[11px] text-text-light">
                            <Info className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                            <span>توجه: امکان تبدیل نهایی منوط به توافق با مالک یا مشاور مربوطه است.</span>
                        </div>
                        {currentDeposit !== baseDeposit && (
                            <button
                                type="button"
                                onClick={handleReset}
                                className="flex items-center gap-1 text-xs text-text-light hover:text-brand font-bold shrink-0 cursor-pointer"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>بازنشانی</span>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
