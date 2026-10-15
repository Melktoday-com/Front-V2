'use client';

import { Select } from "@/components/ui/Select";
import { adminService } from "@/services/admin.service";
import { geoService } from "@/services/geo.service";
import { mediaService } from "@/services/media.service";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Archive,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    Plus,
    Search,
    ToggleLeft,
    ToggleRight,
    Upload,
    X
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ProvinceItem, CityItem, ZoneSummary } from "@/types/api/geo.types";
import { getPaginationItems, toPersianDigits } from "@/lib/utils";

type ZoneCategory = "PROVINCE" | "CITY" | "DISTRICT" | "NEIGHBORHOOD";

export default function AdminGeoPage() {
    const queryClient = useQueryClient();
    const [zoneType, setZoneType] = useState<ZoneCategory>("CITY");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [provinceId, setProvinceId] = useState<string>("");
    const [cityId, setCityId] = useState<string>("");
    const [page, setPage] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newZoneName, setNewZoneName] = useState("");
    const [newZoneParentId, setNewZoneParentId] = useState("");
    const [kmlFile, setKmlFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const limit = 15;

    // Fetch Provinces for the filter and province list
    const { data: provincesData } = useQuery({
        queryKey: ["geo", "provinces", "all"],
        queryFn: () => geoService.listProvinces({ limit: 100 }),
    });

    // Fetch Cities for parent selection if NEIGHBORHOOD or DISTRICT is selected
    const { data: citiesData } = useQuery({
        queryKey: ["geo", "cities", provinceId],
        queryFn: () => geoService.listCities({ provinceId: provinceId ? parseInt(provinceId, 10) : undefined, limit: 1000 }),
        enabled: zoneType === "NEIGHBORHOOD" || zoneType === "CITY" || zoneType === "DISTRICT"
    });

    // Fetch Main Data (Cities, Provinces, Districts/Rural Districts, or Neighborhoods)
    const { data: mainData, isLoading } = useQuery({
        queryKey: ["admin", "geo", zoneType, page, searchTerm, statusFilter, provinceId, cityId],
        queryFn: async () => {
            if (zoneType === "PROVINCE") {
                const res = await geoService.listProvinces({
                    page,
                    limit,
                    search: searchTerm.trim() || undefined,
                    status: statusFilter || undefined
                });
                return {
                    items: res.items || res.zones || [],
                    total: res.total || 0,
                    totalPages: res.totalPages || Math.ceil((res.total || 0) / limit),
                };
            } else if (zoneType === "CITY") {
                const res = await geoService.listCities({
                    page,
                    limit,
                    search: searchTerm.trim() || undefined,
                    status: statusFilter || undefined,
                    provinceId: provinceId ? parseInt(provinceId, 10) : undefined
                });
                return {
                    items: res.items || res.zones || [],
                    total: res.total || 0,
                    totalPages: res.totalPages || Math.ceil((res.total || 0) / limit),
                };
            } else if (zoneType === "DISTRICT") {
                const isNumericCity = cityId && /^\d+$/.test(cityId);
                const res = await geoService.listZones({
                    types: "DISTRICT,RURAL_DISTRICT",
                    page,
                    limit,
                    search: searchTerm.trim() || undefined,
                    status: statusFilter || undefined,
                    provinceId: provinceId ? parseInt(provinceId, 10) : undefined,
                    cityId: isNumericCity ? parseInt(cityId, 10) : undefined,
                    parentId: cityId && !isNumericCity ? cityId : undefined,
                });
                return {
                    items: res.zones || [],
                    total: res.total || 0,
                    totalPages: res.totalPages || Math.ceil((res.total || 0) / limit),
                };
            } else {
                const isNumericCity = cityId && /^\d+$/.test(cityId);
                const res = await geoService.listZones({
                    type: "NEIGHBORHOOD",
                    page,
                    limit,
                    search: searchTerm.trim() || undefined,
                    status: statusFilter || undefined,
                    provinceId: provinceId ? parseInt(provinceId, 10) : undefined,
                    cityId: isNumericCity ? parseInt(cityId, 10) : undefined,
                    parentId: cityId && !isNumericCity ? cityId : undefined,
                });
                return {
                    items: res.zones || [],
                    total: res.total || 0,
                    totalPages: res.totalPages || Math.ceil((res.total || 0) / limit),
                };
            }
        },
    });

    const createZoneMutation = useMutation({
        mutationFn: (data: { name: string, zoneType: string, parentZoneId?: string }) =>
            adminService.createGeoZone(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "geo"] });
            toast.success("منطقه جدید با موفقیت ایجاد شد");
            setIsCreateModalOpen(false);
            setNewZoneName("");
            setNewZoneParentId("");
            setKmlFile(null);
        },
        onError: () => {
            toast.error("خطا در ایجاد منطقه جدید");
        }
    });

    const importKmlMutation = useMutation({
        mutationFn: (data: {
            mediaId?: string;
            content?: string;
            type: string;
            parentZoneId?: string;
            geoProvinceId?: number;
            geoCityId?: number;
            format?: string;
        }) => adminService.importGeoZonesKml(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["admin", "geo"] });
            if (data.importedCount > 0) {
                toast.success(`${data.importedCount} محله با موفقیت از فایل وارد شدند`);
            }
            if (data.skippedCount > 0) {
                toast.warning(`${data.skippedCount} مورد به دلیل خطا وارد نشدند`);
            }
            if (data.importedCount === 0 && data.errors && data.errors.length > 0) {
                toast.error(data.errors[0]);
            }
            setIsCreateModalOpen(false);
            setKmlFile(null);
            setNewZoneParentId("");
            setIsUploading(false);
        },
        onError: () => {
            toast.error("خطا در وارد کردن فایل KML");
            setIsUploading(false);
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            geoService.updateZoneStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "geo"] });
            toast.success("وضعیت منطقه با موفقیت بروزرسانی شد");
        },
        onError: () => {
            toast.error("خطا در بروزرسانی وضعیت");
        }
    });

    const provincesMap = new Map<number | string, string>();
    provincesData?.items?.forEach((p: ProvinceItem) => {
        if (p.geoProvinceId) {
            provincesMap.set(p.geoProvinceId, p.name);
            provincesMap.set(String(p.geoProvinceId), p.name);
        }
        if (p.id) provincesMap.set(p.id, p.name);
    });

    const citiesMap = new Map<number | string, string>();
    citiesData?.items?.forEach((c: CityItem) => {
        if (c.id) citiesMap.set(c.id, c.name);
        if (c.geoCityId) {
            citiesMap.set(c.geoCityId, c.name);
            citiesMap.set(String(c.geoCityId), c.name);
        }
    });

    const toggleStatus = (zone: { id: string; status?: string }) => {
        const nextStatus = zone.status === "PUBLISHED" ? "ARCHIVED" : "PUBLISHED";
        updateStatusMutation.mutate({ id: zone.id, status: nextStatus });
    };

    const handleCreateZone = async (e: React.FormEvent) => {
        e.preventDefault();

        if (zoneType === "NEIGHBORHOOD") {
            if (!kmlFile || !newZoneParentId) {
                toast.error("لطفاً فایل KML و شهر مورد نظر را انتخاب کنید");
                return;
            }

            try {
                setIsUploading(true);
                const uploadToastId = toast.loading("در حال آپلود فایل KML به فضای ذخیره‌سازی ابری...");
                const uploadedMedia = await mediaService.upload(kmlFile, "PRIVATE", "DOCUMENT");
                toast.dismiss(uploadToastId);

                const selectedCity = citiesData?.items?.find((c: CityItem) => c.id === newZoneParentId || String(c.geoCityId) === newZoneParentId);
                const cityNumericId = selectedCity?.geoCityId || (/^\d+$/.test(newZoneParentId) ? parseInt(newZoneParentId, 10) : undefined);
                const cityParentUuid = selectedCity?.id || (!/^\d+$/.test(newZoneParentId) ? newZoneParentId : undefined);
                const provNumericId = provinceId ? parseInt(provinceId, 10) : (selectedCity?.geoProvinceId || undefined);

                const parseToastId = toast.loading("در حال استخراج و پردازش پلیگان‌های نقشه...");
                importKmlMutation.mutate(
                    {
                        mediaId: uploadedMedia.mediaId || uploadedMedia.id,
                        type: "NEIGHBORHOOD",
                        parentZoneId: cityParentUuid,
                        geoProvinceId: provNumericId,
                        geoCityId: cityNumericId,
                        format: "KML",
                    },
                    {
                        onSettled: () => {
                            toast.dismiss(parseToastId);
                        },
                    }
                );
            } catch (err) {
                setIsUploading(false);
                toast.dismiss();
                toast.error("خطا در آپلود فایل KML به فضای ذخیره‌سازی");
            }
        } else {
            if (!newZoneName) return;

            createZoneMutation.mutate({
                name: newZoneName,
                zoneType: zoneType,
                parentZoneId: zoneType === "CITY" ? provinceId : undefined
            });
        }
    };

    const StatusBadge = ({ status }: { status?: string }) => {
        switch (status) {
            case "PUBLISHED":
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-subtle text-success text-xs font-bold border border-success/30">
                        <CheckCircle2 size={12} />
                        فعال
                    </span>
                );
            case "DRAFT":
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning-subtle text-warning text-xs font-bold border border-warning/30">
                        <Clock size={12} />
                        پیش‌نویس
                    </span>
                );
            case "ARCHIVED":
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-secondary text-foreground-secondary text-xs font-bold border border-border-subtle">
                        <Archive size={12} />
                        غیرفعال
                    </span>
                );
            default:
                return null;
        }
    };

    const items = mainData?.items || [];
    const totalItems = mainData?.total || 0;
    const totalPages = mainData?.totalPages || Math.ceil(totalItems / limit) || 1;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">مدیریت مناطق جغرافیایی</h1>
                    <p className="text-foreground-muted font-medium">پیکربندی و مدیریت وضعیت استان‌ها، شهرها، دهستان‌ها و محله‌ها در سامانه</p>
                </div>
                {zoneType === 'NEIGHBORHOOD' ? (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-100"
                    >
                        <Plus size={18} />
                        افزودن محله / بارگذاری KML
                    </button>
                ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-info-subtle text-info text-xs font-bold rounded-xl border border-info/30">
                        <CheckCircle2 size={16} />
                        اطلاعات رسمی کشور — مدیریت از طریق دکمه‌های فعال/غیرفعال‌سازی
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-4 items-center bg-surface p-4 rounded-2xl border border-border-subtle shadow-sm">
                {/* Tabs */}
                <div className="flex bg-surface-secondary p-1 rounded-xl">
                    <button
                        onClick={() => { setZoneType("CITY"); setPage(1); setCityId(""); }}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${zoneType === "CITY" ? "bg-surface text-info shadow-sm" : "text-foreground-muted hover:text-foreground-secondary"}`}
                    >
                        شهرها
                    </button>
                    <button
                        onClick={() => { setZoneType("PROVINCE"); setPage(1); setProvinceId(""); setCityId(""); }}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${zoneType === "PROVINCE" ? "bg-surface text-info shadow-sm" : "text-foreground-muted hover:text-foreground-secondary"}`}
                    >
                        استان‌ها
                    </button>
                    <button
                        onClick={() => { setZoneType("DISTRICT"); setPage(1); }}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${zoneType === "DISTRICT" ? "bg-surface text-info shadow-sm" : "text-foreground-muted hover:text-foreground-secondary"}`}
                    >
                        دهستان‌ها و بخش‌ها
                    </button>
                    <button
                        onClick={() => { setZoneType("NEIGHBORHOOD"); setPage(1); }}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${zoneType === "NEIGHBORHOOD" ? "bg-surface text-info shadow-sm" : "text-foreground-muted hover:text-foreground-secondary"}`}
                    >
                        محله‌ها
                    </button>
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-50">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted" size={18} />
                    <input
                        type="text"
                        placeholder="جستجوی نام..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        className="w-full pr-10 pl-4 py-2 rounded-xl border border-border-subtle outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                </div>

                {/* Province Filter */}
                {zoneType !== "PROVINCE" && (
                    <div className="w-full sm:w-48">
                        <Select
                            value={provinceId}
                            onChange={(val) => { setProvinceId(val); setCityId(""); setPage(1); }}
                            options={[
                                { value: "", label: "همه استان‌ها" },
                                ...(provincesData?.items?.map((p: ProvinceItem) => ({
                                    value: String(p.geoProvinceId || p.id),
                                    label: p.name,
                                })) || [])
                            ]}
                            placeholder="همه استان‌ها"
                            size="sm"
                            searchable
                            variant="white"
                        />
                    </div>
                )}

                {/* City Filter (For Districts and Neighborhoods) */}
                {(zoneType === "DISTRICT" || zoneType === "NEIGHBORHOOD") && (
                    <div className="w-full sm:w-48">
                        <Select
                            value={cityId}
                            onChange={(val) => { setCityId(val); setPage(1); }}
                            options={[
                                { value: "", label: "همه شهرها" },
                                ...(citiesData?.items?.map((c: CityItem) => ({
                                    value: c.geoCityId ? String(c.geoCityId) : c.id,
                                    label: c.name,
                                })) || [])
                            ]}
                            placeholder="همه شهرها"
                            size="sm"
                            searchable
                            variant="white"
                        />
                    </div>
                )}

                {/* Status Filter */}
                <div className="w-full sm:w-44">
                    <Select
                        value={statusFilter}
                        onChange={(val) => { setStatusFilter(val); setPage(1); }}
                        options={[
                            { value: "", label: "همه وضعیت‌ها" },
                            { value: "PUBLISHED", label: "فعال" },
                            { value: "DRAFT", label: "پیش‌نویس" },
                            { value: "ARCHIVED", label: "غیرفعال / بایگانی" },
                        ]}
                        placeholder="همه وضعیت‌ها"
                        size="sm"
                        variant="white"
                    />
                </div>
            </div>

            <div className="bg-surface border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="bg-surface-secondary text-foreground-secondary text-sm uppercase">
                            <th className="px-6 py-4 font-bold border-b border-border-subtle">نام</th>
                            {zoneType !== "PROVINCE" && (
                                <th className="px-6 py-4 font-bold border-b border-border-subtle">استان</th>
                            )}
                            {(zoneType === "DISTRICT" || zoneType === "NEIGHBORHOOD") && (
                                <th className="px-6 py-4 font-bold border-b border-border-subtle">شهر</th>
                            )}
                            <th className="px-6 py-4 font-bold border-b border-border-subtle uppercase">
                                کد {zoneType === 'CITY' ? 'شهر' : zoneType === 'PROVINCE' ? 'استان' : zoneType === 'DISTRICT' ? 'دهستان/بخش' : 'محله'}
                            </th>
                            <th className="px-6 py-4 font-bold border-b border-border-subtle text-center">نوع</th>
                            <th className="px-6 py-4 font-bold border-b border-border-subtle text-center">وضعیت</th>
                            <th className="px-6 py-4 font-bold border-b border-border-subtle text-center">عملیات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            <tr>
                                <td colSpan={zoneType === 'PROVINCE' ? 5 : zoneType === 'CITY' ? 6 : 7} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3 text-foreground-muted">
                                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <span>در حال دریافت اطلاعات...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={zoneType === 'PROVINCE' ? 5 : zoneType === 'CITY' ? 6 : 7} className="py-20 text-center text-foreground-muted">
                                    موردی یافت نشد.
                                </td>
                            </tr>
                        ) : (
                            items.map((zone: ProvinceItem | CityItem | ZoneSummary) => (
                                <tr key={zone.id} className="hover:bg-surface-secondary/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-info-subtle text-info p-2 rounded-lg">
                                                <MapPin size={16} />
                                            </div>
                                            <span className="font-bold text-foreground">{zone.name}</span>
                                        </div>
                                    </td>
                                    {zoneType !== "PROVINCE" && (
                                        <td className="px-6 py-4 text-foreground-secondary font-medium">
                                            {zone.provinceName ||
                                                (zone.geoProvinceId != null
                                                    ? (provincesMap.get(zone.geoProvinceId) || provincesMap.get(String(zone.geoProvinceId)))
                                                    : null) ||
                                                "—"}
                                        </td>
                                    )}
                                    {(zoneType === "DISTRICT" || zoneType === "NEIGHBORHOOD") && (
                                        <td className="px-6 py-4 text-foreground-secondary font-medium">
                                            {zone.cityName ||
                                                (zone.geoCityId != null
                                                    ? (citiesMap.get(zone.geoCityId) || citiesMap.get(String(zone.geoCityId)))
                                                    : null) ||
                                                (zone.parentZoneId != null ? citiesMap.get(zone.parentZoneId) : null) ||
                                                "—"}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 font-mono text-sm text-foreground-muted uppercase">
                                        {zoneType === 'CITY'
                                            ? (zone.geoCityId != null ? toPersianDigits(zone.geoCityId) : "—")
                                            : zoneType === 'PROVINCE'
                                            ? (zone.geoProvinceId != null ? toPersianDigits(zone.geoProvinceId) : "—")
                                            : zoneType === 'DISTRICT'
                                            ? (zone.geoDistrictId || zone.geoRuralDistrictId ? toPersianDigits(zone.geoDistrictId || zone.geoRuralDistrictId) : "—")
                                            : (zone.id?.substring(0, 8) ?? "—")}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-surface-secondary text-foreground-secondary">
                                            {(() => {
                                                const rawType = zone.type || (zoneType === 'CITY' ? 'CITY' : zoneType === 'PROVINCE' ? 'PROVINCE' : zoneType === 'DISTRICT' ? 'DISTRICT' : 'NEIGHBORHOOD');
                                                switch (rawType) {
                                                    case 'PROVINCE': return 'استان';
                                                    case 'CITY': return 'شهر';
                                                    case 'COUNTY': return 'شهرستان';
                                                    case 'DISTRICT': return 'بخش';
                                                    case 'RURAL_DISTRICT': return 'دهستان';
                                                    case 'NEIGHBORHOOD': return 'محله';
                                                    default: return 'ناحیه';
                                                }
                                            })()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center">
                                            <StatusBadge status={zone.status} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => toggleStatus(zone)}
                                                disabled={updateStatusMutation.isPending}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${zone.status === "PUBLISHED"
                                                    ? "text-error hover:bg-error-subtle"
                                                    : "text-success hover:bg-success-subtle"
                                                    }`}
                                            >
                                                {zone.status === "PUBLISHED" ? (
                                                    <>
                                                        <ToggleLeft size={18} />
                                                        غیرفعال‌سازی
                                                    </>
                                                ) : (
                                                    <>
                                                        <ToggleRight size={18} />
                                                        فعال‌سازی
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="px-6 py-4 bg-surface-secondary border-t border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span className="text-sm text-foreground-muted">
                        نمایش {totalItems === 0 ? "۰" : toPersianDigits((page - 1) * limit + 1)} تا {toPersianDigits(Math.min(page * limit, totalItems))} از {toPersianDigits(totalItems)} مورد
                    </span>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1.5">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="px-3 py-1.5 border border-border-subtle rounded-xl bg-surface text-foreground-muted hover:text-foreground hover:border-border transition-all font-bold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={16} />
                                <span>قبلی</span>
                            </button>
                            <div className="flex items-center gap-1">
                                {getPaginationItems(page, page, totalPages).map((item, idx) => {
                                    if (item === "...") {
                                        return (
                                            <span key={`ellipsis-${idx}`} className="px-2 text-foreground-muted text-xs select-none">
                                                ...
                                            </span>
                                        );
                                    }
                                    const isCurrent = item === page;
                                    return (
                                        <button
                                            key={`page-${item}`}
                                            onClick={() => setPage(item as number)}
                                            className={`min-w-8 h-8 px-2 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${
                                                isCurrent
                                                    ? "bg-blue-600 text-white shadow-sm font-black"
                                                    : "bg-surface border border-border-subtle text-foreground-secondary hover:bg-surface-secondary"
                                            }`}
                                        >
                                            {toPersianDigits(item)}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className="px-3 py-1.5 border border-border-subtle rounded-xl bg-surface text-foreground-muted hover:text-foreground hover:border-border transition-all font-bold text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <span>بعدی</span>
                                <ChevronLeft size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-border-subtle">
                            <h2 className="text-xl font-bold text-foreground">
                                افزودن {zoneType === 'CITY' ? 'شهر' : zoneType === 'PROVINCE' ? 'استان' : 'محله'} جدید
                            </h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-foreground-muted hover:text-foreground-secondary">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateZone} className="p-6 space-y-5">
                            {zoneType !== "NEIGHBORHOOD" ? (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground-secondary">نام</label>
                                    <input
                                        type="text"
                                        required
                                        value={newZoneName}
                                        onChange={(e) => setNewZoneName(e.target.value)}
                                        placeholder="مثلاً: تهران، صادقیه، ..."
                                        className="w-full px-4 py-2.5 rounded-xl border border-border-subtle outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-foreground-secondary">فایل KML محله‌ها</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept=".kml,application/vnd.google-earth.kml+xml"
                                            required
                                            onChange={(e) => setKmlFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                            id="kml-upload"
                                        />
                                        <label
                                            htmlFor="kml-upload"
                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border-subtle rounded-2xl hover:border-blue-400 hover:bg-info-subtle/50 transition-all cursor-pointer group-hover:scale-[1.01]"
                                        >
                                            <Upload className="text-foreground-muted group-hover:text-info mb-2" size={24} />
                                            <span className="text-xs font-bold text-foreground-muted group-hover:text-info">
                                                {kmlFile ? kmlFile.name : "برای انتخاب فایل کلیک کنید"}
                                            </span>
                                            <span className="text-[10px] text-foreground-muted mt-1">فرمت‌های مجاز: .kml</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {zoneType === "CITY" && (
                                <div className="space-y-2">
                                    <Select
                                        label="استان"
                                        value={newZoneParentId}
                                        onChange={(val) => setNewZoneParentId(val)}
                                        options={
                                            provincesData?.items?.map((p: ProvinceItem) => ({
                                                value: String(p.geoProvinceId || p.id),
                                                label: p.name,
                                            })) || []
                                        }
                                        placeholder="انتخاب استان..."
                                        searchable
                                        variant="white"
                                    />
                                </div>
                            )}

                            {zoneType === "NEIGHBORHOOD" && (
                                <>
                                    <div className="space-y-2">
                                        <Select
                                            label="استان"
                                            value={provinceId}
                                            onChange={(val) => { setProvinceId(val); setNewZoneParentId(""); }}
                                            options={
                                                provincesData?.items?.map((p: ProvinceItem) => ({
                                                    value: String(p.geoProvinceId || p.id),
                                                    label: p.name,
                                                })) || []
                                            }
                                            placeholder="انتخاب استان..."
                                            searchable
                                            variant="white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Select
                                            label="شهر"
                                            value={newZoneParentId}
                                            onChange={(val) => setNewZoneParentId(val)}
                                            disabled={!provinceId}
                                            options={
                                                citiesData?.items?.map((c: CityItem) => ({
                                                    value: c.geoCityId ? String(c.geoCityId) : c.id,
                                                    label: c.name,
                                                })) || []
                                            }
                                            placeholder="انتخاب شهر..."
                                            searchable
                                            variant="white"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    disabled={createZoneMutation.isPending || importKmlMutation.isPending || isUploading}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                                >
                                    {isUploading
                                        ? "در حال آپلود فایل..."
                                        : createZoneMutation.isPending || importKmlMutation.isPending
                                            ? "در حال ثبت..."
                                            : zoneType === "NEIGHBORHOOD"
                                                ? "شروع درون‌ریزی"
                                                : "ثبت منطقه"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-6 py-3 rounded-xl font-bold text-foreground-muted hover:bg-surface-secondary transition-all"
                                >
                                    انصراف
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
