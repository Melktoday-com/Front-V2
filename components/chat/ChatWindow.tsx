"use client";

import { useMessages, useSendMessage } from "@/hooks/useChat";
import { useMeProfile } from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import { Send, User, Loader2, MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatWindowProps {
    conversationId: string | null;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
    const [message, setMessage] = useState("");
    const { 
        data, 
        isLoading, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage 
    } = useMessages(conversationId || undefined);
    const { data: me } = useMeProfile();
    const { mutate: send, isPending: isSending } = useSendMessage();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Flatten pages of messages (newest first in each page, pages are in order of fetching)
    // We want to display oldest at the top, newest at the bottom.
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
                <h3 className="text-xl font-black text-brand mb-2">گفتگو با آگهی‌دهنده</h3>
                <p className="text-secondary max-w-xs leading-relaxed">
                    یکی از گفتگوها را از لیست سمت راست انتخاب کنید تا پیام‌های آن را ببینید.
                </p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-brand" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white rounded-[40px] border border-soft-border shadow-sm overflow-hidden">
            {/* Header placeholder - in a real app, fetch conversation details */}
            <div className="p-6 border-b border-soft-border bg-white flex items-center gap-4">
                <div className="w-12 h-12 bg-soft-bg rounded-2xl flex items-center justify-center text-brand">
                    <User className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-black text-brand text-lg">گفتگو</h3>
                    <p className="text-xs text-secondary flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        آنلاین
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-soft-border scrollbar-track-transparent"
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
                                "flex flex-col max-w-[85%]",
                                isMine ? "mr-auto items-end" : "ml-auto items-start"
                            )}
                        >
                            <div className={cn(
                                "px-5 py-3 rounded-3xl text-sm leading-relaxed",
                                isMine 
                                    ? "bg-brand text-white rounded-br-lg shadow-md shadow-brand/10" 
                                    : "bg-soft-bg text-brand rounded-bl-lg border border-soft-border"
                            )}>
                                {msg.content}
                            </div>
                            <span className="text-[10px] text-secondary mt-1.5 px-1 font-medium">
                                {formatTime(msg.createdAt)}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-6 bg-soft-bg/30 border-t border-soft-border">
                <div className="relative flex items-center bg-white rounded-2xl border border-soft-border focus-within:border-brand shadow-sm transition-all pr-4">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="پیام خود را بنویسید..."
                        className="flex-1 bg-transparent py-4 text-sm outline-none text-brand font-medium"
                    />
                    <button
                        type="submit"
                        disabled={!message.trim() || isSending}
                        className="m-1.5 w-11 h-11 bg-brand text-white rounded-xl flex items-center justify-center hover:bg-brand-dark transition-colors disabled:opacity-50 shadow-lg shadow-brand/20"
                    >
                        {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
            </form>
        </div>
    );
}

