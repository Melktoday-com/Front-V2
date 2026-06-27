"use client";

import { useConversation, useMessages, useSendMessage } from "@/hooks/useChat";
import { useMeProfile } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { Building2, ChevronRight, Loader2, MessageCircle, Send, ShieldCheck, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatWindowProps {
    conversationId: string | null;
    onBack?: () => void;
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
    const [message, setMessage] = useState("");
    const {
        data,
        isLoading: isLoadingMessages,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useMessages(conversationId || undefined);
    const { data: conversation } = useConversation(conversationId || undefined);
    const { data: me } = useMeProfile();
    const { mutate: send, isPending: isSending } = useSendMessage();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Flatten pages of messages
    const messages = data?.pages.flatMap(page => page).reverse() || [];

    useEffect(() => {
        if (scrollRef.current && !isFetchingNextPage) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages.length, isFetchingNextPage]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !conversationId || isSending) return;

        send({ conversationId, content: message }, {
            onSuccess: () => setMessage(""),
        });
    };

    const formatTime = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleTimeString("fa-IR", {
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch (e) {
            return "";
        }
    };

    if (!conversationId) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-soft-bg/20 rounded-[40px] border border-soft-border border-dashed">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-secondary mb-6 shadow-sm">
                    <MessageCircle className="w-10 h-10 opacity-20" />
                </div>
                <h3 className="text-xl font-black text-brand mb-2">صندوق پیام</h3>
                <p className="text-secondary max-w-xs leading-relaxed">
                    یکی از گفتگوها را از لیست سمت راست انتخاب کنید تا پیام‌های آن را ببینید.
                </p>
            </div>
        );
    }

    if (isLoadingMessages) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-brand" />
            </div>
        );
    }

    const otherParticipant = conversation?.otherParticipant;

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            {/* Header */}
            <div className="p-3 lg:px-6 lg:py-4 border-b border-soft-border bg-white flex items-center gap-3 shrink-0">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="lg:hidden w-8 h-8 bg-soft-bg rounded-full flex items-center justify-center text-brand"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                )}
                <div className="w-9 h-9 lg:w-10 lg:h-10 bg-soft-bg rounded-xl flex items-center justify-center text-brand overflow-hidden">
                    {otherParticipant?.avatar ? (
                        <img src={otherParticipant.avatar} alt={otherParticipant.name} className="w-full h-full object-cover" />
                    ) : conversation?.subjectType === 'SUPPORT' ? (
                        <ShieldCheck className="w-5 h-5 lg:w-6 lg:h-6" />
                    ) : conversation?.subjectType === 'AGENCY' ? (
                        <Building2 className="w-5 h-5 lg:w-6 lg:h-6" />
                    ) : (
                        <User className="w-5 h-5 lg:w-6 lg:h-6" />
                    )}
                </div>
                <div>
                    <h3 className="font-black text-brand text-sm lg:text-base leading-tight">
                        {otherParticipant?.name || 'گفتگو'}
                    </h3>
                    <p className="text-[10px] text-secondary flex items-center gap-1 opacity-70">
                        {conversation?.subjectType === 'SUPPORT' ? (
                            'تیم پشتیبانی ملک تودی'
                        ) : conversation?.subjectType === 'AGENCY' ? (
                            'مشاور املاک'
                        ) : conversation?.subjectType === 'RENTAL' ? (
                            'میزبان اجاره موقت'
                        ) : (
                            <>
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                آنلاین
                            </>
                        )}
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 lg:p-4 space-y-2.5 scrollbar-thin scrollbar-track-transparent"
            >
                {hasNextPage && (
                    <div className="flex justify-center pb-4">
                        <button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="text-xs text-brand font-bold bg-soft-bg px-4 py-2 rounded-full hover:bg-brand hover:text-white transition-all disabled:opacity-50"
                        >
                            {isFetchingNextPage ? "در حال بارگذاری..." : "مشاهده پیام‌های قبلی"}
                        </button>
                    </div>
                )}

                {messages.map((msg: any, idx) => {
                    const isMine = msg.senderId === me?.id;

                    return (
                        <div
                            key={msg.id || idx}
                            className={cn(
                                "flex flex-col max-w-[90%]",
                                isMine ? "mr-auto items-end" : "ml-auto items-start"
                            )}
                        >
                            <div className={cn(
                                "px-3 py-1.5 rounded-2xl text-[13px] leading-relaxed",
                                isMine
                                    ? "bg-brand text-white rounded-br-none"
                                    : "bg-white text-brand rounded-bl-none border border-soft-border shadow-sm"
                            )}>
                                {msg.content}
                            </div>
                            <span className="text-[9px] text-secondary mt-1 px-1 opacity-60">
                                {formatTime(msg.createdAt)}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 lg:p-4 bg-white border-t border-soft-border shrink-0">
                <div className="relative flex items-center bg-soft-bg/20 rounded-xl border border-soft-border focus-within:border-brand/20 focus-within:bg-white transition-all pr-4">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="پیام خود را بنویسید..."
                        className="flex-1 bg-transparent py-3 text-sm outline-none text-brand"
                    />
                    <button
                        type="submit"
                        disabled={!message.trim() || isSending}
                        className="p-2 text-brand hover:scale-110 transition-all disabled:opacity-20"
                    >
                        {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
            </form>
        </div>
    );
}

