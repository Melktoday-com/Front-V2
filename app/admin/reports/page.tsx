"use client";

import { adminService } from "@/services/admin.service";
import { AdminReport } from "@/types/api/admin.types";
import { ReportStatus, ReportTargetType } from "@/types/api/enums";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns-jalali";
import { AlertOctagon, CheckCircle, Clock, ExternalLink, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminReportsPage() {
    const queryClient = useQueryClient();

    const { data: reports, isLoading } = useQuery<AdminReport[]>({
        queryKey: ["admin", "reports"],
        queryFn: () => adminService.listPendingReports(),
    });

    const moderateMutation = useMutation({
        mutationFn: ({ id, action }: { id: string, action: "RESOLVE" | "DISMISS" }) =>
            adminService.moderateReport(id, action),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
            toast.success("گزارش با موفقیت تعیین تکلیف شد");
        },
        onError: () => toast.error("خطا در ثبت تغییرات")
    });

    if (isLoading) return <div className="text-center py-20 text-gray-400">در حال بارگزاری گزارش‌ها...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">گزارش‌های تخلف</h1>
                <p className="text-gray-500 font-medium">بررسی و مدیریت گزارش‌های ثبت شده توسط کاربران</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-right">
                    <thead className="bg-gray-50 border-b border-gray-100 uppercase text-xs font-bold text-gray-500">
                        <tr>
                            <th className="px-6 py-4">محتوا / هدف</th>
                            <th className="px-6 py-4">علت گزارش</th>
                            <th className="px-6 py-4">زمان ثبت</th>
                            <th className="px-6 py-4">وضعیت</th>
                            <th className="px-6 py-4">عملیات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {!reports || reports.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center text-gray-400">
                                    <div className="flex flex-col items-center gap-3">
                                        <AlertOctagon size={48} className="text-gray-200" />
                                        <span>هیچ گزارش تخلف جدیدی یافت نشد.</span>
                                    </div>
                                </td>
                            </tr>
                        ) : reports.map((report: AdminReport) => (
                            <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-gray-800">
                                            {report.targetType === ReportTargetType.LISTING ? "آگهی" : report.targetType === ReportTargetType.USER ? "کاربر" : report.targetType}
                                        </span>
                                        <span className="text-xs text-gray-400 font-mono mt-1">{report.targetId}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm text-gray-700">{report.reason}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Clock size={12} />
                                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${report.status === ReportStatus.PENDING ? "bg-amber-100 text-amber-800" :
                                        report.status === ReportStatus.RESOLVED ? "bg-green-100 text-green-800" :
                                            "bg-gray-100 text-gray-800"
                                        }`}>
                                        {report.status === ReportStatus.PENDING ? "در حال بررسی" :
                                            report.status === ReportStatus.RESOLVED ? "حل شده" : "رد شده"}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {report.status === ReportStatus.PENDING && (
                                            <>
                                                <button
                                                    onClick={() => moderateMutation.mutate({ id: report.id, action: "RESOLVE" })}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="حل شده / جریمه"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => moderateMutation.mutate({ id: report.id, action: "DISMISS" })}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="رد گزارش / بی‌مورد"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </>
                                        )}
                                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <ExternalLink size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
