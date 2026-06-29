"use client";

import { Button } from "@/components/ui/Button";
import { useCreateAgency } from "@/hooks/useAgencies";
import { useCities } from "@/hooks/useGeo";
import { Building2, ChevronLeft, FileText, Globe, MapPin, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function CreateAgencyScene() {
    const router = useRouter();
    const { mutate: createAgency, isPending } = useCreateAgency();
    const { data: citiesData } = useCities({ limit: 100 });

    const [formData, setFormData] = useState({
        agencyName: "",
        bio: "",
        cityId: "",
        licenseNumber: "",
        website: "",
        phone: ""
    });

    const handleCreate = () => {
        if (!formData.agencyName || !formData.bio || !formData.cityId) {
            toast.error("لطفاً تمامی فیلدهای اجباری (نام، بیوگرافی، شهر) را پر کنید");
            return;
        }

        createAgency(formData, {
            onSuccess: () => {
                toast.success("پروفایل آژانس با موفقیت ایجاد شد");
                router.push("/agency/panel");
            }
        });
    };

    return (
        <div className="min-h-screen bg-white">
            <header className="bg-white border-b border-soft-border sticky top-0 z-10 px-6 py-4 flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 hover:bg-soft-bg rounded-xl transition-colors">
                    <ChevronLeft className="w-6 h-6 text-brand rotate-180" />
                </button>
                <h1 className="text-brand font-black text-lg leading-none">ایجاد پروفایل آژانس</h1>
            </header>

            <div className="p-6 lg:p-10 max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2 mb-10">
                    <div className="w-20 h-20 bg-brand/5 rounded-[30px] flex items-center justify-center mx-auto mb-4 border border-brand/5">
                        <Building2 className="w-10 h-10 text-brand" />
                    </div>
                    <h2 className="text-2xl font-black text-brand">اطلاعات آژانس خود را وارد کنید</h2>
                    <p className="text-secondary text-sm">با ایجاد پروفایل آژانس، اعتبار بیشتری نزد مشتریان کسب خواهید کرد.</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-brand text-xs font-black pr-2 uppercase">نام آژانس املاک (اجباری)</label>
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
                        <label className="text-brand text-xs font-black pr-2 uppercase">شهر فعالیت (اجباری)</label>
                        <div className="relative group">
                            <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary group-focus-within:text-brand transition-colors" />
                            <select
                                value={formData.cityId}
                                onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
                                className="w-full bg-soft-bg border border-soft-border rounded-2xl py-4 pr-12 pl-4 text-sm font-bold text-brand focus:ring-2 focus:ring-brand/10 outline-none transition-all appearance-none"
                            >
                                <option value="">انتخاب شهر...</option>
                                {citiesData?.cities?.map((city: any) => (
                                    <option key={city.id} value={city.id}>{city.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-brand text-xs font-black pr-2 uppercase">بیوگرافی و توضیحات (اجباری)</label>
                        <div className="relative group">
                            <FileText className="absolute right-4 top-4 w-5 h-5 text-secondary group-focus-within:text-brand transition-colors" />
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                className="w-full bg-soft-bg border border-soft-border rounded-2xl py-4 pr-12 pl-4 text-sm font-bold text-brand focus:ring-2 focus:ring-brand/10 outline-none transition-all min-h-[120px] resize-none"
                                placeholder="توضیح مختصری درباره آژانس و سوابق خود بنویسید..."
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-brand text-xs font-black pr-2 uppercase">شماره پروانه کسب</label>
                            <input
                                type="text"
                                value={formData.licenseNumber}
                                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                className="w-full bg-soft-bg border border-soft-border rounded-2xl py-4 px-4 text-sm font-bold text-brand focus:ring-2 focus:ring-brand/10 outline-none transition-all"
                                placeholder="وارد کنید..."
                            />
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
                                    placeholder="۰۲۱XXXXXXXX"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-brand text-xs font-black pr-2 uppercase">آدرس وب‌سایت</label>
                        <div className="relative group">
                            <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary group-focus-within:text-brand transition-colors" />
                            <input
                                type="text"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                className="w-full bg-soft-bg border border-soft-border rounded-2xl py-4 pr-12 pl-4 text-sm font-bold text-brand focus:ring-2 focus:ring-brand/10 outline-none transition-all text-left"
                                placeholder="https://your-agency.com"
                            />
                        </div>
                    </div>

                    <Button
                        className="w-full h-14 rounded-2xl text-lg mt-8 shadow-xl shadow-brand/20"
                        onClick={handleCreate}
                        disabled={isPending}
                    >
                        {isPending ? "در حال ثبت اطلاعات..." : "تایید و ساخت پروفایل آژانس"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
