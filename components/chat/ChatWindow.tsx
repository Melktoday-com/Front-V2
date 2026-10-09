"use client";

import { useConversation, useMessages, useSendMessage } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { useMeProfile } from "@/hooks/useUser";
import { cn, getMediaUrl } from "@/lib/utils";
import { ChatMessage, ListingMetadata, PollMetadata } from "@/services/chat.service";
import { mediaService } from "@/services/media.service";
import {
    Building2,
    Check,
    CheckCheck,
    ChevronLeft,
    Image as ImageIcon,
    Loader2,
    MessageCircle,
    Paperclip,
    Send,
    ShieldCheck,
    Star,
    User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ListingMessageCard } from "./ListingMessageCard";
import { ReviewRequestCard } from "./ReviewRequestCard";

interface ChatWindowProps {
    conversationId: string | null;
    onBack?: () => void;
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
    const [message, setMessage] = useState("");
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        data,
        isLoading: isLoadingMessages,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useMessages(conversationId || undefined);

    const { data: conversation } = useConversation(conversationId || undefined);
    const { data: me } = useMeProfile();
    const { activeRole } = useAuth();
    const { mutate: send, isPending: isSending } = useSendMessage();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Flatten pages of messages (reverse for chronological bottom-to-top rendering)
    const messages = data?.pages.flatMap((page) => page).reverse() || [];

    useEffect(() => {
        if (scrollRef.current && !isFetchingNextPage) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages.length, isFetchingNextPage]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !conversationId || isSending) return;

        send(
            { conversationId, content: message.trim(), type: "TEXT" },
            {
                onSuccess: () => setMessage(""),
            }
        );
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !conversationId) return;

        if (!file.type.startsWith("image/")) {
            toast.error("لطفاً یک فایل تصویری انتخاب کنید");
            return;
        }

        try {
            setIsUploadingImage(true);
            const media = await mediaService.upload(file, "PUBLIC", "IMAGE");
            const mediaId = media.id || media.mediaId;

            send(
                {
                    conversationId,
                    mediaIds: [mediaId],
                    type: "IMAGE",
                },
                {
                    onSuccess: () => {
                        toast.success("تصویر ارسال شد");
                    },
                    onError: () => {
                        toast.error("خطا در ارسال تصویر");
                    },
                }
            );
        } catch (err) {
            toast.error("خطا در بارگذاری تصویر");
        } finally {
            setIsUploadingImage(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const formatTime = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleTimeString("fa-IR", {
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "";
        }
    };

    const canRequestReview =
        activeRole === "agent" ||
        activeRole === "landlord" ||
        activeRole === "admin" ||
        activeRole === "super-admin" ||
        conversation?.subjectType === "AGENCY" ||
        conversation?.subjectType === "RENTAL";

    const handleRequestReview = () => {
        if (!conversationId || isSending) return;
        const otherParticipant = conversation?.otherParticipant;
        const targetType = conversation?.subjectType === "RENTAL" ? "temporary-rent" : "agency";
        const targetId = conversation?.subjectId || "";
        const targetTitle = otherParticipant?.name || (targetType === "temporary-rent" ? "میزبان اقامتگاه" : "مشاور املاک");

        send(
            {
                conversationId,
                content: "لطفاً نظر و امتیاز خود را درباره عملکرد کارشناس ثبت نمایید.",
                type: "POLL",
                metadata: {
                    isReviewRequest: true,
                    targetType,
                    targetId,
                    targetTitle,
                    requestedAt: new Date().toISOString(),
                },
            },
            {
                onSuccess: () => {
                    toast.success("درخواست ثبت نظر با موفقیت برای کاربر ارسال شد");
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message || "خطا در ارسال درخواست نظر");
                },
            }
        );
    };

    if (!conversationId) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-soft-bg/20 rounded-[40px] border border-soft-border border-dashed">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-secondary mb-6 shadow-sm">
                    <MessageCircle className="w-10 h-10 opacity-20" />
                </div>
                <h3 className="text-xl font-black text-brand mb-2">صندوق پیام</h3>
                <p className="text-secondary max-w-xs leading-relaxed text-sm font-medium">
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
        <div className="h-full flex flex-col bg-white overflow-hidden" dir="rtl">
            {/* Header */}
            <div className="p-3 lg:px-6 lg:py-3.5 border-b border-soft-border bg-white flex items-center justify-between shrink-0 sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="md:hidden p-1.5 -mr-1 rounded-xl hover:bg-soft-bg text-secondary"
                        >
                            <ChevronLeft className="w-5 h-5 rotate-180" />
                        </button>
                    )}
                    <div className="w-10 h-10 bg-soft-bg rounded-2xl flex items-center justify-center text-brand overflow-hidden border border-soft-border shrink-0">
                        {otherParticipant?.avatar ? (
                            <img
                                src={getMediaUrl(otherParticipant.avatar)}
                                alt={otherParticipant.name || "User"}
                                className="w-full h-full object-cover"
                            />
                        ) : conversation?.subjectType === "AGENCY" ? (
                            <Building2 className="w-5 h-5 text-brand/50" />
                        ) : (
                            <User className="w-5 h-5 text-brand/50" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-black text-brand text-sm lg:text-base leading-tight">
                            {otherParticipant?.name || "گفتگو"}
                        </h3>
                        <p className="text-[10px] text-secondary flex items-center gap-1.5 opacity-80 mt-0.5">
                            {conversation?.subjectType === "AGENCY" ? (
                                "مشاور املاک"
                            ) : conversation?.subjectType === "RENTAL" ? (
                                "میزبان اجاره موقت"
                            ) : (
                                <>
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <span>پلتفرم ملک تودی</span>
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {canRequestReview && (
                    <button
                        type="button"
                        onClick={handleRequestReview}
                        disabled={isSending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 text-xs font-bold transition-colors border border-amber-500/20 cursor-pointer"
                        title="ارسال درخواست ثبت نظر و امتیاز به کاربر"
                    >
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        <span className="hidden sm:inline">درخواست ثبت نظر</span>
                    </button>
                )}
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-3 lg:px-6 py-4 space-y-3 custom-scrollbar bg-slate-50/40"
            >
                {hasNextPage && (
                    <div className="flex justify-center pb-2">
                        <button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="text-xs text-brand font-bold bg-white border border-soft-border px-4 py-1.5 rounded-full hover:bg-brand hover:text-white transition-all disabled:opacity-50 shadow-xs"
                        >
                            {isFetchingNextPage ? (
                                <span className="flex items-center gap-1.5">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    در حال دریافت پیام‌های قبلی...
                                </span>
                            ) : (
                                "مشاهده پیام‌های قبلی"
                            )}
                        </button>
                    </div>
                )}

                {messages.map((msg: ChatMessage, idx) => {
                    const isMine = msg.senderId === me?.userId;

                    return (
                        <div
                            key={msg.id || idx}
                            className={cn(
                                "flex flex-col max-w-[85%] sm:max-w-[70%]",
                                isMine ? "mr-auto items-end" : "ml-auto items-start"
                            )}
                        >
                            {/* Message Type: LISTING */}
                            {msg.type === "LISTING" ? (
                                <ListingMessageCard
                                    metadata={msg.metadata as ListingMetadata}
                                    mediaIds={msg.mediaIds}
                                />
                            ) : msg.type === "POLL" || (msg.metadata as any)?.isReviewRequest ? (
                                /* Message Type: REVIEW REQUEST */
                                <ReviewRequestCard
                                    messageId={msg.id}
                                    metadata={msg.metadata as any}
                                    isMine={isMine}
                                    conversationSubjectType={conversation?.subjectType}
                                    conversationSubjectId={conversation?.subjectId}
                                />
                            ) : msg.type === "IMAGE" || (msg.mediaIds && msg.mediaIds.length > 0 && !msg.content) ? (
                                /* Message Type: IMAGE */
                                <div className="space-y-1.5">
                                    <div
                                        className={cn(
                                            "p-1.5 rounded-2xl overflow-hidden border shadow-xs bg-white",
                                            isMine ? "border-brand/20 rounded-br-none" : "border-soft-border rounded-bl-none"
                                        )}
                                    >
                                        {msg.mediaIds?.map((id, mIdx) => (
                                            <a
                                                key={mIdx}
                                                href={getMediaUrl(id)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block max-w-xs max-h-72 rounded-xl overflow-hidden group relative"
                                            >
                                                <img
                                                    src={getMediaUrl(id)}
                                                    alt="Chat Attachment"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                    {msg.content && (
                                        <div
                                            className={cn(
                                                "px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed",
                                                isMine
                                                    ? "bg-brand text-white rounded-br-none"
                                                    : "bg-white text-brand rounded-bl-none border border-soft-border shadow-xs"
                                            )}
                                        >
                                            {msg.content}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Message Type: TEXT or standard */
                                <div
                                    className={cn(
                                        "px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed break-words shadow-xs",
                                        isMine
                                            ? "bg-brand text-white rounded-br-none"
                                            : "bg-white text-brand rounded-bl-none border border-soft-border/90"
                                    )}
                                >
                                    {msg.content}
                                </div>
                            )}

                            <span className="text-[9px] text-secondary mt-1 px-1 opacity-70 flex items-center gap-1 font-medium">
                                <span>{formatTime(msg.createdAt)}</span>
                                {isMine && <CheckCheck className="w-3 h-3 text-brand" />}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Input Bar */}
            <form
                onSubmit={handleSend}
                className="p-3 lg:p-4 bg-white border-t border-soft-border shrink-0 sticky bottom-0 z-20"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                />

                <div className="relative flex items-center bg-soft-bg/30 rounded-2xl border border-soft-border focus-within:border-brand/30 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/5 transition-all p-1.5">
                    {/* Attachment / Image button */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage || isSending}
                        className="p-2 text-secondary hover:text-brand hover:bg-white rounded-xl transition-all disabled:opacity-40"
                        title="ارسال تصویر"
                    >
                        {isUploadingImage ? (
                            <Loader2 className="w-5 h-5 animate-spin text-brand" />
                        ) : (
                            <ImageIcon className="w-5 h-5" />
                        )}
                    </button>

                    {/* Review request button */}
                    {canRequestReview && (
                        <button
                            type="button"
                            onClick={handleRequestReview}
                            disabled={isSending}
                            className="p-2 text-secondary hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all cursor-pointer"
                            title="درخواست ثبت نظر و امتیاز عملکرد"
                        >
                            <Star className="w-5 h-5 text-amber-500" />
                        </button>
                    )}

                    {/* Text input */}
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="پیام خود را بنویسید..."
                        className="flex-1 bg-transparent py-2.5 px-3 text-xs lg:text-sm font-medium outline-none text-brand placeholder:text-secondary/50"
                    />

                    {/* Send button */}
                    <button
                        type="submit"
                        disabled={!message.trim() || isSending}
                        className="p-2.5 bg-brand text-white rounded-xl hover:bg-brand/90 hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:hover:scale-100 shadow-xs"
                    >
                        {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 rotate-180" />
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
