"use client";

import React from "react";
import { PriceModel } from "@/types/api/ads.types";
import { formatPrice, toPersianDigits } from "@/lib/utils";

export type PricingValue = number | string | boolean;

interface DynamicPricingFieldsProps {
    priceModel: PriceModel;
    values: Record<string, PricingValue>;
    onChange: (key: string, value: PricingValue) => void;
    errors?: Record<string, string>;
}

// Convert large Rial/Toman numbers into Persian human-readable words (میلیون / میلیارد)
function numberToPersianWords(amount: number): string {
    if (!amount || isNaN(amount) || amount <= 0) return "";
    if (amount >= 1_000_000_000_000) {
        const hezarMilliard = (amount / 1_000_000_000_000).toFixed(2).replace(/\.?0+$/, "");
        return `${toPersianDigits(hezarMilliard)} هزار میلیارد تومان`;
    }
    if (amount >= 1_000_000_000) {
        const milliard = (amount / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "");
        return `${toPersianDigits(milliard)} میلیارد تومان`;
    }
    if (amount >= 1_000_000) {
        const million = (amount / 1_000_000).toFixed(1).replace(/\.?0+$/, "");
        return `${toPersianDigits(million)} میلیون تومان`;
    }
    if (amount >= 1_000) {
        const hezar = (amount / 1_000).toFixed(0);
        return `${toPersianDigits(hezar)} هزار تومان`;
    }
    return `${toPersianDigits(amount)} تومان`;
}

export const DynamicPricingFields: React.FC<DynamicPricingFieldsProps> = ({
    priceModel,
    values,
    onChange,
    errors = {},
}) => {
    if (!priceModel || !priceModel.pricingFields || priceModel.pricingFields.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-sm font-bold text-brand">
                    اطلاعات مالی — {priceModel.displayName}
                </h3>
                {priceModel.currency && (
                    <span className="text-[11px] font-bold text-text-light bg-gray-100 px-2.5 py-1 rounded-lg">
                        واحد پول: {priceModel.currency === "TOMAN" ? "تومان" : priceModel.currency}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {priceModel.pricingFields.map((field) => {
                    const rawVal = values[field.key];
                    const numVal = Number(rawVal || 0);
                    const isTomanUnit = !field.unit || field.unit === "تومان";
                    const persianPreview = field.fieldType === "NUMBER" && isTomanUnit && numVal > 0
                        ? numberToPersianWords(numVal)
                        : null;

                    if (field.fieldType === "BOOLEAN") {
                        return (
                            <div
                                key={field.key}
                                className="col-span-1 md:col-span-2 flex items-center justify-between p-3.5 bg-gray-50/80 border border-gray-200 rounded-xl"
                            >
                                <div>
                                    <label
                                        htmlFor={`pricing_${field.key}`}
                                        className="text-xs font-bold text-brand block cursor-pointer"
                                    >
                                        {field.label}
                                        {field.required && <span className="text-red-500 mr-1">*</span>}
                                    </label>
                                    {field.helpText && (
                                        <p className="text-[11px] text-text-light mt-0.5">
                                            {field.helpText}
                                        </p>
                                    )}
                                </div>
                                <input
                                    id={`pricing_${field.key}`}
                                    type="checkbox"
                                    checked={Boolean(rawVal)}
                                    onChange={(e) => onChange(field.key, e.target.checked)}
                                    className="w-5 h-5 text-primary border-gray-300 rounded-md focus:ring-primary focus:ring-2 cursor-pointer"
                                />
                            </div>
                        );
                    }

                    return (
                        <div
                            key={field.key}
                            className={field.fieldType === "STRING" ? "col-span-1 md:col-span-2" : "col-span-1"}
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-bold text-brand">
                                    {field.label}
                                    {field.required && <span className="text-red-500 mr-1">*</span>}
                                </label>
                                {field.unit && (
                                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                        {field.unit}
                                    </span>
                                )}
                            </div>

                            <div className="relative">
                                <input
                                    type={field.fieldType === "NUMBER" ? "number" : "text"}
                                    min={field.fieldType === "NUMBER" ? 0 : undefined}
                                    value={typeof rawVal === "boolean" ? "" : (rawVal ?? "")}
                                    placeholder={field.placeholder || (field.fieldType === "NUMBER" ? "مبلغ به عدد..." : "")}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        onChange(field.key, field.fieldType === "NUMBER" ? (v === "" ? "" : Number(v)) : v);
                                    }}
                                    className={`w-full p-3 text-sm bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-primary outline-hidden transition-all ${
                                        errors[field.key] ? "border-red-500 bg-red-50/20" : "border-gray-200"
                                    }`}
                                />
                            </div>

                            {/* Live Persian price word preview */}
                            {persianPreview && (
                                <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg mt-1 inline-block">
                                    معادل: {persianPreview}
                                </p>
                            )}

                            {field.helpText && !persianPreview && (
                                <p className="text-[11px] text-text-light mt-1">
                                    {field.helpText}
                                </p>
                            )}

                            {errors[field.key] && (
                                <p className="text-xs text-red-500 mt-1 font-bold">
                                    {errors[field.key]}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
