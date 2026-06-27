"use client";

import { ChatWindow } from "@/components/chat/ChatWindow";
import { ConversationList } from "@/components/chat/ConversationList";
import { cn } from "@/lib/utils";
import { ChevronRight, MessageSquare } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ChatContent() {
    const searchParams = useSearchParams();
    const conversationId = searchParams.get("id");
    const router = useRouter();

    return (
        <div className="flex flex-row h-full w-full overflow-hidden bg-white" dir="rtl">
            {/* Sidebar (Right Side in RTL) */}
            <div className={cn(
                "flex flex-col border-l border-soft-border bg-white h-full md:w-[300px] lg:w-[340px] shrink-0 overflow-hidden",
                conversationId ? "hidden md:flex" : "flex w-full md:w-[300px] lg:w-[340px]"
            )}>
                <header className="px-5 py-4 border-b border-soft-border flex items-center justify-between shrink-0">
                    <h1 className="text-brand text-lg font-black">
                        پیام‌های من
                    </h1>
                    <button
                        onClick={() => router.push('/profile')}
                        className="w-10 h-10 bg-soft-bg rounded-full flex items-center justify-center text-brand md:hidden"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    <ConversationList />
                </div>
            </div>

            {/* Main Area (Left Side in RTL) */}
            <div className={cn(
                "flex-1 h-full bg-soft-bg/10 overflow-hidden",
                !conversationId ? "hidden md:flex" : "flex"
            )}>
                {conversationId ? (
                    <div className="flex-1 h-full flex flex-col overflow-hidden">
                        <ChatWindow
                            conversationId={conversationId}
                            onBack={() => router.push('/profile/chat')}
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-4">
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

export function ChatScene() {
    return (
        <div className="chat-page-content fixed inset-0 z-[60] flex flex-col bg-white overflow-hidden" dir="rtl">
            <div className="flex-1 w-full h-full flex flex-col overflow-hidden">
                <div className="flex-1 bg-white flex flex-col overflow-hidden">
                    <Suspense fallback={
                        <div className="flex-1 flex items-center justify-center h-full text-brand">
                            <div className="w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin" />
                        </div>
                    }>
                        <ChatContent />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
