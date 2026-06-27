"use client";

import { ChatWindow } from "@/components/chat/ChatWindow";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChevronRight, MessageSquare } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

function ChatContent() {
    const searchParams = useSearchParams();
    const conversationId = searchParams.get("id");

    return (
        <div className="grid lg:grid-cols-[380px,1fr] gap-0 lg:gap-8 h-[calc(100vh-160px)] overflow-hidden">
            {/* Sidebar: Conversation List */}
            <div className={cn(
                "flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar pb-10 sm:pb-0",
                conversationId ? "hidden lg:flex" : "flex"
            )}>
                <ConversationList />
            </div>

            {/* Main Area: Chat Window / Empty State */}
            <div className={cn(
                "min-h-0 flex-1",
                !conversationId ? "hidden lg:flex" : "flex"
            )}>
                {conversationId ? (
                    <div className="flex-1 h-full">
                        <ChatWindow conversationId={conversationId} />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-soft-bg/30 rounded-[40px] border border-dashed border-soft-border p-10 text-center space-y-4">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm text-primary">
                            <MessageSquare className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-brand font-black text-lg">صندوق پیام</h3>
                            <p className="text-secondary text-sm font-medium max-w-[250px] leading-relaxed">
                                برای مشاهده پیام‌ها و گفتگو با دیگران، یکی از چت‌ها را از لیست سمت راست انتخاب کنید.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ChatListPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-white pb-24 lg:pb-10 overflow-hidden">
            <div className="p-4 lg:p-10 space-y-8 max-w-7xl mx-auto h-screen flex flex-col">
                <header className="flex items-center gap-4 flex-shrink-0">
                    <button
                        onClick={() => router.push('/profile')}
                        className="w-10 h-10 bg-soft-bg rounded-full flex items-center justify-center text-brand"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                    <h1 className="text-brand text-2xl font-black">
                        پیام‌های من
                    </h1>
                </header>

                <Suspense fallback={
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                }>
                    <ChatContent />
                </Suspense>
            </div>
        </div>
    );
}
