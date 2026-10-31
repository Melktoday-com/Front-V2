"use client";

import { Button } from "@/components/ui/Button";
import { cn, formatPrice, toPersianDigits } from "@/lib/utils";
import { AttributeDefinition, PriceModel, SubcategoryConfigResponse } from "@/types/api/ads.types";
import { NumericRangeFilterDto } from "@/types/api/search.types";
import { Check, ChevronDown, Filter, RotateCcw, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export interface SubcategoryFilterValues {
    priceModelKey?: string;
    minPrice?: number;
    maxPrice?: number;
    minDeposit?: number;
    maxDeposit?: number;
    minRent?: number;
    maxRent?: number;
    minArea?: number;
    maxArea?: number;
    minRooms?: number;
    maxRooms?: number;
    minFloor?: number;
    maxFloor?: number;
    minConstructionYear?: number;
    maxConstructionYear?: number;
    hasParking?: boolean;
    hasElevator?: boolean;
    hasStorage?: boolean;
    hasBalcony?: boolean;
    numericAttributes?: Record<string, NumericRangeFilterDto>;
    booleanAttributes?: Record<string, boolean>;
    selectionAttributes?: Record<string, string>;
    stringAttributes?: Record<string, string>;
}

interface SubcategoryFilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    categoryKey?: string;
    subcategoryKey?: string;
    subcategoryName?: string;
    subcatConfig?: SubcategoryConfigResponse | null;
    isLoadingConfig?: boolean;
    currentValues: SubcategoryFilterValues;
    onApply: (values: SubcategoryFilterValues) => void;
    onClear: () => void;
}

const COMMON_AREA_PRESETS = [50, 75, 100, 120, 150, 200];
const ROOM_OPTIONS = [
    { label: "همه", value: undefined },
    { label: "بدون خواب", value: 0 },
    { label: "۱ خواب", value: 1 },
    { label: "۲ خواب", value: 2 },
    { label: "۳ خواب", value: 3 },
    { label: "۴+ خواب", value: 4 },
];

const toStr = (v: number | undefined | null) => (v !== undefined && v !== null && !isNaN(v) ? String(v) : "");

export function SubcategoryFilterDrawer({
    isOpen,
    onClose,
    categoryKey,
    subcategoryKey,
    subcategoryName,
    subcatConfig,
    isLoadingConfig = false,
    currentValues,
    onApply,
    onClear,
}: SubcategoryFilterDrawerProps) {
    // Local editable state
    const [priceModelKey, setPriceModelKey] = useState<string | undefined>(currentValues.priceModelKey);
    const [minPrice, setMinPrice] = useState<string>(toStr(currentValues.minPrice));
    const [maxPrice, setMaxPrice] = useState<string>(toStr(currentValues.maxPrice));
    const [minDeposit, setMinDeposit] = useState<string>(toStr(currentValues.minDeposit));
    const [maxDeposit, setMaxDeposit] = useState<string>(toStr(currentValues.maxDeposit));
    const [minRent, setMinRent] = useState<string>(toStr(currentValues.minRent));
    const [maxRent, setMaxRent] = useState<string>(toStr(currentValues.maxRent));
    const [minArea, setMinArea] = useState<string>(toStr(currentValues.minArea));
    const [maxArea, setMaxArea] = useState<string>(toStr(currentValues.maxArea));
    const [rooms, setRooms] = useState<number | undefined>(currentValues.minRooms);
    const [minFloor, setMinFloor] = useState<string>(toStr(currentValues.minFloor));
    const [maxFloor, setMaxFloor] = useState<string>(toStr(currentValues.maxFloor));
    const [minConstructionYear, setMinConstructionYear] = useState<string>(toStr(currentValues.minConstructionYear));
    const [maxConstructionYear, setMaxConstructionYear] = useState<string>(toStr(currentValues.maxConstructionYear));

    // Booleans
    const [hasParking, setHasParking] = useState<boolean | undefined>(currentValues.hasParking);
    const [hasElevator, setHasElevator] = useState<boolean | undefined>(currentValues.hasElevator);
    const [hasStorage, setHasStorage] = useState<boolean | undefined>(currentValues.hasStorage);
    const [hasBalcony, setHasBalcony] = useState<boolean | undefined>(currentValues.hasBalcony);

    // Dynamic dictionaries
    const [numericAttrs, setNumericAttrs] = useState<Record<string, { min?: string; max?: string }>>({});
    const [booleanAttrs, setBooleanAttrs] = useState<Record<string, boolean>>({});
    const [selectionAttrs, setSelectionAttrs] = useState<Record<string, string>>({});
    const [stringAttrs, setStringAttrs] = useState<Record<string, string>>({});

    // Sync from props on open
    useEffect(() => {
        if (!isOpen) return;

        setPriceModelKey(currentValues.priceModelKey);
        setMinPrice(toStr(currentValues.minPrice));
        setMaxPrice(toStr(currentValues.maxPrice));
        setMinDeposit(toStr(currentValues.minDeposit));
        setMaxDeposit(toStr(currentValues.maxDeposit));
        setMinRent(toStr(currentValues.minRent));
        setMaxRent(toStr(currentValues.maxRent));
        setMinArea(toStr(currentValues.minArea));
        setMaxArea(toStr(currentValues.maxArea));
        setRooms(currentValues.minRooms);
        setMinFloor(toStr(currentValues.minFloor));
        setMaxFloor(toStr(currentValues.maxFloor));
        setMinConstructionYear(toStr(currentValues.minConstructionYear));
        setMaxConstructionYear(toStr(currentValues.maxConstructionYear));

        setHasParking(currentValues.hasParking);
        setHasElevator(currentValues.hasElevator);
        setHasStorage(currentValues.hasStorage);
        setHasBalcony(currentValues.hasBalcony);

        // Convert incoming numericAttributes to strings
        const initNum: Record<string, { min?: string; max?: string }> = {};
        if (currentValues.numericAttributes) {
            for (const [k, v] of Object.entries(currentValues.numericAttributes)) {
                initNum[k] = {
                    min: v.min !== undefined ? String(v.min) : "",
                    max: v.max !== undefined ? String(v.max) : "",
                };
            }
        }
        setNumericAttrs(initNum);
        setBooleanAttrs(currentValues.booleanAttributes ? { ...currentValues.booleanAttributes } : {});
        setSelectionAttrs(currentValues.selectionAttributes ? { ...currentValues.selectionAttributes } : {});
        setStringAttrs(currentValues.stringAttributes ? { ...currentValues.stringAttributes } : {});
    }, [isOpen, currentValues]);

    // Partition subcategory attributes into types, excluding keys handled by canonical top-level fields
    const { customNumberDefs, customBooleanDefs, customSelectDefs, customStringDefs } = useMemo(() => {
        const defs = subcatConfig?.attributeDefinitions ?? [];
        const ignoredKeys = new Set([
            "area",
            "metraj",
            "rooms",
            "rooms_count",
            "bedrooms",
            "parking",
            "has_parking",
            "elevator",
            "has_elevator",
            "storage",
            "has_storage",
            "balcony",
            "has_balcony",
            "floor",
            "floor_number",
            "construction_year",
            "year_of_construction",
        ]);

        const numberDefs: AttributeDefinition[] = [];
        const booleanDefs: AttributeDefinition[] = [];
        const selectDefs: AttributeDefinition[] = [];
        const stringDefs: AttributeDefinition[] = [];

        for (const def of defs) {
            if (!def.isActive) continue;
            const k = def.key.toLowerCase();
            if (ignoredKeys.has(k)) continue;

            if (def.type === "NUMBER") numberDefs.push(def);
            else if (def.type === "BOOLEAN") booleanDefs.push(def);
            else if (def.type === "SELECT") selectDefs.push(def);
            else if (def.type === "STRING") stringDefs.push(def);
        }

        return {
            customNumberDefs: numberDefs,
            customBooleanDefs: booleanDefs,
            customSelectDefs: selectDefs,
            customStringDefs: stringDefs,
        };
    }, [subcatConfig]);

    // Active filters count
    const activeCount = useMemo(() => {
        let count = 0;
        if (priceModelKey) count++;
        if (minPrice || maxPrice) count++;
        if (minDeposit || maxDeposit) count++;
        if (minRent || maxRent) count++;
        if (minArea || maxArea) count++;
        if (rooms !== undefined) count++;
        if (minFloor || maxFloor) count++;
        if (minConstructionYear || maxConstructionYear) count++;
        if (hasParking) count++;
        if (hasElevator) count++;
        if (hasStorage) count++;
        if (hasBalcony) count++;

        for (const v of Object.values(numericAttrs)) {
            if (v.min || v.max) count++;
        }
        for (const v of Object.values(booleanAttrs)) {
            if (v) count++;
        }
        for (const v of Object.values(selectionAttrs)) {
            if (v) count++;
        }
        for (const v of Object.values(stringAttrs)) {
            if (v && v.trim()) count++;
        }
        return count;
    }, [
        priceModelKey,
        minPrice,
        maxPrice,
        minDeposit,
        maxDeposit,
        minRent,
        maxRent,
        minArea,
        maxArea,
        rooms,
        minFloor,
        maxFloor,
        minConstructionYear,
        maxConstructionYear,
        hasParking,
        hasElevator,
        hasStorage,
        hasBalcony,
        numericAttrs,
        booleanAttrs,
        selectionAttrs,
        stringAttrs,
    ]);

    const handleApply = () => {
        const outNumeric: Record<string, NumericRangeFilterDto> = {};
        for (const [k, v] of Object.entries(numericAttrs)) {
            const minNum = v.min ? Number(v.min) : undefined;
            const maxNum = v.max ? Number(v.max) : undefined;
            if ((minNum !== undefined && !isNaN(minNum)) || (maxNum !== undefined && !isNaN(maxNum))) {
                outNumeric[k] = { min: minNum, max: maxNum };
            }
        }

        const outBoolean: Record<string, boolean> = {};
        for (const [k, v] of Object.entries(booleanAttrs)) {
            if (v === true) outBoolean[k] = true;
        }

        const outSelection: Record<string, string> = {};
        for (const [k, v] of Object.entries(selectionAttrs)) {
            if (v && v.trim()) outSelection[k] = v.trim();
        }

        const outString: Record<string, string> = {};
        for (const [k, v] of Object.entries(stringAttrs)) {
            if (v && v.trim()) outString[k] = v.trim();
        }

        onApply({
            priceModelKey: priceModelKey || undefined,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            minDeposit: minDeposit ? Number(minDeposit) : undefined,
            maxDeposit: maxDeposit ? Number(maxDeposit) : undefined,
            minRent: minRent ? Number(minRent) : undefined,
            maxRent: maxRent ? Number(maxRent) : undefined,
            minArea: minArea ? Number(minArea) : undefined,
            maxArea: maxArea ? Number(maxArea) : undefined,
            minRooms: rooms !== undefined ? rooms : undefined,
            maxRooms: rooms !== undefined ? (rooms === 4 ? undefined : rooms) : undefined,
            minFloor: minFloor ? Number(minFloor) : undefined,
            maxFloor: maxFloor ? Number(maxFloor) : undefined,
            minConstructionYear: minConstructionYear ? Number(minConstructionYear) : undefined,
            maxConstructionYear: maxConstructionYear ? Number(maxConstructionYear) : undefined,
            hasParking: hasParking || undefined,
            hasElevator: hasElevator || undefined,
            hasStorage: hasStorage || undefined,
            hasBalcony: hasBalcony || undefined,
            numericAttributes: Object.keys(outNumeric).length > 0 ? outNumeric : undefined,
            booleanAttributes: Object.keys(outBoolean).length > 0 ? outBoolean : undefined,
            selectionAttributes: Object.keys(outSelection).length > 0 ? outSelection : undefined,
            stringAttributes: Object.keys(outString).length > 0 ? outString : undefined,
        });
        onClose();
    };

    const handleResetAll = () => {
        setPriceModelKey(undefined);
        setMinPrice("");
        setMaxPrice("");
        setMinDeposit("");
        setMaxDeposit("");
        setMinRent("");
        setMaxRent("");
        setMinArea("");
        setMaxArea("");
        setRooms(undefined);
        setMinFloor("");
        setMaxFloor("");
        setMinConstructionYear("");
        setMaxConstructionYear("");
        setHasParking(undefined);
        setHasElevator(undefined);
        setHasStorage(undefined);
        setHasBalcony(undefined);
        setNumericAttrs({});
        setBooleanAttrs({});
        setSelectionAttrs({});
        setStringAttrs({});
        onClear();
    };

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
            role="dialog"
            aria-modal="true"
            data-modal="true"
            aria-label="فیلترهای پیشرفته"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Container: Bottom Drawer on mobile, Centered Dialog on desktop */}
            <div
                className={cn(
                    "relative z-10 w-full md:w-[620px] md:max-w-2xl bg-surface rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden",
                    "h-[90vh] max-h-[92vh] md:h-[720px] md:max-h-[85vh]",
                    "border-t md:border border-border-subtle",
                    "animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-200 text-right"
                )}
            >
                {/* Mobile Drag Bar */}
                <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-border-subtle" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-primary" />
                        <div>
                            <span className="font-bold text-brand text-sm sm:text-base">
                                فیلترهای {subcategoryName || "جستجو"}
                            </span>
                            {subcatConfig?.subcategory?.displayName && (
                                <span className="block text-[11px] text-text-light font-medium">
                                    زیردسته: {subcatConfig.subcategory.displayName}
                                </span>
                            )}
                        </div>
                        {activeCount > 0 && (
                            <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full mr-1">
                                {activeCount}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {activeCount > 0 && (
                            <button
                                type="button"
                                onClick={handleResetAll}
                                className="flex items-center gap-1 text-xs text-error font-semibold hover:opacity-80 transition-opacity cursor-pointer px-2 py-1 rounded-lg hover:bg-error-subtle"
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span>حذف همه</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 rounded-full hover:bg-soft-bg text-secondary hover:text-brand transition-colors cursor-pointer"
                            aria-label="بستن"
                            data-modal-close="true"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 custom-scrollbar">
                    {/* 1. Price Model Selection (if multiple allowed price models exist) */}
                    {subcatConfig?.allowedPriceModels && subcatConfig.allowedPriceModels.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-main flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-primary" />
                                <span>نوع معامله / مدل قیمت</span>
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setPriceModelKey(undefined)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer",
                                        priceModelKey === undefined
                                            ? "bg-primary text-white border-primary shadow-xs"
                                            : "bg-soft-bg text-secondary border-soft-border hover:border-primary/50"
                                    )}
                                >
                                    همه مدل‌ها
                                </button>
                                {subcatConfig.allowedPriceModels.map((pm) => (
                                    <button
                                        key={pm.key}
                                        type="button"
                                        onClick={() =>
                                            setPriceModelKey(priceModelKey === pm.key ? undefined : pm.key)
                                        }
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer",
                                            priceModelKey === pm.key
                                                ? "bg-primary text-white border-primary shadow-xs"
                                                : "bg-soft-bg text-secondary border-soft-border hover:border-primary/50"
                                        )}
                                    >
                                        {pm.displayName || pm.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 2. Price Ranges */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-text-main">محدوده قیمت و بودجه (تومان)</label>

                        {/* Total price for Sale / Default */}
                        {(!priceModelKey ||
                            priceModelKey.includes("sale") ||
                            priceModelKey.includes("cash") ||
                            priceModelKey.includes("total")) && (
                            <div className="space-y-1.5 bg-soft-bg/50 p-3 rounded-2xl border border-soft-border/70">
                                <span className="text-[11px] font-semibold text-secondary">قیمت کل</span>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        placeholder="حداقل قیمت"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        className="h-10 px-3 text-xs bg-surface border border-soft-border rounded-xl focus:border-primary focus:outline-none"
                                    />
                                    <input
                                        type="number"
                                        placeholder="حداکثر قیمت"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        className="h-10 px-3 text-xs bg-surface border border-soft-border rounded-xl focus:border-primary focus:outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Rent / Deposit for Rent models */}
                        {(!priceModelKey ||
                            priceModelKey.includes("rent") ||
                            priceModelKey.includes("mortgage") ||
                            priceModelKey.includes("rahn")) && (
                            <div className="space-y-2 bg-soft-bg/50 p-3 rounded-2xl border border-soft-border/70">
                                <span className="text-[11px] font-semibold text-secondary">ودیعه / رهن و اجاره</span>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        placeholder="حداقل ودیعه"
                                        value={minDeposit}
                                        onChange={(e) => setMinDeposit(e.target.value)}
                                        className="h-10 px-3 text-xs bg-surface border border-soft-border rounded-xl focus:border-primary focus:outline-none"
                                    />
                                    <input
                                        type="number"
                                        placeholder="حداکثر ودیعه"
                                        value={maxDeposit}
                                        onChange={(e) => setMaxDeposit(e.target.value)}
                                        className="h-10 px-3 text-xs bg-surface border border-soft-border rounded-xl focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <input
                                        type="number"
                                        placeholder="حداقل اجاره"
                                        value={minRent}
                                        onChange={(e) => setMinRent(e.target.value)}
                                        className="h-10 px-3 text-xs bg-surface border border-soft-border rounded-xl focus:border-primary focus:outline-none"
                                    />
                                    <input
                                        type="number"
                                        placeholder="حداکثر اجاره"
                                        value={maxRent}
                                        onChange={(e) => setMaxRent(e.target.value)}
                                        className="h-10 px-3 text-xs bg-surface border border-soft-border rounded-xl focus:border-primary focus:outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. Area (متراژ) */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-main">متراژ (متر مربع)</label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="number"
                                placeholder="حداقل متراژ"
                                value={minArea}
                                onChange={(e) => setMinArea(e.target.value)}
                                className="h-10 px-3 text-xs bg-surface border border-soft-border rounded-xl focus:border-primary focus:outline-none"
                            />
                            <input
                                type="number"
                                placeholder="حداکثر متراژ"
                                value={maxArea}
                                onChange={(e) => setMaxArea(e.target.value)}
                                className="h-10 px-3 text-xs bg-surface border border-soft-border rounded-xl focus:border-primary focus:outline-none"
                            />
                        </div>
                        {/* Quick Presets */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {COMMON_AREA_PRESETS.map((areaVal) => (
                                <button
                                    key={areaVal}
                                    type="button"
                                    onClick={() => setMinArea(minArea === String(areaVal) ? "" : String(areaVal))}
                                    className={cn(
                                        "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer",
                                        minArea === String(areaVal)
                                            ? "bg-primary text-white border-primary"
                                            : "bg-soft-bg text-secondary border-soft-border hover:border-primary/50"
                                    )}
                                >
                                    از {toPersianDigits(areaVal)} متر
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 4. Rooms (تعداد خواب) */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-main">تعداد اتاق خواب</label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                            {ROOM_OPTIONS.map((opt) => (
                                <button
                                    key={opt.label}
                                    type="button"
                                    onClick={() => setRooms(opt.value)}
                                    className={cn(
                                        "h-9 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center",
                                        rooms === opt.value
                                            ? "bg-primary text-white border-primary shadow-xs"
                                            : "bg-soft-bg text-secondary border-soft-border hover:border-primary/50"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 5. Core Amenities (Parking, Elevator, Storage, Balcony) */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-text-main">امکانات اصلی ملک</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                                type="button"
                                onClick={() => setHasElevator(!hasElevator)}
                                className={cn(
                                    "h-10 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                                    hasElevator
                                        ? "bg-primary text-white border-primary shadow-xs"
                                        : "bg-soft-bg text-secondary border-soft-border hover:border-primary/50"
                                )}
                            >
                                {hasElevator && <Check className="w-3.5 h-3.5" />}
                                <span>آسانسور</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setHasParking(!hasParking)}
                                className={cn(
                                    "h-10 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                                    hasParking
                                        ? "bg-primary text-white border-primary shadow-xs"
                                        : "bg-soft-bg text-secondary border-soft-border hover:border-primary/50"
                                )}
                            >
                                {hasParking && <Check className="w-3.5 h-3.5" />}
                                <span>پارکینگ</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setHasStorage(!hasStorage)}
                                className={cn(
                                    "h-10 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                                    hasStorage
                                        ? "bg-primary text-white border-primary shadow-xs"
                                        : "bg-soft-bg text-secondary border-soft-border hover:border-primary/50"
                                )}
                            >
                                {hasStorage && <Check className="w-3.5 h-3.5" />}
                                <span>انباری</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setHasBalcony(!hasBalcony)}
                                className={cn(
                                    "h-10 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                                    hasBalcony
                                        ? "bg-primary text-white border-primary shadow-xs"
                                        : "bg-soft-bg text-secondary border-soft-border hover:border-primary/50"
                                )}
                            >
                                {hasBalcony && <Check className="w-3.5 h-3.5" />}
                                <span>بالکن</span>
                            </button>
                        </div>
                    </div>

                    {/* 6. Floor & Construction Year */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-main">طبقه</label>
                            <div className="grid grid-cols-2 gap-1.5">
                                <input
                                    type="number"
                                    placeholder="از طبقه"
                                    value={minFloor}
                                    onChange={(e) => setMinFloor(e.target.value)}
                                    className="h-10 px-2.5 text-xs bg-surface border border-soft-border rounded-xl focus:border-primary focus:outline-none"
                                />
                                <input
                                    type="number"
                                    placeholder="تا طبقه"
                                    value={maxFloor}
                                    onChange={(e) => setMaxFloor(e.target.value)}
                                    className="h-10 px-2.5 text-xs bg-surface border border-soft-border rounded-xl focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-text-main">سال ساخت</label>
                            <div className="grid grid-cols-2 gap-1.5">
                                <input
                                    type="number"
                                    placeholder="از سال (مثلا ۱۴۰۰)"
                                    value={minConstructionYear}
                                    onChange={(e) => setMinConstructionYear(e.target.value)}
                                    className="h-10 px-2.5 text-xs bg-surface border border-soft-border rounded-xl focus:border-primary focus:outline-none"
                                />
                                <input
                                    type="number"
                                    placeholder="تا سال"
                                    value={maxConstructionYear}
                                    onChange={(e) => setMaxConstructionYear(e.target.value)}
                                    className="h-10 px-2.5 text-xs bg-surface border border-soft-border rounded-xl focus:border-primary focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 7. Custom Dynamic Boolean Attributes (defined by Super Admin for this Subcategory) */}
                    {customBooleanDefs.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-border-subtle">
                            <label className="text-xs font-bold text-text-main flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-primary" />
                                <span>سایر ویژگی‌های اختصاصی زیردسته</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {customBooleanDefs.map((def) => {
                                    const isChecked = booleanAttrs[def.key] === true;
                                    return (
                                        <button
                                            key={def.key}
                                            type="button"
                                            onClick={() =>
                                                setBooleanAttrs((prev) => ({
                                                    ...prev,
                                                    [def.key]: !isChecked,
                                                }))
                                            }
                                            className={cn(
                                                "h-9 px-3 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer",
                                                isChecked
                                                    ? "bg-primary text-white border-primary shadow-xs"
                                                    : "bg-soft-bg text-secondary border-soft-border hover:border-primary/50"
                                            )}
                                        >
                                            {isChecked && <Check className="w-3 h-3" />}
                                            <span>{def.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 8. Custom Dynamic Select Attributes (defined by Super Admin for this Subcategory) */}
                    {customSelectDefs.length > 0 && (
                        <div className="space-y-4 pt-2 border-t border-border-subtle">
                            {customSelectDefs.map((def) => {
                                const selectedOption = selectionAttrs[def.key];
                                const options = def.options ?? [];
                                if (options.length === 0) return null;

                                return (
                                    <div key={def.key} className="space-y-2">
                                        <label className="text-xs font-bold text-text-main">{def.label}</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {options.map((opt) => {
                                                const isSelected = selectedOption === opt.key;
                                                return (
                                                    <button
                                                        key={opt.key}
                                                        type="button"
                                                        onClick={() =>
                                                            setSelectionAttrs((prev) => ({
                                                                ...prev,
                                                                [def.key]: isSelected ? "" : opt.key,
                                                            }))
                                                        }
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                                                            isSelected
                                                                ? "bg-primary text-white border-primary shadow-xs"
                                                                : "bg-soft-bg text-secondary border-soft-border hover:border-primary/50"
                                                        )}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* 9. Custom Dynamic Number Attributes (defined by Super Admin for this Subcategory) */}
                    {customNumberDefs.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-border-subtle">
                            {customNumberDefs.map((def) => {
                                const val = numericAttrs[def.key] ?? {};
                                return (
                                    <div key={def.key} className="space-y-1.5">
                                        <label className="text-xs font-bold text-text-main">{def.label}</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                placeholder={`حداقل ${def.label}`}
                                                value={val.min ?? ""}
                                                onChange={(e) =>
                                                    setNumericAttrs((prev) => ({
                                                        ...prev,
                                                        [def.key]: {
                                                            ...prev[def.key],
                                                            min: e.target.value,
                                                        },
                                                    }))
                                                }
                                                className="h-10 px-3 text-xs bg-surface border border-soft-border rounded-xl focus:border-primary focus:outline-none"
                                            />
                                            <input
                                                type="number"
                                                placeholder={`حداکثر ${def.label}`}
                                                value={val.max ?? ""}
                                                onChange={(e) =>
                                                    setNumericAttrs((prev) => ({
                                                        ...prev,
                                                        [def.key]: {
                                                            ...prev[def.key],
                                                            max: e.target.value,
                                                        },
                                                    }))
                                                }
                                                className="h-10 px-3 text-xs bg-surface border border-soft-border rounded-xl focus:border-primary focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* 10. Custom Dynamic String Attributes */}
                    {customStringDefs.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-border-subtle">
                            {customStringDefs.map((def) => (
                                <div key={def.key} className="space-y-1.5">
                                    <label className="text-xs font-bold text-text-main">{def.label}</label>
                                    <input
                                        type="text"
                                        placeholder={`جستجو در ${def.label}...`}
                                        value={stringAttrs[def.key] ?? ""}
                                        onChange={(e) =>
                                            setStringAttrs((prev) => ({
                                                ...prev,
                                                [def.key]: e.target.value,
                                            }))
                                        }
                                        className="h-10 px-3 text-xs bg-surface border border-soft-border rounded-xl focus:border-primary focus:outline-none w-full"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-border-subtle bg-surface flex items-center gap-3 shrink-0">
                    <Button
                        type="button"
                        onClick={handleApply}
                        className="flex-1 h-11 text-sm font-bold flex items-center justify-center gap-2"
                    >
                        <span>اعمال فیلترها</span>
                        {activeCount > 0 && (
                            <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-black">
                                {activeCount}
                            </span>
                        )}
                    </Button>
                    {activeCount > 0 && (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleResetAll}
                            className="h-11 px-4 text-xs font-bold text-secondary hover:text-error"
                        >
                            حذف فیلترها
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
