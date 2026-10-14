"use client";

import { useAuth } from "@/hooks/useAuth";
import { usePaymentStatus } from "@/hooks/useWallet";
import { formatCurrency, toPersianDigits } from "@/lib/utils";
import {
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    Loader2,
    ShieldAlert,
    Wallet,
    XCircle,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PaymentCallbackContent() {
    const searchParams = useSearchParams();
    const { isLoggedIn } = useAuth();

    // Check multiple query param aliases passed by gateways or redirects
    const purchaseId =
        searchParams.get("purchaseId") ||
        searchParams.get("purchase_id") ||
        searchParams.get("id") ||
        searchParams.get("paymentId") ||
        searchParams.get("authority") ||
        "";

    const queryStatus = (
        searchParams.get("status") ||
        searchParams.get("state") ||
        ""
    ).toUpperCase();

    const { data: statusData, isLoading, isError } = usePaymentStatus(purchaseId);

    const status = statusData?.status;
    const isGatewayFailed =
        queryStatus === "FAILED" ||
        queryStatus === "CANCELED" ||
        queryStatus === "EXPIRED" ||
        queryStatus === "NOK";

    const isSuccess = status === "SUCCESS" || status === "COMPLETED";
    const isFailed =
        status === "FAILED" ||
        status === "CANCELED" ||
        status === "EXPIRED" ||
        (isGatewayFailed && !statusData && !isLoading);
    const isPending = (status === "PENDING" || (isLoading && !statusData)) && !isGatewayFailed;
    const isUnknown = !purchaseId && !queryStatus;

    return (
        <div className="max-w-md mx-auto px-4 py-12">
            <div className="bg-surface rounded-3xl border border-border-subtle p-8 shadow-xl text-center space-y-6">
                {isPending && (
                    <div className="space-y-4">
                        <div className="w-20 h-20 bg-info-subtle text-info rounded-full flex items-center justify-center mx-auto">
                            <Loader2 className="w-10 h-10 animate-spin" />
                        </div>
                        <h1 className="text-lg font-black text-brand">در حال تأیید پرداخت...</h1>
                        <p className="text-xs text-text-light leading-relaxed">
                            در حال استعلام نتیجه تراکنش از شاپرک و درگاه پرداخت. لطفاً شکیبا باشید.
                        </p>
                    </div>
                )}

                {isSuccess && (
                    <div className="space-y-4">
                        <div className="w-20 h-20 bg-success-subtle text-success rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h1 className="text-xl font-black text-success">پرداخت با موفقیت انجام شد</h1>
                        <p className="text-xs text-text-light">
                            مبلغ مورد نظر با موفقیت به موجودی کیف پول شما اضافه گردید.
                        </p>

                        <div className="bg-surface-secondary rounded-2xl p-4 text-xs space-y-3 font-bold border border-border-subtle text-right mt-6">
                            {statusData?.amountIRR && (
                                <div className="flex items-center justify-between">
                                    <span className="text-text-light">مبلغ پرداختی:</span>
                                    <span className="text-brand font-black text-sm">
                                        {formatCurrency(Math.floor(statusData.amountIRR / 10))} تومان
                                    </span>
                                </div>
                            )}
                            {statusData?.rrn && (
                                <div className="flex items-center justify-between">
                                    <span className="text-text-light">شماره پیگیری (RRN):</span>
                                    <span className="font-mono text-brand">{toPersianDigits(statusData.rrn)}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-text-light">شناسه پرداخت:</span>
                                <span className="font-mono text-brand truncate max-w-[180px]">{toPersianDigits(purchaseId)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {isFailed && (
                    <div className="space-y-4">
                        <div className="w-20 h-20 bg-error-subtle text-error rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <XCircle className="w-10 h-10" />
                        </div>
                        <h1 className="text-xl font-black text-error">تراکنش ناموفق بود</h1>
                        <p className="text-xs text-text-light leading-relaxed">
                            پرداخت توسط کاربر لغو شده یا با خطای درگاه بانکی مواجه گردید. در صورت کسر وجه از حساب، حداکثر ظرف ۷۲ ساعت توسط بانک بازگردانده می‌شود.
                        </p>

                        {purchaseId && (
                            <div className="bg-surface-secondary rounded-2xl p-4 text-xs space-y-3 font-bold border border-border-subtle text-right mt-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-text-light">شناسه پرداخت:</span>
                                    <span className="font-mono text-brand truncate max-w-[180px]">{toPersianDigits(purchaseId)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isUnknown && (
                    <div className="space-y-4">
                        <div className="w-20 h-20 bg-warning-subtle text-warning rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle className="w-10 h-10" />
                        </div>
                        <h1 className="text-lg font-black text-brand">اطلاعات تراکنش یافت نشد</h1>
                        <p className="text-xs text-text-light leading-relaxed">
                            هیچ شناسه پرداختی در آدرس بازگشت وجود ندارد. لطفاً موجودی کیف پول خود را بررسی فرمایید.
                        </p>
                    </div>
                )}

                {isError && !isGatewayFailed && !isUnknown && (
                    <div className="space-y-4">
                        <div className="w-20 h-20 bg-warning-subtle text-warning rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle className="w-10 h-10" />
                        </div>
                        <h1 className="text-lg font-black text-brand">عدم دسترسی به اطلاعات تراکنش</h1>
                        <p className="text-xs text-text-light leading-relaxed">
                            {isLoggedIn
                                ? "اطلاعات مربوط به این تراکنش یافت نشد یا منقضی شده است. در صورت کسر وجه از حساب، حداکثر ظرف ۷۲ ساعت توسط بانک بازگردانده می‌شود."
                                : "برای استعلام وضعیت پرداخت و شارژ کیف پول، لطفاً ابتدا وارد حساب کاربری خود شوید."}
                        </p>
                        {!isLoggedIn && (
                            <Link
                                href={`/auth?redirect=${encodeURIComponent(`/wallet/callback?purchaseId=${purchaseId}`)}`}
                                className="inline-flex items-center justify-center px-6 py-2.5 bg-brand text-white font-bold text-xs rounded-xl shadow hover:bg-brand-900 transition-colors"
                            >
                                ورود به حساب کاربری
                            </Link>
                        )}
                    </div>
                )}

                <div className="pt-4">
                    <Link
                        href="/wallet"
                        className="w-full py-4 bg-primary text-white font-black text-sm rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                        <Wallet className="w-4 h-4" />
                        <span>بازگشت به کیف پول</span>
                        <ChevronLeft className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function PaymentCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-[50vh] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            }
        >
            <PaymentCallbackContent />
        </Suspense>
    );
}
