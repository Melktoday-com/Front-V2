"use client";

import React from "react";
import { AttributeDefinition } from "@/types/api/ads.types";
import { JsonValue } from "@/types/common";
import { Select } from "@/components/ui/Select";
import { toPersianDigits } from "@/lib/utils";

export type AttributeValue = number | string | boolean | string[];

export function getAttributeConstraints(attr: AttributeDefinition): {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
} {
    const min = attr.constraints?.min;
    const max = attr.constraints?.max;
    const key = (attr.key || "").toLowerCase();
    const label = (attr.label || "").toLowerCase();

    let resolvedMin = min;
    let resolvedMax = max;

    if (key.includes("construction_year") || key.includes("build_year") || label.includes("سال ساخت")) {
        resolvedMin = min ?? 1350;
        resolvedMax = max ?? 1405;
    } else if (key === "total_floors" || (label.includes("تعداد") && label.includes("کل طبقات"))) {
        resolvedMin = min ?? 1;
        resolvedMax = max ?? 60;
    } else if (key === "floor_number" || key === "floor" || label.includes("طبقه واحد")) {
        resolvedMin = min ?? -2;
        resolvedMax = max ?? 50;
    } else if (key.includes("units_per_floor") || label.includes("واحد در هر طبقه")) {
        resolvedMin = min ?? 1;
        resolvedMax = max ?? 20;
    } else if (key.includes("rooms") || label.includes("اتاق")) {
        resolvedMin = min ?? 0;
        resolvedMax = max ?? 10;
    } else if (key.includes("area") || key.includes("meterage") || label.includes("متراژ") || label.includes("زیربنا") || label.includes("مساحت")) {
        resolvedMin = min ?? 5;
        resolvedMax = max ?? 50000;
    }

    return {
        min: resolvedMin,
        max: resolvedMax,
        minLength: attr.constraints?.minLength,
        maxLength: attr.constraints?.maxLength,
    };
}

export function validateAttributeValue(
    attr: AttributeDefinition,
    val: unknown,
    allAttributes?: Record<string, unknown>
): string | null {
    const isUnset = val === undefined || val === null || val === "" || (typeof val === "string" && val.trim() === "");

    if (attr.required && isUnset) {
        return `تکمیل مشخصه «${attr.label}» الزامی است`;
    }

    if (isUnset) {
        return null;
    }

    const key = (attr.key || "").toLowerCase();
    const label = (attr.label || "").toLowerCase();
    const constraints = getAttributeConstraints(attr);

    if (attr.type === "NUMBER") {
        const num = Number(val);
        if (isNaN(num)) {
            return `مقدار «${attr.label}» باید یک عدد معتبر باشد`;
        }

        if (constraints.min !== undefined && num < constraints.min) {
            if (label.includes("سال ساخت")) {
                return `سال ساخت نمی‌تواند کمتر از ${toPersianDigits(constraints.min)} باشد`;
            }
            if (label.includes("طبقه واحد")) {
                return `طبقه واحد نمی‌تواند کمتر از ${toPersianDigits(constraints.min)} باشد (برای زیرزمین از مقادیر منفی استفاده کنید)`;
            }
            return `مقدار «${attr.label}» نمی‌تواند کمتر از ${toPersianDigits(constraints.min)} باشد`;
        }

        if (constraints.max !== undefined && num > constraints.max) {
            if (label.includes("سال ساخت")) {
                return `سال ساخت نمی‌تواند بیشتر از ${toPersianDigits(constraints.max)} باشد`;
            }
            if (label.includes("تعداد اتاق")) {
                return `تعداد اتاق خواب نمی‌تواند بیشتر از ${toPersianDigits(constraints.max)} باشد`;
            }
            return `مقدار «${attr.label}» نمی‌تواند بیشتر از ${toPersianDigits(constraints.max)} باشد`;
        }

        // Cross-field validation: floor vs total_floors
        if (key === "floor_number" || key === "floor" || label.includes("طبقه واحد")) {
            const totalFloorsRaw = allAttributes?.total_floors ?? allAttributes?.totalFloors;
            if (totalFloorsRaw !== undefined && totalFloorsRaw !== null && totalFloorsRaw !== "") {
                const totalFloorsNum = Number(totalFloorsRaw);
                if (!isNaN(totalFloorsNum) && num > totalFloorsNum) {
                    return `طبقه واحد (${toPersianDigits(num)}) نمی‌تواند از تعداد کل طبقات (${toPersianDigits(totalFloorsNum)}) بیشتر باشد`;
                }
            }
        }

        if (key === "total_floors" || (label.includes("تعداد") && label.includes("کل طبقات"))) {
            const floorRaw = allAttributes?.floor_number ?? allAttributes?.floor;
            if (floorRaw !== undefined && floorRaw !== null && floorRaw !== "") {
                const floorNum = Number(floorRaw);
                if (!isNaN(floorNum) && floorNum > num) {
                    return `تعداد کل طبقات (${toPersianDigits(num)}) نمی‌تواند کمتر از طبقه واحد (${toPersianDigits(floorNum)}) باشد`;
                }
            }
        }
    }

    if (attr.type === "STRING") {
        const str = String(val).trim();
        if (constraints.minLength !== undefined && str.length < constraints.minLength) {
            return `«${attr.label}» باید حداقل ${toPersianDigits(constraints.minLength)} حرف باشد`;
        }
        if (constraints.maxLength !== undefined && str.length > constraints.maxLength) {
            return `«${attr.label}» نمی‌تواند بیشتر از ${toPersianDigits(constraints.maxLength)} حرف باشد`;
        }
    }

    if (attr.type === "SELECT" && attr.options && attr.options.length > 0) {
        const strVal = String(val).trim();
        if (strVal && !attr.options.some((o) => o.key === strVal)) {
            return `گزینه انتخابی برای «${attr.label}» نامعتبر است`;
        }
    }

    return null;
}

interface DynamicAttributeRendererProps {
    definitions: AttributeDefinition[];
    values: Record<string, AttributeValue | JsonValue | undefined>;
    onChange: (key: string, value: AttributeValue) => void;
    errors?: Record<string, string>;
}

export const DynamicAttributeRenderer: React.FC<DynamicAttributeRendererProps> = ({
    definitions,
    values,
    onChange,
    errors = {},
}) => {
    if (!definitions || definitions.length === 0) {
        return null;
    }

    // Separate boolean features from text/number/select fields for nice layout grouping
    const nonBooleanFields = definitions.filter((d) => d.type !== "BOOLEAN");
    const booleanFields = definitions.filter((d) => d.type === "BOOLEAN");

    return (
        <div className="space-y-6">
            {nonBooleanFields.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {nonBooleanFields.map((attr) => {
                        const val = values[attr.key];
                        const err = errors[attr.key];

                        if (attr.type === "SELECT") {
                            const options = (attr.options || []).map((opt) => ({
                                value: opt.key,
                                label: opt.label,
                            }));

                            return (
                                <div key={attr.key} className="col-span-1">
                                    <Select
                                        label={`${attr.label}${attr.required ? " *" : ""}`}
                                        value={val !== undefined && val !== null ? String(val) : ""}
                                        onChange={(newVal) => onChange(attr.key, newVal)}
                                        options={options}
                                        placeholder={`انتخاب ${attr.label}...`}
                                        error={err}
                                        helperText={attr.description}
                                    />
                                </div>
                            );
                        }

                        if (attr.type === "NUMBER") {
                            const constraints = getAttributeConstraints(attr);
                            return (
                                <div key={attr.key} className="col-span-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-bold text-brand">
                                            {attr.label}
                                            {attr.required && <span className="text-error mr-1">*</span>}
                                        </label>
                                        {constraints.min !== undefined && constraints.max !== undefined && (
                                            <span className="text-[10px] text-text-light font-normal">
                                                (از {toPersianDigits(constraints.min)} تا {toPersianDigits(constraints.max)})
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="number"
                                        min={constraints.min}
                                        max={constraints.max}
                                        value={typeof val === "number" || typeof val === "string" ? val : ""}
                                        placeholder={`مثال: ${constraints.min ?? 0}`}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            onChange(attr.key, v === "" ? "" : Number(v));
                                        }}
                                        className={`w-full p-3 text-sm bg-surface-secondary border rounded-xl focus:bg-surface focus:ring-2 focus:ring-primary outline-hidden transition-all ${
                                            err ? "border-red-500 bg-error-subtle/20" : "border-border-subtle"
                                        }`}
                                    />
                                    {attr.description && (
                                        <p className="text-[11px] text-text-light mt-1">
                                            {attr.description}
                                        </p>
                                    )}
                                    {err && (
                                        <p className="text-xs text-error mt-1 font-bold">
                                            {err}
                                        </p>
                                    )}
                                </div>
                            );
                        }

                        // Default STRING
                        return (
                            <div key={attr.key} className="col-span-1">
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-brand">
                                        {attr.label}
                                        {attr.required && <span className="text-error mr-1">*</span>}
                                    </label>
                                </div>
                                <input
                                    type="text"
                                    minLength={attr.constraints?.minLength}
                                    maxLength={attr.constraints?.maxLength}
                                    value={typeof val === "number" || typeof val === "string" ? val : ""}
                                    placeholder={attr.label}
                                    onChange={(e) => onChange(attr.key, e.target.value)}
                                    className={`w-full p-3 text-sm bg-surface-secondary border rounded-xl focus:bg-surface focus:ring-2 focus:ring-primary outline-hidden transition-all ${
                                        err ? "border-red-500 bg-error-subtle/20" : "border-border-subtle"
                                    }`}
                                />
                                {attr.description && (
                                    <p className="text-[11px] text-text-light mt-1">
                                        {attr.description}
                                    </p>
                                )}
                                {err && (
                                    <p className="text-xs text-error mt-1 font-bold">
                                        {err}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {booleanFields.length > 0 && (
                <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold text-brand">
                        امکانات و ویژگی‌ها
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {booleanFields.map((attr) => {
                            const isChecked = Boolean(values[attr.key]);
                            return (
                                <label
                                    key={attr.key}
                                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                                        isChecked
                                            ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                                            : "border-border-subtle bg-surface-secondary/50 hover:bg-surface-secondary/70 text-brand"
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => onChange(attr.key, e.target.checked)}
                                        className="w-4 h-4 text-primary border-border rounded-md focus:ring-primary focus:ring-2 cursor-pointer"
                                    />
                                    <span className="text-xs truncate">{attr.label}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
