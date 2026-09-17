'use client';

import { adminService } from "@/services/admin.service";
import { PriceModel, PricingField, PricingFieldDefinition } from "@/types/api/ads.types";
import { CreateAdminPriceModelRequest, UpdateAdminPriceModelRequest } from "@/types/api/admin.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Check,
    Coins,
    Edit2,
    Plus,
    Tag,
    Trash2,
    X
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

interface PriceModelsModalProps {
    isOpen: boolean;
    onClose: () => void;
    variant?: 'normal' | 'temporary-rent';
}

interface PriceModelFormData {
    id?: string;
    key: string;
    name: string;
    displayName: string;
    description: string;
    displayOrder: number;
    isActive: boolean;
    pricingFields: PricingFieldDefinition[];
}

const initialPriceModelFormData: PriceModelFormData = {
    key: "",
    name: "",
    displayName: "",
    description: "",
    displayOrder: 1,
    isActive: true,
    pricingFields: [
        {
            key: "total_price",
            label: "قیمت کل",
            fieldType: "NUMBER",
            required: true,
            unit: "تومان",
            placeholder: "مثلاً: ۵,۰۰۰,۰۰۰,۰۰۰"
        }
    ]
};

export default function PriceModelsModal({
    isOpen,
    onClose,
    variant = 'normal'
}: PriceModelsModalProps) {
    const queryClient = useQueryClient();
    const isTemp = variant === 'temporary-rent';
    const queryKeyPrefix = isTemp ? ["admin", "temporary-rent"] : ["admin", "ads"];

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formData, setFormData] = useState<PriceModelFormData>(initialPriceModelFormData);

    // New field state inside form
    const [newFieldKey, setNewFieldKey] = useState("");
    const [newFieldLabel, setNewFieldLabel] = useState("");
    const [newFieldType, setNewFieldType] = useState<'NUMBER' | 'BOOLEAN' | 'STRING'>('NUMBER');
    const [newFieldRequired, setNewFieldRequired] = useState(true);
    const [newFieldUnit, setNewFieldUnit] = useState("تومان");

    const { data: priceModels, isLoading } = useQuery({
        queryKey: [...queryKeyPrefix, "price-models"],
        queryFn: () => isTemp ? adminService.listTemporaryRentPriceModels() : adminService.listPriceModels(),
        enabled: isOpen,
    });

    const saveMutation = useMutation({
        mutationFn: (data: PriceModelFormData) => {
            const createPayload: CreateAdminPriceModelRequest = {
                key: data.key.trim().toLowerCase(),
                name: data.name.trim(),
                displayName: data.displayName.trim() || data.name.trim(),
                description: data.description || undefined,
                displayOrder: Number(data.displayOrder) || 1,
                isActive: data.isActive,
                pricingFields: data.pricingFields
            };

            if (data.id) {
                const updatePayload: UpdateAdminPriceModelRequest = {
                    name: createPayload.name,
                    displayName: createPayload.displayName,
                    description: createPayload.description,
                    displayOrder: createPayload.displayOrder,
                    isActive: createPayload.isActive,
                    pricingFields: createPayload.pricingFields,
                };
                return isTemp
                    ? adminService.updateTemporaryRentPriceModel(data.id, updatePayload)
                    : adminService.updatePriceModel(data.id, updatePayload);
            } else {
                return isTemp
                    ? adminService.createTemporaryRentPriceModel(createPayload)
                    : adminService.createPriceModel(createPayload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [...queryKeyPrefix, "price-models"] });
            toast.success(formData.id ? "مدل قیمت‌گذاری با موفقیت ویرایش شد" : "مدل قیمت‌گذاری با موفقیت ایجاد شد");
            setIsFormModalOpen(false);
            setFormData(initialPriceModelFormData);
        },
        onError: (err: unknown) => {
            const errorObj = err as { response?: { data?: { message?: string } } };
            const msg = errorObj?.response?.data?.message || "خطا در ذخیره مدل قیمت‌گذاری";
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
    });

    if (!isOpen) return null;

    const handleOpenCreate = () => {
        setFormData({
            ...initialPriceModelFormData,
            displayOrder: (priceModels?.length || 0) + 1
        });
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (pm: PriceModel) => {
        setFormData({
            id: pm.id,
            key: pm.key,
            name: pm.name,
            displayName: pm.displayName || pm.name,
            description: pm.description || "",
            displayOrder: pm.displayOrder ?? 1,
            isActive: pm.isActive ?? true,
            pricingFields: Array.isArray(pm.pricingFields) ? [...pm.pricingFields] : []
        });
        setIsFormModalOpen(true);
    };

    const handleAddField = () => {
        if (!newFieldKey.trim() || !newFieldLabel.trim()) {
            toast.error("کلید و نام فیلد قیمت‌گذاری را وارد کنید");
            return;
        }
        setFormData(prev => ({
            ...prev,
            pricingFields: [
                ...prev.pricingFields,
                {
                    key: newFieldKey.trim(),
                    label: newFieldLabel.trim(),
                    fieldType: newFieldType,
                    required: newFieldRequired,
                    unit: newFieldUnit.trim() || undefined
                }
            ]
        }));
        setNewFieldKey("");
        setNewFieldLabel("");
    };

    const handleRemoveField = (index: number) => {
        setFormData(prev => ({
            ...prev,
            pricingFields: prev.pricingFields.filter((_, i) => i !== index)
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-slate-100">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <Coins className="w-5 h-5 text-amber-500" />
                            مدیریت الگوهای قیمت‌گذاری {isTemp ? '(اقامتگاه و روزانه)' : '(املاک عادی)'}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            مدل‌های محاسباتی و فیلدهای مالی مانند خرید نقدی، رهن و اجاره، ودیعه، پیش‌فروش و ...
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleOpenCreate}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-200"
                        >
                            <Plus className="w-4 h-4" />
                            مدل قیمت‌گذاری جدید
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {isLoading ? (
                        <div className="py-20 text-center text-slate-400">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            در حال بارگذاری مدل‌های قیمت‌گذاری...
                        </div>
                    ) : !priceModels || priceModels.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <p className="text-slate-400 text-sm mb-3">هیچ مدل قیمت‌گذاری تعریف نشده است.</p>
                            <button
                                onClick={handleOpenCreate}
                                className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline"
                            >
                                <Plus className="w-4 h-4" />
                                تعریف اولین مدل قیمت‌گذاری
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {priceModels.map((pm: PriceModel) => (
                                <div
                                    key={pm.id}
                                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-900 text-base">{pm.displayName || pm.name}</h3>
                                                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">
                                                        {pm.key}
                                                    </span>
                                                    {pm.isActive ? (
                                                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                                                            فعال
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                                            غیرفعال
                                                        </span>
                                                    )}
                                                </div>
                                                {pm.description && (
                                                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{pm.description}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleOpenEdit(pm)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                title="ویرایش مدل"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Pricing fields badge list */}
                                        <div className="mt-4 pt-3 border-t border-slate-100">
                                            <span className="text-xs font-bold text-slate-700 block mb-2">فیلدهای مالی مشخص‌شده:</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {pm.pricingFields?.map((f: PricingField) => (
                                                    <div
                                                        key={f.key}
                                                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 flex items-center gap-1.5"
                                                    >
                                                        <span className="font-semibold text-slate-800">{f.label}</span>
                                                        {f.unit && <span className="text-[10px] text-slate-400">({f.unit})</span>}
                                                        {f.required && <span className="text-rose-500 font-bold">*</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Submodal: Create / Edit Price Model */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150" dir="rtl">
                    <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-base">
                                {formData.id ? "ویرایش مدل قیمت‌گذاری" : "ایجاد مدل قیمت‌گذاری جدید"}
                            </h3>
                            <button
                                onClick={() => setIsFormModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        کلید یکتا (Key - انگلیسی)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="مثلاً: buy_sell یا rent_mortgage"
                                        disabled={!!formData.id}
                                        value={formData.key}
                                        onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase disabled:bg-slate-100 disabled:text-slate-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        نام مدل (سیستمی)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="مثلاً: خرید و فروش نقدی"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    نام نمایشی به کاربر (فارسی)
                                </label>
                                <input
                                    type="text"
                                    placeholder="مثلاً: خرید و فروش قطعی"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    توضیحات مدل
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="توضیح کوتاه در رابطه با نوع معامله..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>

                            {/* Pricing Fields Builder */}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800">
                                        فیلدهای ورودی مالی (Pricing Fields)
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        {formData.pricingFields.length} فیلد تعریف شده
                                    </span>
                                </div>

                                {formData.pricingFields.length > 0 && (
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {formData.pricingFields.map((field, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800">{field.label}</span>
                                                    <span className="text-[10px] font-mono text-slate-400">({field.key})</span>
                                                    {field.unit && <span className="text-[10px] text-slate-500">[{field.unit}]</span>}
                                                    {field.required && (
                                                        <span className="text-[9px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold">
                                                            اجباری
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveField(idx)}
                                                    className="text-slate-400 hover:text-rose-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                                    <input
                                        type="text"
                                        placeholder="کلید فیلد (e.g. deposit)"
                                        value={newFieldKey}
                                        onChange={(e) => setNewFieldKey(e.target.value)}
                                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono"
                                    />
                                    <input
                                        type="text"
                                        placeholder="نام فیلد (e.g. مبلغ ودیعه)"
                                        value={newFieldLabel}
                                        onChange={(e) => setNewFieldLabel(e.target.value)}
                                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                                    />
                                    <input
                                        type="text"
                                        placeholder="واحد پول (پیش‌فرض: تومان)"
                                        value={newFieldUnit}
                                        onChange={(e) => setNewFieldUnit(e.target.value)}
                                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                                    />
                                    <label className="flex items-center gap-2 px-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newFieldRequired}
                                            onChange={(e) => setNewFieldRequired(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                        />
                                        <span className="text-xs text-slate-700">فیلد اجباری است</span>
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddField}
                                    className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                                >
                                    + افزودن فیلد مالی جدید
                                </button>
                            </div>

                            {/* Active & Display Order */}
                            <div className="grid grid-cols-2 gap-4 items-center">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        ترتیب نمایش
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.displayOrder}
                                        onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                                    />
                                </div>
                                <div className="pt-5">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                        />
                                        <span className="text-xs font-bold text-slate-700">مدل فعال است</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                            <button
                                onClick={() => saveMutation.mutate(formData)}
                                disabled={!formData.key || !formData.name || formData.pricingFields.length === 0 || saveMutation.isPending}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-all disabled:opacity-50 text-xs"
                            >
                                {saveMutation.isPending ? "در حال ذخیره..." : "ذخیره مدل قیمت‌گذاری"}
                            </button>
                            <button
                                onClick={() => setIsFormModalOpen(false)}
                                className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all text-xs"
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
