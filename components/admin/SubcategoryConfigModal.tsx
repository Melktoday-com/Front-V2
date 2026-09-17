'use client';

import { adminService } from "@/services/admin.service";
import { DynamicAttributeType } from "@/types/api/ads.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    AlertCircle,
    Check,
    CheckSquare,
    ChevronDown,
    DollarSign,
    Edit2,
    Layers,
    ListFilter,
    Plus,
    Sliders,
    Square,
    Trash2,
    X
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface SubcategoryConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    subcategoryId: string;
    subcategoryName: string;
    categoryName: string;
    variant?: 'normal' | 'temporary-rent';
}

interface OptionInput {
    key: string;
    label: string;
    displayOrder?: number;
}

interface AttributeFormData {
    id?: string;
    key: string;
    label: string;
    description: string;
    type: DynamicAttributeType;
    required: boolean;
    displayOrder: number;
    options: OptionInput[];
    constraints: {
        min?: number;
        max?: number;
    };
}

const initialAttributeFormData: AttributeFormData = {
    key: "",
    label: "",
    description: "",
    type: "STRING",
    required: false,
    displayOrder: 1,
    options: [],
    constraints: {}
};

export default function SubcategoryConfigModal({
    isOpen,
    onClose,
    subcategoryId,
    subcategoryName,
    categoryName,
    variant = 'normal'
}: SubcategoryConfigModalProps) {
    const queryClient = useQueryClient();
    const isTemp = variant === 'temporary-rent';
    const [activeTab, setActiveTab] = useState<'price-models' | 'attributes'>('price-models');

    // Selected price models state
    const [selectedPriceModelIds, setSelectedPriceModelIds] = useState<string[]>([]);

    // Attribute modal state
    const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
    const [attributeFormData, setAttributeFormData] = useState<AttributeFormData>(initialAttributeFormData);
    const [newOptionKey, setNewOptionKey] = useState("");
    const [newOptionLabel, setNewOptionLabel] = useState("");

    // Queries
    const queryKeyPrefix = isTemp ? ["admin", "temporary-rent"] : ["admin", "ads"];

    // 1. All available price models
    const { data: allPriceModels, isLoading: loadingPriceModels } = useQuery({
        queryKey: [...queryKeyPrefix, "price-models"],
        queryFn: () => isTemp ? adminService.listTemporaryRentPriceModels() : adminService.listPriceModels(),
        enabled: isOpen,
    });

    // 2. Currently assigned price models for this subcategory
    const { data: subcategoryPriceModels, isLoading: loadingSubPriceModels } = useQuery({
        queryKey: [...queryKeyPrefix, "subcategory-price-models", subcategoryId],
        queryFn: () => isTemp
            ? adminService.getTemporaryRentSubcategoryPriceModels(subcategoryId)
            : adminService.getSubcategoryPriceModels(subcategoryId),
        enabled: isOpen && !!subcategoryId,
    });

    // Sync selected price model IDs when fetched
    useEffect(() => {
        if (subcategoryPriceModels && Array.isArray(subcategoryPriceModels)) {
            setSelectedPriceModelIds(subcategoryPriceModels.map((pm: any) => pm.id));
        }
    }, [subcategoryPriceModels]);

    // 3. Subcategory dynamic attributes
    const { data: attributes, isLoading: loadingAttributes } = useQuery({
        queryKey: [...queryKeyPrefix, "subcategory-attributes", subcategoryId],
        queryFn: () => isTemp
            ? adminService.getTemporaryRentAttributes(subcategoryId)
            : adminService.getSubcategoryAttributes(subcategoryId),
        enabled: isOpen && !!subcategoryId,
    });

    // Mutation: Assign price models
    const assignPriceModelsMutation = useMutation({
        mutationFn: (ids: string[]) => isTemp
            ? adminService.assignTemporaryRentPriceModels(subcategoryId, ids)
            : adminService.assignPriceModelsToSubcategory(subcategoryId, ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeyPrefix, "subcategory-price-models", subcategoryId] });
            queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
            toast.success("مدل‌های قیمت‌گذاری مجاز با موفقیت ذخیره شدند");
        },
        onError: () => toast.error("خطا در ذخیره مدل‌های قیمت‌گذاری")
    });

    // Mutation: Create / Update attribute
    const saveAttributeMutation = useMutation({
        mutationFn: async (data: AttributeFormData) => {
            const payload: any = {
                label: data.label,
                description: data.description || undefined,
                type: data.type,
                required: data.required,
                displayOrder: Number(data.displayOrder) || 1,
            };

            if (data.type === 'SELECT') {
                payload.options = data.options;
            } else {
                payload.options = null;
            }

            if (data.type === 'NUMBER') {
                const constraints: any = {};
                if (data.constraints.min !== undefined && data.constraints.min !== null) constraints.min = Number(data.constraints.min);
                if (data.constraints.max !== undefined && data.constraints.max !== null) constraints.max = Number(data.constraints.max);
                payload.constraints = constraints;
            } else {
                payload.constraints = null;
            }

            if (data.id) {
                // Update
                return isTemp
                    ? adminService.updateTemporaryRentAttribute(subcategoryId, data.id, payload)
                    : adminService.updateSubcategoryAttribute(subcategoryId, data.id, payload);
            } else {
                // Create
                payload.key = data.key.trim();
                return isTemp
                    ? adminService.createTemporaryRentAttribute(subcategoryId, payload)
                    : adminService.createSubcategoryAttribute(subcategoryId, payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeyPrefix, "subcategory-attributes", subcategoryId] });
            toast.success(attributeFormData.id ? "ویژگی با موفقیت ویرایش شد" : "ویژگی جدید با موفقیت اضافه شد");
            setIsAttributeModalOpen(false);
            setAttributeFormData(initialAttributeFormData);
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || "خطا در ذخیره ویژگی";
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
    });

    // Mutation: Delete attribute
    const deleteAttributeMutation = useMutation({
        mutationFn: (attributeId: string) => isTemp
            ? adminService.deleteTemporaryRentAttribute(subcategoryId, attributeId)
            : adminService.deleteSubcategoryAttribute(subcategoryId, attributeId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeyPrefix, "subcategory-attributes", subcategoryId] });
            toast.success("ویژگی با موفقیت حذف شد");
        },
        onError: () => toast.error("خطا در حذف ویژگی")
    });

    if (!isOpen) return null;

    const togglePriceModel = (id: string) => {
        setSelectedPriceModelIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleOpenCreateAttribute = () => {
        setAttributeFormData({
            ...initialAttributeFormData,
            displayOrder: (attributes?.length || 0) + 1
        });
        setNewOptionKey("");
        setNewOptionLabel("");
        setIsAttributeModalOpen(true);
    };

    const handleOpenEditAttribute = (attr: any) => {
        setAttributeFormData({
            id: attr.id,
            key: attr.key,
            label: attr.label,
            description: attr.description || "",
            type: attr.type,
            required: !!attr.required,
            displayOrder: attr.displayOrder ?? 1,
            options: Array.isArray(attr.options) ? [...attr.options] : [],
            constraints: {
                min: attr.constraints?.min,
                max: attr.constraints?.max,
            }
        });
        setNewOptionKey("");
        setNewOptionLabel("");
        setIsAttributeModalOpen(true);
    };

    const handleAddOption = () => {
        if (!newOptionKey.trim() || !newOptionLabel.trim()) {
            toast.error("کلید و عنوان گزینه را وارد کنید");
            return;
        }
        setAttributeFormData(prev => ({
            ...prev,
            options: [
                ...prev.options,
                {
                    key: newOptionKey.trim(),
                    label: newOptionLabel.trim(),
                    displayOrder: prev.options.length + 1
                }
            ]
        }));
        setNewOptionKey("");
        setNewOptionLabel("");
    };

    const handleRemoveOption = (index: number) => {
        setAttributeFormData(prev => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== index)
        }));
    };

    const getTypeBadge = (type: DynamicAttributeType) => {
        switch (type) {
            case 'STRING':
                return <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md">متنی</span>;
            case 'NUMBER':
                return <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md">عددی</span>;
            case 'BOOLEAN':
                return <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-md">بله / خیر</span>;
            case 'SELECT':
                return <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-md">انتخابی</span>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-100">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                                {categoryName}
                            </span>
                            <span className="text-slate-300">/</span>
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-blue-600" />
                                تنظیمات زیردسته: {subcategoryName}
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            تنظیم الگوهای قیمت‌گذاری مجاز و ویژگی‌های فیلدی داینامیک این زیردسته
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 bg-white px-6">
                    <button
                        onClick={() => setActiveTab('price-models')}
                        className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all ${
                            activeTab === 'price-models'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <DollarSign className="w-4 h-4" />
                        مدل‌های قیمت‌گذاری مجاز
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                            {selectedPriceModelIds.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('attributes')}
                        className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all ${
                            activeTab === 'attributes'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <ListFilter className="w-4 h-4" />
                        ویژگی‌های داینامیک فرم
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                            {attributes?.length || 0}
                        </span>
                    </button>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* TAB 1: Price Models */}
                    {activeTab === 'price-models' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-900 leading-relaxed">
                                    تنها مدل‌هایی که در این بخش انتخاب و تیک زده شوند، هنگام ثبت آگهی در این زیردسته به کاربر نمایش داده می‌شوند و سیستم صحت مقادیر مالی را با فرمول‌های فیلدهای آن مدل ارزیابی می‌کند.
                                </p>
                            </div>

                            {loadingPriceModels || loadingSubPriceModels ? (
                                <div className="py-16 text-center text-slate-400">
                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                    در حال بارگذاری مدل‌های قیمت‌گذاری...
                                </div>
                            ) : !allPriceModels || allPriceModels.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    هیچ مدل قیمت‌گذاری در سیستم تعریف نشده است.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {allPriceModels.map((pm: any) => {
                                        const isChecked = selectedPriceModelIds.includes(pm.id);
                                        return (
                                            <div
                                                key={pm.id}
                                                onClick={() => togglePriceModel(pm.id)}
                                                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                                                    isChecked
                                                        ? 'border-blue-600 bg-blue-50/20 shadow-sm shadow-blue-100'
                                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-0.5 rounded-lg p-1 transition-colors ${
                                                            isChecked ? 'text-blue-600' : 'text-slate-300'
                                                        }`}>
                                                            {isChecked ? (
                                                                <CheckSquare className="w-5 h-5 text-blue-600" />
                                                            ) : (
                                                                <Square className="w-5 h-5 text-slate-300" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-sm text-slate-900">
                                                                    {pm.displayName || pm.name}
                                                                </h4>
                                                                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                                                    {pm.key}
                                                                </span>
                                                            </div>
                                                            {pm.description && (
                                                                <p className="text-xs text-slate-500 mt-1 leading-normal">
                                                                    {pm.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Pricing fields preview */}
                                                {pm.pricingFields && Array.isArray(pm.pricingFields) && pm.pricingFields.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                                                        <span className="text-[10px] text-slate-400 ml-1">فیلدها:</span>
                                                        {pm.pricingFields.map((f: any) => (
                                                            <span
                                                                key={f.key}
                                                                className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                                                                    f.required
                                                                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                                                        : 'bg-slate-100 text-slate-600'
                                                                }`}
                                                            >
                                                                {f.label} {f.required && '*'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={() => assignPriceModelsMutation.mutate(selectedPriceModelIds)}
                                    disabled={assignPriceModelsMutation.isPending}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-blue-200 disabled:opacity-50"
                                >
                                    <Check className="w-5 h-5" />
                                    {assignPriceModelsMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات مدل‌های مجاز"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Dynamic Attributes */}
                    {activeTab === 'attributes' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">لیست ویژگی‌های اختصاصی این زیردسته</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        فیلدهای فرم مانند تعداد اتاق، متراژ، طبقه، آسانسور و غیره
                                    </p>
                                </div>
                                <button
                                    onClick={handleOpenCreateAttribute}
                                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-200"
                                >
                                    <Plus className="w-4 h-4" />
                                    افزودن ویژگی جدید
                                </button>
                            </div>

                            {loadingAttributes ? (
                                <div className="py-16 text-center text-slate-400">
                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                    در حال بارگذاری ویژگی‌ها...
                                </div>
                            ) : !attributes || attributes.length === 0 ? (
                                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-slate-400 text-sm mb-3">هنوز هیچ ویژگی داینامیکی برای این زیردسته تعریف نشده است.</p>
                                    <button
                                        onClick={handleOpenCreateAttribute}
                                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline"
                                    >
                                        <Plus className="w-4 h-4" />
                                        تعریف اولین ویژگی
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {attributes.map((attr: any) => (
                                        <div
                                            key={attr.id}
                                            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                                                    #{attr.displayOrder || 1}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-slate-900 text-sm">{attr.label}</span>
                                                        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                                            {attr.key}
                                                        </span>
                                                        {getTypeBadge(attr.type)}
                                                        {attr.required ? (
                                                            <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-200">
                                                                اجباری
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                                                اختیاری
                                                            </span>
                                                        )}
                                                    </div>

                                                    {attr.description && (
                                                        <p className="text-xs text-slate-500 mt-1">{attr.description}</p>
                                                    )}

                                                    {/* Constraints preview for NUMBER */}
                                                    {attr.type === 'NUMBER' && attr.constraints && (
                                                        <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-2">
                                                            {attr.constraints.min !== undefined && <span>حداقل: {attr.constraints.min}</span>}
                                                            {attr.constraints.max !== undefined && <span>حداکثر: {attr.constraints.max}</span>}
                                                        </div>
                                                    )}

                                                    {/* Options preview for SELECT */}
                                                    {attr.type === 'SELECT' && Array.isArray(attr.options) && attr.options.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                                            {attr.options.map((opt: any) => (
                                                                <span
                                                                    key={opt.key}
                                                                    className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                                                                >
                                                                    {opt.label}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                                <button
                                                    onClick={() => handleOpenEditAttribute(attr)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                    title="ویرایش ویژگی"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`آیا از حذف ویژگی "${attr.label}" اطمینان دارید؟`)) {
                                                            deleteAttributeMutation.mutate(attr.id);
                                                        }
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                    title="حذف ویژگی"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Submodal: Create / Edit Attribute */}
            {isAttributeModalOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150" dir="rtl">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-base">
                                {attributeFormData.id ? "ویرایش ویژگی" : "افزودن ویژگی جدید"}
                            </h3>
                            <button
                                onClick={() => setIsAttributeModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            {/* Key */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    کلید فنی (Key - انگلیسی و بدون فاصله)
                                </label>
                                <input
                                    type="text"
                                    placeholder="مثلاً: rooms یا floor یا has_parking"
                                    disabled={!!attributeFormData.id}
                                    value={attributeFormData.key}
                                    onChange={(e) => setAttributeFormData({ ...attributeFormData, key: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-slate-100 disabled:text-slate-400"
                                />
                            </div>

                            {/* Label */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    عنوان نمایشی (فارسی)
                                </label>
                                <input
                                    type="text"
                                    placeholder="مثلاً: تعداد اتاق خواب"
                                    value={attributeFormData.label}
                                    onChange={(e) => setAttributeFormData({ ...attributeFormData, label: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    نوع فیلد
                                </label>
                                <select
                                    value={attributeFormData.type}
                                    onChange={(e) => setAttributeFormData({ ...attributeFormData, type: e.target.value as DynamicAttributeType })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                                >
                                    <option value="STRING">متنی (STRING) - مانند آدرس یا توضیحات خاص</option>
                                    <option value="NUMBER">عددی (NUMBER) - مانند متراژ، سال ساخت، طبقه</option>
                                    <option value="BOOLEAN">بله / خیر (BOOLEAN) - مانند آسانسور، پارکینگ، انباری</option>
                                    <option value="SELECT">انتخابی (SELECT) - لیست گزینه‌های کشویی مانند نوع سند، جهت ملک</option>
                                </select>
                            </div>

                            {/* Number Constraints */}
                            {attributeFormData.type === 'NUMBER' && (
                                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">حداقل مقدار</label>
                                        <input
                                            type="number"
                                            value={attributeFormData.constraints.min ?? ""}
                                            onChange={(e) => setAttributeFormData({
                                                ...attributeFormData,
                                                constraints: {
                                                    ...attributeFormData.constraints,
                                                    min: e.target.value === "" ? undefined : Number(e.target.value)
                                                }
                                            })}
                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">حداکثر مقدار</label>
                                        <input
                                            type="number"
                                            value={attributeFormData.constraints.max ?? ""}
                                            onChange={(e) => setAttributeFormData({
                                                ...attributeFormData,
                                                constraints: {
                                                    ...attributeFormData.constraints,
                                                    max: e.target.value === "" ? undefined : Number(e.target.value)
                                                }
                                            })}
                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Select Options Editor */}
                            {attributeFormData.type === 'SELECT' && (
                                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-700">گزینه‌های انتخابی (Options)</span>
                                        <span className="text-[10px] text-slate-400">{attributeFormData.options.length} گزینه</span>
                                    </div>

                                    {attributeFormData.options.length > 0 && (
                                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                            {attributeFormData.options.map((opt, idx) => (
                                                <div key={idx} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                                                    <span className="font-bold text-slate-800">{opt.label}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-mono text-slate-400">{opt.key}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveOption(idx)}
                                                            className="text-slate-400 hover:text-red-500"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                                        <input
                                            type="text"
                                            placeholder="کلید مقدار (e.g. 1)"
                                            value={newOptionKey}
                                            onChange={(e) => setNewOptionKey(e.target.value)}
                                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                                        />
                                        <input
                                            type="text"
                                            placeholder="عنوان فارسی (e.g. ۱ خواب)"
                                            value={newOptionLabel}
                                            onChange={(e) => setNewOptionLabel(e.target.value)}
                                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddOption}
                                        className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                                    >
                                        + افزودن به گزینه‌ها
                                    </button>
                                </div>
                            )}

                            {/* Required & Display Order */}
                            <div className="grid grid-cols-2 gap-4 items-center">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        ترتیب نمایش
                                    </label>
                                    <input
                                        type="number"
                                        value={attributeFormData.displayOrder}
                                        onChange={(e) => setAttributeFormData({ ...attributeFormData, displayOrder: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                                    />
                                </div>
                                <div className="pt-5">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={attributeFormData.required}
                                            onChange={(e) => setAttributeFormData({ ...attributeFormData, required: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                        />
                                        <span className="text-xs font-bold text-slate-700">این فیلد اجباری است</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                            <button
                                onClick={() => saveAttributeMutation.mutate(attributeFormData)}
                                disabled={!attributeFormData.key || !attributeFormData.label || saveAttributeMutation.isPending}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm"
                            >
                                {saveAttributeMutation.isPending ? "در حال ذخیره..." : "ذخیره ویژگی"}
                            </button>
                            <button
                                onClick={() => setIsAttributeModalOpen(false)}
                                className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all text-sm"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
