"use client";

import { useChargeWallet, useWalletBalance, useWalletTransactions } from "@/hooks/useWallet";
import { cn, formatPrice, toPersianDigits } from "@/lib/utils";
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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const QUICK_AMOUNTS = [
    { label: "۱۰۰ هزار", value: 100000 },
    { label: "۲۵۰ هزار", value: 250000 },
    { label: "۵۰۰ هزار", value: 500000 },
    { label: "۱ میلیون", value: 1000000 },
];

export default function WalletScene() {
    const router = useRouter();
    const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState<number>(250000);
    const [customAmount, setCustomAmount] = useState<string>("");

    const { data: balanceData, isLoading: isLoadingBalance } = useWalletBalance();
    const { data: transactionsData, isLoading: isLoadingTransactions } = useWalletTransactions(1, 20);
    const chargeMutation = useChargeWallet();

    const handleCharge = async () => {
        const finalAmount = customAmount ? Number(customAmount) : selectedAmount;
        if (!finalAmount || finalAmount < 10000) {
            toast.error("حداقل مبلغ شارژ ۱۰,۰۰۰ تومان می‌باشد.");
            return;
        }

        chargeMutation.mutate(
            {
                amount: finalAmount,
                currency: "IRR",
                idempotencyKey: `charge_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                reason: "شارژ آنلاین کیف پول",
            },
            {
                onSuccess: (res) => {
                    toast.success("کیف پول شما با موفقیت شارژ شد.");
                    setIsChargeModalOpen(false);
                    setCustomAmount("");
                },
                onError: () => {
                    toast.error("خطا در ایجاد تراکنش پرداخت");
                },
            }
        );
    };

    const balanceAmount = balanceData?.balance ?? 0;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-28">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => router.back()}
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
                        <span className="text-[10px] font-bold bg-white/10 px-2.5 py-1 rounded-full text-white/80">
                            ملک‌تودی پی
                        </span>
                    </div>

                    <div>
                        {isLoadingBalance ? (
                            <div className="h-10 w-40 bg-white/20 animate-pulse rounded-xl" />
                        ) : (
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl sm:text-4xl font-black tracking-tight">
                                    {formatPrice(balanceAmount, "")}
                                </span>
                                <span className="text-sm font-bold text-white/80">تومان</span>
                            </div>
                        )}
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => setIsChargeModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-black text-xs rounded-2xl shadow-lg shadow-primary/30 transition-transform active:scale-95"
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
                                    <div key={i} className="h-18 bg-gray-100 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        );
                    }
                    if (txList.length === 0) {
                        return (
                            <div className="py-16 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
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
                                    className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                                isDeposit
                                                    ? "bg-green-50 text-green-600"
                                                    : "bg-red-50 text-red-600"
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
                                                isDeposit ? "text-green-600" : "text-red-600"
                                            )}
                                        >
                                            {isDeposit ? "+" : "-"} {formatPrice(tx.amount, "")} تومان
                                        </span>
                                        <span
                                            className={cn(
                                                "text-[9px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5",
                                                isSuccess
                                                    ? "bg-green-50 text-green-700"
                                                    : "bg-amber-50 text-amber-700"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 border border-gray-100">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <h3 className="font-black text-brand text-base">افزایش موجودی کیف پول</h3>
                            <button
                                onClick={() => setIsChargeModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-text-light hover:bg-gray-200"
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
                                                    : "bg-gray-50 border-gray-200 text-text-light hover:bg-gray-100"
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
                                className="w-full p-3.5 border border-gray-200 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary outline-hidden text-sm font-bold"
                            />
                        </div>

                        <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-center gap-2 text-xs text-blue-900 font-medium">
                            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>پرداخت امن از طریق درگاه پرداخت بانکی شاپرک</span>
                        </div>

                        <button
                            type="button"
                            onClick={handleCharge}
                            disabled={chargeMutation.isPending}
                            className="w-full py-4 bg-primary text-white font-black text-sm rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {chargeMutation.isPending ? (
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
