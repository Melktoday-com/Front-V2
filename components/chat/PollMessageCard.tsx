"use client";

import { usePoll, useVotePoll } from "@/hooks/useChat";
import { cn, toPersianDigits } from "@/lib/utils";
import { BarChart3, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { PollMetadata } from "@/services/chat.service";
import { useState } from "react";
import { toast } from "sonner";

interface PollMessageCardProps {
    pollId: string;
    initialData?: PollMetadata | null;
    isMine?: boolean;
}

export function PollMessageCard({ pollId, initialData }: PollMessageCardProps) {
    const { data: poll, isLoading } = usePoll(pollId);
    const { mutate: vote, isPending: isVoting } = useVotePoll();
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

    const activeQuestion = poll?.question || initialData?.question || "نظرسنجی";
    const status = poll?.status || initialData?.status || 'OPEN';
    const expiresAt = poll?.expiresAt || initialData?.expiresAt;
    const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
    const isClosed = status === 'CLOSED' || isExpired;

    const totalVotes = poll?.totalVotes ?? 0;
    const userVotedOptionId = poll?.userVotedOptionId;
    const hasVoted = !!userVotedOptionId;

    const options = poll?.options || initialData?.options?.map(o => ({
        id: o.id,
        text: o.text,
        sortOrder: o.sortOrder || 0,
        voteCount: 0,
        percentage: 0,
    })) || [];

    const handleVote = (optionId: string) => {
        if (isClosed || isVoting) return;
        setSelectedOptionId(optionId);
        vote(
            { pollId, optionId },
            {
                onSuccess: () => {
                    toast.success("رای شما ثبت شد");
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message || "خطا در ثبت رای");
                },
            }
        );
    };

    return (
        <div className="w-full max-w-sm bg-white rounded-2xl border border-soft-border/90 p-4 shadow-xs space-y-3.5 text-right font-medium my-1">
            {/* Poll Header */}
            <div className="flex items-start justify-between gap-2 border-b border-soft-border/60 pb-2.5">
                <div className="flex items-center gap-2 text-brand">
                    <div className="p-1.5 rounded-lg bg-brand/5 text-brand">
                        <BarChart3 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black">نظرسنجی</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {isClosed ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                            پایان‌یافته
                        </span>
                    ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            در حال رای‌گیری
                        </span>
                    )}
                </div>
            </div>

            {/* Question */}
            <h4 className="text-brand font-black text-sm leading-snug">
                {activeQuestion}
            </h4>

            {/* Options */}
            <div className="space-y-2 pt-1">
                {options.map((option) => {
                    const isSelected = (poll?.userVotedOptionId === option.id) || (selectedOptionId === option.id);
                    const percent = option.percentage || 0;

                    return (
                        <button
                            key={option.id}
                            type="button"
                            disabled={isClosed || isVoting}
                            onClick={() => handleVote(option.id)}
                            className={cn(
                                "relative w-full text-right p-3 rounded-xl border transition-all overflow-hidden flex flex-col justify-center",
                                isSelected
                                    ? "border-brand/40 bg-brand/5 ring-1 ring-brand/10"
                                    : "border-soft-border bg-white hover:border-brand/20 hover:bg-soft-bg/30",
                                isClosed ? "cursor-default" : "cursor-pointer"
                            )}
                        >
                            {/* Progress bar background */}
                            {(hasVoted || isClosed) && (
                                <div
                                    className={cn(
                                        "absolute inset-y-0 right-0 transition-all duration-500 rounded-xl",
                                        isSelected ? "bg-brand/15" : "bg-soft-bg/80"
                                    )}
                                    style={{ width: `${percent}%` }}
                                />
                            )}

                            {/* Content */}
                            <div className="relative z-10 flex items-center justify-between gap-3 w-full">
                                <div className="flex items-center gap-2 min-w-0">
                                    {isSelected ? (
                                        <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border border-soft-border/80 shrink-0 bg-white" />
                                    )}
                                    <span className={cn(
                                        "text-xs font-bold truncate",
                                        isSelected ? "text-brand" : "text-brand/90"
                                    )}>
                                        {option.text}
                                    </span>
                                </div>

                                {(hasVoted || isClosed) && (
                                    <span className="text-[11px] font-black text-secondary shrink-0">
                                        {toPersianDigits(percent)}٪
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Poll Footer */}
            <div className="flex items-center justify-between text-[11px] text-secondary/70 pt-1 border-t border-soft-border/40">
                <span className="font-bold">
                    مجموع آرا: {toPersianDigits(totalVotes)} رای
                </span>
                {expiresAt && !isClosed && (
                    <span className="inline-flex items-center gap-1 text-[10px]">
                        <Clock className="w-3 h-3" />
                        تا {new Date(expiresAt).toLocaleDateString('fa-IR')}
                    </span>
                )}
            </div>
        </div>
    );
}
