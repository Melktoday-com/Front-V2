"use client";

import { useConversations } from "@/hooks/useChat";
import { useMeProfile } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { ChatConversation } from "@/services/chat.service";
import { Building2, MessageSquare, ShieldCheck, User } from "lucide-react";
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
            <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-20 bg-soft-bg rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (!conversations?.length) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 bg-soft-bg/10 rounded-[30px] border border-soft-border border-dashed">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-secondary shadow-sm">
                    <MessageSquare className="w-6 h-6 opacity-20" />
                </div>
                <div className="text-secondary font-bold text-xs">هنوز پیامی ندارید</div>
            </div>
        );
    }

    return (
        <div className="space-y-2 pb-20 lg:pb-0">
            {conversations.map((conv: ChatConversation) => {
                const otherId = conv.participants.find(p => p !== me?.userId);

                return (
                    <Link
                        key={conv.id}
                        href={`/profile/chat?id=${conv.id}`}
                        scroll={false}
                        className={cn(
                            "flex items-center gap-3 p-3 rounded-2xl transition-all duration-200",
                            activeId === conv.id
                                ? "bg-brand/5 ring-1 ring-brand/10 shadow-sm"
                                : "bg-white hover:bg-soft-bg"
                        )}
                    >
                        <div className="relative">
                            <div className="w-11 h-11 rounded-full
                             bg-soft-bg flex items-center justify-center border
                              border-soft-border overflow-hidden shrink-0">
                                {conv.otherParticipant?.avatar ? (
                                    <img
                                        src={conv.otherParticipant.avatar}
                                        alt={conv.otherParticipant.name || "User"}
                                        className="w-full h-full object-cover"
                                    />
                                ) : conv.subjectType === 'SUPPORT' ? (
                                    <ShieldCheck className="w-6 h-6 text-brand" />
                                ) : conv.subjectType === 'AGENCY' ? (
                                    <Building2 className="w-6 h-6 text-brand/40" />
                                ) : (
                                    <User className="w-6 h-6 text-brand/40" />
                                )}
                            </div>
                            {conv.unreadCount && conv.unreadCount > 0 ? (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in">
                                    {conv.unreadCount}
                                </span>
                            ) : <></>}
                        </div>

                        <div className="flex-1 min-w-0 font-medium">
                            <div className="flex justify-between items-start mb-0.5">
                                <span className="text-brand font-black text-sm truncate">
                                    {conv.otherParticipant?.name || (otherId ? `کاربر ${otherId.slice(0, 4)}` : "کاربر ملک تودی")}
                                </span>
                                <span className="text-secondary text-[9px] font-bold opacity-60">
                                    {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-tighter",
                                    conv.subjectType === 'AGENCY' ? "bg-amber-100 text-amber-700" :
                                        conv.subjectType === 'SUPPORT' ? "bg-brand/10 text-brand" :
                                            conv.subjectType === 'RENTAL' ? "bg-purple-100 text-purple-700" :
                                                "bg-blue-100 text-blue-700"
                                )}>
                                    {conv.subjectType === 'AGENCY' ? 'املاکی' :
                                        conv.subjectType === 'SUPPORT' ? 'پشتیبانی' :
                                            conv.subjectType === 'RENTAL' ? 'اجاره موقت' :
                                                'آگهی'}
                                </span>
                                <p className="text-secondary text-[10px] truncate opacity-70">
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
