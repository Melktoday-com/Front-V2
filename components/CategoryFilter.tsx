"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Slider } from "./ui/Slider";

const categories = ["همه", "خانه", "آپارتمان", "ویلایی", "باغ"];

export function CategoryFilter() {
    const [active, setActive] = useState("همه");

    return (
        <Slider spaceBetween={8} className="-mx-4 px-4 lg:mx-0 lg:px-0">
            {categories.map((category) => (
                <button
                    key={category}
                    onClick={() => setActive(category)}
                    className={cn(
                        "px-6 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap",
                        active === category
                            ? "bg-brand text-white shadow-md shadow-brand/20"
                            : "bg-soft-bg text-secondary hover:bg-soft-border"
                    )}
                >
                    {category}
                </button>
            ))}
        </Slider>
    );
}
