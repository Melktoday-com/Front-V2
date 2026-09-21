'use client';

import React, { useState } from "react";
import {
    Plus,
    Trash2,
    Sliders,
    Layers,
    Type,
    Hash,
    ToggleLeft,
    List,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    Check
} from "lucide-react";
import { CreateAdminAttributeRequest } from "@/types/api/admin.types";

export interface InlineAttributeItem {
    id: string;
    key: string;
    label: string;
    description?: string;
    type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'SELECT';
    required: boolean;
    displayOrder: number;
    options: Array<{ key: string; label: string; displayOrder?: number }>;
    constraints?: {
        min?: number;
        max?: number;
    };
}

interface SubcategoryAttributesEditorProps {
    attributes: InlineAttributeItem[];
    onChange: (attributes: InlineAttributeItem[]) => void;
    themeColor?: 'blue' | 'emerald';
}

export function sanitizeAttributeKey(input: string): string {
    return input
        .toLowerCase()
        .replace(/[\s-]+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/^_+/, '');
}

export function formatInlineAttributesToPayload(attributes: InlineAttributeItem[]): CreateAdminAttributeRequest[] {
    return attributes
        .filter(attr => attr.key.trim() && attr.label.trim())
        .map((attr, index) => {
            const sanitizedKey = sanitizeAttributeKey(attr.key);
            const payload: CreateAdminAttributeRequest = {
                key: sanitizedKey || `attr_${index + 1}`,
                label: attr.label.trim(),
                description: attr.description?.trim() || undefined,
                type: attr.type,
                required: attr.required,
                displayOrder: index + 1,
            };

            if (attr.type === 'NUMBER' && attr.constraints) {
                const min = attr.constraints.min;
                const max = attr.constraints.max;
                if (min !== undefined || max !== undefined) {
                    payload.constraints = {
                        min: min !== undefined && !isNaN(min) ? min : undefined,
                        max: max !== undefined && !isNaN(max) ? max : undefined,
                    };
                }
            }

            if (attr.type === 'SELECT') {
                payload.options = attr.options
                    .filter(opt => opt.key.trim() && opt.label.trim())
                    .map((opt, optIndex) => ({
                        key: sanitizeAttributeKey(opt.key) || `opt_${optIndex + 1}`,
                        label: opt.label.trim(),
                        displayOrder: optIndex + 1,
                    }));
            }

            return payload;
        });
}

export default function SubcategoryAttributesEditor({
    attributes,
    onChange,
    themeColor = 'blue',
}: SubcategoryAttributesEditorProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [newOptionKey, setNewOptionKey] = useState<{ [attrId: string]: string }>({});
    const [newOptionLabel, setNewOptionLabel] = useState<{ [attrId: string]: string }>({});

    const isBlue = themeColor === 'blue';
    const accentBg = isBlue ? 'bg-blue-50' : 'bg-emerald-50';
    const accentText = isBlue ? 'text-blue-600' : 'text-emerald-600';
    const accentBorder = isBlue ? 'border-blue-200' : 'border-emerald-200';
    const accentBtn = isBlue ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700';

    const handleAddAttribute = () => {
        const newId = `attr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newItem: InlineAttributeItem = {
            id: newId,
            key: "",
            label: "",
            description: "",
            type: "STRING",
            required: false,
            displayOrder: attributes.length + 1,
            options: [],
        };
        onChange([...attributes, newItem]);
        setExpandedId(newId);
    };

    const handleUpdateAttribute = (id: string, updates: Partial<InlineAttributeItem>) => {
        onChange(
            attributes.map(attr => (attr.id === id ? { ...attr, ...updates } : attr))
        );
    };

    const handleRemoveAttribute = (id: string) => {
        onChange(attributes.filter(attr => attr.id !== id));
        if (expandedId === id) setExpandedId(null);
    };

    const handleAddOption = (attrId: string) => {
        const k = (newOptionKey[attrId] || "").trim();
        const l = (newOptionLabel[attrId] || "").trim();
        if (!k || !l) return;

        const targetAttr = attributes.find(a => a.id === attrId);
        if (!targetAttr) return;

        const sanitizedKey = sanitizeAttributeKey(k) || `opt_${targetAttr.options.length + 1}`;
        const updatedOptions = [
            ...targetAttr.options,
            { key: sanitizedKey, label: l, displayOrder: targetAttr.options.length + 1 }
        ];

        handleUpdateAttribute(attrId, { options: updatedOptions });
        setNewOptionKey({ ...newOptionKey, [attrId]: "" });
        setNewOptionLabel({ ...newOptionLabel, [attrId]: "" });
    };

    const handleRemoveOption = (attrId: string, optIndex: number) => {
        const targetAttr = attributes.find(a => a.id === attrId);
        if (!targetAttr) return;
        const updatedOptions = targetAttr.options.filter((_, idx) => idx !== optIndex);
        handleUpdateAttribute(attrId, { options: updatedOptions });
    };

    const getTypeIcon = (type: InlineAttributeItem['type']) => {
        switch (type) {
            case 'STRING':
                return <Type className="w-3.5 h-3.5 text-blue-500" />;
            case 'NUMBER':
                return <Hash className="w-3.5 h-3.5 text-amber-500" />;
            case 'BOOLEAN':
                return <ToggleLeft className="w-3.5 h-3.5 text-emerald-500" />;
            case 'SELECT':
                return <List className="w-3.5 h-3.5 text-purple-500" />;
        }
    };

    const getTypeTitle = (type: InlineAttributeItem['type']) => {
        switch (type) {
            case 'STRING':
                return 'متنی (STRING)';
            case 'NUMBER':
                return 'عددی (NUMBER)';
            case 'BOOLEAN':
                return 'بله/خیر (BOOLEAN)';
            case 'SELECT':
                return 'انتخابی (SELECT)';
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sliders className={`w-4 h-4 ${accentText}`} />
                    <span className="font-bold text-slate-800 text-xs">
                        ویژگی‌های سفارشی زیردسته (Attributes)
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        {attributes.length} ویژگی
                    </span>
                </div>
                <button
                    type="button"
                    onClick={handleAddAttribute}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-[11px] font-bold ${accentBtn} shadow-sm transition-all`}
                >
                    <Plus className="w-3.5 h-3.5" />
                    افزودن ویژگی
                </button>
            </div>

            {attributes.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50/50">
                    <p className="text-xs text-slate-500">
                        هیچ ویژگی اختصاصی برای این زیردسته تعریف نشده است (اختیاری).
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                        می‌توانید فیلدهای دلخواه مانند تعداد اتاق، متراژ، طبقه، سال ساخت، آسانسور یا نوع سند را تعریف کنید.
                    </p>
                </div>
            ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {attributes.map((attr, index) => {
                        const isExpanded = expandedId === attr.id;
                        const keyInvalid = attr.key.trim() && !/^[a-z][a-z0-9_]*$/.test(attr.key.trim());

                        return (
                            <div
                                key={attr.id}
                                className={`border rounded-2xl transition-all overflow-hidden bg-white shadow-xs ${
                                    isExpanded ? `${accentBorder} ring-1 ring-slate-100` : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                {/* Card Summary Header */}
                                <div
                                    className={`p-2.5 flex items-center justify-between cursor-pointer select-none ${
                                        isExpanded ? accentBg : 'bg-slate-50/40 hover:bg-slate-50'
                                    }`}
                                    onClick={() => setExpandedId(isExpanded ? null : attr.id)}
                                >
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="w-5 h-5 rounded-lg bg-white border border-slate-200 text-slate-500 font-mono text-[10px] font-bold flex items-center justify-center">
                                            {index + 1}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            {getTypeIcon(attr.type)}
                                            <span className="font-bold text-slate-800 text-xs">
                                                {attr.label || "(بدون عنوان)"}
                                            </span>
                                        </div>
                                        {attr.key && (
                                            <span className="font-mono text-[10px] text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                                {attr.key}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-slate-500 font-medium">
                                            {getTypeTitle(attr.type)}
                                        </span>
                                        {attr.required && (
                                            <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">
                                                اجباری
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveAttribute(attr.id);
                                            }}
                                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="حذف ویژگی"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                        <div className="p-1 text-slate-400">
                                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Card Details (when expanded) */}
                                {isExpanded && (
                                    <div className="p-3.5 space-y-3 border-t border-slate-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                                    عنوان ویژگی (فارسی) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="مثلاً: تعداد اتاق"
                                                    value={attr.label}
                                                    onChange={(e) => {
                                                        const newLabel = e.target.value;
                                                        const updates: Partial<InlineAttributeItem> = { label: newLabel };
                                                        // Auto-generate key if empty
                                                        if (!attr.key) {
                                                            updates.key = sanitizeAttributeKey(newLabel);
                                                        }
                                                        handleUpdateAttribute(attr.id, updates);
                                                    }}
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                                    کلید فنی (Key انگلیسی) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="مثلاً: room_count"
                                                    value={attr.key}
                                                    onChange={(e) => handleUpdateAttribute(attr.id, {
                                                        key: sanitizeAttributeKey(e.target.value)
                                                    })}
                                                    className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-mono lowercase ${
                                                        keyInvalid ? 'border-red-300 bg-red-50/50' : 'border-slate-200'
                                                    } focus:ring-1 focus:ring-blue-500`}
                                                />
                                                {keyInvalid && (
                                                    <p className="text-[10px] text-red-500 mt-0.5">
                                                        باید با حروف کوچک انگلیسی شروع شود و فقط شامل حروف، اعداد و _ باشد.
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 items-center">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                                    نوع مقدار فیلد
                                                </label>
                                                <select
                                                    value={attr.type}
                                                    onChange={(e) => handleUpdateAttribute(attr.id, {
                                                        type: e.target.value as InlineAttributeItem['type']
                                                    })}
                                                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-blue-500"
                                                >
                                                    <option value="STRING">متنی (STRING) - مانند آدرس یا توضیحات</option>
                                                    <option value="NUMBER">عددی (NUMBER) - مانند متراژ، طبقه، سال ساخت</option>
                                                    <option value="BOOLEAN">بله/خیر (BOOLEAN) - مانند آسانسور، پارکینگ، انباری</option>
                                                    <option value="SELECT">انتخابی چندگزینه‌ای (SELECT) - کشویی</option>
                                                </select>
                                            </div>
                                            <div className="pt-4 flex items-center">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={attr.required}
                                                        onChange={(e) => handleUpdateAttribute(attr.id, { required: e.target.checked })}
                                                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                                                    />
                                                    <span className="text-xs font-bold text-slate-700">این ویژگی اجباری است</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Number constraints */}
                                        {attr.type === 'NUMBER' && (
                                            <div className="grid grid-cols-2 gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-600 mb-1">حداقل مقدار (اختیاری)</label>
                                                    <input
                                                        type="number"
                                                        placeholder="مثلاً: 0"
                                                        value={attr.constraints?.min ?? ""}
                                                        onChange={(e) => handleUpdateAttribute(attr.id, {
                                                            constraints: {
                                                                ...attr.constraints,
                                                                min: e.target.value === "" ? undefined : Number(e.target.value)
                                                            }
                                                        })}
                                                        className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-600 mb-1">حداکثر مقدار (اختیاری)</label>
                                                    <input
                                                        type="number"
                                                        placeholder="مثلاً: 100"
                                                        value={attr.constraints?.max ?? ""}
                                                        onChange={(e) => handleUpdateAttribute(attr.id, {
                                                            constraints: {
                                                                ...attr.constraints,
                                                                max: e.target.value === "" ? undefined : Number(e.target.value)
                                                            }
                                                        })}
                                                        className="w-full px-2 py-1 rounded-lg border border-slate-200 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* SELECT options manager */}
                                        {attr.type === 'SELECT' && (
                                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-slate-700 text-[11px]">
                                                        گزینه‌های منوی کشویی ({attr.options.length} گزینه)
                                                    </span>
                                                    {attr.options.length === 0 && (
                                                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" />
                                                            حداقل یک گزینه اضافه کنید
                                                        </span>
                                                    )}
                                                </div>

                                                {attr.options.length > 0 && (
                                                    <div className="space-y-1 max-h-28 overflow-y-auto">
                                                        {attr.options.map((opt, optIdx) => (
                                                            <div
                                                                key={optIdx}
                                                                className="flex items-center justify-between bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-[11px]"
                                                            >
                                                                <span className="font-bold text-slate-800">{opt.label}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono text-[9px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                                                                        {opt.key}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveOption(attr.id, optIdx)}
                                                                        className="text-slate-400 hover:text-red-500"
                                                                        title="حذف گزینه"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-slate-200">
                                                    <input
                                                        type="text"
                                                        placeholder="عنوان فارسی (مثلاً: ۲ خواب)"
                                                        value={newOptionLabel[attr.id] || ""}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setNewOptionLabel({ ...newOptionLabel, [attr.id]: val });
                                                            if (!newOptionKey[attr.id]) {
                                                                setNewOptionKey({ ...newOptionKey, [attr.id]: sanitizeAttributeKey(val) });
                                                            }
                                                        }}
                                                        className="px-2 py-1 rounded-lg border border-slate-200 text-xs"
                                                    />
                                                    <div className="flex gap-1">
                                                        <input
                                                            type="text"
                                                            placeholder="کلید انگلیسی (مثلاً: 2_bed)"
                                                            value={newOptionKey[attr.id] || ""}
                                                            onChange={(e) => setNewOptionKey({
                                                                ...newOptionKey,
                                                                [attr.id]: sanitizeAttributeKey(e.target.value)
                                                            })}
                                                            className="flex-1 px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddOption(attr.id)}
                                                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs"
                                                        >
                                                            + افزودن
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
