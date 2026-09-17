"use client";

import { cn } from "@/lib/utils";
import { CategoryListItem } from "@/types/api/ads.types";
import Image from "next/image";
import { Slider } from "./ui/Slider";

interface CategoryFilterProps {
  categories: CategoryListItem[];
  isLoading?: boolean;
  selectedCategoryKey?: string;
  onSelectCategory?: (key: string) => void;
}

const CategoryFilter = ({
  categories,
  isLoading,
  selectedCategoryKey,
  onSelectCategory,
}: CategoryFilterProps) => {
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="shrink-0 w-20 h-20 bg-gray-100 animate-pulse rounded-2xl"
          />
        ))}
      </div>
    );
  }

  return (
    <Slider className="pb-2">
      {categories.map((category) => {
        const isSelected = selectedCategoryKey === category.key;
        return (
          <button
            type="button"
            key={category.id || category.key}
            onClick={() => onSelectCategory?.(isSelected ? "" : category.key)}
            className="flex flex-col items-center gap-1.5 cursor-pointer group text-right shrink-0 focus:outline-hidden"
          >
            <div
              className={cn(
                "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border transition-all duration-200",
                isSelected
                  ? "bg-primary border-primary shadow-md shadow-primary/25 text-white"
                  : "bg-gray-50 border-gray-100 group-hover:bg-primary/10 group-hover:border-primary/40 text-gray-700"
              )}
            >
              {category.icon ? (
                <Image
                  src={category.icon}
                  alt={category.displayName}
                  width={28}
                  height={28}
                  className={cn(
                    "transition-transform group-hover:scale-110",
                    isSelected ? "brightness-0 invert" : ""
                  )}
                />
              ) : (
                <span className="text-xl">🏠</span>
              )}
            </div>
            <span
              className={cn(
                "text-[11px] sm:text-xs font-bold transition-colors truncate max-w-16 sm:max-w-20 text-center",
                isSelected
                  ? "text-primary font-black"
                  : "text-text-light group-hover:text-brand"
              )}
            >
              {category.displayName}
            </span>
          </button>
        );
      })}
    </Slider>
  );
};

export default CategoryFilter;
