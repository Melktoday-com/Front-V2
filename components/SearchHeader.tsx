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
        <div className="space-y-6 lg:space-y-10">
            {/* Top Bar: Location & Profile */}
            <div className="flex justify-between items-center">
                <div
                    onClick={() => setIsSelectorOpen(true)}
                    className="flex items-center gap-2 bg-soft-bg px-4 py-2.5 rounded-[20px] border border-soft-border group cursor-pointer hover:border-primary/50 transition-all shadow-sm"
                >
                    <MapPin className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex items-center gap-2">
                        <span className="text-brand font-black text-sm">
                            {selectedCity.name || "انتخاب شهر"}
                        </span>
                        <ChevronDown className="w-4 h-4 text-secondary group-hover:text-primary transition-colors" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isLoggedIn && (
                        <button className="p-3 bg-soft-bg rounded-[18px] border border-soft-border text-brand hover:text-primary transition-colors relative">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-3 left-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-soft-bg" />
                        </button>
                    )}
                    <Link href={isLoggedIn ? "/profile" : "/auth"}>
                        <Button variant="outline" className="h-[52px] px-6 rounded-[18px] flex items-center gap-2 border-soft-border bg-white shadow-sm">
                            <User className="w-5 h-5" />
                            <span className="font-bold">{isLoggedIn ? "حساب کاربری" : "ورود / ثبت‌نام"}</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Hero & Search Area */}
            <div className="space-y-6">
                <h1 className="text-brand text-2xl lg:text-4xl font-black leading-tight max-w-2xl">
                    به دنبال بهترین محل
                    <br />
                    برای زندگی هستی؟
                </h1>

                <form onSubmit={handleSearch} className="relative z-10 w-full lg:max-w-3xl">
                    <div className="relative group">
                        <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-secondary group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearching(true)}
                            placeholder="جستجو در املاک، مناطق یا خیابان‌ها..."
                            className="w-full bg-soft-bg border-none rounded-[25px] py-5 pr-14 pl-6 text-base font-bold text-brand focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-secondary-400 shadow-sm group-hover:shadow-md"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute left-5 top-1/2 -translate-y-1/2 p-1 hover:bg-soft-border/30 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-secondary" />
                            </button>
                        )}
                    </div>

                    {/* Search Suggestions Dropdown */}
                    {isSearching && searchQuery.trim().length > 1 && (
                        <>
                            <div
                                className="fixed inset-0 z-[-1]"
                                onClick={() => setIsSearching(false)}
                            />
                            <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-soft-border rounded-[25px] shadow-2xl p-4 animate-in fade-in slide-in-from-top-4 overflow-hidden">
                                {suggestionsLoading ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {suggestions?.map((item, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    setSearchQuery(item.text);
                                                    setIsSearching(false);
                                                    router.push(`/explore?search=${encodeURIComponent(item.text)}&cityId=${selectedCity.id}&cityName=${selectedCity.name}`);
                                                }}
                                                className="w-full flex items-center gap-3 p-4 hover:bg-soft-bg rounded-[18px] transition-colors text-right group"
                                            >
                                                <div className="w-10 h-10 bg-soft-bg rounded-[12px] flex items-center justify-center group-hover:bg-white transition-colors">
                                                    <Search className="w-5 h-5 text-secondary group-hover:text-primary" />
                                                </div>
                                                <div className="flex flex-col text-right">
                                                    <span className="text-brand font-bold">{item.text}</span>
                                                    <span className="text-[10px] text-secondary font-medium">{item.type === 'location' ? 'موقعیت مکانی' : 'دسته بندی'}</span>
                                                </div>
                                            </button>
                                        ))}
                                        {suggestions?.length === 0 && (
                                            <div className="p-8 text-center text-secondary font-bold">نتیجه‌ای یافت نشد</div>
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
