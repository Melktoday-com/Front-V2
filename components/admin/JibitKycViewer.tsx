"use client";

import React, { useState } from "react";
import {
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Copy,
    Check,
    Building2,
    User,
    Calendar,
    Phone,
    MapPin,
    FileText,
    Hash,
    BadgeCheck,
    Clock,
} from "lucide-react";
import { cn, toPersianDigits } from "@/lib/utils";
import { toast } from "sonner";

export interface JibitKycViewerProps {
    kycDetails?: Record<string, any> | null;
    applicantInfo?: {
        fullName?: string;
        nationalCode?: string;
        guildCode?: string;
        phone?: string;
        agentType?: string;
    };
    className?: string;
}

export function JibitKycViewer({ kycDetails, applicantInfo, className }: JibitKycViewerProps) {
    const [showRawJson, setShowRawJson] = useState(false);
    const [copied, setCopied] = useState(false);

    // If no KYC data at all
    if (!kycDetails || Object.keys(kycDetails).length === 0 || kycDetails.message) {
        return (
            <div
                className={cn(
                    "p-4 rounded-2xl border border-dashed border-border-subtle bg-surface-secondary/50 text-center space-y-2",
                    className
                )}
            >
                <div className="w-9 h-9 mx-auto rounded-full bg-surface-secondary flex items-center justify-center text-foreground-muted">
                    <Clock className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-foreground">اطلاعات استعلام جیبیت ثبت نشده است</div>
                <p className="text-[11px] text-foreground-muted">
                    استعلام هوشمند برای این درخواست هنوز انجام نشده یا اطلاعات در پایگاه داده ذخیره نگردیده است.
                </p>
            </div>
        );
    }

    const provider = kycDetails.provider || (kycDetails.matched !== undefined ? "JIBIT_SHAHKAR" : "JIBIT_GUILD");
    const isShahkar = provider === "JIBIT_SHAHKAR" || (kycDetails.matched !== undefined && !kycDetails.guildCode && !kycDetails.boardTitle);

    // Extract Guild / Corporation Fields
    const info = (kycDetails.info || {}) as Record<string, any>;
    const raw = (info.raw || {}) as Record<string, any>;
    const userInfo = (info.userInfo || raw.userInfo || {}) as Record<string, any>;
    const firstLicense = (info.licenses?.[0] || raw.licenses?.[0] || {}) as Record<string, any>;
    const businessInfo = (firstLicense.businessInfo || {}) as Record<string, any>;

    const guildCode =
        kycDetails.guildCode ||
        info.guildCode ||
        info.code ||
        firstLicense.licenseNumber ||
        applicantInfo?.guildCode ||
        "-";

    const senfCode =
        kycDetails.senfCode ||
        info.senfCode ||
        firstLicense.senf?.senfCode ||
        raw.senfCode ||
        "-";

    const isRealEstateSenfCode = String(senfCode).trim() === "5900";

    const boardTitle =
        kycDetails.boardTitle ||
        info.boardTitle ||
        firstLicense.boardTitle ||
        "-";

    const ownerFirstName = userInfo.firstName || info.firstName || "";
    const ownerLastName = userInfo.lastName || info.lastName || "";
    const ownerName =
        kycDetails.ownerName ||
        (ownerFirstName || ownerLastName ? `${ownerFirstName} ${ownerLastName}`.trim() : null) ||
        info.name ||
        "-";

    const ownerNationalCode =
        kycDetails.nationalCode ||
        userInfo.nationalCode ||
        info.nationalCode ||
        "-";

    const identityNo =
        kycDetails.identityNo ||
        userInfo.identificationNumber ||
        info.identificationNumber ||
        info.identityNo ||
        firstLicense.identityNo ||
        "-";

    const unionName =
        kycDetails.unionName ||
        firstLicense.organization?.title ||
        info.unionName ||
        "-";

    const conventName =
        kycDetails.conventName ||
        kycDetails.isicName ||
        firstLicense.senf?.title ||
        info.isicName ||
        info.conventName ||
        "-";

    const licState =
        kycDetails.licState ||
        firstLicense.status ||
        info.licState ||
        "-";

    const licType =
        kycDetails.licType ||
        firstLicense.licenseType ||
        info.licType ||
        "-";

    const licIssueDate =
        kycDetails.licIssueDate ||
        firstLicense.licenseIssueDate ||
        info.licIssueDate ||
        "-";

    const licExpireDate =
        kycDetails.licExpireDate ||
        firstLicense.licenseExpireDate ||
        info.licExpireDate ||
        "-";

    const address =
        kycDetails.address ||
        businessInfo.address?.fullAddress ||
        info.address ||
        "-";

    const postalCode =
        kycDetails.postalCode ||
        businessInfo.address?.postalCode ||
        info.postalCode ||
        "-";

    const phone =
        kycDetails.phone ||
        businessInfo.phone ||
        info.phone ||
        "-";

    // Matching Status
    const isVerified = Boolean(kycDetails.verified);
    const applicantNationalCode = applicantInfo?.nationalCode?.trim();
    const cleanOwnerNationalCode = ownerNationalCode !== "-" ? String(ownerNationalCode).trim() : null;

    const nationalCodeMatched =
        kycDetails.nationalCodeMatched !== undefined
            ? Boolean(kycDetails.nationalCodeMatched)
            : applicantNationalCode && cleanOwnerNationalCode
            ? applicantNationalCode === cleanOwnerNationalCode
            : null;

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(kycDetails, null, 2));
        setCopied(true);
        toast.success("داده‌های JSON در کلیپ‌بورد کپی شد");
        setTimeout(() => setCopied(false), 2000);
    };

    // ── SHAHKAR VIEW (Consultants) ───────────────────────────────────────────
    if (isShahkar) {
        const isMatched = Boolean(kycDetails.matched);
        return (
            <div className={cn("p-4 rounded-2xl border space-y-3 bg-surface", className, isMatched ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5")}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isMatched ? (
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        ) : (
                            <ShieldAlert className="w-5 h-5 text-rose-600" />
                        )}
                        <div>
                            <div className="text-xs font-black text-foreground">
                                {isMatched ? "تطابق سامانه شاهکار تأیید شد" : "عدم تطابق سامانه شاهکار"}
                            </div>
                            <div className="text-[11px] text-foreground-secondary">
                                {isMatched
                                    ? "شماره تلفن همراه با کد ملی متقاضی مطابقت کامل دارد."
                                    : "شماره تلفن همراه با کد ملی متقاضی تطابق ندارد."}
                            </div>
                        </div>
                    </div>
                    <span
                        className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-black",
                            isMatched ? "bg-emerald-500/15 text-emerald-700" : "bg-rose-500/15 text-rose-700"
                        )}
                    >
                        {isMatched ? "شاهکار تأیید" : "شاهکار نامنطبق"}
                    </span>
                </div>

                {/* Raw JSON toggle */}
                <div className="pt-2 border-t border-border-subtle/60">
                    <button
                        type="button"
                        onClick={() => setShowRawJson(!showRawJson)}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-foreground-muted hover:text-foreground transition-colors"
                    >
                        {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>مشاهده داده‌های خام استعلام جیبیت (JSON)</span>
                    </button>

                    {showRawJson && (
                        <div className="mt-2 relative">
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="absolute top-2 left-2 z-10 p-1.5 rounded-lg bg-surface-secondary text-foreground-muted hover:text-foreground text-[10px] flex items-center gap-1 border border-border-subtle"
                            >
                                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                <span>{copied ? "کپی شد" : "کپی"}</span>
                            </button>
                            <pre className="text-[11px] font-mono bg-surface-secondary p-3 rounded-xl border border-border-subtle text-foreground-secondary overflow-x-auto max-h-60 leading-relaxed text-left" dir="ltr">
                                {JSON.stringify(kycDetails, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── GUILD / AGENCY LICENSE VIEW ──────────────────────────────────────────
    const hasError = !isVerified || Boolean(kycDetails.error);

    return (
        <div className={cn("p-4 rounded-2xl border space-y-4 bg-surface", className, hasError ? "border-rose-500/30 bg-rose-500/5" : nationalCodeMatched === false ? "border-amber-500/30 bg-amber-500/5" : "border-emerald-500/30 bg-emerald-500/5")}>
            {/* Header / Status Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border-subtle/80">
                <div className="flex items-center gap-2.5">
                    {hasError ? (
                        <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                            <ShieldX className="w-5 h-5" />
                        </div>
                    ) : nationalCodeMatched === false ? (
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                    ) : (
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                    )}

                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-foreground">
                                استعلام پروانه کسب اتاق اصناف (سرویس جیبیت)
                            </span>
                            {isRealEstateSenfCode && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                    <BadgeCheck className="w-3 h-3" />
                                    <span>رسته املاک (کد ۵۹۰۰)</span>
                                </span>
                            )}
                        </div>
                        <div className="text-[11px] text-foreground-secondary mt-0.5">
                            {hasError ? (
                                <span className="text-rose-600 font-bold">
                                    {kycDetails.error || "اطلاعات پروانه در سامانه اصناف یافت نشد یا استعلام با خطا مواجه شد."}
                                </span>
                            ) : nationalCodeMatched === false ? (
                                <span className="text-amber-700 font-bold">
                                    پروانه کسب معتبر است اما کد ملی متقاضی با دارنده پروانه مغایرت دارد.
                                </span>
                            ) : (
                                <span className="text-emerald-700 font-bold">
                                    پروانه کسب معتبر بوده و هویت متقاضی با دارنده پروانه انطباق کامل دارد.
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    {licState !== "-" && (
                        <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-black border",
                            licState.includes("معتبر") || licState.includes("فعال") || licState === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-700 border-rose-500/30"
                        )}>
                            وضعیت پروانه: {licState}
                        </span>
                    )}

                    {nationalCodeMatched !== null && (
                        <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-black border flex items-center gap-1",
                            nationalCodeMatched
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-700 border-rose-500/30"
                        )}>
                            {nationalCodeMatched ? (
                                <>
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>تطابق کدملی تأیید</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-3 h-3" />
                                    <span>مغایرت کدملی</span>
                                </>
                            )}
                        </span>
                    )}
                </div>
            </div>

            {/* Cross-Check Comparison Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 p-3 rounded-xl bg-surface-secondary/70 border border-border-subtle text-xs">
                {/* 1. National Code Match */}
                <div className="space-y-1">
                    <div className="text-[11px] text-foreground-muted flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>تطابق کد ملی دارنده:</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                        <span className="font-bold text-foreground">
                            {ownerNationalCode !== "-" ? toPersianDigits(ownerNationalCode) : "-"}
                        </span>
                        {nationalCodeMatched === true && (
                            <span className="text-[10px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">
                                منطبق ✓
                            </span>
                        )}
                        {nationalCodeMatched === false && (
                            <span className="text-[10px] text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded font-bold">
                                مغایر ✕
                            </span>
                        )}
                    </div>
                    {applicantNationalCode && (
                        <div className="text-[10px] text-foreground-muted">
                            متقاضی: <span className="font-mono">{toPersianDigits(applicantNationalCode)}</span>
                        </div>
                    )}
                </div>

                {/* 2. Guild Code Match */}
                <div className="space-y-1">
                    <div className="text-[11px] text-foreground-muted flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5" />
                        <span>شناسه صنفی (۱۰ رقمی):</span>
                    </div>
                    <div className="font-mono font-bold text-foreground">
                        {guildCode !== "-" ? toPersianDigits(guildCode) : "-"}
                    </div>
                    <div className="text-[10px] text-foreground-muted">
                        کد رسته: <span className="font-mono font-bold">{toPersianDigits(senfCode)}</span>
                        {isRealEstateSenfCode ? " (رسته املاک)" : ""}
                    </div>
                </div>

                {/* 3. Owner & Board Name */}
                <div className="space-y-1">
                    <div className="text-[11px] text-foreground-muted flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>نام صاحب پروانه:</span>
                    </div>
                    <div className="font-bold text-foreground truncate" title={ownerName}>
                        {ownerName}
                    </div>
                    {applicantInfo?.fullName && (
                        <div className="text-[10px] text-foreground-muted truncate" title={applicantInfo.fullName}>
                            نام متقاضی: {applicantInfo.fullName}
                        </div>
                    )}
                </div>
            </div>

            {/* Detailed License Information Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-surface border border-border-subtle/80 space-y-0.5">
                    <span className="text-[11px] text-foreground-muted block">عنوان تابلو / واحد:</span>
                    <span className="font-bold text-foreground text-xs block truncate" title={boardTitle}>
                        {boardTitle}
                    </span>
                </div>

                <div className="p-2.5 rounded-xl bg-surface border border-border-subtle/80 space-y-0.5">
                    <span className="text-[11px] text-foreground-muted block">شماره شناسنامه:</span>
                    <span className="font-mono font-bold text-foreground text-xs block">
                        {identityNo !== "-" ? toPersianDigits(identityNo) : "-"}
                    </span>
                </div>

                <div className="p-2.5 rounded-xl bg-surface border border-border-subtle/80 space-y-0.5">
                    <span className="text-[11px] text-foreground-muted block">اتحادیه صنف:</span>
                    <span className="font-bold text-foreground text-xs block truncate" title={unionName}>
                        {unionName}
                    </span>
                </div>

                <div className="p-2.5 rounded-xl bg-surface border border-border-subtle/80 space-y-0.5">
                    <span className="text-[11px] text-foreground-muted block">رسته صنفی (ISIC):</span>
                    <span className="font-bold text-foreground text-xs block truncate" title={conventName}>
                        {conventName}
                    </span>
                </div>

                <div className="p-2.5 rounded-xl bg-surface border border-border-subtle/80 space-y-0.5">
                    <span className="text-[11px] text-foreground-muted block">نوع پروانه:</span>
                    <span className="font-bold text-foreground text-xs block">
                        {licType}
                    </span>
                </div>

                <div className="p-2.5 rounded-xl bg-surface border border-border-subtle/80 space-y-0.5">
                    <span className="text-[11px] text-foreground-muted block">تاریخ صدور:</span>
                    <span className="font-mono text-foreground text-xs block">
                        {licIssueDate !== "-" ? toPersianDigits(licIssueDate) : "-"}
                    </span>
                </div>

                <div className="p-2.5 rounded-xl bg-surface border border-border-subtle/80 space-y-0.5">
                    <span className="text-[11px] text-foreground-muted block">تاریخ اعتبار / انقضا:</span>
                    <span className="font-mono text-foreground text-xs block">
                        {licExpireDate !== "-" ? toPersianDigits(licExpireDate) : "-"}
                    </span>
                </div>

                <div className="p-2.5 rounded-xl bg-surface border border-border-subtle/80 space-y-0.5">
                    <span className="text-[11px] text-foreground-muted block">شماره تماس واحد:</span>
                    <span className="font-mono text-foreground text-xs block">
                        {phone !== "-" ? toPersianDigits(phone) : "-"}
                    </span>
                </div>

                <div className="p-2.5 rounded-xl bg-surface border border-border-subtle/80 space-y-0.5 col-span-2 sm:col-span-3 lg:col-span-4">
                    <span className="text-[11px] text-foreground-muted block">نشانی و کد پستی واحد صنفی:</span>
                    <div className="text-foreground text-xs leading-relaxed">
                        <span>{address}</span>
                        {postalCode !== "-" && (
                            <span className="text-foreground-muted mr-2 font-mono text-[11px]">
                                (کد پستی: {toPersianDigits(postalCode)})
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Accordion / Collapsible Raw JSON */}
            <div className="pt-2 border-t border-border-subtle/70">
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setShowRawJson(!showRawJson)}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-foreground-muted hover:text-foreground transition-colors"
                    >
                        {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span>مشاهده داده‌های خام استعلام جیبیت (JSON)</span>
                    </button>

                    {showRawJson && (
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="px-2.5 py-1 rounded-lg bg-surface-secondary hover:bg-surface-tertiary text-foreground-secondary text-[11px] font-bold flex items-center gap-1.5 border border-border-subtle transition-colors"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? "کپی شد" : "کپی JSON"}</span>
                        </button>
                    )}
                </div>

                {showRawJson && (
                    <div className="mt-2.5">
                        <pre className="text-[11px] font-mono bg-surface-secondary p-3 rounded-xl border border-border-subtle text-foreground-secondary overflow-x-auto max-h-72 leading-relaxed text-left" dir="ltr">
                            {JSON.stringify(kycDetails, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
