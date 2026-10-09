"use client";

import { useCreatePoll } from "@/hooks/useChat";
import { Button } from "@/components/ui/Button";
import { BarChart3, Loader2, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CreatePollModalProps {
    conversationId: string;
    isOpen: boolean;
    onClose: () => void;
}

export function CreatePollModal({ conversationId, isOpen, onClose }: CreatePollModalProps) {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState<string[]>(["", ""]);
    const { mutate: createPoll, isPending } = useCreatePoll();

    if (!isOpen) return null;

    const handleAddOption = () => {
        if (options.length >= 10) {
            toast.error("حداکثر ۱۰ گزینه مجاز است");
            return;
        }
        setOptions([...options, ""]);
    };

    const handleRemoveOption = (index: number) => {
        if (options.length <= 2) {
            toast.error("حداقل دو گزینه برای نظرسنجی الزامی است");
            return;
        }
        setOptions(options.filter((_, i) => i !== index));
    };

    const handleOptionChange = (index: number, val: string) => {
        const next = [...options];
        next[index] = val;
        setOptions(next);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedQuestion = question.trim();
        if (!trimmedQuestion || trimmedQuestion.length < 3) {
            toast.error("صورت سوال باید حداقل ۳ کاراکتر باشد");
            return;
        }

        const validOptions = options.map((o) => o.trim()).filter(Boolean);
        if (validOptions.length < 2) {
            toast.error("حداقل دو گزینه دارای متن الزامی است");
            return;
        }

        createPoll(
            {
                conversationId,
                question: trimmedQuestion,
                options: validOptions,
            },
            {
                onSuccess: () => {
                    toast.success("نظرسنجی با موفقیت ارسال شد");
                    onClose();
                    setQuestion("");
                    setOptions(["", ""]);
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message || "خطا در ایجاد نظرسنجی");
                },
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in" dir="rtl">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-soft-border space-y-5 animate-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-soft-border pb-4">
                    <div className="flex items-center gap-2 text-brand">
                        <div className="p-2 rounded-xl bg-brand/5 text-brand">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <h3 className="font-black text-base">ایجاد نظرسنجی جدید</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-soft-bg text-secondary transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-brand">
                            سوال یا موضوع نظرسنجی
                        </label>
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="مثال: آیا با زمان بازدید روز جمعه موافقید؟"
                            className="w-full bg-soft-bg/30 border border-soft-border rounded-2xl py-3 px-4 text-xs font-bold text-brand focus:ring-2 focus:ring-brand/20 outline-none"
                            maxLength={500}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-brand">
                            گزینه‌های پاسخ (۲ تا ۱۰ مورد)
                        </label>
                        <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar p-1">
                            {options.map((opt, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                                        placeholder={`گزینه ${idx + 1}`}
                                        className="flex-1 bg-soft-bg/30 border border-soft-border rounded-xl py-2 px-3 text-xs font-bold text-brand focus:ring-2 focus:ring-brand/20 outline-none"
                                        maxLength={255}
                                        required
                                    />
                                    {options.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveOption(idx)}
                                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {options.length < 10 && (
                            <button
                                type="button"
                                onClick={handleAddOption}
                                className="w-full py-2.5 rounded-xl border border-dashed border-soft-border hover:border-brand/40 text-brand text-xs font-bold flex items-center justify-center gap-1.5 transition-all bg-soft-bg/20 hover:bg-brand/5"
                            >
                                <Plus className="w-4 h-4" />
                                <span>افزودن گزینه دیگر</span>
                            </button>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-3 border-t border-soft-border">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 rounded-2xl h-11 text-xs font-bold"
                            disabled={isPending}
                        >
                            انصراف
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 rounded-2xl h-11 text-xs font-bold"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    در حال ارسال...
                                </span>
                            ) : (
                                "انتشار نظرسنجی"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
