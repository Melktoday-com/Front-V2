"use client";

import React from "react";
import { AttributeDefinition } from "@/types/api/ads.types";
import { JsonValue } from "@/types/common";
import { Select } from "@/components/ui/Select";

export type AttributeValue = number | string | boolean | string[];

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
                            return (
                                <div key={attr.key} className="col-span-1">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-bold text-brand">
                                            {attr.label}
                                            {attr.required && <span className="text-red-500 mr-1">*</span>}
                                        </label>
                                    </div>
                                    <input
                                        type="number"
                                        min={attr.constraints?.min}
                                        max={attr.constraints?.max}
                                        value={typeof val === "number" || typeof val === "string" ? val : ""}
                                        placeholder={`مثال: ${attr.constraints?.min ?? 0}`}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            onChange(attr.key, v === "" ? "" : Number(v));
                                        }}
                                        className={`w-full p-3 text-sm bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary outline-hidden transition-all ${
                                            err ? "border-red-500 bg-red-50/20" : "border-gray-200"
                                        }`}
                                    />
                                    {attr.description && (
                                        <p className="text-[11px] text-text-light mt-1">
                                            {attr.description}
                                        </p>
                                    )}
                                    {err && (
                                        <p className="text-xs text-red-500 mt-1 font-bold">
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
                                        {attr.required && <span className="text-red-500 mr-1">*</span>}
                                    </label>
                                </div>
                                <input
                                    type="text"
                                    minLength={attr.constraints?.minLength}
                                    maxLength={attr.constraints?.maxLength}
                                    value={typeof val === "number" || typeof val === "string" ? val : ""}
                                    placeholder={attr.label}
                                    onChange={(e) => onChange(attr.key, e.target.value)}
                                    className={`w-full p-3 text-sm bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary outline-hidden transition-all ${
                                        err ? "border-red-500 bg-red-50/20" : "border-gray-200"
                                    }`}
                                />
                                {attr.description && (
                                    <p className="text-[11px] text-text-light mt-1">
                                        {attr.description}
                                    </p>
                                )}
                                {err && (
                                    <p className="text-xs text-red-500 mt-1 font-bold">
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
                                            : "border-gray-200 bg-gray-50/50 hover:bg-gray-100/70 text-brand"
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => onChange(attr.key, e.target.checked)}
                                        className="w-4 h-4 text-primary border-gray-300 rounded-md focus:ring-primary focus:ring-2 cursor-pointer"
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
