"use client";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useZones } from "@/hooks/useGeo";
import { useSearchSuggestions } from "@/hooks/useSearch";
import { Bell, Loader2, MapPin, Search, User, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SearchHeaderProps {
    selectedCity: { id: string; name: string };
    onCityChange: (city: { id: string; name: string }) => void;
}

export function SearchHeader({ selectedCity, onCityChange }: SearchHeaderProps) {
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const { data: citiesData } = useZones("root");
    const { data: suggestions, isLoading: suggestionsLoading } = useSearchSuggestions(searchQuery);

    // Auto-select first city if none selected
    useEffect(() => {
        if (!selectedCity.id && citiesData?.zones && citiesData.zones.length > 0) {
            onCityChange({
                id: citiesData.zones[0].id,
                name: citiesData.zones[0].name
            });
        }
    }, [citiesData, selectedCity.id, onCityChange]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/explore?search=${encodeURIComponent(searchQuery)}&cityId=${selectedCity.id}&cityName=${selectedCity.name}`);
        }
    };

    return (
        <div className="space-y-6 lg:space-y-10">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 bg-soft-bg px-4 py-2 rounded-[20px] border border-soft-border relative group cursor-pointer">
                    <MapPin className="w-4 h-4 text-primary" />
                    <select
                        value={selectedCity.id}
                        onChange={(e) => {
                            const city = citiesData?.zones.find(z => z.id === e.target.value);
                            if (city) onCityChange({ id: city.id, name: city.name });
                        }}
                        className="bg-transparent text-brand font-bold text-xs border-none focus:ring-0 outline-none cursor-pointer appearance-none pr-4"
                    >
                        {citiesData?.zones.map(city => (
                            <option key={city.id} value={city.id}>{city.name}</option>
                        )) || <option value="">Loading cities...</option>}
                    </select>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" size="icon" className="rounded-full w-10 h-10 transition-transform hover:scale-105">
                        <Search className="w-5 h-5 text-brand lg:hidden" />
                        <Bell className="w-5 h-5 text-brand" />
                    </Button>
                    <div className="flex items-center gap-3">
                        {isLoggedIn ? (
                            <Link href="/profile" className="w-10 h-10 rounded-full bg-soft-bg border border-soft-border flex items-center justify-center overflow-hidden transition-all hover:border-primary">
                                <User className="w-5 h-5 text-brand" />
                            </Link>
                        ) : (
                            <Link href="/auth">
                                <Button size="sm" className="hidden lg:flex rounded-full h-10 px-6">ورود | ثبت نام</Button>
                                <div className="lg:hidden w-10 h-10 rounded-full bg-soft-bg border border-soft-border flex items-center justify-center">
                                    <User className="w-5 h-5 text-brand" />
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-4 lg:space-y-6">
                <h1 className="text-brand text-2xl lg:text-4xl font-black leading-tight max-w-2xl">
                    به دنبال بهترین محل
                    <br />
                    برای زندگی هستی؟
                </h1>
                <form onSubmit={handleSearch} className="relative group max-w-xl">
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        {suggestionsLoading ? (
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        ) : (
                            <Search className="w-5 h-5 text-secondary group-focus-within:text-primary transition-colors" />
                        )}
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearching(true)}
                        placeholder="جستجوی خانه، آپارتمان و..."
                        className="w-full bg-soft-bg border-none rounded-[20px] py-4 pr-12 pl-4 text-sm font-bold text-brand focus:ring-2 focus:ring-primary/20 placeholder:text-secondary-300 outline-none transition-all shadow-sm group-hover:shadow-md"
                    />

                    {isSearching && searchQuery.length >= 2 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-soft-border overflow-hidden z-50">
                            <div className="flex justify-between items-center p-3 border-b border-soft-border bg-gray-50/50">
                                <span className="text-[10px] uppercase tracking-wider text-secondary-400 font-bold">Suggestions</span>
                                <button onClick={() => setIsSearching(false)} type="button">
                                    <X className="w-4 h-4 text-secondary-300 hover:text-red-500 transition-colors" />
                                </button>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {suggestions?.map((item, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            setSearchQuery(item.text);
                                            setIsSearching(false);
                                            router.push(`/explore?search=${encodeURIComponent(item.text)}&cityName=${selectedCity.name}`);
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-soft-bg cursor-pointer transition-colors border-b border-soft-border last:border-0"
                                    >
                                        <div className={`w-2 h-2 rounded-full ${item.type === 'location' ? 'bg-blue-400' : 'bg-primary'}`} />
                                        <span className="text-sm font-bold text-brand">{item.text}</span>
                                        <span className="text-[10px] text-secondary ml-auto">{item.type}</span>
                                    </div>
                                ))}
                                {suggestions?.length === 0 && !suggestionsLoading && (
                                    <div className="p-4 text-center text-sm text-secondary">نتیجه‌ای یافت نشد</div>
                                )}
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

