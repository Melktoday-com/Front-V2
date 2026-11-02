import { useCategories } from "@/hooks/useAds";
import { useMemo } from "react";

export function useCategoryLookup() {
    const { data: categories, isLoading } = useCategories();

    const { categoryMap, subcategoryMap } = useMemo(() => {
        const catMap: Record<string, string> = {};
        const subMap: Record<string, string> = {};

        if (Array.isArray(categories)) {
            categories.forEach((cat) => {
                if (cat.key) {
                    catMap[cat.key] = cat.displayName || cat.key;
                }
                cat.subcategories?.forEach((sub) => {
                    if (sub.key) {
                        subMap[sub.key] = sub.displayName || sub.key;
                        subMap[`${cat.key}/${sub.key}`] = sub.displayName || sub.key;
                    }
                });
            });
        }

        return { categoryMap: catMap, subcategoryMap: subMap };
    }, [categories]);

    const getCategoryName = (key?: string) => {
        if (!key) return "";
        return categoryMap[key] || key;
    };

    const getSubcategoryName = (subKey?: string, catKey?: string) => {
        if (!subKey) return "";
        if (catKey && subcategoryMap[`${catKey}/${subKey}`]) {
            return subcategoryMap[`${catKey}/${subKey}`];
        }
        return subcategoryMap[subKey] || subKey;
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
