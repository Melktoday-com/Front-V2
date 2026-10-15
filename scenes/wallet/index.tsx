"use client";

import { useInitiateTopUp, useWalletBalance, useWalletTransactions } from "@/hooks/useWallet";
import { cn, formatCurrency, rialToToman, toPersianDigits } from "@/lib/utils";
import { normalizeApiError } from "@/lib/api/error-handler";
import {
    ArrowDownRight,
    ArrowUpLeft,
    CheckCircle2,
    ChevronRight,
    CreditCard,
    History,
    Loader2,
    Plus,
    ShieldCheck,
    Wallet,
    X,
} from "lucide-react";
import { TransactionStatus, TransactionType } from "@/types/api/enums";
import { useSafeBack } from "@/hooks/useSafeBack";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const QUICK_AMOUNTS = [
    { label: "۱۰۰ هزار", value: 100000 },
    { label: "۲۵۰ هزار", value: 250000 },
    { label: "۵۰۰ هزار", value: 500000 },
    { label: "۱ میلیون", value: 1000000 },
];

export default function WalletScene() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const handleBack = useSafeBack("/");
    const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState<number>(250000);
    const [customAmount, setCustomAmount] = useState<string>("");

    // Prefill amount if redirected with ?amount=...
    useEffect(() => {
        const queryAmount = searchParams?.get("amount");
        if (queryAmount) {
            const parsed = parseInt(queryAmount, 10);
            if (!isNaN(parsed) && parsed > 0) {
                setCustomAmount(String(parsed));
                setSelectedAmount(0);
                setIsChargeModalOpen(true);
            }
        }
    }, [searchParams]);

    const { data: balanceData, isLoading: isLoadingBalance } = useWalletBalance();
    const { data: transactionsData, isLoading: isLoadingTransactions } = useWalletTransactions(1, 20);
    const initiateMutation = useInitiateTopUp();

    const handleCharge = async () => {
        const finalAmount = customAmount ? Number(customAmount) : selectedAmount;
        if (!finalAmount || finalAmount < 10000) {
            toast.error("حداقل مبلغ شارژ ۱۰,۰۰۰ تومان می‌باشد.");
            return;
        }

        // Convert Toman to IRR (1 Toman = 10 IRR)
        const amountIRR = finalAmount * 10;
        const callbackUrl = `${window.location.origin}/wallet/callback`;

        initiateMutation.mutate(
            {
                amountIRR,
                callbackUrl,
                idempotencyKey: `topup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            },
            {
                onSuccess: (res) => {
                    if (res?.paymentUrl) {
                        toast.info("در حال انتقال به درگاه پرداخت شاپرک...");
                        window.location.href = res.paymentUrl;
                    } else {
                        toast.error("آدرس درگاه پرداخت از سرور دریافت نشد.");
                    }
                },
                onError: (err: Error) => {
                    const message = normalizeApiError(
                        err,
                        "خطا در برقراری ارتباط با درگاه پرداخت",
                    );
                    toast.error(message);
                },
            }
        );
    };

    // Backend wallet stores balance in IRR (currency: "IRR").
    // Convert to Toman for user display (1 Toman = 10 IRR).
    const rawBalanceIrr = Number(balanceData?.availableBalance ?? balanceData?.balance ?? 0);
    const balanceToman = rialToToman(rawBalanceIrr);

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-1.5 text-xs font-bold text-text-light hover:text-brand transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                    <span>بازگشت</span>
                </button>
                <h1 className="text-base font-black text-brand">کیف پول من</h1>
                <div className="w-6" />
            </div>

            {/* Balance Card */}
            <div className="bg-gradient-to-br from-brand via-slate-900 to-brand-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
                <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
                    <Wallet size={200} />
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-white/70">
                            <CreditCard className="w-4 h-4 text-primary" />
                            <span>موجودی در دسترس</span>
                        </div>
                        <span className="text-[10px] font-bold bg-surface/10 px-2.5 py-1 rounded-full text-white/80">
                            ملک‌تودی پی
                        </span>
                    </div>

                    <div>
                        {isLoadingBalance ? (
                            <div className="h-10 w-40 bg-surface/20 animate-pulse rounded-xl" />
                        ) : (
                            <div className="space-y-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl sm:text-4xl font-black tracking-tight">
                                        {formatCurrency(balanceToman)}
                                    </span>
                                    <span className="text-sm font-bold text-white/80">تومان</span>
                                </div>
                                <div className="text-xs text-white/60 font-medium">
                                    معادل {formatCurrency(rawBalanceIrr)} ریال
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => setIsChargeModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-black text-xs rounded-2xl shadow-lg shadow-primary/30 transition-transform active:scale-95 cursor-pointer"
                        >
                            <Plus className="w-4 h-4 stroke-[3]" />
                            <span>افزایش موجودی</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Transactions Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-black text-brand flex items-center gap-2">
                        <History className="w-4 h-4 text-primary" />
                        <span>تاریخچه تراکنش‌ها</span>
                    </h2>
                    <span className="text-xs text-text-light font-bold">
                        {toPersianDigits(transactionsData?.total || 0)} تراکنش
                    </span>
                </div>

                {(() => {
                    const txList = transactionsData?.transactions || transactionsData?.items || [];
                    if (isLoadingTransactions) {
                        return (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-18 bg-surface-secondary rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        );
                    }
                    if (txList.length === 0) {
                        return (
                            <div className="py-16 text-center bg-surface-secondary rounded-3xl border border-dashed border-border-subtle">
                                <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-xs font-bold text-text-light">هنوز تراکنشی در حساب شما ثبت نشده است.</p>
                            </div>
                        );
                    }
                    return (
                        <div className="space-y-3">
                            {txList.map((tx) => {
                                const isDeposit = tx.type === TransactionType.CREDIT;
                                const isSuccess = tx.status === TransactionStatus.COMPLETED;

                            return (
                                <div
                                    key={tx.id}
                                    className="p-4 bg-surface rounded-2xl border border-border-subtle flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                                isDeposit
                                                    ? "bg-success-subtle text-success"
                                                    : "bg-error-subtle text-error"
                                            )}
                                        >
                                            {isDeposit ? (
                                                <ArrowDownRight className="w-5 h-5" />
                                            ) : (
                                                <ArrowUpLeft className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-brand">{tx.reason || "تراکنش کیف پول"}</h4>
                                            <span className="text-[10px] text-text-light mt-0.5 block">
                                                {new Date(tx.createdAt).toLocaleDateString("fa-IR")}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-left">
                                        <span
                                            className={cn(
                                                "text-xs font-black block",
                                                isDeposit ? "text-success" : "text-error"
                                            )}
                                        >
                                            {isDeposit ? "+" : "-"} {formatCurrency(rialToToman(tx.amount))} تومان
                                        </span>
                                        <span className="text-[10px] text-text-light block mt-0.5">
                                            {formatCurrency(tx.amount)} ریال
                                        </span>
                                        <span
                                            className={cn(
                                                "text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5",
                                                isSuccess
                                                    ? "bg-success-subtle text-success"
                                                    : "bg-warning-subtle text-warning"
                                            )}
                                        >
                                            {isSuccess ? "موفق" : "در انتظار"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })()}
            </div>

            {/* Charge Modal */}
            {isChargeModalOpen && (
                <div role="dialog" aria-modal="true" aria-label="افزایش موجودی کیف پول" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 border border-border-subtle">
                        <div className="flex justify-between items-center border-b border-border-subtle pb-3">
                            <h3 className="font-black text-brand text-base">افزایش موجودی کیف پول</h3>
                            <button
                                onClick={() => setIsChargeModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center text-text-light hover:bg-gray-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Quick Presets */}
                        <div>
                            <label className="block text-xs font-bold text-brand mb-2">انتخاب مبلغ آماده</label>
                            <div className="grid grid-cols-2 gap-2.5">
                                {QUICK_AMOUNTS.map((opt) => {
                                    const isSelected = selectedAmount === opt.value && !customAmount;
                                    return (
                                        <button
                                            type="button"
                                            key={opt.value}
                                            onClick={() => {
                                                setSelectedAmount(opt.value);
                                                setCustomAmount("");
                                            }}
                                            className={cn(
                                                "py-3 rounded-2xl border text-xs font-black transition-all",
                                                isSelected
                                                    ? "bg-primary text-white border-primary shadow-xs"
                                                    : "bg-surface-secondary border-border-subtle text-text-light hover:bg-surface-secondary"
                                            )}
                                        >
                                            {opt.label} تومان
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Custom Input */}
                        <div>
                            <label className="block text-xs font-bold text-brand mb-2">یا مبلغ دلخواه (تومان)</label>
                            <input
                                type="number"
                                placeholder="مثلاً: ۱۵۰,۰۰۰"
                                value={customAmount}
                                onChange={(e) => {
                                    setCustomAmount(e.target.value);
                                    setSelectedAmount(0);
                                }}
                                className="w-full p-3.5 border border-border-subtle rounded-2xl bg-surface-secondary focus:bg-surface focus:ring-2 focus:ring-primary outline-hidden text-sm font-bold"
                            />
                        </div>

                        <div className="p-3 bg-info-subtle/70 rounded-2xl border border-info/30 flex items-center gap-2 text-xs text-foreground font-medium">
                            <ShieldCheck className="w-4 h-4 text-info shrink-0" />
                            <span>پرداخت امن از طریق درگاه پرداخت بانکی شاپرک</span>
                        </div>

                        <button
                            type="button"
                            onClick={handleCharge}
                            disabled={initiateMutation.isPending}
                            className="w-full py-4 bg-primary text-white font-black text-sm rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {initiateMutation.isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>انتقال به درگاه پرداخت</span>
                                    <CheckCircle2 className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
