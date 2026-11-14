"use client";

import React from "react";
import {
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    CheckCircle2,
    XCircle,
    Building2,
    User,
    BadgeCheck,
    Clock,
    RefreshCw,
    Hash,
} from "lucide-react";
import { cn, toPersianDigits } from "@/lib/utils";
import type {
    AgentGuildKycDetails,
    AgentShahkarKycDetails,
    AgentKycDetails,
    CorporationIdentityInfo,
    CorporationLicense,
    CorporationUserInfo,
} from "@/types/api/agency.types";

export interface JibitKycViewerProps {
    kycDetails?: AgentGuildKycDetails | AgentShahkarKycDetails | AgentKycDetails | null;
    applicantInfo?: {
        fullName?: string;
        nationalCode?: string;
        guildCode?: string;
        phone?: string;
        agentType?: string;
    };
    onReverify?: () => void;
    isReverifying?: boolean;
    className?: string;
}

export function JibitKycViewer({
    kycDetails,
    applicantInfo,
    onReverify,
    isReverifying,
    className,
}: JibitKycViewerProps) {
    // If no KYC data at all
    if (!kycDetails || Object.keys(kycDetails).length === 0 || kycDetails.message) {
        return (
            <div
                className={cn(
                    "p-4 rounded-2xl border border-dashed border-border-subtle bg-surface-secondary/50 text-center space-y-3",
                    className
                )}
            >
                <div className="w-9 h-9 mx-auto rounded-full bg-surface-secondary flex items-center justify-center text-foreground-muted">
                    <Clock className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-foreground">اطلاعات استعلام جیبیت ثبت نشده است</div>
                <p className="text-[11px] text-foreground-muted max-w-md mx-auto">
                    استعلام هوشمند برای این درخواست هنوز انجام نشده یا اطلاعات در پایگاه داده ذخیره نگردیده است.
                </p>
                {onReverify && (
                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={onReverify}
                            disabled={isReverifying}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs disabled:opacity-50"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5", isReverifying && "animate-spin")} />
                            <span>{isReverifying ? "در حال استعلام از جیبیت..." : "انجام استعلام برخط جیبیت"}</span>
                        </button>
                    </div>
                )}
            </div>
        );
    }

    const provider = kycDetails.provider || (kycDetails.matched !== undefined ? "JIBIT_SHAHKAR" : "JIBIT_GUILD");
    const isShahkar =
        provider === "JIBIT_SHAHKAR" ||
        (kycDetails.matched !== undefined && !kycDetails.guildCode && !kycDetails.boardTitle);

    // Extract Guild / Corporation Fields
    const info: CorporationIdentityInfo = kycDetails.info || {};
    const userInfo: CorporationUserInfo = info.userInfo || {};
    const firstLicense: CorporationLicense = info.licenses?.[0] || {};
    const businessInfo = firstLicense.businessInfo || {};

    const applicantNationalCode = applicantInfo?.nationalCode?.trim();

    const ownerFirstName = userInfo.firstName || info.firstName || "";
    const ownerLastName = userInfo.lastName || info.lastName || "";
    const ownerFullName = (ownerFirstName || ownerLastName)
        ? `${ownerFirstName} ${ownerLastName}`.trim()
        : null;

    const ownerNationalCode =
        kycDetails.nationalCode ||
        userInfo.nationalCode ||
        info.nationalCode ||
        applicantNationalCode ||
        "-";

    // If info.code matches applicant nationalCode, ignore it as guildCode
    const infoCode = info.code;
    const isInfoCodeNationalId =
        Boolean(infoCode && applicantNationalCode && infoCode === applicantNationalCode);

    const guildCode =
        kycDetails.guildCode ||
        (!isInfoCodeNationalId && infoCode ? infoCode : undefined) ||
        firstLicense.id ||
        applicantInfo?.guildCode ||
        "-";

    const senfCode =
        kycDetails.senfCode ||
        info.senfCode ||
        firstLicense.senf?.senfCode ||
        "-";

    const isRealEstateSenfCode = String(senfCode).trim() === "5900";

    const boardTitle =
        kycDetails.boardTitle ||
        info.boardTitle ||
        firstLicense.senf?.title ||
        firstLicense.title ||
        "-";

    const ownerName =
        kycDetails.ownerName ||
        ownerFullName ||
        applicantInfo?.fullName ||
        "-";

    const identityNo =
        kycDetails.identityNo ||
        userInfo.identificationNumber ||
        info.identificationNumber ||
        info.identityNo ||
        "-";

    const unionName =
        kycDetails.unionName ||
        firstLicense.organization?.title ||
        firstLicense.organizationInfo?.title ||
        info.unionName ||
        "-";

    const conventName =
        kycDetails.conventName ||
        kycDetails.isicName ||
        businessInfo.isicName ||
        businessInfo.isicTitle ||
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
        firstLicense.issueDate ||
        info.licIssueDate ||
        "-";

    const licExpireDate =
        kycDetails.licExpireDate ||
        firstLicense.expirationDate ||
        info.licExpireDate ||
        "-";

    const address =
        kycDetails.address ||
        firstLicense.senf?.address ||
        info.address ||
        "-";

    const postalCode =
        kycDetails.postalCode ||
        firstLicense.senf?.postalCode ||
        info.postalCode ||
        "-";

    const phone =
        kycDetails.tel ||
        firstLicense.senf?.phoneNumber ||
        info.tel ||
        applicantInfo?.phone ||
        "-";

    // Matching Status
    const isVerified = Boolean(kycDetails.verified);
    const cleanOwnerNationalCode = ownerNationalCode !== "-" ? String(ownerNationalCode).trim() : null;

    const nationalCodeMatched =
        kycDetails.nationalCodeMatched !== undefined
            ? Boolean(kycDetails.nationalCodeMatched)
            : applicantNationalCode && cleanOwnerNationalCode
            ? applicantNationalCode === cleanOwnerNationalCode
            : null;

    // ── SHAHKAR VIEW (Consultants) ───────────────────────────────────────────
    if (isShahkar) {
        const isMatched = Boolean(kycDetails.matched);
        return (
            <div
                className={cn(
                    "p-4 rounded-2xl border space-y-3 bg-surface",
                    className,
                    isMatched ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"
                )}
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        {isMatched ? (
                            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
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
                    <div className="flex items-center gap-2">
                        {onReverify && (
                            <button
                                type="button"
                                onClick={onReverify}
                                disabled={isReverifying}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-surface-secondary hover:bg-slate-200 text-foreground-secondary transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={cn("w-3.5 h-3.5", isReverifying && "animate-spin")} />
                                <span>{isReverifying ? "در حال استعلام..." : "استعلام مجدد شاهکار"}</span>
                            </button>
                        )}
                        <span
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-black",
                                isMatched ? "bg-emerald-500/15 text-emerald-700" : "bg-rose-500/15 text-rose-700"
                            )}
                        >
                            {isMatched ? "شاهکار تأیید" : "شاهکار نامنطبق"}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // ── GUILD / AGENCY LICENSE VIEW ──────────────────────────────────────────
    const hasError = !isVerified || Boolean(kycDetails.error);

    return (
        <div
            className={cn(
                "p-4 rounded-2xl border space-y-4 bg-surface",
                className,
                hasError
                    ? "border-rose-500/30 bg-rose-500/5"
                    : nationalCodeMatched === false
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-emerald-500/30 bg-emerald-500/5"
            )}
        >
            {/* Header / Status Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border-subtle/80">
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
                        <div className="flex items-center gap-2 flex-wrap">
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

                {/* Status Badges & Re-verify Action */}
                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    {onReverify && (
                        <button
                            type="button"
                            onClick={onReverify}
                            disabled={isReverifying}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs disabled:opacity-50"
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5", isReverifying && "animate-spin")} />
                            <span>{isReverifying ? "در حال استعلام..." : "استعلام مجدد از جیبیت"}</span>
                        </button>
                    )}

                    {licState !== "-" && (
                        <span
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-black border",
                                licState.includes("معتبر") || licState.includes("فعال") || licState === "ACTIVE"
                                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                                    : "bg-rose-500/10 text-rose-700 border-rose-500/30"
                            )}
                        >
                            وضعیت پروانه: {licState}
                        </span>
                    )}

                    {nationalCodeMatched !== null && (
                        <span
                            className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-black border flex items-center gap-1",
                                nationalCodeMatched
                                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                                    : "bg-rose-500/10 text-rose-700 border-rose-500/30"
                            )}
                        >
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
        </div>
    );
}
