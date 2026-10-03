"use client";

import { useAuth } from "@/hooks/useAuth";
import {
    useActiveTicketTopics,
    useAddTicketReply,
    useCreateTicket,
    useMyTickets,
    useTicket,
    useTicketMessages,
} from "@/hooks/useTicketing";
import { cn, toPersianDigits } from "@/lib/utils";
import {
    TICKET_STATUS_CONFIG,
    Ticket,
    TicketSenderRole,
    TicketStatus,
} from "@/types/api/ticketing.types";
import { formatDistanceToNow } from "date-fns-jalali";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Headphones,
    LifeBuoy,
    Loader2,
    Lock,
    MessageSquare,
    Plus,
    RefreshCw,
    Send,
    Tag,
    X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getCookie } from "cookies-next";
import React, { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

export type WidgetState =
    | "closed"
    | "opening"
    | "topic loading"
    | "topic selection"
    | "message composition"
    | "submitting"
    | "created"
    | "loading conversation"
    | "replying"
    | "success"
    | "error"
    | "closed ticket";

type ActiveTab = "history" | "new" | "conversation";

export function TicketFloatingWidget() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isLoggedIn } = useAuth();

    // Do not show floating widget inside Admin layout or Auth pages
    const isExcludedRoute = pathname.startsWith("/admin") || pathname.startsWith("/auth");

    const [isOpen, setIsOpen] = useState(false);
    const [hasToken, setHasToken] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>("history");
    const [selectedTopicId, setSelectedTopicId] = useState<string>("");
    const [subject, setSubject] = useState("");
    const [initialMessage, setInitialMessage] = useState("");
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyBody, setReplyBody] = useState("");
    const [uiState, setUiState] = useState<WidgetState>("closed");
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        setHasToken(Boolean(getCookie("access_token")));
    }, []);

    const isAuthenticated = isLoggedIn || hasToken;

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const widgetDialogRef = useRef<HTMLDivElement>(null);
    const titleId = useId();

    // Data Queries
    const {
        data: topics,
        isLoading: isTopicsLoading,
        isError: isTopicsError,
        refetch: refetchTopics,
    } = useActiveTicketTopics();

    const {
        data: myTicketsData,
        isLoading: isMyTicketsLoading,
        refetch: refetchMyTickets,
    } = useMyTickets({ limit: 50 });

    const {
        data: currentTicket,
        isLoading: isCurrentTicketLoading,
        refetch: refetchCurrentTicket,
    } = useTicket(selectedTicketId || undefined);

    const {
        data: messagesData,
        isLoading: isMessagesLoading,
        refetch: refetchMessages,
    } = useTicketMessages(selectedTicketId || undefined);

    // Mutations
    const createTicketMutation = useCreateTicket();
    const addReplyMutation = useAddTicketReply(selectedTicketId || undefined);

    const handleCloseWidget = React.useCallback(() => {
        setIsOpen(false);
        setUiState("closed");
        setFormError(null);
        // Clear deep link query param if present
        if (searchParams.get("ticketId")) {
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete("ticketId");
            const newUrl = newParams.toString()
                ? `${pathname}?${newParams.toString()}`
                : pathname;
            router.replace(newUrl, { scroll: false });
        }
    }, [pathname, router, searchParams]);

    // Deep linking: check URL query param ?ticketId=...
    useEffect(() => {
        const ticketIdFromUrl = searchParams.get("ticketId");
        if (ticketIdFromUrl && ticketIdFromUrl !== selectedTicketId) {
            setSelectedTicketId(ticketIdFromUrl);
            setActiveTab("conversation");
            setIsOpen(true);
            setUiState("loading conversation");
        }
    }, [searchParams, selectedTicketId]);

    // Custom window event listener for deep linking
    useEffect(() => {
        const handleOpenEvent = (event: Event) => {
            const customEvent = event as CustomEvent<{ ticketId?: string }>;
            if (customEvent.detail?.ticketId) {
                setSelectedTicketId(customEvent.detail.ticketId);
                setActiveTab("conversation");
            } else {
                setActiveTab("new");
            }
            setIsOpen(true);
        };

        window.addEventListener("melktoday:open-ticket", handleOpenEvent);
        return () => {
            window.removeEventListener("melktoday:open-ticket", handleOpenEvent);
        };
    }, []);

    // Focus & Keyboard Escape handler for accessibility
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                handleCloseWidget();
            }
        };

        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
            // Auto focus widget dialog
            widgetDialogRef.current?.focus();
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, handleCloseWidget]);

    // Auto-scroll messages to bottom when new messages arrive
    useEffect(() => {
        if (activeTab === "conversation" && messagesData?.messages?.length) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messagesData?.messages, activeTab]);

    // Sync UI state for closed tickets
    useEffect(() => {
        if (currentTicket && activeTab === "conversation") {
            if (
                currentTicket.status === TicketStatus.CLOSED ||
                currentTicket.status === TicketStatus.RESOLVED
            ) {
                setUiState("closed ticket");
            } else {
                setUiState("created");
            }
        }
    }, [currentTicket, activeTab]);

    if (isExcludedRoute) {
        return null;
    }

    const handleOpenWidget = () => {
        const isAuthed = isLoggedIn || Boolean(getCookie("access_token"));
        setIsOpen(true);
        setUiState("opening");
        if (!isAuthed) {
            return;
        }

        if (selectedTicketId) {
            setActiveTab("conversation");
        } else if (myTicketsData?.tickets && myTicketsData.tickets.length > 0) {
            setActiveTab("history");
        } else {
            setActiveTab("new");
            setUiState("topic selection");
        }
    };

    const handleSelectTicket = (ticket: Ticket) => {
        setSelectedTicketId(ticket.id);
        setActiveTab("conversation");
        setUiState("loading conversation");
    };

    const handleStartNewTicket = () => {
        setSelectedTicketId(null);
        setSelectedTopicId("");
        setSubject("");
        setInitialMessage("");
        setFormError(null);
        setActiveTab("new");
        setUiState("topic selection");
    };

    const handleCreateTicketSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!selectedTopicId) {
            setFormError("لطفاً یک موضوع برای تیکت خود انتخاب کنید.");
            return;
        }

        const trimmedSubject = subject.trim();
        if (!trimmedSubject || trimmedSubject.length < 3) {
            setFormError("عنوان تیکت باید حداقل ۳ نویسه باشد.");
            return;
        }

        const trimmedMessage = initialMessage.trim();
        if (!trimmedMessage || trimmedMessage.length < 5) {
            setFormError("متن پیام تیکت باید حداقل ۵ نویسه باشد.");
            return;
        }

        try {
            setUiState("submitting");
            const created = await createTicketMutation.mutateAsync({
                topicId: selectedTopicId,
                subject: trimmedSubject,
                initialMessage: trimmedMessage,
            });

            toast.success("تیکت شما با موفقیت ثبت شد");
            setSelectedTicketId(created.id);
            setActiveTab("conversation");
            setUiState("created");
            refetchMyTickets();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "خطا در ثبت تیکت. لطفاً دوباره تلاش کنید.";
            setFormError(message);
            setUiState("error");
            toast.error(message);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicketId) return;

        const trimmedReply = replyBody.trim();
        if (!trimmedReply) return;

        try {
            setUiState("replying");
            await addReplyMutation.mutateAsync({ body: trimmedReply });
            setReplyBody("");
            setUiState("created");
            refetchMessages();
            refetchCurrentTicket();
        } catch (err) {
            setUiState("created");
            const message =
                err instanceof Error ? err.message : "خطا در ارسال پیام. لطفاً دوباره تلاش کنید.";
            toast.error(message);
        }
    };

    const formatTimestamp = (dateStr: string) => {
        try {
            const formatted = formatDistanceToNow(new Date(dateStr), { addSuffix: true });
            return toPersianDigits(formatted);
        } catch {
            return "چند لحظه پیش";
        }
    };

    const isInputDisabled =
        uiState === "closed ticket" ||
        currentTicket?.status === TicketStatus.CLOSED ||
        currentTicket?.status === TicketStatus.RESOLVED ||
        addReplyMutation.isPending;

    return (
        <aside aria-label="پشتیبانی و تیکت">
            {/* ── Floating Support Button (Bottom-Left) ─────────────────────────── */}
            {!isOpen && (
                <div className="fixed bottom-24 lg:bottom-8 left-4 lg:left-8 z-40">
                    <button
                        type="button"
                        onClick={handleOpenWidget}
                        aria-label="پشتیبانی و تیکت"
                        aria-expanded={isOpen}
                        className="group relative flex items-center gap-3 bg-brand text-white px-4 py-3.5 rounded-full shadow-2xl hover:bg-brand/90 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
                    >
                        <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary">
                            <Headphones className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
                        </span>
                        <span className="text-sm font-black hidden sm:inline-block pr-0.5">
                            پشتیبانی و تیکت
                        </span>
                    </button>
                </div>
            )}

            {/* ── Floating Ticket Widget Dialog ─────────────────────────────────── */}
            {isOpen && (
                <div
                    ref={widgetDialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    tabIndex={-1}
                    className="fixed bottom-0 lg:bottom-8 left-0 lg:left-8 w-full sm:w-[440px] h-[85vh] sm:h-[620px] max-h-[92vh] bg-white sm:rounded-3xl shadow-2xl border border-soft-border/80 flex flex-col z-50 overflow-hidden outline-none animate-in fade-in slide-in-from-bottom-6 duration-300"
                    dir="rtl"
                >
                    {/* Header */}
                    <div className="bg-brand text-white p-4 flex items-center justify-between border-b border-white/10 shrink-0">
                        <div className="flex items-center gap-2.5">
                            {activeTab === "conversation" && (
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("history")}
                                    className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                                    aria-label="بازگشت به لیست تیکت‌ها"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                            )}
                            <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center text-primary">
                                <LifeBuoy className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 id={titleId} className="text-sm font-black text-white">
                                    پشتیبانی ملک‌تودی
                                </h3>
                                <p className="text-[11px] text-white/70">
                                    {activeTab === "conversation" && currentTicket
                                        ? currentTicket.topicLabel || "گفت‌وگوی تیکت"
                                        : "ثبت و پیگیری تیکت‌های پشتیبانی"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handleCloseWidget}
                                className="p-2 rounded-2xl hover:bg-white/15 text-white/80 hover:text-white transition-colors"
                                aria-label="بستن پنجره پشتیبانی"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs (if authenticated and not inside conversation) */}
                    {isAuthenticated && activeTab !== "conversation" && (
                        <div className="flex items-center border-b border-soft-border bg-soft-bg/50 p-1.5 gap-1 shrink-0">
                            <button
                                type="button"
                                onClick={() => setActiveTab("history")}
                                className={cn(
                                    "flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                                    activeTab === "history"
                                        ? "bg-white text-brand shadow-sm font-black"
                                        : "text-secondary hover:text-brand"
                                )}
                            >
                                <MessageSquare className="w-4 h-4" />
                                <span>تیکت‌های من</span>
                                {Boolean(myTicketsData?.total) && (
                                    <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-black">
                                        {toPersianDigits(myTicketsData?.total || 0)}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleStartNewTicket}
                                className={cn(
                                    "flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                                    activeTab === "new"
                                        ? "bg-white text-brand shadow-sm font-black"
                                        : "text-secondary hover:text-brand"
                                )}
                            >
                                <Plus className="w-4 h-4 text-primary" />
                                <span>تیکت جدید</span>
                            </button>
                        </div>
                    )}

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-white flex flex-col">
                        {!isAuthenticated ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-4 flex-1">
                                <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
                                    <Lock className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-base font-black text-brand">ورود به حساب کاربری</h4>
                                    <p className="text-xs text-secondary max-w-xs leading-relaxed">
                                        برای ثبت و پیگیری تیکت‌های پشتیبانی، لطفاً ابتدا وارد حساب کاربری خود شوید.
                                    </p>
                                </div>
                                <Link
                                    href={`/auth?redirect=${encodeURIComponent(pathname)}`}
                                    className="w-full max-w-xs py-3 px-4 bg-brand text-white font-black text-sm rounded-2xl hover:bg-brand/90 transition-all text-center shadow-lg"
                                >
                                    ورود یا ثبت‌نام
                                </Link>
                            </div>
                        ) : (
                            <>
                        {/* ── TAB 1: User Ticket History ───────────────────────────── */}
                        {activeTab === "history" && (
                            <div className="space-y-3 flex-1">
                                <div className="flex items-center justify-between pb-1">
                                    <span className="text-xs font-bold text-secondary">
                                        سابقه تیکت‌های شما
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => refetchMyTickets()}
                                        className="text-xs text-primary hover:underline flex items-center gap-1 font-bold"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <span>بروزرسانی</span>
                                    </button>
                                </div>

                                {isMyTicketsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-secondary">
                                        <Loader2 className="w-7 h-7 animate-spin text-primary" />
                                        <span className="text-xs font-bold">
                                            در حال دریافت تیکت‌ها...
                                        </span>
                                    </div>
                                ) : !myTicketsData?.tickets || myTicketsData.tickets.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                                        <div className="w-14 h-14 rounded-3xl bg-soft-bg flex items-center justify-center text-secondary mb-3">
                                            <MessageSquare className="w-7 h-7" />
                                        </div>
                                        <p className="text-sm font-black text-brand mb-1">
                                            تیکتی ثبت نشده است
                                        </p>
                                        <p className="text-xs text-secondary mb-5 max-w-xs">
                                            در صورت وجود هرگونه سوال، پیشنهاد یا گزارش مشکل، می‌توانید تیکت
                                            جدید ثبت کنید.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleStartNewTicket}
                                            className="px-4 py-2.5 rounded-2xl bg-brand text-white text-xs font-black shadow-md hover:bg-brand/90 transition-all flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4 text-primary" />
                                            <span>ثبت اولین تیکت</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {myTicketsData.tickets.map((ticket) => {
                                            const statusCfg =
                                                TICKET_STATUS_CONFIG[ticket.status] ||
                                                TICKET_STATUS_CONFIG[TicketStatus.OPEN];
                                            return (
                                                <button
                                                    key={ticket.id}
                                                    type="button"
                                                    onClick={() => handleSelectTicket(ticket)}
                                                    className="w-full text-right p-3.5 rounded-2xl border border-soft-border/80 hover:border-primary/50 hover:bg-soft-bg/40 transition-all group flex flex-col gap-2 shadow-xs"
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-xs font-bold text-secondary flex items-center gap-1.5 truncate">
                                                            <Tag className="w-3.5 h-3.5 text-primary" />
                                                            {ticket.topicLabel || "پشتیبانی"}
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                "text-[10px] font-black px-2 py-0.5 rounded-full border",
                                                                statusCfg.badgeBg,
                                                                statusCfg.badgeText,
                                                                statusCfg.borderColor
                                                            )}
                                                        >
                                                            {statusCfg.label}
                                                        </span>
                                                    </div>

                                                    <h4 className="text-xs font-black text-brand group-hover:text-primary transition-colors line-clamp-1">
                                                        {ticket.subject}
                                                    </h4>

                                                    <div className="flex items-center justify-between text-[11px] text-secondary/80 pt-1 border-t border-soft-border/50">
                                                        <span>
                                                            بروزرسانی: {formatTimestamp(ticket.updatedAt)}
                                                        </span>
                                                        <span className="text-primary font-bold group-hover:translate-x-[-2px] transition-transform">
                                                            مشاهده گفت‌وگو ←
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── TAB 2: Create New Ticket ─────────────────────────────── */}
                        {activeTab === "new" && (
                            <form
                                onSubmit={handleCreateTicketSubmit}
                                className="space-y-4 flex-1 flex flex-col"
                            >
                                {/* Topic Selection */}
                                <div>
                                    <label
                                        htmlFor="ticket-topic-select"
                                        className="block text-xs font-black text-brand mb-2"
                                    >
                                        ۱. انتخاب موضوع تیکت
                                    </label>
                                    {isTopicsLoading ? (
                                        <div className="py-6 flex items-center justify-center gap-2 text-xs text-secondary">
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                            <span>در حال دریافت موضوعات...</span>
                                        </div>
                                    ) : isTopicsError ? (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-600">
                                            <span>خطا در دریافت موضوعات</span>
                                            <button
                                                type="button"
                                                onClick={() => refetchTopics()}
                                                className="underline font-bold"
                                            >
                                                تلاش مجدد
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2" id="ticket-topic-select">
                                            {topics?.map((t) => {
                                                const isSelected = selectedTopicId === t.id;
                                                return (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedTopicId(t.id);
                                                            setUiState("message composition");
                                                        }}
                                                        className={cn(
                                                            "p-2.5 rounded-2xl border text-right transition-all flex items-center gap-2 text-xs font-bold",
                                                            isSelected
                                                                ? "border-primary bg-primary/10 text-primary font-black shadow-xs"
                                                                : "border-soft-border/80 bg-white text-brand hover:border-soft-border hover:bg-soft-bg/50"
                                                        )}
                                                    >
                                                        <Tag
                                                            className={cn(
                                                                "w-4 h-4 shrink-0",
                                                                isSelected ? "text-primary" : "text-secondary"
                                                            )}
                                                        />
                                                        <span className="truncate">{t.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Subject */}
                                <div>
                                    <label
                                        htmlFor="ticket-subject-input"
                                        className="block text-xs font-black text-brand mb-1.5"
                                    >
                                        ۲. عنوان تیکت
                                    </label>
                                    <input
                                        id="ticket-subject-input"
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="مثال: سوال درباره نحوه ثبت آگهی یا ارتقای اشتراک"
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-2xl border border-soft-border/80 focus:border-primary focus:ring-1 focus:ring-primary text-xs outline-none bg-soft-bg/20 placeholder:text-secondary/50 font-bold"
                                    />
                                </div>

                                {/* Initial Message */}
                                <div className="flex-1 flex flex-col">
                                    <label
                                        htmlFor="ticket-message-input"
                                        className="block text-xs font-black text-brand mb-1.5"
                                    >
                                        ۳. شرح پیام
                                    </label>
                                    <textarea
                                        id="ticket-message-input"
                                        value={initialMessage}
                                        onChange={(e) => setInitialMessage(e.target.value)}
                                        placeholder="لطفاً جزییات درخواست، مشکل یا سوال خود را به طور کامل بنویسید..."
                                        rows={4}
                                        required
                                        className="w-full flex-1 px-3.5 py-2.5 rounded-2xl border border-soft-border/80 focus:border-primary focus:ring-1 focus:ring-primary text-xs outline-none bg-soft-bg/20 placeholder:text-secondary/50 resize-none font-bold min-h-[100px]"
                                    />
                                </div>

                                {formError && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-600 font-bold">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <span>{formError}</span>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={createTicketMutation.isPending}
                                    className="w-full py-3 px-4 rounded-2xl bg-brand text-white font-black text-xs shadow-md hover:bg-brand/90 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {createTicketMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                            <span>در حال ثبت تیکت...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 text-primary" />
                                            <span>ارسال تیکت به پشتیبانی</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* ── TAB 3: Ticket Conversation ───────────────────────────── */}
                        {activeTab === "conversation" && (
                            <div className="flex-1 flex flex-col h-full min-h-0">
                                {/* Ticket Summary Banner */}
                                {currentTicket && (
                                    <div className="p-3 mb-3 rounded-2xl bg-soft-bg/70 border border-soft-border flex flex-col gap-1.5 shrink-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-black text-brand line-clamp-1">
                                                {currentTicket.subject}
                                            </span>
                                            {(() => {
                                                const cfg =
                                                    TICKET_STATUS_CONFIG[currentTicket.status] ||
                                                    TICKET_STATUS_CONFIG[TicketStatus.OPEN];
                                                return (
                                                    <span
                                                        className={cn(
                                                            "text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0",
                                                            cfg.badgeBg,
                                                            cfg.badgeText,
                                                            cfg.borderColor
                                                        )}
                                                    >
                                                        {cfg.label}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-secondary">
                                            <span>موضوع: {currentTicket.topicLabel || "پشتیبانی"}</span>
                                            <span>ثبت: {formatTimestamp(currentTicket.createdAt)}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Message History */}
                                <div className="flex-1 overflow-y-auto space-y-3 pl-1 pr-0.5 pb-2">
                                    {isMessagesLoading || isCurrentTicketLoading ? (
                                        <div className="flex items-center justify-center py-12 gap-2 text-xs text-secondary font-bold">
                                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                            <span>در حال بارگذاری پیام‌ها...</span>
                                        </div>
                                    ) : !messagesData?.messages || messagesData.messages.length === 0 ? (
                                        <div className="text-center py-10 text-xs text-secondary font-bold">
                                            پیامی در این تیکت یافت نشد.
                                        </div>
                                    ) : (
                                        messagesData.messages.map((msg) => {
                                            const isAdmin = msg.senderRole === TicketSenderRole.ADMIN;
                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={cn(
                                                        "flex flex-col max-w-[85%] rounded-2xl p-3 shadow-xs text-xs space-y-1.5",
                                                        isAdmin
                                                            ? "ml-auto bg-soft-bg border border-soft-border text-brand rounded-br-xs"
                                                            : "mr-auto bg-primary text-white rounded-bl-xs"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between gap-3 text-[10px] opacity-80 pb-0.5 border-b border-white/10">
                                                        <span className="font-bold flex items-center gap-1">
                                                            {isAdmin ? (
                                                                <>
                                                                    <LifeBuoy className="w-3 h-3 text-primary" />
                                                                    <span>پشتیبانی ملک‌تودی</span>
                                                                </>
                                                            ) : (
                                                                <span>شما (کاربر)</span>
                                                            )}
                                                        </span>
                                                        <span className="text-[9px]">
                                                            {formatTimestamp(msg.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="whitespace-pre-wrap leading-relaxed font-bold">
                                                        {msg.body}
                                                    </p>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Closed Ticket Notice or Reply Composer */}
                                {currentTicket?.status === TicketStatus.CLOSED ||
                                currentTicket?.status === TicketStatus.RESOLVED ? (
                                    <div className="p-3 bg-gray-100 border border-gray-200 rounded-2xl text-center text-xs text-secondary font-bold flex items-center justify-center gap-2 mt-2">
                                        <Lock className="w-4 h-4 text-gray-500" />
                                        <span>
                                            این تیکت بسته شده است و امکان ارسال پاسخ جدید وجود ندارد.
                                        </span>
                                    </div>
                                ) : (
                                    <form
                                        onSubmit={handleSendReply}
                                        className="pt-2 border-t border-soft-border flex items-center gap-2 shrink-0"
                                    >
                                        <textarea
                                            value={replyBody}
                                            onChange={(e) => setReplyBody(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendReply(e);
                                                }
                                            }}
                                            placeholder="پاسخ خود را بنویسید..."
                                            disabled={isInputDisabled}
                                            rows={1}
                                            className="flex-1 px-3.5 py-2.5 rounded-2xl border border-soft-border focus:border-primary text-xs outline-none bg-soft-bg/30 placeholder:text-secondary/60 resize-none font-bold max-h-24 disabled:opacity-50"
                                        />
                                        <button
                                            type="submit"
                                            disabled={isInputDisabled || !replyBody.trim()}
                                            aria-label="ارسال پاسخ"
                                            className="w-10 h-10 rounded-2xl bg-brand text-white flex items-center justify-center shadow-md hover:bg-brand/90 active:scale-95 disabled:opacity-40 transition-all shrink-0"
                                        >
                                            {addReplyMutation.isPending ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                            ) : (
                                                <Send className="w-4 h-4 text-primary" />
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </aside>
    );
}
