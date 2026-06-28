"use client";

import { CategoryListItem } from "@/types/api/ads.types";
import Image from "next/image";
import { Slider } from "./ui/Slider";

interface CategoryFilterProps {
  categories: CategoryListItem[];
  isLoading?: boolean;
}

const CategoryFilter = ({ categories, isLoading }: CategoryFilterProps) => {
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="shrink-0 w-24 h-24 bg-gray-100 animate-pulse rounded-2xl"
          />
        ))}
      </div>
    );
  }

  return (
    <Slider className="pb-4">
      {categories.map((category) => (
        <div
          key={category.id}
          className="flex flex-col items-center gap-2 cursor-pointer group"
        >
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-primary-light group-hover:border-primary transition-all">
            {category.icon ? (
              <Image
                src={category.icon}
                alt={category.displayName}
                width={32}
                height={32}
                className="group-hover:scale-110 transition-transform"
              />
            ) : (
              <span className="text-2xl">🏠</span>
            )}
          </div>
          <span className="text-xs font-medium text-gray-600 group-hover:text-primary transition-colors">
            {category.displayName}
          </span>
        </div>
      ))}
    </Slider>
  );
};

export default CategoryFilter;
