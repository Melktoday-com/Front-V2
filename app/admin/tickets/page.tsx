"use client";

import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import {
    useAdminChangeTicketStatus,
    useAdminReplyTicket,
    useAdminTicket,
    useAdminTicketMessages,
    useAdminTickets,
    useAllTicketTopics,
} from "@/hooks/useTicketing";
import { normalizeApiError } from "@/lib/api/error-handler";
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
    Calendar,
    ChevronDown,
    Filter,
    Headphones,
    LifeBuoy,
    Loader2,
    Lock,
    MessageSquare,
    RefreshCw,
    Search,
    Send,
    ShieldAlert,
    Tag,
    User,
} from "lucide-react";
import React, { useId, useState } from "react";
import { toast } from "sonner";

export default function AdminTicketsPage() {
    const { hasPermission, isSuperAdmin, isLoading: permissionsLoading } =
        useAdminPermissions();

    const canView = isSuperAdmin || hasPermission("tickets.view");
    const canReply = isSuperAdmin || hasPermission("tickets.reply");
    const canManage = isSuperAdmin || hasPermission("tickets.manage");

    // Filters & Pagination
    const [selectedStatus, setSelectedStatus] = useState<TicketStatus | "ALL">("ALL");
    const [selectedTopicId, setSelectedTopicId] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
    const [replyBody, setReplyBody] = useState("");
    const [page, setPage] = useState(1);
    const limit = 20;

    const statusFilterId = useId();
    const topicFilterId = useId();

    // Topics query for filtering
    const { data: topics } = useAllTicketTopics(canView);

    // Tickets query
    const {
        data: ticketsData,
        isLoading: isTicketsLoading,
        isFetching: isTicketsFetching,
        refetch: refetchTickets,
    } = useAdminTickets(
        {
            status: selectedStatus === "ALL" ? undefined : selectedStatus,
            topicId: selectedTopicId === "ALL" ? undefined : selectedTopicId,
            limit,
            offset: (page - 1) * limit,
        },
        canView
    );

    // Selected ticket detail & messages
    const {
        data: activeTicket,
        isLoading: isActiveTicketLoading,
        refetch: refetchActiveTicket,
    } = useAdminTicket(selectedTicketId || undefined, canView);

    const {
        data: messagesData,
        isLoading: isMessagesLoading,
        refetch: refetchMessages,
    } = useAdminTicketMessages(selectedTicketId || undefined, undefined, canView);

    // Mutations
    const replyMutation = useAdminReplyTicket(selectedTicketId || undefined);
    const changeStatusMutation = useAdminChangeTicketStatus(
        selectedTicketId || undefined
    );

    // Handle Reply
    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicketId || !replyBody.trim()) return;

        try {
            await replyMutation.mutateAsync({ body: replyBody.trim() });
            toast.success("پاسخ شما با موفقیت ثبت شد");
            setReplyBody("");
            refetchMessages();
            refetchActiveTicket();
            refetchTickets();
        } catch (err) {
            const errorMsg = normalizeApiError(
                err instanceof Error ? err : String(err),
                "خطا در ارسال پاسخ تیکت"
            );
            toast.error(errorMsg);
        }
    };

    // Handle Status Change
    const handleChangeStatus = async (newStatus: TicketStatus) => {
        if (!selectedTicketId || !canManage) return;

        try {
            await changeStatusMutation.mutateAsync({ status: newStatus });
            toast.success(`وضعیت تیکت به «${TICKET_STATUS_CONFIG[newStatus].label}» تغییر یافت`);
            refetchActiveTicket();
            refetchTickets();
        } catch (err) {
            const errorMsg = normalizeApiError(
                err instanceof Error ? err : String(err),
                "امکان تغییر وضعیت تیکت به وضعیت انتخابی وجود ندارد"
            );
            toast.error(errorMsg);
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

    // Permission check
    if (permissionsLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm font-bold text-secondary">
                    در حال بررسی دسترسی‌ها...
                </span>
            </div>
        );
    }

    if (!canView) {
        return (
            <div className="p-8">
                <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-red-200 text-center shadow-sm">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-4">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-black text-brand mb-2">
                        عدم دسترسی به ماژول تیکتینگ
                    </h3>
                    <p className="text-xs text-secondary leading-relaxed">
                        حساب کاربری شما مجوز مشاهده تیکت‌های پشتیبانی (
                        <code className="text-red-600 bg-red-50 px-1 py-0.5 rounded">
                            tickets.view
                        </code>
                        ) را ندارد. لطفاً با راهبر ارشد سیستم (SuperAdmin) تماس بگیرید.
                    </p>
                </div>
            </div>
        );
    }

    const filteredTickets = (ticketsData?.tickets || []).filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.trim().toLowerCase();
        return (
            t.subject.toLowerCase().includes(q) ||
            t.requesterId.toLowerCase().includes(q) ||
            (t.topicLabel && t.topicLabel.toLowerCase().includes(q))
        );
    });

    return (
        <div className="p-6 lg:p-8 space-y-6" dir="rtl">
            {/* Header & Page Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-soft-border shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <Headphones className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-brand">
                            مدیریت تیکت‌های پشتیبانی
                        </h1>
                        <p className="text-xs text-secondary mt-0.5">
                            پاسخگویی به درخواست‌ها، راهنمایی کاربران و مدیریت وضعیت تیکت‌ها
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            refetchTickets();
                            if (selectedTicketId) {
                                refetchActiveTicket();
                                refetchMessages();
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-soft-border hover:bg-soft-bg text-secondary font-bold text-xs transition-colors"
                    >
                        <RefreshCw
                            className={cn(
                                "w-4 h-4",
                                isTicketsFetching && "animate-spin text-primary"
                            )}
                        />
                        <span>بروزرسانی</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-3xl border border-soft-border flex flex-wrap items-center gap-3 shadow-xs">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="جستجو در عنوان، موضوع یا شناسه..."
                        className="w-full pl-3 pr-10 py-2 rounded-2xl border border-soft-border text-xs outline-none focus:border-primary bg-soft-bg/20 font-bold"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                    <label
                        htmlFor={statusFilterId}
                        className="text-xs font-bold text-secondary flex items-center gap-1"
                    >
                        <Filter className="w-3.5 h-3.5 text-primary" />
                        <span>وضعیت:</span>
                    </label>
                    <select
                        id={statusFilterId}
                        value={selectedStatus}
                        onChange={(e) =>
                            setSelectedStatus(e.target.value as TicketStatus | "ALL")
                        }
                        className="px-3 py-2 rounded-2xl border border-soft-border text-xs font-bold bg-white outline-none focus:border-primary"
                    >
                        <option value="ALL">همه وضعیت‌ها</option>
                        {Object.values(TicketStatus).map((st) => (
                            <option key={st} value={st}>
                                {TICKET_STATUS_CONFIG[st].label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Topic Filter */}
                <div className="flex items-center gap-2">
                    <label
                        htmlFor={topicFilterId}
                        className="text-xs font-bold text-secondary flex items-center gap-1"
                    >
                        <Tag className="w-3.5 h-3.5 text-primary" />
                        <span>موضوع:</span>
                    </label>
                    <select
                        id={topicFilterId}
                        value={selectedTopicId}
                        onChange={(e) => setSelectedTopicId(e.target.value)}
                        className="px-3 py-2 rounded-2xl border border-soft-border text-xs font-bold bg-white outline-none focus:border-primary"
                    >
                        <option value="ALL">همه موضوعات</option>
                        {topics?.map((topic) => (
                            <option key={topic.id} value={topic.id}>
                                {topic.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Master-Detail Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
                {/* Right: Ticket List (Master) */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-soft-border p-4 flex flex-col shadow-xs">
                    <div className="flex items-center justify-between pb-3 mb-2 border-b border-soft-border">
                        <span className="text-xs font-black text-brand">
                            فهرست تیکت‌ها ({toPersianDigits(ticketsData?.total || 0)})
                        </span>
                        {isTicketsLoading && (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                        {isTicketsLoading ? (
                            <div className="py-20 text-center text-xs text-secondary font-bold">
                                در حال دریافت تیکت‌ها...
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="py-20 text-center">
                                <MessageSquare className="w-10 h-10 text-secondary/30 mx-auto mb-2" />
                                <p className="text-xs font-bold text-secondary">
                                    تیکتی با این مشخصات یافت نشد.
                                </p>
                            </div>
                        ) : (
                            filteredTickets.map((ticket) => {
                                const isSelected = selectedTicketId === ticket.id;
                                const statusCfg =
                                    TICKET_STATUS_CONFIG[ticket.status] ||
                                    TICKET_STATUS_CONFIG[TicketStatus.OPEN];

                                return (
                                    <button
                                        key={ticket.id}
                                        type="button"
                                        onClick={() => setSelectedTicketId(ticket.id)}
                                        className={cn(
                                            "w-full text-right p-4 rounded-2xl border transition-all text-xs flex flex-col gap-2 group",
                                            isSelected
                                                ? "border-primary bg-primary/5 shadow-xs"
                                                : "border-soft-border/70 hover:border-soft-border hover:bg-soft-bg/30"
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-bold text-secondary flex items-center gap-1.5 truncate text-[11px]">
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

                                        <h4
                                            className={cn(
                                                "font-black text-xs line-clamp-1 group-hover:text-primary transition-colors",
                                                isSelected ? "text-primary" : "text-brand"
                                            )}
                                        >
                                            {ticket.subject}
                                        </h4>

                                        <div className="flex items-center justify-between text-[10px] text-secondary/80 pt-1 border-t border-soft-border/40">
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3 text-secondary" />
                                                <span className="truncate max-w-[120px]">
                                                    کاربر: {ticket.requesterId.slice(0, 8)}...
                                                </span>
                                            </span>
                                            <span>{formatTimestamp(ticket.updatedAt)}</span>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Left: Ticket Detail & Message History (Detail) */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-soft-border p-6 flex flex-col shadow-xs">
                    {!selectedTicketId ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-24 text-secondary">
                            <div className="w-16 h-16 rounded-3xl bg-soft-bg flex items-center justify-center text-secondary mb-3">
                                <Headphones className="w-8 h-8" />
                            </div>
                            <h3 className="text-sm font-black text-brand mb-1">
                                تیکتی انتخاب نشده است
                            </h3>
                            <p className="text-xs text-secondary max-w-sm">
                                از ستون سمت راست یک تیکت را برای مشاهده سابقه پیام‌ها، پاسخگویی و
                                مدیریت وضعیت انتخاب نمایید.
                            </p>
                        </div>
                    ) : isActiveTicketLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-24 gap-3 text-secondary">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <span className="text-xs font-bold">
                                در حال دریافت اطلاعات تیکت...
                            </span>
                        </div>
                    ) : !activeTicket ? (
                        <div className="text-center py-16 text-xs text-secondary font-bold">
                            اطلاعات تیکت یافت نشد.
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col h-full min-h-0">
                            {/* Ticket Detail Header */}
                            <div className="p-4 rounded-2xl bg-soft-bg/60 border border-soft-border flex flex-col gap-3 mb-4 shrink-0">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-secondary flex items-center gap-1">
                                                <Tag className="w-3.5 h-3.5 text-primary" />
                                                {activeTicket.topicLabel || "پشتیبانی"}
                                            </span>
                                            <span className="text-xs text-secondary">•</span>
                                            <span className="text-xs text-secondary flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                ثبت: {formatTimestamp(activeTicket.createdAt)}
                                            </span>
                                        </div>
                                        <h2 className="text-sm font-black text-brand">
                                            {activeTicket.subject}
                                        </h2>
                                    </div>

                                    {/* Status Badge & Status Changer */}
                                    <div className="flex items-center gap-2">
                                        {canManage ? (
                                            <div className="relative">
                                                <select
                                                    value={activeTicket.status}
                                                    onChange={(e) =>
                                                        handleChangeStatus(
                                                            e.target.value as TicketStatus
                                                        )
                                                    }
                                                    disabled={changeStatusMutation.isPending}
                                                    className={cn(
                                                        "text-xs font-black px-3 py-1.5 rounded-xl border appearance-none pr-3 pl-7 cursor-pointer outline-none transition-all",
                                                        TICKET_STATUS_CONFIG[activeTicket.status]
                                                            .badgeBg,
                                                        TICKET_STATUS_CONFIG[activeTicket.status]
                                                            .badgeText,
                                                        TICKET_STATUS_CONFIG[activeTicket.status]
                                                            .borderColor
                                                    )}
                                                >
                                                    {Object.values(TicketStatus).map((st) => (
                                                        <option key={st} value={st}>
                                                            {TICKET_STATUS_CONFIG[st].label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                                            </div>
                                        ) : (
                                            <span
                                                className={cn(
                                                    "text-xs font-black px-3 py-1.5 rounded-xl border",
                                                    TICKET_STATUS_CONFIG[activeTicket.status]
                                                        .badgeBg,
                                                    TICKET_STATUS_CONFIG[activeTicket.status]
                                                        .badgeText,
                                                    TICKET_STATUS_CONFIG[activeTicket.status]
                                                        .borderColor
                                                )}
                                            >
                                                {TICKET_STATUS_CONFIG[activeTicket.status].label}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-[11px] text-secondary flex items-center gap-4 border-t border-soft-border/50 pt-2">
                                    <span>
                                        شناسه کاربر:{" "}
                                        <code className="text-brand font-mono font-bold">
                                            {activeTicket.requesterId}
                                        </code>
                                    </span>
                                    <span>
                                        بروزرسانی: {formatTimestamp(activeTicket.updatedAt)}
                                    </span>
                                </div>
                            </div>

                            {/* Messages Timeline */}
                            <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-soft-bg/20 rounded-2xl border border-soft-border/50 mb-4 min-h-[240px]">
                                {isMessagesLoading ? (
                                    <div className="flex items-center justify-center py-16 gap-2 text-xs text-secondary font-bold">
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                        <span>در حال بارگذاری پیام‌ها...</span>
                                    </div>
                                ) : !messagesData?.messages ||
                                  messagesData.messages.length === 0 ? (
                                    <div className="text-center py-16 text-xs text-secondary font-bold">
                                        پیامی ثبت نشده است.
                                    </div>
                                ) : (
                                    messagesData.messages.map((msg) => {
                                        const isAdmin =
                                            msg.senderRole === TicketSenderRole.ADMIN;
                                        return (
                                            <div
                                                key={msg.id}
                                                className={cn(
                                                    "flex flex-col max-w-[80%] rounded-2xl p-3.5 shadow-xs text-xs space-y-1.5",
                                                    isAdmin
                                                        ? "mr-auto bg-brand text-white rounded-bl-xs"
                                                        : "ml-auto bg-white border border-soft-border text-brand rounded-br-xs"
                                                )}
                                            >
                                                <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 border-b border-white/10 pb-1">
                                                    <span className="font-black flex items-center gap-1">
                                                        {isAdmin ? (
                                                            <>
                                                                <LifeBuoy className="w-3 h-3 text-primary" />
                                                                <span>پاسخ پشتیبان</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <User className="w-3 h-3 text-secondary" />
                                                                <span>کاربر (درخواست‌کننده)</span>
                                                            </>
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
                            </div>

                            {/* Reply Composer */}
                            {activeTicket.status === TicketStatus.CLOSED ? (
                                <div className="p-3.5 rounded-2xl bg-gray-100 border border-gray-200 text-center text-xs text-secondary font-bold flex items-center justify-center gap-2">
                                    <Lock className="w-4 h-4 text-gray-500" />
                                    <span>
                                        این تیکت بسته شده است. برای ارسال پاسخ ابتدا وضعیت آن را تغییر دهید.
                                    </span>
                                </div>
                            ) : canReply ? (
                                <form
                                    onSubmit={handleSendReply}
                                    className="flex items-end gap-2 pt-2 border-t border-soft-border"
                                >
                                    <div className="flex-1">
                                        <textarea
                                            value={replyBody}
                                            onChange={(e) => setReplyBody(e.target.value)}
                                            placeholder="پاسخ ادمین به تیکت را اینجا بنویسید..."
                                            rows={3}
                                            disabled={replyMutation.isPending}
                                            className="w-full px-3.5 py-2.5 rounded-2xl border border-soft-border focus:border-primary text-xs outline-none bg-soft-bg/30 placeholder:text-secondary/60 resize-none font-bold disabled:opacity-50"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={replyMutation.isPending || !replyBody.trim()}
                                        className="h-10 px-5 rounded-2xl bg-brand text-white font-black text-xs shadow-md hover:bg-brand/90 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-2 shrink-0 mb-1"
                                    >
                                        {replyMutation.isPending ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 text-primary" />
                                                <span>ارسال پاسخ</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-700 font-bold flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>
                                        شما مجوز ارسال پاسخ به تیکت‌ها (<code>tickets.reply</code>) را
                                        ندارید.
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
