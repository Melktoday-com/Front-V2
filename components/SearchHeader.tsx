"use client";

import { useCity } from "@/components/providers/CityProvider";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useSearchSuggestions } from "@/hooks/useSearch";
import { Bell, ChevronDown, Loader2, MapPin, Search, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CitySelector } from "./CitySelector";

interface SearchHeaderProps {
    isInitialOpen?: boolean;
}

export function SearchHeader({ isInitialOpen }: SearchHeaderProps) {
    const { selectedCity, setSelectedCity } = useCity();
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    // Effect to open modal if selectedCity is empty and isInitialOpen is true
    useEffect(() => {
        if (isInitialOpen && !selectedCity.id) {
            setIsSelectorOpen(true);
        }
    }, [isInitialOpen, selectedCity.id]);

    const { data: suggestions, isLoading: suggestionsLoading } = useSearchSuggestions(searchQuery);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/explore?search=${encodeURIComponent(searchQuery)}&cityId=${selectedCity.id}&cityName=${selectedCity.name}`);
        }
    };

    return (
        <div className="px-3 space-y-6 lg:space-y-8">
            {/* Top Bar: Location & Profile */}
            <div className="flex justify-between items-center">
                <button
                    onClick={() => setIsSelectorOpen(true)}
                    className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-full border border-soft-border group hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                    <div className="w-7 h-7 rounded-full bg-soft-bg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-brand font-black text-xs lg:text-sm">
                            {selectedCity.name || "انتخاب شهر"}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-secondary group-hover:text-primary transition-all duration-500 group-hover:rotate-180" />
                    </div>
                </button>

                <div className="flex items-center gap-3">
                    {isLoggedIn && (
                        <button className="p-2.5 bg-white rounded-full border border-soft-border text-brand hover:text-primary hover:border-primary/30 transition-all relative shadow-sm hover:shadow-md">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2.5 left-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                        </button>
                    )}
                    {!isLoggedIn && <Link href={"/auth"}>
                        <Button variant="outline" className="h-11 px-5 rounded-full flex items-center gap-2 border-soft-border bg-white shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                            <User className="w-4 h-4 text-primary" />
                            <span className="font-black text-sm">{"ورود / ثبت‌نام"}</span>
                        </Button>
                    </Link>}
                </div>
            </div>

            {/* Hero & Search Area */}
            <div className="space-y-6">
                <div className="max-w-2xl space-y-2">
                    <h1 className="text-brand text-2xl lg:text-4xl font-black tracking-tighter leading-[1.1]">
                        اینجا، داستان <span className="text-primary">خانه</span> شما آغاز می‌شود
                    </h1>
                    <p className="text-secondary text-sm lg:text-base font-bold opacity-70">
                        هوشمندانه جستجو کنید، با اطمینان انتخاب کنید
                    </p>
                </div>

                <form onSubmit={handleSearch} className="relative z-10 w-full lg:max-w-4xl">
                    <div className="relative group">
                        <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-secondary/50 group-focus-within:text-primary transition-all duration-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearching(true)}
                            placeholder="نام منطقه، محله یا خیابان را جستجو کنید..."
                            className="w-full bg-white border-2 border-soft-border/50 rounded-[20px] py-4 pr-14 pl-16 text-lg font-bold text-brand focus:ring-8 focus:ring-primary/5 focus:border-primary/30 outline-none transition-all placeholder:text-secondary/40 shadow-xl shadow-brand/5 hover:border-soft-border"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="p-2 hover:bg-soft-bg rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-secondary" />
                                </button>
                            )}
                            <button
                                type="submit"
                                className="bg-primary hover:bg-primary/90 text-white p-2.5 rounded-full shadow-lg shadow-primary/25 hover:scale-110 active:scale-95 transition-all"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Search Suggestions Dropdown */}
                    {isSearching && searchQuery.trim().length > 1 && (
                        <>
                            <div
                                className="fixed inset-0 z-[-1]"
                                onClick={() => setIsSearching(false)}
                            />
                            <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl border border-soft-border rounded-[25px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-2.5 animate-in fade-in slide-in-from-top-4 duration-400 overflow-hidden">
                                {suggestionsLoading ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="w-10 h-10 text-primary animate-spin opacity-30" />
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {suggestions?.map((item, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    setSearchQuery(item.text);
                                                    setIsSearching(false);
                                                    router.push(`/explore?search=${encodeURIComponent(item.text)}&cityId=${selectedCity.id}&cityName=${selectedCity.name}`);
                                                }}
                                                className="w-full flex items-center gap-4 p-3 hover:bg-soft-bg rounded-[18px] transition-all text-right group"
                                            >
                                                <div className="w-11 h-11 bg-soft-bg rounded-[15px] flex items-center justify-center transition-all group-hover:bg-primary group-hover:scale-90 shadow-sm shrink-0">
                                                    {item.type === 'location' ? (
                                                        <MapPin className="w-5 h-5 text-secondary group-hover:text-white" />
                                                    ) : (
                                                        <Search className="w-5 h-5 text-secondary group-hover:text-white" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col text-right">
                                                    <span className="text-brand font-black text-base">{item.text}</span>
                                                    <span className="text-[10px] text-secondary font-bold opacity-50">
                                                        {item.type === 'location' ? 'مشاهده تمام املاک در این موقعیت' : 'جستجو در این دسته‌بندی'}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                        {suggestions?.length === 0 && (
                                            <div className="p-10 text-center text-secondary font-black opacity-30 text-sm">نتیجه‌ای یافت نشد</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </form>
            </div>

            {/* Modal/Drawer Selector */}
            <CitySelector
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                onSelect={(city) => {
                    setSelectedCity(city);
                    setIsSelectorOpen(false);
                }}
                currentCityId={selectedCity.id}
            />
        </div>
    );
}
