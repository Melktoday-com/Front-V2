"use client";

import { CitySelector } from "@/components/CitySelector";
import { Button } from "@/components/ui/Button";
import { useUploadMedia } from "@/hooks/useMedia";
import { useCreateTemporaryRentDraft } from "@/hooks/useTemporaryRent";
import { CreateTemporaryRentDraftRequest } from "@/types/api/temporary-rent.types";
import { ChevronRight, Image as ImageIcon, MapPin, Plus, Trash2, Upload, Calendar, Users, DollarSign } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Leaflet is client-side only
const DynamicMapPicker = dynamic(() => import("@/components/ui/MapPicker"), { ssr: false });

type Step = "LOCATION" | "DETAILS" | "MEDIA";

export default function CreateTemporaryRentScene() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("LOCATION");
    const [isCitySelectorOpen, setIsCitySelectorOpen] = useState(false);
    
    const [formData, setFormData] = useState<CreateTemporaryRentDraftRequest>({
        cityId: "",
        categoryPath: {
            categoryKey: "residential",
            subcategoryKey: "villa",
            attributeSchemaVersion: 1
        },
        title: "",
        description: "",
        nightlyPrice: 0,
        maxGuests: 2,
        availabilityWindow: {
            availableFrom: new Date().toISOString(),
            availableTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        latitude: 35.6892,
        longitude: 51.3890,
        mediaIds: []
    });

    const [cityName, setCityName] = useState("");
    const { mutateAsync: uploadMedia, isPending: isUploading } = useUploadMedia();
    const createDraftMutation = useCreateTemporaryRentDraft();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            try {
                const result = await uploadMedia(files[i]);
                setFormData(prev => ({
                    ...prev,
                    mediaIds: [...(prev.mediaIds || []), result.mediaId]
                }));
            } catch (err) {
                toast.error("خطا در آپلود تصویر");
            }
        }
    };

    const removeMedia = (id: string) => {
        setFormData(prev => ({
            ...prev,
            mediaIds: prev.mediaIds?.filter(m => m !== id)
        }));
    };

    const handleNext = () => {
        if (step === "LOCATION") {
            if (!formData.cityId) {
                toast.error("لطفا شهر را انتخاب کنید");
                return;
            }
            setStep("DETAILS");
        } else if (step === "DETAILS") {
            if (!formData.title || !formData.description || formData.nightlyPrice <= 0) {
                toast.error("لطفا تمام فیلدها را با مقادیر معتبر پر کنید");
                return;
            }
            setStep("MEDIA");
        } else if (step === "MEDIA") {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        try {
            await createDraftMutation.mutateAsync(formData);
            toast.success("اقامتگاه با موفقیت به عنوان پیش‌نویس ثبت شد");
            router.push("/profile/temporary-rent");
        } catch (err) {
            toast.error("خطا در ثبت اقامتگاه");
        }
    };

    return (
        <div className="min-h-screen bg-white pb-24 lg:pb-10">
            <header className="p-6 lg:px-10 border-b flex items-center gap-4 bg-white sticky top-0 z-10">
                <button onClick={() => router.back()} className="hover:bg-soft-bg p-2 rounded-xl transition-colors">
                    <ChevronRight className="w-6 h-6 text-brand" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-brand">ثبت اقامتگاه جدید</h1>
                    <div className="flex gap-1 mt-1">
                        <div className={cn("h-1 w-6 rounded-full", step === "LOCATION" ? "bg-primary" : "bg-soft-border")} />
                        <div className={cn("h-1 w-6 rounded-full", step === "DETAILS" ? "bg-primary" : "bg-soft-border")} />
                        <div className={cn("h-1 w-6 rounded-full", step === "MEDIA" ? "bg-primary" : "bg-soft-border")} />
                    </div>
                </div>
            </header>

            <main className="p-6 max-w-2xl mx-auto">
                {step === "LOCATION" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <section className="space-y-4">
                            <h2 className="text-brand font-black text-lg flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary" />
                                موقعیت اقامتگاه
                            </h2>
                            <Button
                                variant="outline"
                                onClick={() => setIsCitySelectorOpen(true)}
                                className="w-full h-14 rounded-2xl justify-between border-soft-border hover:bg-soft-bg group"
                            >
                                <span className={cn("font-bold", cityName ? "text-brand" : "text-secondary")}>
                                    {cityName || "انتخاب شهر..."}
                                </span>
                                <ChevronRight className="w-5 h-5 text-secondary group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </section>

                        <section className="space-y-4">
                            <label className="text-brand font-bold text-sm block pr-2">انتخاب دقیق روی نقشه</label>
                            <div className="rounded-[30px] overflow-hidden border border-soft-border shadow-sm">
                                <DynamicMapPicker 
                                    initialCenter={[formData.latitude, formData.longitude]}
                                    onChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                                />
                            </div>
                        </section>
                    </div>
                )}

                {step === "DETAILS" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <section className="space-y-6">
                            <h2 className="text-brand font-black text-lg flex items-center gap-2">
                                <Plus className="w-5 h-5 text-primary" />
                                اطلاعات اصلی
                            </h2>
                            
                            <div className="space-y-2">
                                <label className="text-brand font-bold text-sm pr-2">عنوان آگهی</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full bg-soft-bg border border-soft-border rounded-2xl py-4 px-6 text-brand font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                    placeholder="مثلاً: ویلای استخردار در رامسر"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-brand font-bold text-sm pr-2">توضیحات</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full bg-soft-bg border border-soft-border rounded-2xl py-4 px-6 text-brand font-bold focus:ring-2 focus:ring-primary/20 outline-none min-h-[150px]"
                                    placeholder="توضیحات کامل درباره امکانات و دسترسی‌ها..."
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-brand font-bold text-sm pr-2 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-primary" />
                                        اجاره هر شب (تومان)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.nightlyPrice || ""}
                                        onChange={(e) => setFormData(prev => ({ ...prev, nightlyPrice: Number(e.target.value) }))}
                                        className="w-full bg-soft-bg border border-soft-border rounded-2xl py-4 px-6 text-brand font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-brand font-bold text-sm pr-2 flex items-center gap-2">
                                        <Users className="w-4 h-4 text-primary" />
                                        ظرفیت (نفر)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.maxGuests}
                                        onChange={(e) => setFormData(prev => ({ ...prev, maxGuests: Number(e.target.value) }))}
                                        className="w-full bg-soft-bg border border-soft-border rounded-2xl py-4 px-6 text-brand font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {step === "MEDIA" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <section className="space-y-6">
                            <h2 className="text-brand font-black text-lg flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-primary" />
                                تصاویر اقامتگاه
                            </h2>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {formData.mediaIds?.map((id) => (
                                    <div key={id} className="relative aspect-square rounded-2xl overflow-hidden border border-soft-border group">
                                        <img
                                            src={`${process.env.NEXT_PUBLIC_API_URL}/media/${id}`}
                                            className="w-full h-full object-cover"
                                            alt="Uploaded"
                                        />
                                        <button
                                            onClick={() => removeMedia(id)}
                                            className="absolute top-2 left-2 p-1.5 bg-error text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                
                                <label className={cn(
                                    "aspect-square rounded-2xl border-2 border-dashed border-soft-border flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-soft-bg transition-colors",
                                    isUploading && "animate-pulse"
                                )}>
                                    <input
                                        type="file"
                                        multiple
                                        hidden
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        disabled={isUploading}
                                    />
                                    {isUploading ? (
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 text-secondary" />
                                            <span className="text-xs font-bold text-secondary">افزودن تصویر</span>
                                        </>
                                    )}
                                </label>
                            </div>
                            <p className="text-center text-xs text-secondary font-bold">
                                برای انتشار نهایی، داشتن حداقل یک تصویر الزامی است.
                            </p>
                        </section>
                    </div>
                )}

                <div className="mt-12 flex items-center gap-4">
                    {step !== "LOCATION" && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (step === "DETAILS") setStep("LOCATION");
                                if (step === "MEDIA") setStep("DETAILS");
                            }}
                            className="flex-1 h-14 rounded-2xl font-black border-soft-border"
                        >
                            مرحله قبلی
                        </Button>
                    )}
                    <Button
                        onClick={handleNext}
                        disabled={createDraftMutation.isPending}
                        className="flex-[2] h-14 rounded-2xl font-black text-lg"
                    >
                        {step === "MEDIA" 
                            ? (createDraftMutation.isPending ? "در حال ثبت..." : "ثبت نهایی پیش‌نویس") 
                            : "مرحله بعدی"
                        }
                    </Button>
                </div>
            </main>

            <CitySelector
                isOpen={isCitySelectorOpen}
                onClose={() => setIsCitySelectorOpen(false)}
                onSelect={(city) => {
                    setFormData(prev => ({ 
                        ...prev, 
                        cityId: city.id,
                        latitude: city.centerPoint?.latitude || prev.latitude,
                        longitude: city.centerPoint?.longitude || prev.longitude
                    }));
                    setCityName(city.name);
                    setIsCitySelectorOpen(false);
                }}
            />
        </div>
    );
}

function Loader2(props: any) {
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
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
