'use client';

import { Select } from "@/components/ui/Select";
import { adminService } from "@/services/admin.service";
import { geoService } from "@/services/geo.service";
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

    const limit = 15;

    // Fetch Provinces for the filter and province list
    const { data: provincesData } = useQuery({
        queryKey: ["geo", "provinces", "all"],
        queryFn: () => geoService.listProvinces({ limit: 100 }),
    });

    // Fetch Cities for parent selection if NEIGHBORHOOD or DISTRICT is selected
    const { data: citiesData } = useQuery({
        queryKey: ["geo", "cities", provinceId],
        queryFn: () => geoService.listCities({ provinceId: provinceId ? parseInt(provinceId) : undefined, limit: 1000 }),
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
                    search: searchTerm,
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
                    search: searchTerm,
                    status: statusFilter || undefined,
                    provinceId: provinceId ? parseInt(provinceId) : undefined
                });
                return {
                    items: res.items || res.zones || [],
                    total: res.total || 0,
                    totalPages: res.totalPages || Math.ceil((res.total || 0) / limit),
                };
            } else if (zoneType === "DISTRICT") {
                const res = await geoService.listZones({
                    types: "DISTRICT,RURAL_DISTRICT",
                    page,
                    limit,
                    search: searchTerm,
                    status: statusFilter || undefined,
                    provinceId: provinceId ? parseInt(provinceId) : undefined,
                    cityId: cityId ? parseInt(cityId) : undefined
                });
                return {
                    items: res.zones || [],
                    total: res.total || 0,
                    totalPages: res.totalPages || Math.ceil((res.total || 0) / limit),
                };
            } else {
                const res = await geoService.listZones({
                    type: "NEIGHBORHOOD",
                    page,
                    limit,
                    search: searchTerm,
                    status: statusFilter || undefined,
                    provinceId: provinceId ? parseInt(provinceId) : undefined,
                    cityId: cityId ? parseInt(cityId) : undefined
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
        mutationFn: (data: { content: string; type: string; parentZoneId?: string }) =>
            adminService.importGeoZonesKml(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["admin", "geo"] });
            if (data.importedCount > 0) {
                toast.success(`${data.importedCount} محله با موفقیت از فایل وارد شدند`);
            }
            if (data.skippedCount > 0) {
                toast.warning(`${data.skippedCount} مورد به دلیل خطا وارد نشدند`);
            }
            setIsCreateModalOpen(false);
            setKmlFile(null);
            setNewZoneParentId("");
        },
        onError: () => {
            toast.error("خطا در وارد کردن فایل KML");
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
    provincesData?.items?.forEach((p: any) => {
        if (p.geoProvinceId) {
            provincesMap.set(p.geoProvinceId, p.name);
            provincesMap.set(String(p.geoProvinceId), p.name);
        }
        if (p.id) provincesMap.set(p.id, p.name);
    });

    const citiesMap = new Map<number | string, string>();
    citiesData?.items?.forEach((c: any) => {
        if (c.id) citiesMap.set(c.id, c.name);
        if (c.geoCityId) {
            citiesMap.set(c.geoCityId, c.name);
            citiesMap.set(String(c.geoCityId), c.name);
        }
    });

    const toggleStatus = (zone: any) => {
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

            const reader = new FileReader();
            reader.onload = async (event) => {
                const content = event.target?.result as string;
                importKmlMutation.mutate({ content, type: "NEIGHBORHOOD", parentZoneId: newZoneParentId });
            };
            reader.readAsText(kmlFile);
        } else {
            if (!newZoneName) return;

            createZoneMutation.mutate({
                name: newZoneName,
                zoneType: zoneType,
                parentZoneId: zoneType === "CITY" ? provinceId : undefined
            });
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case "PUBLISHED":
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100">
                        <CheckCircle2 size={12} />
                        فعال
                    </span>
                );
            case "DRAFT":
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                        <Clock size={12} />
                        پیش‌نویس
                    </span>
                );
            case "ARCHIVED":
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 text-xs font-bold border border-gray-100">
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
                    <h1 className="text-2xl font-bold text-gray-800">مدیریت مناطق جغرافیایی</h1>
                    <p className="text-gray-500 font-medium">پیکربندی و مدیریت وضعیت استان‌ها، شهرها، دهستان‌ها و محله‌ها در سامانه</p>
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
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-100">
                        <CheckCircle2 size={16} />
                        اطلاعات رسمی کشور — مدیریت از طریق دکمه‌های فعال/غیرفعال‌سازی
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => { setZoneType("CITY"); setPage(1); }}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${zoneType === "CITY" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        شهرها
                    </button>
                    <button
                        onClick={() => { setZoneType("PROVINCE"); setPage(1); }}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${zoneType === "PROVINCE" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        استان‌ها
                    </button>
                    <button
                        onClick={() => { setZoneType("DISTRICT"); setPage(1); }}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${zoneType === "DISTRICT" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        دهستان‌ها و بخش‌ها
                    </button>
                    <button
                        onClick={() => { setZoneType("NEIGHBORHOOD"); setPage(1); }}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${zoneType === "NEIGHBORHOOD" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        محله‌ها
                    </button>
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-50">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="جستجوی نام..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        className="w-full pr-10 pl-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                                ...(provincesData?.items?.map((p: any) => ({
                                    value: p.geoProvinceId || p.id,
                                    label: p.name,
                                })) || [])
                            ]}
                            placeholder="همه استان‌ها"
                            size="sm"
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
                                ...(citiesData?.items?.map((c: any) => ({
                                    value: c.id || c.geoCityId,
                                    label: c.name,
                                })) || [])
                            ]}
                            placeholder="همه شهرها"
                            size="sm"
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

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 text-sm uppercase">
                            <th className="px-6 py-4 font-bold border-b border-gray-100">نام</th>
                            {zoneType !== "PROVINCE" && (
                                <th className="px-6 py-4 font-bold border-b border-gray-100">استان</th>
                            )}
                            {(zoneType === "DISTRICT" || zoneType === "NEIGHBORHOOD") && (
                                <th className="px-6 py-4 font-bold border-b border-gray-100">شهر</th>
                            )}
                            <th className="px-6 py-4 font-bold border-b border-gray-100 uppercase">
                                کد {zoneType === 'CITY' ? 'شهر' : zoneType === 'PROVINCE' ? 'استان' : zoneType === 'DISTRICT' ? 'دهستان/بخش' : 'محله'}
                            </th>
                            <th className="px-6 py-4 font-bold border-b border-gray-100 text-center">نوع</th>
                            <th className="px-6 py-4 font-bold border-b border-gray-100 text-center">وضعیت</th>
                            <th className="px-6 py-4 font-bold border-b border-gray-100 text-center">عملیات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            <tr>
                                <td colSpan={zoneType === 'PROVINCE' ? 5 : zoneType === 'CITY' ? 6 : 7} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3 text-gray-400">
                                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <span>در حال دریافت اطلاعات...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={zoneType === 'PROVINCE' ? 5 : zoneType === 'CITY' ? 6 : 7} className="py-20 text-center text-gray-400">
                                    موردی یافت نشد.
                                </td>
                            </tr>
                        ) : (
                            items.map((zone: any) => (
                                <tr key={zone.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                                                <MapPin size={16} />
                                            </div>
                                            <span className="font-bold text-gray-800">{zone.name}</span>
                                        </div>
                                    </td>
                                    {zoneType !== "PROVINCE" && (
                                        <td className="px-6 py-4 text-gray-600 font-medium">
                                            {provincesMap.get(zone.geoProvinceId) || provincesMap.get(String(zone.geoProvinceId)) || "—"}
                                        </td>
                                    )}
                                    {(zoneType === "DISTRICT" || zoneType === "NEIGHBORHOOD") && (
                                        <td className="px-6 py-4 text-gray-600 font-medium">
                                            {citiesMap.get(zone.geoCityId) || citiesMap.get(String(zone.geoCityId)) || citiesMap.get(zone.parentZoneId) || "—"}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 font-mono text-sm text-gray-500 uppercase">
                                        {zoneType === 'CITY'
                                            ? (zone.geoCityId ?? "—")
                                            : zoneType === 'PROVINCE'
                                            ? (zone.geoProvinceId ?? "—")
                                            : zoneType === 'DISTRICT'
                                            ? (zone.geoDistrictId || zone.geoRuralDistrictId || "—")
                                            : (zone.id?.substring(0, 8) ?? "—")}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
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
                                                    ? "text-red-600 hover:bg-red-50"
                                                    : "text-green-600 hover:bg-green-50"
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
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                        نمایش {items.length} مورد از {totalItems}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-blue-600 hover:border-blue-200 disabled:opacity-50 transition-all font-bold"
                        >
                            <ChevronRight size={18} />
                        </button>
                        <div className="flex gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) pageNum = i + 1;
                                else if (page <= 3) pageNum = i + 1;
                                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                else pageNum = page - 2 + i;

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setPage(pageNum)}
                                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${page === pageNum
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            disabled={page === totalPages || totalPages === 0}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:text-blue-600 hover:border-blue-200 disabled:opacity-50 transition-all font-bold"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">
                                افزودن {zoneType === 'CITY' ? 'شهر' : zoneType === 'PROVINCE' ? 'استان' : 'محله'} جدید
                            </h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateZone} className="p-6 space-y-5">
                            {zoneType !== "NEIGHBORHOOD" ? (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">نام</label>
                                    <input
                                        type="text"
                                        required
                                        value={newZoneName}
                                        onChange={(e) => setNewZoneName(e.target.value)}
                                        placeholder="مثلاً: تهران، صادقیه، ..."
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">فایل KML محله‌ها</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept=".kml"
                                            required
                                            onChange={(e) => setKmlFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                            id="kml-upload"
                                        />
                                        <label
                                            htmlFor="kml-upload"
                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group-hover:scale-[1.01]"
                                        >
                                            <Upload className="text-gray-400 group-hover:text-blue-500 mb-2" size={24} />
                                            <span className="text-xs font-bold text-gray-500 group-hover:text-blue-600">
                                                {kmlFile ? kmlFile.name : "برای انتخاب فایل کلیک کنید"}
                                            </span>
                                            <span className="text-[10px] text-gray-400 mt-1">فرمت‌های مجاز: .kml</span>
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
                                            provincesData?.items?.map((p: any) => ({
                                                value: p.geoProvinceId,
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
                                            onChange={(val) => setProvinceId(val)}
                                            options={
                                                provincesData?.items?.map((p: any) => ({
                                                    value: p.geoProvinceId,
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
                                                citiesData?.items?.map((c: any) => ({
                                                    value: c.id || c.geoCityId,
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
                                    disabled={createZoneMutation.isPending || importKmlMutation.isPending}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                                >
                                    {createZoneMutation.isPending || importKmlMutation.isPending ? "در حال ثبت..." : (zoneType === "NEIGHBORHOOD" ? "شروع درون‌ریزی" : "ثبت منطقه")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
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
