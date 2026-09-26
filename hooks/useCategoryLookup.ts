import { useCategories } from "@/hooks/useAds";
import { useMemo } from "react";

export const DEFAULT_CATEGORY_TRANSLATIONS: Record<string, string> = {
    // Categories
    residential: "املاک مسکونی",
    commercial: "املاک تجاری و اداری",
    land: "زمین و کلنگی",
    industrial: "املاک صنعتی و کشاورزی",
    temporary_rent: "اجاره روزانه و اقامتگاه",

    // Subcategories
    apartment: "آپارتمان",
    villa: "ویلا",
    suite: "سوئیت",
    office: "دفتر کار و اداری",
    store: "مغازه و تجاری",
    shop: "مغازه",
    furnished_apartment: "آپارتمان مبله",
    garden: "باغ و باغچه",
    commercial_land: "زمین تجاری",
    residential_land: "زمین مسکونی",
    agricultural: "کشاورزی و زراعی",
    factory: "کارخانه و کارگاه",
    warehouse: "انبار و سوله",
};

export function useCategoryLookup() {
    const { data: categories, isLoading } = useCategories();

    const { categoryMap, subcategoryMap } = useMemo(() => {
        const catMap: Record<string, string> = { ...DEFAULT_CATEGORY_TRANSLATIONS };
        const subMap: Record<string, string> = { ...DEFAULT_CATEGORY_TRANSLATIONS };

        if (Array.isArray(categories)) {
            categories.forEach((cat) => {
                if (cat.key) {
                    catMap[cat.key] = cat.displayName || catMap[cat.key] || cat.key;
                }
                cat.subcategories?.forEach((sub) => {
                    if (sub.key) {
                        subMap[sub.key] = sub.displayName || subMap[sub.key] || sub.key;
                        subMap[`${cat.key}/${sub.key}`] = sub.displayName || sub.key;
                    }
                });
            });
        }

        return { categoryMap: catMap, subcategoryMap: subMap };
    }, [categories]);

    const getCategoryName = (key?: string) => {
        if (!key) return "";
        return categoryMap[key] || DEFAULT_CATEGORY_TRANSLATIONS[key] || key;
    };

    const getSubcategoryName = (subKey?: string, catKey?: string) => {
        if (!subKey) return "";
        if (catKey && subcategoryMap[`${catKey}/${subKey}`]) {
            return subcategoryMap[`${catKey}/${subKey}`];
        }
        return subcategoryMap[subKey] || DEFAULT_CATEGORY_TRANSLATIONS[subKey] || subKey;
    };

    const getCategoryPathLabel = (categoryKey?: string, subcategoryKey?: string) => {
        const catLabel = getCategoryName(categoryKey);
        const subLabel = getSubcategoryName(subcategoryKey, categoryKey);
        if (catLabel && subLabel) {
            return `${catLabel} / ${subLabel}`;
        }
        return subLabel || catLabel || "—";
    };

    return {
        categoryMap,
        subcategoryMap,
        getCategoryName,
        getSubcategoryName,
        getCategoryPathLabel,
        isLoading,
    };
}
