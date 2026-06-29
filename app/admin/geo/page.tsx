"use client";

import { adminService } from "@/services/admin.service";
import { CreateGeoZoneRequest, GeoZone } from "@/types/api/admin.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, FileUp, MapPin, Plus, Save, Search, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

type ZoneCategory = "CITY" | "NEIGHBORHOOD" | "MAP_ZONE";

export default function AdminGeoPage() {
    const queryClient = useQueryClient();
    const [zoneType, setZoneType] = useState<ZoneCategory>("NEIGHBORHOOD");
    const [searchTerm, setSearchTerm] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [newZoneName, setNewZoneName] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: zones, isLoading } = useQuery<GeoZone[]>({
        queryKey: ["admin", "geo", zoneType],
        queryFn: () => adminService.listGeoZones(zoneType),
        initialData: [],
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminService.archiveGeoZone(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "geo", zoneType] });
            toast.success("منطقه با موفقیت حذف شد");
        }
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateGeoZoneRequest) => adminService.createGeoZone(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "geo", zoneType] });
            toast.success("منطقه جدید با موفقیت ثبت شد");
            setIsAdding(false);
            setNewZoneName("");
        }
    });

    const importKmlMutation = useMutation({
        mutationFn: (data: { kmlContent: string }) => adminService.importGeoZonesKml(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "geo", zoneType] });
            toast.success("مناطق از فایل KML با موفقیت وارد شدند");
        },
        onError: () => {
            toast.error("خطا در وارد کردن فایل KML");
        }
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            importKmlMutation.mutate({ kmlContent: content });
        };
        reader.readAsText(file);
    };

    const filteredZones = zones?.filter((z: GeoZone) => z.name.includes(searchTerm)) || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">مدیریت محدوده جغرافیایی</h1>
                    <p className="text-gray-500 font-medium">پیکربندی شهرها، محله‌ها و مناطق شهری</p>
                </div>
                <div className="flex gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".kml"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importKmlMutation.isPending}
                        className="bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <FileUp size={20} />
                        {importKmlMutation.isPending ? 'در حال وارد کردن...' : 'وارد کردن KML'}
                    </button>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                        <Plus size={20} />
                        افزودن {zoneType === 'CITY' ? 'شهر' : zoneType === 'NEIGHBORHOOD' ? 'محله' : 'منطقه'} جدید
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                        <h3 className="font-bold text-gray-700 mb-4 px-2">نوع محدوده</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => setZoneType("CITY")}
                                className={`w-full text-right px-4 py-3 rounded-xl transition-all ${zoneType === "CITY" ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-500 hover:bg-gray-50"}`}
                            >
                                شهرها
                            </button>
                            <button
                                onClick={() => setZoneType("NEIGHBORHOOD")}
                                className={`w-full text-right px-4 py-3 rounded-xl transition-all ${zoneType === "NEIGHBORHOOD" ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-500 hover:bg-gray-50"}`}
                            >
                                محله‌ها
                            </button>
                            <button
                                onClick={() => setZoneType("MAP_ZONE")}
                                className={`w-full text-right px-4 py-3 rounded-xl transition-all ${zoneType === "MAP_ZONE" ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-500 hover:bg-gray-50"}`}
                            >
                                مناطق شهری (Map Zones)
                            </button>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-3 space-y-4">
                    <div className="relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder={`جستجو در بین ${zoneType === 'CITY' ? 'شهرها' : zoneType === 'NEIGHBORHOOD' ? 'محله‌ها' : 'مناطق'}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pr-12 pl-4 py-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                        />
                    </div>

                    {isAdding && (
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-4 items-center animate-in slide-in-from-top-2">
                            <input
                                type="text"
                                placeholder={`نام ${zoneType === 'CITY' ? 'شهر' : zoneType === 'NEIGHBORHOOD' ? 'محله' : 'منطقه'}`}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-blue-200 outline-none"
                                value={newZoneName}
                                onChange={(e) => setNewZoneName(e.target.value)}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => createMutation.mutate({ name: newZoneName, zoneType: zoneType })}
                                    className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700"
                                >
                                    <Save size={20} />
                                </button>
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="bg-white text-gray-500 border border-gray-200 p-2.5 rounded-xl hover:bg-gray-50"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        {isLoading ? (
                            <div className="p-20 text-center text-gray-400">در حال دریافت داده‌ها...</div>
                        ) : filteredZones.length === 0 ? (
                            <div className="p-20 text-center text-gray-400">موردی یافت نشد.</div>
                        ) : (
                            <div className="grid grid-cols-1 divide-y divide-gray-100">
                                {filteredZones.map((zone: GeoZone) => (
                                    <div key={zone.id} className="p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-gray-100 p-2.5 rounded-xl text-gray-600">
                                                <MapPin size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800">{zone.name}</h4>
                                                <p className="text-xs text-gray-400 mt-0.5">ID: {zone.id}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                <Edit3 size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('آیا از حذف این منطقه مطمئن هستید؟')) {
                                                        deleteMutation.mutate(zone.id);
                                                    }
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
