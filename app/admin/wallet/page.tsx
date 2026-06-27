"use client";

import { adminService } from "@/services/admin.service";
import { AdjustWalletRequest } from "@/types/api/admin.types";
import { useMutation } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, Gift, Info, Wallet } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

export default function AdminWalletPage() {
    const [userId, setUserId] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState<"CREDIT" | "DEBIT">("CREDIT");
    const [note, setNote] = useState("");

    const adjustMutation = useMutation({
        mutationFn: (data: AdjustWalletRequest) => adminService.adjustWallet(data),
        onSuccess: () => {
            toast.success("تراکنش با موفقیت انجام شد");
            setAmount("");
            setNote("");
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : "خطا در انجام تراکنش";
            toast.error(message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !amount) {
            toast.error("شناسه کاربر و مبلغ الزامی هستند");
            return;
        }
        adjustMutation.mutate({
            targetUserId: userId,
            type,
            amountRials: amount,
            note
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">مدیریت مالی</h1>
                <p className="text-gray-500 font-medium">افزایش یا کاهش دستی اعتبار کاربران</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-blue-100 text-sm opacity-80">مجموع اعتبارهای هدیه (ماه جاری)</p>
                        <h3 className="text-2xl font-bold mt-2">۲۵,۰۰۰,۰۰۰ ریال</h3>
                    </div>
                    <Gift className="absolute -right-4 -bottom-4 text-blue-500 opacity-20" size={100} />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <p className="text-gray-500 text-sm">کل تراکنش‌های سیستمی امروز</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-2">۱۲۴</h3>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <p className="text-gray-500 text-sm">تغییر تراز مالی</p>
                    <h3 className="text-2xl font-bold text-green-600 mt-2">+ ۵,۲۰۰,۰۰۰</h3>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                        <Wallet size={18} />
                        تراکنش جدید
                    </h3>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">شناسه کاربر (UUID)</label>
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                placeholder="مثلا: 123e4567-..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">نوع عملیات</label>
                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setType("CREDIT")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-all ${type === "CREDIT" ? "bg-white text-green-600 shadow-sm" : "text-gray-500"}`}
                                >
                                    <ArrowUpCircle size={16} />
                                    واریز (بستانکار)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType("DEBIT")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-all ${type === "DEBIT" ? "bg-white text-red-600 shadow-sm" : "text-gray-500"}`}
                                >
                                    <ArrowDownCircle size={16} />
                                    برداشت (بدهکار)
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">مبلغ (ریال)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                placeholder="مبلغ را به ریال وارد کنید"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">توضیحات (اختیاری)</label>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                placeholder="علت تراکنش"
                            />
                        </div>
                    </div>

                    <div className="bg-amber-50 rounded-xl p-4 flex items-start gap-3 text-amber-700 text-sm">
                        <Info className="flex-shrink-0 mt-0.5" size={18} />
                        <p>
                            دقت کنید که این عملیات مستقیماً روی موجودی کیف پول کاربر تاثیر می‌گذارد و غیرقابل بازگشت است.
                            تمامی این تغییرات در گزارش‌های بازرسی ثبت می‌شوند.
                        </p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={adjustMutation.isPending}
                            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                        >
                            {adjustMutation.isPending ? "در حال پردازش..." : "اعمال تغییرات"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
