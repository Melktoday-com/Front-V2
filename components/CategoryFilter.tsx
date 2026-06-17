"use client";

import { cn } from "@/lib/utils";
import { Building, Building2, Home, LayoutGrid, Map, Palmtree, Store, Trees, Warehouse } from "lucide-react";
import { useState } from "react";
import { Slider } from "./ui/Slider";

const categories = [
    { name: "همه", icon: LayoutGrid },
    { name: "آپارتمان", icon: Building2 },
    { name: "ویلایی", icon: Palmtree },
    { name: "خانه", icon: Home },
    { name: "زمین", icon: Map },
    { name: "تجاری", icon: Store },
    { name: "اداری", icon: Building },
    { name: "باغ", icon: Trees },
    { name: "انبار", icon: Warehouse },
];

export function CategoryFilter() {
    const [active, setActive] = useState("همه");

    return (
        <Slider spaceBetween={12} className="pb-4">
            {categories.map((category) => (
                <button
                    key={category.name}
                    onClick={() => setActive(category.name)}
                    className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap border",
                        active === category.name
                            ? "bg-brand text-white border-brand shadow-lg shadow-brand/20 scale-105"
                            : "bg-soft-bg text-secondary border-soft-border hover:bg-soft-border"
                    )}
                >
                    <category.icon className={cn("w-4 h-4", active === category.name ? "text-white" : "text-primary")} />
                    {category.name}
                </button>
            ))}
        </Slider>
    );
}
