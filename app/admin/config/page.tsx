"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
    Settings, 
    ShieldCheck, 
    BarChart, 
    Save, 
    RefreshCcw,
    Info,
    Zap,
    TrendingUp
} from "lucide-react";
import { adminService } from "@/services/admin.service";
import { PlanLimits } from "@/types/api/admin.types";

const INITIAL_LIMITS: Record<string, PlanLimits> = {
    FREE: {
        maxActiveListings: 3,
        hasAnalytics: false,
        hasPriorityRanking: false,
        hasProBadge: false,
        hasUnlimitedMessaging: false,
        canBoost: false
    },
    PRO: {
        maxActiveListings: 20,
        hasAnalytics: true,
        hasPriorityRanking: true,
        hasProBadge: true,
        hasUnlimitedMessaging: true,
        canBoost: true
    }
};

export default function AdminConfigPage() {
    const [limits, setLimits] = useState(INITIAL_LIMITS);
    const [selectedPlan, setSelectedPlan] = useState<"FREE" | "PRO">("FREE");

    const updateMutation = useMutation({
        mutationFn: ({ plan, data }: { plan: "FREE" | "PRO", data: PlanLimits }) => 
            adminService.updatePlanLimits({ plan, limits: data }),
        onSuccess: () => {
            toast.success("تنظیمات با موفقیت ذخیره شد");
        },
        onError: (error: any) => {
            toast.error("خطا در ذخیره تنظیمات: " + (error.response?.data?.message || "خطای ناشناخته"));
        }
    });

    const handleInputChange = (field: keyof PlanLimits, value: boolean | number) => {
        setLimits(prev => ({
            ...prev,
            [selectedPlan]: {
                ...prev[selectedPlan],
                [field]: value
            }
        }));
    };

    const handleSave = () => {
        updateMutation.mutate({
            plan: selectedPlan,
            data: limits[selectedPlan]
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">تنظیمات سیستم</h1>
                    <p className="text-gray-500">مدیریت محدودیت‌های پلن‌های اشتراک</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Tabs */}
                <div className="lg:col-span-1 space-y-2">
                    <button 
                        onClick={() => setSelectedPlan("FREE")}
                        className={`w-full text-right p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedPlan === "FREE" ? "bg-blue-50 text-blue-600 font-bold" : "hover:bg-gray-50 text-gray-600"}`}
                    >
                        <ShieldCheck size={20} />
                        پلن رایگان (FREE)
                    </button>
                    <button 
                        onClick={() => setSelectedPlan("PRO")}
                        className={`w-full text-right p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedPlan === "PRO" ? "bg-blue-50 text-blue-600 font-bold" : "hover:bg-gray-50 text-gray-600"}`}
                    >
                        <Zap size={20} />
                        پلن پیشرفته (PRO)
                    </button>
                    
                    <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-3 text-amber-700">
                        <Info size={24} className="shrink-0" />
                        <p className="text-xs leading-relaxed">
                            تغییرات در محدودیت‌ها بلافاصله روی تمامی کاربران آن پلن اعمال خواهد شد. لطفا با دقت مدیریت کنید.
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-8">
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-gray-800 border-b pb-4 flex items-center gap-2">
                            <Settings size={20} className="text-blue-600" />
                            پیکربندی پلن {selectedPlan}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">حداکثر آگهی‌های فعال</label>
                                <input 
                                    type="number"
                                    value={limits[selectedPlan].maxActiveListings ?? 0}
                                    onChange={(e) => handleInputChange("maxActiveListings", parseInt(e.target.value) || 0)}
                                    className="w-full p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <p className="text-xs text-gray-400">تعداد آگهی‌هایی که کاربر می‌تواند همزمان در وضعیت «منتشر شده» داشته باشد.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <ToggleField 
                                label="دسترسی به تحلیل و آمار" 
                                description="نمایش نمودار بازدید و بازخورد آگهی‌ها به کاربر"
                                checked={limits[selectedPlan].hasAnalytics}
                                onChange={(val: boolean) => handleInputChange("hasAnalytics", val)}
                                icon={BarChart}
                            />
                            <ToggleField 
                                label="رتبه‌بندی اولویت‌دار" 
                                description="نمایش آگهی‌ها بالاتر از آگهی‌های رایگان"
                                checked={limits[selectedPlan].hasPriorityRanking}
                                onChange={(val: boolean) => handleInputChange("hasPriorityRanking", val)}
                                icon={TrendingUp}
                            />
                            <ToggleField 
                                label="نشان حرفه‌ای (Pro)" 
                                description="نمایش نشان اختصاصی در پروفایل و آگهی‌ها"
                                checked={limits[selectedPlan].hasProBadge}
                                onChange={(val: boolean) => handleInputChange("hasProBadge", val)}
                                icon={ShieldCheck}
                            />
                            <ToggleField 
                                label="پیام‌رسانی نامحدود" 
                                description="امکان ارسال پیام بدون محدودیت روزانه"
                                checked={limits[selectedPlan].hasUnlimitedMessaging}
                                onChange={(val: boolean) => handleInputChange("hasUnlimitedMessaging", val)}
                                icon={RefreshCcw}
                            />
                            <ToggleField 
                                label="قابلیت نردبان و فوری" 
                                description="دسترسی به ابزارهای ارتقای آگهی"
                                checked={limits[selectedPlan].canBoost}
                                onChange={(val: boolean) => handleInputChange("canBoost", val)}
                                icon={Zap}
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t flex justify-end gap-3">
                        <button 
                            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            onClick={() => setLimits(INITIAL_LIMITS)}
                        >
                            انصراف
                        </button>
                        <button 
                            className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            onClick={handleSave}
                            disabled={updateMutation.isPending}
                        >
                            <Save size={18} />
                            {updateMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ToggleField({ label, description, checked, onChange, icon: Icon }: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (val: boolean) => void;
    icon: any;
}) {
    return (
        <div className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onChange(!checked)}>
            <div className={`p-2 rounded-lg ${checked ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"}`}>
                <Icon size={20} />
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">{label}</span>
                    <div className={`w-10 h-5 rounded-full transition-colors relative ${checked ? "bg-blue-600" : "bg-gray-300"}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${checked ? "left-1" : "left-6"}`} />
                    </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{description}</p>
            </div>
        </div>
    );
}
