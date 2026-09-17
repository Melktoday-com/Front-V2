"use client";

import React from "react";
import { PriceModel } from "@/types/api/ads.types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle } from "lucide-react";

interface DynamicPriceModelSelectorProps {
    priceModels: PriceModel[];
    selectedKey?: string;
    onSelect: (model: PriceModel) => void;
    disabled?: boolean;
}

export const DynamicPriceModelSelector: React.FC<DynamicPriceModelSelectorProps> = ({
    priceModels,
    selectedKey,
    onSelect,
    disabled = false,
}) => {
    if (!priceModels || priceModels.length === 0) {
        return (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs">
                هیچ مدل قیمتی برای این زیردسته تنظیم نشده است.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <label className="block text-xs font-bold text-brand">
                مدل معامله و شرایط مالی <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {priceModels.map((model) => {
                    const isSelected = selectedKey === model.key || selectedKey === model.id;
                    return (
                        <button
                            type="button"
                            key={model.id || model.key}
                            disabled={disabled}
                            onClick={() => onSelect(model)}
                            className={cn(
                                "flex flex-col justify-between p-4 rounded-2xl border text-right transition-all group relative",
                                isSelected
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                                    : "border-gray-200 hover:border-primary/40 bg-white hover:bg-gray-50/60"
                            )}
                        >
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <span className={cn(
                                    "text-sm font-black",
                                    isSelected ? "text-primary" : "text-brand"
                                )}>
                                    {model.displayName}
                                </span>
                                {isSelected ? (
                                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                ) : (
                                    <Circle className="w-5 h-5 text-gray-300 group-hover:text-gray-400 shrink-0 mt-0.5" />
                                )}
                            </div>
                            {model.description && (
                                <p className="text-[11px] text-text-light line-clamp-2 leading-relaxed">
                                    {model.description}
                                </p>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
