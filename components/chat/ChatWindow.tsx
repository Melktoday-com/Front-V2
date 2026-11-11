"use client";

import { RoleName } from "@/types/access";
import { useAuth } from "@/hooks/useAuth";
import {
    useConversation,
    useDeleteMessage,
    useEditMessage,
    useMessages,
    useSendMessage,
} from "@/hooks/useChat";
import { useMeProfile } from "@/hooks/useUser";
import { cn, getMediaUrl } from "@/lib/utils";
import {
    ChatMessage,
    ListingMetadata,
    ReplyMetadata,
} from "@/services/chat.service";
import { mediaService } from "@/services/media.service";
import {
    ArrowRight,
    Building2,
    Check,
    CheckCheck,
    ChevronRight,
    Copy,
    Edit2,
    Image as ImageIcon,
    Loader2,
    MessageCircle,
    Reply,
    Send,
    Star,
    Trash2,
    User,
    X,
} from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { ListingMessageCard } from "./ListingMessageCard";
import { ReviewRequestCard } from "./ReviewRequestCard";
import {
    formatFullDateTime,
    formatMessageDate,
    formatMessageTime,
    shouldShowDateSeparator,
} from "./chat-date.utils";

/**
 * Message retract / edit window: 1 hour in milliseconds
 * Matches backend MESSAGE_RETRACT_WINDOW_MS
 */
const MESSAGE_RETRACT_WINDOW_MS = 60 * 60 * 1000;

interface ChatWindowProps {
    conversationId: string | null;
    onBack?: () => void;
}

export function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
    const [message, setMessage] = useState("");
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
    const [activeMenuMessageId, setActiveMenuMessageId] = useState<string | null>(null);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const [messageIdToDelete, setMessageIdToDelete] = useState<string | null>(null);

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
    const editMutation = useEditMessage();
    const deleteMutation = useDeleteMessage();

    // Flatten pages of messages (reverse for chronological bottom-to-top rendering)
    const messages = data?.pages.flatMap((page) => page).reverse() || [];

    // Scroll to bottom on initial load and when new messages arrive
    useEffect(() => {
        if (scrollRef.current && !isFetchingNextPage) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages.length, isFetchingNextPage]);

    // Close open message actions menu when clicking anywhere outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest("[data-message-menu]") && !target.closest("[data-message-bubble]")) {
                setActiveMenuMessageId(null);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    // Auto-resize bottom textarea as user types
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [message]);

    const scrollToMessage = (targetId: string) => {
        const el = document.getElementById(`msg-${targetId}`);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            setHighlightedMessageId(targetId);
            setTimeout(() => {
                setHighlightedMessageId((curr) => (curr === targetId ? null : curr));
            }, 1500);
        } else {
            toast.info("پیام ارجاع داده شده در لیست حاضر یافت نشد");
        }
    };

    const handleStartEdit = (msg: ChatMessage) => {
        setActiveMenuMessageId(null);
        setReplyingTo(null);
        setEditingMessage({
            id: msg.id,
            content: msg.content || "",
        });
        setMessage(msg.content || "");
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.selectionStart = textareaRef.current.value.length;
                textareaRef.current.selectionEnd = textareaRef.current.value.length;
            }
        }, 50);
    };

    const handleCancelEdit = () => {
        setEditingMessage(null);
        setMessage("");
    };

    const handleStartReply = (msg: ChatMessage) => {
        setActiveMenuMessageId(null);
        setEditingMessage(null);
        setReplyingTo(msg);
        setTimeout(() => {
            textareaRef.current?.focus();
        }, 50);
    };

    const handleCancelReply = () => {
        setReplyingTo(null);
    };

    const handleCopy = (content?: string | null) => {
        setActiveMenuMessageId(null);
        if (!content) return;
        navigator.clipboard.writeText(content);
        toast.success("متن پیام در کلیپ‌بورد کپی شد");
    };

    const handleDelete = (messageId: string) => {
        setActiveMenuMessageId(null);
        setMessageIdToDelete(messageId);
    };

    const confirmDelete = () => {
        if (!conversationId || !messageIdToDelete) return;
        const targetId = messageIdToDelete;
        deleteMutation.mutate(
            { conversationId, messageId: targetId },
            {
                onSuccess: () => {
                    toast.success("پیام حذف شد");
                    if (editingMessage?.id === targetId) {
                        handleCancelEdit();
                    }
                    if (replyingTo?.id === targetId) {
                        handleCancelReply();
                    }
                    setMessageIdToDelete(null);
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message || "خطا در حذف پیام");
                    setMessageIdToDelete(null);
                },
            }
        );
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!conversationId) return;

        const trimmed = message.trim();

        // 1. If currently in EDIT mode
        if (editingMessage) {
            if (!trimmed) {
                toast.error("متن پیام نمی‌تواند خالی باشد");
                return;
            }
            if (trimmed === editingMessage.content.trim()) {
                handleCancelEdit();
                return;
            }
            editMutation.mutate(
                {
                    conversationId,
                    messageId: editingMessage.id,
                    content: trimmed,
                },
                {
                    onSuccess: () => {
                        handleCancelEdit();
                        toast.success("پیام با موفقیت ویرایش شد");
                    },
                    onError: (err: any) => {
                        toast.error(err?.response?.data?.message || "خطا در ویرایش پیام");
                    },
                }
            );
            return;
        }

        // 2. Normal send or Reply
        if (!trimmed || isSending) return;

        let metadataToSend: Record<string, any> | undefined = undefined;
        if (replyingTo) {
            const targetSenderName =
                replyingTo.senderId === me?.userId
                    ? "شما"
                    : otherParticipant?.name || "کاربر";

            let snippet = replyingTo.content || "";
            if (!snippet) {
                if (replyingTo.type === "IMAGE") snippet = "📷 تصویر";
                else if (replyingTo.type === "LISTING") snippet = "🏠 آگهی ملک";
                else if (replyingTo.type === "POLL") snippet = "📊 نظرسنجی";
                else snippet = "پیام";
            }

            metadataToSend = {
                replyTo: {
                    id: replyingTo.id,
                    senderId: replyingTo.senderId,
                    senderName: targetSenderName,
                    content: snippet,
                    type: replyingTo.type,
                },
            };
        }

        send(
            {
                conversationId,
                content: trimmed,
                type: "TEXT",
                metadata: metadataToSend,
            },
            {
                onSuccess: () => {
                    setMessage("");
                    setReplyingTo(null);
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message || "خطا در ارسال پیام");
                },
            }
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === "Escape") {
            if (editingMessage) {
                handleCancelEdit();
            } else if (replyingTo) {
                handleCancelReply();
            }
        }
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

            let metadataToSend: Record<string, any> | undefined = undefined;
            if (replyingTo) {
                const targetSenderName =
                    replyingTo.senderId === me?.userId
                        ? "شما"
                        : otherParticipant?.name || "کاربر";

                let snippet = replyingTo.content || "";
                if (!snippet) {
                    if (replyingTo.type === "IMAGE") snippet = "📷 تصویر";
                    else if (replyingTo.type === "LISTING") snippet = "🏠 آگهی ملک";
                    else if (replyingTo.type === "POLL") snippet = "📊 نظرسنجی";
                    else snippet = "پیام";
                }

                metadataToSend = {
                    replyTo: {
                        id: replyingTo.id,
                        senderId: replyingTo.senderId,
                        senderName: targetSenderName,
                        content: snippet,
                        type: replyingTo.type,
                    },
                };
            }

            send(
                {
                    conversationId,
                    mediaIds: [mediaId],
                    type: "IMAGE",
                    content: message.trim() || undefined,
                    metadata: metadataToSend,
                },
                {
                    onSuccess: () => {
                        toast.success("تصویر ارسال شد");
                        setMessage("");
                        setReplyingTo(null);
                    },
                    onError: () => {
                        toast.error("خطا در ارسال تصویر");
                    },
                }
            );
        } catch {
            toast.error("خطا در بارگذاری تصویر");
        } finally {
            setIsUploadingImage(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const isServiceRole =
        activeRole === RoleName.Agent ||
        activeRole === RoleName.Landlord ||
        activeRole === RoleName.Admin ||
        activeRole === RoleName.SuperAdmin;

    const canRequestReview =
        isServiceRole &&
        (conversation?.subjectType === "AGENCY" || conversation?.subjectType === "RENTAL");

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
                <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center text-secondary mb-6 shadow-sm">
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
        <div className="h-full flex flex-col bg-surface overflow-hidden" dir="rtl">
            {/* Header */}
            <div className="p-3 lg:px-6 lg:py-3.5 border-b border-soft-border bg-surface flex items-center justify-between shrink-0 sticky top-0 z-20">
                <div className="flex items-center gap-2.5 sm:gap-3">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="md:hidden p-1.5 -mr-1 text-text-light hover:text-brand hover:bg-soft-bg/60 rounded-xl transition-colors shrink-0 cursor-pointer"
                            title="بازگشت به لیست گفتگوها"
                            aria-label="بازگشت به لیست گفتگوها"
                        >
                            <ChevronRight className="w-6 h-6" />
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
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-3 lg:px-6 py-4 space-y-3 custom-scrollbar bg-surface-secondary/40"
            >
                {hasNextPage && (
                    <div className="flex justify-center pb-2">
                        <button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="text-xs text-brand font-bold bg-surface border border-soft-border px-4 py-1.5 rounded-full hover:bg-brand hover:text-white transition-all disabled:opacity-50 shadow-xs cursor-pointer"
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
                    const prevMsg = idx > 0 ? messages[idx - 1] : null;
                    const showDateDivider = shouldShowDateSeparator(msg.createdAt, prevMsg?.createdAt);
                    const isMine = msg.senderId === me?.userId;
                    const isWithinRetract =
                        Date.now() - new Date(msg.createdAt).getTime() <= MESSAGE_RETRACT_WINDOW_MS;
                    const isReviewReq =
                        msg.type === "POLL" || Boolean((msg.metadata as any)?.isReviewRequest);
                    const isReviewSubmitted = Boolean((msg.metadata as any)?.isSubmitted);
                    const canEdit =
                        isMine &&
                        !msg.isDeleted &&
                        msg.type !== "POLL" &&
                        isWithinRetract;
                    const canDelete =
                        isMine &&
                        !msg.isDeleted &&
                        isWithinRetract &&
                        (!isReviewReq || !isReviewSubmitted);
                    const canReply = !msg.isDeleted;
                    const canCopy = Boolean(msg.content && !msg.isDeleted);
                    const hasAnyAction = canReply || canEdit || canCopy || canDelete;

                    const replyData = (msg.metadata as any)?.replyTo as ReplyMetadata | undefined;

                    return (
                        <Fragment key={msg.id || idx}>
                            {showDateDivider && (
                                <div className="flex justify-center py-1 select-none">
                                    <span className="inline-flex items-center text-[11px] font-bold text-secondary/90 bg-surface border border-soft-border/80 px-3 py-1 rounded-full shadow-xs">
                                        {formatMessageDate(msg.createdAt)}
                                    </span>
                                </div>
                            )}

                            <div
                                id={`msg-${msg.id}`}
                                data-message-bubble
                            onClick={() => {
                                if (hasAnyAction) {
                                    setActiveMenuMessageId((curr) => (curr === msg.id ? null : msg.id));
                                }
                            }}
                            className={cn(
                                "group relative flex flex-col max-w-[85%] sm:max-w-[70%] transition-all duration-300 rounded-2xl select-text cursor-pointer",
                                isMine ? "mr-auto items-end" : "ml-auto items-start",
                                highlightedMessageId === msg.id && "ring-2 ring-brand ring-offset-2 scale-[1.01] animate-pulse"
                            )}
                        >
                            {/* Desktop Quick Action Bar (on hover) */}
                            {hasAnyAction && (
                                <div
                                    className={cn(
                                        "hidden md:group-hover:flex items-center gap-0.5 bg-surface border border-soft-border rounded-xl px-1 py-0.5 shadow-sm transition-all z-10",
                                        "absolute -top-3.5",
                                        isMine ? "left-2" : "right-2"
                                    )}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {canReply && (
                                        <button
                                            type="button"
                                            onClick={() => handleStartReply(msg)}
                                            title="پاسخ"
                                            className="p-1 hover:text-brand hover:bg-soft-bg rounded-lg transition-colors text-secondary cursor-pointer"
                                        >
                                            <Reply className="w-3.5 h-3.5 -scale-x-100" />
                                        </button>
                                    )}
                                    {canEdit && (
                                        <button
                                            type="button"
                                            onClick={() => handleStartEdit(msg)}
                                            title="ویرایش"
                                            className="p-1 hover:text-brand hover:bg-soft-bg rounded-lg transition-colors text-secondary cursor-pointer"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    {canCopy && (
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(msg.content)}
                                            title="کپی متن"
                                            className="p-1 hover:text-brand hover:bg-soft-bg rounded-lg transition-colors text-secondary cursor-pointer"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(msg.id)}
                                            title="حذف پیام"
                                            className="p-1 hover:text-error hover:bg-error/10 rounded-lg transition-colors text-secondary cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Mobile / Clicked Context Menu Popover */}
                            {activeMenuMessageId === msg.id && hasAnyAction && (
                                <div
                                    data-message-menu
                                    className={cn(
                                        "absolute z-30 flex items-center gap-0.5 p-1 bg-surface border border-soft-border rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md",
                                        idx === 0 ? "top-full mt-1.5" : "bottom-full mb-1.5",
                                        isMine ? "left-0" : "right-0"
                                    )}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {canReply && (
                                        <button
                                            type="button"
                                            onClick={() => handleStartReply(msg)}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-soft-bg rounded-xl text-xs font-bold text-brand transition-colors cursor-pointer"
                                        >
                                            <Reply className="w-3.5 h-3.5 -scale-x-100" />
                                            <span>پاسخ</span>
                                        </button>
                                    )}
                                    {canEdit && (
                                        <button
                                            type="button"
                                            onClick={() => handleStartEdit(msg)}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-soft-bg rounded-xl text-xs font-bold text-brand transition-colors cursor-pointer"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                            <span>ویرایش</span>
                                        </button>
                                    )}
                                    {canCopy && (
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(msg.content)}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-soft-bg rounded-xl text-xs font-bold text-secondary hover:text-brand transition-colors cursor-pointer"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>کپی</span>
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(msg.id)}
                                            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-error/10 rounded-xl text-xs font-bold text-error transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>حذف</span>
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Bubble Contents */}
                            {msg.isDeleted ? (
                                <div className="px-3.5 py-2 rounded-2xl text-[12px] italic text-secondary/70 bg-surface border border-dashed border-soft-border shadow-xs flex items-center gap-1.5">
                                    <Trash2 className="w-3.5 h-3.5 opacity-60" />
                                    <span>این پیام حذف شده است</span>
                                </div>
                            ) : msg.type === "LISTING" ? (
                                <div onClick={(e) => e.stopPropagation()}>
                                    <ListingMessageCard
                                        metadata={msg.metadata as ListingMetadata}
                                        mediaIds={msg.mediaIds}
                                    />
                                </div>
                            ) : msg.type === "POLL" || (msg.metadata as any)?.isReviewRequest ? (
                                <div onClick={(e) => e.stopPropagation()}>
                                    <ReviewRequestCard
                                        messageId={msg.id}
                                        conversationId={conversationId}
                                        createdAt={msg.createdAt}
                                        metadata={msg.metadata as any}
                                        isMine={isMine}
                                        conversationSubjectType={conversation?.subjectType}
                                        conversationSubjectId={conversation?.subjectId}
                                        onDelete={handleDelete}
                                    />
                                </div>
                            ) : (
                                <div
                                    className={cn(
                                        "p-2.5 sm:p-3 rounded-2xl text-[13px] leading-relaxed shadow-xs transition-all",
                                        isMine
                                            ? "bg-brand text-white rounded-br-none"
                                            : "bg-surface text-brand rounded-bl-none border border-soft-border/90"
                                    )}
                                >
                                    {/* Quoted / Replied message preview inside bubble */}
                                    {replyData && (
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                scrollToMessage(replyData.id);
                                            }}
                                            title="رفتن به پیام اصلی"
                                            className={cn(
                                                "group/reply mb-2 px-2.5 py-1.5 rounded-xl flex items-stretch gap-2.5 cursor-pointer select-none transition-all duration-150 min-w-[140px] max-w-full",
                                                isMine
                                                    ? "bg-white/10 hover:bg-white/15 active:bg-white/20 backdrop-blur-[2px]"
                                                    : "bg-brand/[0.04] hover:bg-brand/[0.08] active:bg-brand/[0.12] border border-soft-border/80"
                                            )}
                                        >
                                            {/* Vertical accent bar */}
                                            <span
                                                className={cn(
                                                    "w-1 rounded-full shrink-0 my-0.5 transition-colors",
                                                    isMine ? "bg-teal-300" : "bg-brand"
                                                )}
                                            />
                                            <div className="min-w-0 flex-1 py-0.5 text-right">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    {replyData.type === "IMAGE" ? (
                                                        <ImageIcon className={cn("w-3 h-3 shrink-0", isMine ? "text-teal-300" : "text-brand")} />
                                                    ) : replyData.type === "LISTING" ? (
                                                        <Building2 className={cn("w-3 h-3 shrink-0", isMine ? "text-teal-300" : "text-brand")} />
                                                    ) : (
                                                        <Reply
                                                            className={cn(
                                                                "w-3 h-3 shrink-0 -scale-x-100 transition-transform group-hover/reply:-translate-x-0.5",
                                                                isMine ? "text-teal-300" : "text-brand"
                                                            )}
                                                        />
                                                    )}
                                                    <span
                                                        className={cn(
                                                            "font-bold text-[11px] leading-tight truncate",
                                                            isMine ? "text-teal-300" : "text-brand"
                                                        )}
                                                    >
                                                        {replyData.senderName || "پیام"}
                                                    </span>
                                                </div>
                                                <div
                                                    className={cn(
                                                        "text-[11px] leading-snug truncate opacity-90",
                                                        isMine ? "text-white" : "text-secondary"
                                                    )}
                                                >
                                                    {replyData.content || "مشاهده پیام"}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Image Attachment (if IMAGE type) */}
                                    {msg.mediaIds && msg.mediaIds.length > 0 && (
                                        <div className="mb-2 space-y-1 rounded-xl overflow-hidden">
                                            {msg.mediaIds.map((id, mIdx) => (
                                                <a
                                                    key={mIdx}
                                                    href={getMediaUrl(id)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
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
                                    )}

                                    {/* Message Text */}
                                    {msg.content && (
                                        <div className="break-words whitespace-pre-wrap">
                                            {msg.content}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Timestamp & Status Indicator */}
                            <span
                                title={formatFullDateTime(msg.createdAt)}
                                className="text-[9px] text-secondary mt-1 px-1 opacity-70 flex items-center gap-1 font-medium select-none"
                            >
                                <span>{formatMessageTime(msg.createdAt)}</span>
                                {msg.isEdited && <span className="text-[9px] text-secondary/80">(ویرایش شده)</span>}
                                {isMine && <CheckCheck className="w-3 h-3 text-brand" />}
                            </span>
                        </div>
                    </Fragment>
                );
            })}
            </div>

            {/* Unified Bottom Input Bar */}
            <form
                onSubmit={handleSubmit}
                className="p-2.5 sm:p-3 lg:p-4 bg-surface border-t border-soft-border shrink-0 sticky bottom-0 z-20"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                />

                <div className="max-w-4xl mx-auto w-full">
                    {/* Unified Card Container (Zero Outline / Ring on Focus) */}
                    <div className="relative flex flex-col bg-soft-bg/35 hover:bg-soft-bg/50 focus-within:bg-surface rounded-2xl border border-soft-border focus-within:border-brand/35 transition-all duration-200 shadow-xs overflow-hidden outline-none ring-0 focus:outline-none focus:ring-0 focus-within:outline-none focus-within:ring-0">
                        {/* Banner: Edit or Reply Mode */}
                        {(editingMessage || replyingTo) && (
                            <div className="flex items-center justify-between px-3.5 py-2 bg-soft-bg/80 border-b border-soft-border/80 text-xs animate-in slide-in-from-bottom-2 duration-150">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="w-1 h-7.5 bg-brand rounded-full shrink-0" />
                                    {editingMessage ? (
                                        <Edit2 className="w-4 h-4 text-brand shrink-0" />
                                    ) : (
                                        <Reply className="w-4 h-4 text-brand shrink-0 -scale-x-100" />
                                    )}
                                    <div className="min-w-0 flex-1 text-right">
                                        <div className="text-xs font-bold text-brand flex items-center gap-1.5">
                                            {editingMessage ? (
                                                <span>ویرایش پیام</span>
                                            ) : (
                                                <span>
                                                    پاسخ به{" "}
                                                    <span className="text-brand font-black">
                                                        {replyingTo?.senderId === me?.userId
                                                            ? "خودتان"
                                                            : otherParticipant?.name || "کاربر"}
                                                    </span>
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-secondary truncate opacity-85 mt-0.5 max-w-md">
                                            {editingMessage
                                                ? editingMessage.content
                                                : replyingTo?.content ||
                                                  (replyingTo?.type === "IMAGE"
                                                      ? "📷 تصویر"
                                                      : replyingTo?.type === "LISTING"
                                                      ? "🏠 آگهی ملک"
                                                      : replyingTo?.type === "POLL"
                                                      ? "📊 نظرسنجی"
                                                      : "پیام")}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={editingMessage ? handleCancelEdit : handleCancelReply}
                                    className="p-1.5 text-secondary hover:text-brand hover:bg-surface rounded-xl transition-colors shrink-0 cursor-pointer"
                                    title="انصراف (Esc)"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Input Row */}
                        <div className="flex items-end p-1.5 gap-1.5">
                            {/* Media Attachment & Actions: Hidden when input has text or editing */}
                            {!message.trim() && !editingMessage && (
                                <div className="flex items-center gap-0.5 animate-in fade-in duration-200 shrink-0">
                                    {/* Image upload button */}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploadingImage || isSending}
                                        className="p-2 text-secondary hover:text-brand hover:bg-surface rounded-xl transition-all disabled:opacity-40 shrink-0 cursor-pointer"
                                        title="ارسال تصویر"
                                    >
                                        {isUploadingImage ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-brand" />
                                        ) : (
                                            <ImageIcon className="w-5 h-5" />
                                        )}
                                    </button>

                                    {/* Review request button: strictly for service roles (agent/landlord/admin) */}
                                    {canRequestReview && (
                                        <button
                                            type="button"
                                            onClick={handleRequestReview}
                                            disabled={isSending}
                                            className="p-2 text-secondary hover:text-warning hover:bg-warning-subtle rounded-xl transition-all cursor-pointer shrink-0"
                                            title="درخواست ثبت نظر و امتیاز عملکرد"
                                        >
                                            <Star className="w-5 h-5 text-amber-500" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Auto-resizing textarea with zero focus outline */}
                            <textarea
                                ref={textareaRef}
                                rows={1}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={editingMessage ? "متن ویرایش شده را وارد کنید..." : "پیام خود را بنویسید..."}
                                className="flex-1 bg-transparent py-2.5 px-3 text-xs lg:text-sm font-medium outline-none border-none ring-0 shadow-none focus:outline-none focus:border-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-brand placeholder:text-secondary/50 resize-none max-h-36 custom-scrollbar leading-relaxed"
                                style={{ outline: "none", boxShadow: "none" }}
                            />

                            {/* Action / Send button with world-class state transitions */}
                            <button
                                type="submit"
                                disabled={(!message.trim() && !editingMessage) || isSending || editMutation.isPending}
                                className={cn(
                                    "p-2.5 rounded-xl transition-all duration-200 shadow-xs shrink-0 flex items-center justify-center",
                                    message.trim() || editingMessage
                                        ? "bg-brand text-white hover:bg-brand/90 hover:scale-105 active:scale-95 opacity-100 cursor-pointer"
                                        : "bg-soft-bg text-secondary/30 opacity-40 cursor-not-allowed scale-95"
                                )}
                                title={editingMessage ? "تأیید ویرایش (Enter)" : "ارسال پیام (Enter)"}
                            >
                                {isSending || editMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : editingMessage ? (
                                    <Check className="w-4 h-4 stroke-[2.5]" />
                                ) : (
                                    <Send className="w-4 h-4 rotate-180" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Persian Confirmation Modal for Message Deletion */}
            <DeleteConfirmModal
                isOpen={!!messageIdToDelete}
                onClose={() => setMessageIdToDelete(null)}
                onConfirm={confirmDelete}
                isLoading={deleteMutation.isPending}
                title="حذف پیام"
                description="آیا از حذف این پیام اطمینان دارید؟ این پیام برای هر دو طرف حذف خواهد شد."
            />
        </div>
    );
}
