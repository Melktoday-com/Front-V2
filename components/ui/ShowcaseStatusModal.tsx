"use client";

import React, { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Power } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ShowcaseStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    type: "AGENCY" | "HOST";
    isActivating: boolean;
    isLoading?: boolean;
}

export function ShowcaseStatusModal({
    isOpen,
    onClose,
    onConfirm,
    type,
    isActivating,
    isLoading = false,
}: ShowcaseStatusModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen && !isLoading) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, isLoading, onClose]);

    useEffect(() => {
        if (!isOpen) return;
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const targetTitle = type === "AGENCY" ? "ویترین املاک" : "ویترین اقامتگاه";
    const itemNoun = type === "AGENCY" ? "آگهی‌های" : "اقامتگاه‌های";

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={isActivating ? `فعال‌سازی ${targetTitle}` : `غیرفعال‌سازی ${targetTitle}`}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isLoading) {
                    onClose();
                }
            }}
        >
            <div className="bg-surface border border-border-subtle rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
                <div
                    className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center mx-auto",
                        isActivating
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-amber-500/10 text-amber-600"
                    )}
                >
                    {isActivating ? (
                        <CheckCircle2 className="w-6 h-6" />
                    ) : (
                        <AlertTriangle className="w-6 h-6" />
                    )}
                </div>

                <div className="space-y-2 text-center">
                    <h3 className="text-base font-black text-brand">
                        {isActivating
                            ? `فعال‌سازی مجدد ${targetTitle}`
                            : `غیرفعال‌سازی ${targetTitle}`}
                    </h3>

                    {isActivating ? (
                        <p className="text-xs text-secondary leading-relaxed text-right bg-soft-bg/60 p-3 rounded-xl border border-soft-border/50">
                            با فعال‌سازی مجدد ویترین، صفحه اختصاصی شما دوباره در دسترس کاربران قرار می‌گیرد و پست‌های شما منتشر می‌شوند.
                            <br />
                            <span className="font-bold text-brand mt-1 block">
                                توجه: {itemNoun} شما برای بررسی و اطمینان در حالت آرشیو باقی می‌مانند و می‌توانید موارد دلخواه را مجدداً از لیست منتشر کنید.
                            </span>
                        </p>
                    ) : (
                        <div className="text-xs text-secondary leading-relaxed text-right bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-xl space-y-2">
                            <p className="font-bold text-amber-700 dark:text-amber-400">
                                آیا از غیرفعال‌سازی {targetTitle} اطمینان دارید؟
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-secondary text-[11px]">
                                <li>صفحه اختصاصی شما از دید عموم کاربران مخفی می‌شود.</li>
                                <li>تمام {itemNoun} فعال شما به حالت آرشیو منتقل می‌شوند.</li>
                                <li>تمام مقالات و پست‌های شما موقتاً غیرفعال می‌شوند.</li>
                            </ul>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 py-2.5 rounded-xl border border-border-subtle text-xs font-bold text-secondary hover:bg-soft-bg transition-colors cursor-pointer disabled:opacity-50"
                    >
                        انصراف
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={cn(
                            "flex-1 py-2.5 rounded-xl text-white text-xs font-black transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs",
                            isActivating
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : "bg-red-600 hover:bg-red-700"
                        )}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>در حال اعمال...</span>
                            </>
                        ) : isActivating ? (
                            "تأیید و فعال‌سازی"
                        ) : (
                            "بله، غیرفعال شود"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
