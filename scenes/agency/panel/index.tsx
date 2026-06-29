"use client";

import { Button } from "@/components/ui/Button";
import { useAgencyStats, useMyAgency, useUpdateAgency } from "@/hooks/useAgencies";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
    AlertCircle,
    BarChart3,
    Building2,
    CheckCircle2,
    ChevronLeft,
    FileText,
    Globe,
    LayoutDashboard,
    Phone,
    Settings,
    Star
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Tab = "overview" | "settings";

export default function AgencyPanelScene() {
    const { user, isLoggedIn } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("overview");

    const { data: agency, isLoading: isLoadingAgency } = useMyAgency();
    const { data: stats, isLoading: isLoadingStats } = useAgencyStats(agency?.id || "");
    const { mutate: updateAgency, isPending: isUpdating } = useUpdateAgency();

    // Form states
    const [formData, setFormData] = useState({
        agencyName: "",
        bio: "",
        licenseNumber: "",
        website: "",
        phone: ""
    });

    useEffect(() => {
        if (agency) {
            setFormData({
                agencyName: agency.name || "",
                bio: agency.bio || "",
                licenseNumber: agency.licenseNumber || "",
                website: agency.website || "",
                phone: agency.phone || ""
            });
        }
    }, [agency]);

    if (!isLoggedIn) {
        return (
            <div className="p-10 text-center">
                <p className="text-brand font-bold mb-4">برای دسترسی به پنل مدیریت باید وارد شوید.</p>
                <Button onClick={() => router.push("/auth")}>ورود به حساب</Button>
            </div>
        );
    }

    if (isLoadingAgency) {
        return <div className="p-10 text-center text-brand font-bold animate-pulse">در حال بارگذاری اطلاعات آژانس...</div>;
    }

    if (!agency) {
        return (
            <div className="p-10 text-center max-w-md mx-auto space-y-6">
                <div className="w-20 h-20 bg-soft-bg rounded-full flex items-center justify-center mx-auto">
                    <Building2 className="w-10 h-10 text-brand" />
                </div>
                <h2 className="text-xl font-black text-brand">شما هنوز پروفایل آژانس ندارید</h2>
                <p className="text-secondary text-sm leading-relaxed">
                    برای مدیریت آژانس و مشاورین خود، ابتدا باید یک پروفایل آژانس املاک ایجاد کنید.
                </p>
                <Button className="w-full h-14 rounded-2xl" onClick={() => router.push("/agency/create")}>
                    ایجاد پروفایل آژانس
                </Button>
            </div>
        );
    }

    const handleUpdate = () => {
        updateAgency({
            agencyId: agency.id,
            data: formData
        }, {
            onSuccess: () => {
                toast.success("پروفایل آژانس با موفقیت بروزرسانی شد");
            }
        });
    };

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Header */}
            <header className="bg-white border-b border-soft-border sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 hover:bg-soft-bg rounded-xl transition-colors">
                        <ChevronLeft className="w-6 h-6 text-brand rotate-180" />
                    </button>
                    <div>
                        <h1 className="text-brand font-black text-lg leading-none">{agency.name}</h1>
                        <span className="text-[10px] font-bold text-secondary uppercase">پنل مدیریت آژانس</span>
                    </div>
                </div>
                {agency.verificationStatus === "VERIFIED" ? (
                    <div className="flex items-center gap-1.5 bg-success/10 text-success px-3 py-1.5 rounded-full">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase">تایید شده</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 bg-warning/10 text-warning px-3 py-1.5 rounded-full">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase">{agency.verificationStatus === "PENDING" ? "در انتظار تایید" : "تایید نشده"}</span>
                    </div>
                )}
            </header>

            <div className="p-6 lg:p-10 space-y-8 max-w-4xl mx-auto">
                {/* Tabs */}
                <div className="flex gap-2 p-1.5 bg-soft-bg rounded-[20px] sticky top-20 z-10 shadow-sm border border-soft-border">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-[15px] text-sm font-black transition-all",
                            activeTab === "overview" ? "bg-white text-brand shadow-sm" : "text-secondary hover:text-brand"
                        )}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        داشبورد
                    </button>
                    <button
                        onClick={() => setActiveTab("settings")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-[15px] text-sm font-black transition-all",
                            activeTab === "settings" ? "bg-white text-brand shadow-sm" : "text-secondary hover:text-brand"
                        )}
                    >
                        <Settings className="w-4 h-4" />
                        تنظیمات
                    </button>
                </div>

                {activeTab === "overview" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-soft-bg rounded-[25px] p-5 border border-soft-border space-y-2">
                                <span className="text-secondary text-[10px] font-black uppercase block">دنبال‌کنندگان</span>
                                <div className="text-brand text-2xl font-black">{stats?.followerCount || 0}</div>
                            </div>
                            <div className="bg-soft-bg rounded-[25px] p-5 border border-soft-border space-y-2">
                                <span className="text-secondary text-[10px] font-black uppercase block">درخواست مشاوره</span>
                                <div className="text-brand text-2xl font-black">{stats?.consultationCount || 0}</div>
                            </div>
                            <div className="bg-soft-bg rounded-[25px] p-5 border border-soft-border space-y-2">
                                <span className="text-secondary text-[10px] font-black uppercase block">امتیاز کل</span>
                                <div className="flex items-center gap-1">
                                    <Star className="w-5 h-5 fill-warning text-warning" />
                                    <div className="text-brand text-2xl font-black">{agency.rating || 0}</div>
                                </div>
                            </div>
                            <div className="bg-soft-bg rounded-[25px] p-5 border border-soft-border space-y-2 text-primary">
                                <span className="text-primary/70 text-[10px] font-black uppercase block">وضعیت فعلی</span>
                                <div className="text-sm font-black uppercase">{agency.verificationStatus}</div>
                            </div>
                        </div>

                        {/* Recent Activity / Quick Actions Placeholder */}
                        <section className="bg-brand rounded-[30px] p-8 text-white">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-black">آژانس خود را ارتقا دهید</h3>
                                    <p className="text-white/70 text-sm mt-2">با ثبت آگهی‌های بیشتر، مشتریان بیشتری جذب کنید.</p>
                                </div>
                                <div className="p-4 bg-white/10 rounded-2xl">
                                    <BarChart3 className="w-8 h-8" />
                                </div>
                            </div>
                            <Button variant="secondary" className="w-full text-brand font-black" onClick={() => router.push("/ads/submit")}>
                                ثبت آگهی جدید
                            </Button>
                        </section>
                    </div>
                )}

                {activeTab === "settings" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <section className="bg-white rounded-[30px] p-8 border border-soft-border space-y-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-brand/5 rounded-2xl text-brand">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-black text-brand">اطلاعات عمومی آژانس</h3>
                            </div>

                            <div className="grid gap-6">
                                <div className="space-y-2">
                                    <label className="text-brand text-xs font-black pr-2 uppercase">نام آژانس املاک</label>
                                    <div className="relative group">
                                        <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary group-focus-within:text-brand transition-colors" />
                                        <input
                                            type="text"
                                            value={formData.agencyName}
                                            onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                                            className="w-full bg-soft-bg border border-soft-border rounded-2xl py-4 pr-12 pl-4 text-sm font-bold text-brand focus:ring-2 focus:ring-brand/10 outline-none transition-all"
                                            placeholder="نام آژانس را وارد کنید..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-brand text-xs font-black pr-2 uppercase">بیوگرافی و توضیحات</label>
                                    <div className="relative group">
                                        <FileText className="absolute right-4 top-4 w-5 h-5 text-secondary group-focus-within:text-brand transition-colors" />
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            className="w-full bg-soft-bg border border-soft-border rounded-2xl py-4 pr-12 pl-4 text-sm font-bold text-brand focus:ring-2 focus:ring-brand/10 outline-none transition-all min-h-[120px] resize-none"
                                            placeholder="توضیحات آژانس خود را بنویسید..."
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-brand text-xs font-black pr-2 uppercase">شماره پروانه کسب</label>
                                        <div className="relative group">
                                            <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary group-focus-within:text-brand transition-colors" />
                                            <input
                                                type="text"
                                                value={formData.licenseNumber}
                                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                                className="w-full bg-soft-bg border border-soft-border rounded-2xl py-4 pr-12 pl-4 text-sm font-bold text-brand focus:ring-2 focus:ring-brand/10 outline-none transition-all"
                                                placeholder="اختیاری..."
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-brand text-xs font-black pr-2 uppercase">شماره تماس ثابت</label>
                                        <div className="relative group">
                                            <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary group-focus-within:text-brand transition-colors" />
                                            <input
                                                type="text"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full bg-soft-bg border border-soft-border rounded-2xl py-4 pr-12 pl-4 text-sm font-bold text-brand focus:ring-2 focus:ring-brand/10 outline-none transition-all"
                                                placeholder="اختیاری..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-brand text-xs font-black pr-2 uppercase">وب‌سایت</label>
                                    <div className="relative group">
                                        <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary group-focus-within:text-brand transition-colors" />
                                        <input
                                            type="text"
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            className="w-full bg-soft-bg border border-soft-border rounded-2xl py-4 pr-12 pl-4 text-sm font-bold text-brand focus:ring-2 focus:ring-brand/10 outline-none transition-all"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-14 rounded-2xl text-lg mt-4 shadow-lg shadow-brand/20"
                                    onClick={handleUpdate}
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? "در حال ثبت تغییرات..." : "ذخیره تغییرات پروفایل"}
                                </Button>
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}

function ShieldCheck(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}
