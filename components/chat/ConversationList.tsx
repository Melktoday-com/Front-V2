"use client";

import { useConversations } from "@/hooks/useChat";
import { useMeProfile } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { MessageSquare, User } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ConversationListContent() {
    const { data: conversations, isLoading } = useConversations();
    const { data: me } = useMeProfile();
    const searchParams = useSearchParams();
    const activeId = searchParams.get("id");

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 bg-soft-bg rounded-3xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (!conversations?.length) {
        return (
            <div className="flex flex-col items-center justify-center p-10 text-center space-y-4 bg-soft-bg/20 rounded-[40px] border border-soft-border border-dashed">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-secondary shadow-sm">
                    <MessageSquare className="w-8 h-8 opacity-20" />
                </div>
                <div className="text-secondary font-bold text-sm">هنوز پیامی ندارید</div>
            </div>
        );
    }

    return (
        <div className="space-y-3 pb-20 lg:pb-0">
            {conversations.map((conv) => {
                const otherId = conv.participants.find(p => p !== me?.id);

                return (
                    <Link
                        key={conv.id}
                        href={`/profile/chat?id=${conv.id}`}
                        scroll={false}
                        className={cn(
                            "flex items-center gap-4 p-4 rounded-3xl border transition-all duration-300",
                            activeId === conv.id
                                ? "bg-brand/5 border-brand/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-brand/10"
                                : "bg-white border-soft-border hover:bg-soft-bg hover:border-brand/10"
                        )}
                    >
                        <div className="relative">
                            <div className="w-14 h-14 rounded-full bg-soft-bg flex items-center justify-center border border-soft-border overflow-hidden">
                                {conv.otherParticipant?.avatar ? (
                                    <img
                                        src={conv.otherParticipant.avatar}
                                        alt={conv.otherParticipant.name || "User"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-7 h-7 text-brand/40" />
                                )}
                            </div>
                            {conv.unreadCount && conv.unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-6 h-6 bg-error text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in">
                                    {conv.unreadCount}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-brand font-black text-[15px] truncate">
                                    {conv.otherParticipant?.name || (otherId ? `کاربر ${otherId.slice(0, 4)}` : "کاربر ملک تودی")}
                                </span>
                                <span className="text-secondary text-[10px] font-bold opacity-60">
                                    {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider",
                                    conv.subjectType === 'AGENCY' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                                )}>
                                    {conv.subjectType === 'AGENCY' ? 'مشاور' : 'آگهی'}
                                </span>
                                <p className="text-secondary text-xs font-medium truncate opacity-70 leading-relaxed">
                                    {conv.lastMessageId ? "پیام جدید" : "گفتگو را شروع کنید"}
                                </p>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

export function ConversationList() {
    return (
        <Suspense fallback={<div className="h-40 bg-soft-bg rounded-3xl animate-pulse" />}>
            <ConversationListContent />
        </Suspense>
    );
}
