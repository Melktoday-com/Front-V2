"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";
import React, { useState } from "react";

interface AdminAdRejectModalProps {
    isOpen: boolean;
    adTitle: string;
    adId: string;
    onClose: () => void;
    onConfirm: (reason: string, note?: string) => Promise<void> | void;
    isSubmitting?: boolean;
}

const COMMON_REASONS = [
    "تصاویر نامناسب، بی‌کیفیت یا نامربوط به ملک",
    "قیمت نامتعارف یا مغایر با عرف منطقه",
    "اطلاعات یا مشخصات ملک ناقص یا متناقض است",
    "آگهی تکراری یا پیش‌تر ثبت شده است",
    "مغایرت با قوانین و مقررات محتوایی پلتفرم",
    "عدم پاسخگویی یا عدم صحت اطلاعات تماس",
    "سایر موارد",
];

export default function AdminAdRejectModal({
    isOpen,
    adTitle,
    adId,
    onClose,
    onConfirm,
    isSubmitting = false,
}: AdminAdRejectModalProps) {
    const [selectedReason, setSelectedReason] = useState<string>(COMMON_REASONS[0]);
    const [note, setNote] = useState<string>("");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const reason = selectedReason === "سایر موارد" && note.trim()
            ? note.trim()
            : selectedReason;
        onConfirm(reason, note.trim() || undefined);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div
                className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 flex flex-col text-right"
                dir="rtl"
            >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900">
                                رد آگهی ملک
                            </h3>
                            <p className="text-xs text-slate-500 font-medium truncate max-w-xs">
                                {adTitle || `شناسه: ${adId}`}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 block">
                            علت رد آگهی را انتخاب کنید:
                        </label>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                            {COMMON_REASONS.map((r) => (
                                <label
                                    key={r}
                                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                        selectedReason === r
                                            ? "bg-rose-50/60 border-rose-300 text-rose-900 font-black shadow-2xs"
                                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="rejectReason"
                                        value={r}
                                        checked={selectedReason === r}
                                        onChange={() => setSelectedReason(r)}
                                        className="text-rose-600 focus:ring-rose-500"
                                    />
                                    <span>{r}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 block">
                            توضیحات تکمیلی یا یادداشت ادمین (اختیاری):
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="توضیحاتی برای شفافیت دلیل رد آگهی بنویسید..."
                            rows={3}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none font-medium leading-relaxed"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <AlertTriangle className="w-4 h-4" />
                            )}
                            <span>ثبت رد آگهی</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                        >
                            انصراف
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
