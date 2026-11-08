"use client";

import React, { useEffect } from "react";
import { Loader2, Trash2 } from "lucide-react";

export interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title?: string;
    description?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

export function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = "حذف پیام",
    description = "آیا از حذف این مورد اطمینان دارید؟ این عملیات غیرقابل بازگشت است.",
    confirmText = "بله، حذف شود",
    cancelText = "انصراف",
    isLoading = false,
}: DeleteConfirmModalProps) {
    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen && !isLoading) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, isLoading, onClose]);

    // Prevent background scrolling when open
    useEffect(() => {
        if (!isOpen) return;
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : "تأیید حذف"}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isLoading) {
                    onClose();
                }
            }}
        >
            <div className="bg-surface border border-border-subtle rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 text-center animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-full bg-error-subtle/30 text-error flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-base font-bold text-brand">{title}</h3>
                    <div className="text-xs text-secondary leading-relaxed">
                        {description}
                    </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 py-2.5 rounded-xl border border-border-subtle text-xs font-bold text-secondary hover:bg-soft-bg transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 py-2.5 rounded-xl bg-error hover:bg-error/90 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>در حال حذف...</span>
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
