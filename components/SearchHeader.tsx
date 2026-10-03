"use client";

import { useCity } from "@/components/providers/CityProvider";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useChat";
import { useDebounce } from "@/hooks/useDebounce";
import { useUnreadNotificationsCount } from "@/hooks/useNotifications";
import { useGlobalSearch, useSearchSuggestions } from "@/hooks/useSearch";
import { toPersianDigits } from "@/lib/utils";
import {
    ListingSearchDocument,
    PostSearchDocument,
    ProfileSearchDocument,
    SearchIndex,
    TemporaryRentalSearchDocument,
} from "@/types/api/search.types";
import {
    ArrowLeft,
    Bell,
    BookOpen,
    Building2,
    ChevronDown,
    Hotel,
    Loader2,
    MapPin,
    MessageSquare,
    Search,
    Sparkles,
    User,
    Users,
    X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CitySelector } from "./CitySelector";

interface SearchHeaderProps {
    isInitialOpen?: boolean;
}

type SearchTab = "ALL" | "LISTINGS" | "RENTALS" | "PROFILES" | "POSTS";

export function SearchHeader({ isInitialOpen }: SearchHeaderProps) {
    const { selectedCity, setSelectedCity } = useCity();
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<SearchTab>("ALL");

    const debouncedQuery = useDebounce(searchQuery, 250);

    const { data: conversations } = useConversations();
    const { data: unreadNotificationsCount = 0 } = useUnreadNotificationsCount();

    const unreadChatCount = conversations?.reduce((sum, c) => sum + (c.unreadCount || 0), 0) ?? 0;

    // Effect to open modal if selectedCity is empty and isInitialOpen is true
    useEffect(() => {
        if (isInitialOpen && !selectedCity.id) {
            setIsSelectorOpen(true);
        }
    }, [isInitialOpen, selectedCity.id]);

    const { data: suggestions, isLoading: suggestionsLoading } = useSearchSuggestions(debouncedQuery);
    const { data: globalData, isLoading: globalLoading } = useGlobalSearch(
        debouncedQuery,
        4,
        isSearching && debouncedQuery.trim().length >= 2
    );

    const listings = useMemo(() => {
        const item = globalData?.results.find((r) => r.index === SearchIndex.LISTINGS);
        return (item?.hits as ListingSearchDocument[] | undefined) || [];
    }, [globalData]);

    const rentals = useMemo(() => {
        const item = globalData?.results.find((r) => r.index === SearchIndex.TEMPORARY_RENTALS);
        return (item?.hits as TemporaryRentalSearchDocument[] | undefined) || [];
    }, [globalData]);

    const profiles = useMemo(() => {
        const item = globalData?.results.find((r) => r.index === SearchIndex.PROFILES);
        return (item?.hits as ProfileSearchDocument[] | undefined) || [];
    }, [globalData]);

    const posts = useMemo(() => {
        const item = globalData?.results.find((r) => r.index === SearchIndex.POSTS);
        return (item?.hits as PostSearchDocument[] | undefined) || [];
    }, [globalData]);

    const totalResultsCount = listings.length + rentals.length + profiles.length + posts.length;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setIsSearching(false);
            router.push(
                `/ads?search=${encodeURIComponent(searchQuery)}&cityId=${selectedCity.id || ""}&cityName=${encodeURIComponent(
                    selectedCity.name || ""
                )}`
            );
        }
    };

    const formatPriceNumber = (num?: number): string => {
        if (!num || num <= 0) return "توافقی";
        if (num >= 1000000000) {
            const b = (num / 1000000000).toFixed(1).replace(/\.0$/, "");
            return `${toPersianDigits(b)} میلیارد تومان`;
        }
        if (num >= 1000000) {
            const m = Math.round(num / 1000000);
            return `${toPersianDigits(m)} میلیون تومان`;
        }
        return `${toPersianDigits(num.toLocaleString("fa-IR"))} تومان`;
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

                <div className="flex items-center gap-2 sm:gap-3">
                    {isLoggedIn && (
                        <>
                            {/* Chat Icon */}
                            <Link
                                href="/profile/chat"
                                aria-label="پیام‌ها و گفت‌وگوها"
                                title="پیام‌ها و گفت‌وگوها"
                                className="p-2.5 bg-white rounded-full border border-soft-border text-brand hover:text-primary hover:border-primary/30 transition-all relative shadow-sm hover:shadow-md flex items-center justify-center"
                            >
                                <MessageSquare className="w-5 h-5" />
                                {unreadChatCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                        {toPersianDigits(unreadChatCount > 99 ? "99+" : unreadChatCount)}
                                    </span>
                                )}
                            </Link>

                            {/* Notifications Icon */}
                            <Link
                                href="/notifications"
                                aria-label="اعلان‌های سیستم"
                                title="اعلان‌های سیستم"
                                className="p-2.5 bg-white rounded-full border border-soft-border text-brand hover:text-primary hover:border-primary/30 transition-all relative shadow-sm hover:shadow-md flex items-center justify-center"
                            >
                                <Bell className="w-5 h-5" />
                                {unreadNotificationsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                                        {toPersianDigits(unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount)}
                                    </span>
                                )}
                            </Link>

                            {/* Profile Icon */}
                            <Link
                                href="/profile"
                                aria-label="حساب کاربری"
                                title="حساب کاربری"
                                className="p-2.5 bg-white rounded-full border border-soft-border text-brand hover:text-primary hover:border-primary/30 transition-all relative shadow-sm hover:shadow-md flex items-center justify-center"
                            >
                                <User className="w-5 h-5" />
                            </Link>
                        </>
                    )}
                    {!isLoggedIn && (
                        <Link href={"/auth"}>
                            <Button
                                variant="outline"
                                className="h-11 px-5 rounded-full flex items-center gap-2 border-soft-border bg-white shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
                            >
                                <User className="w-4 h-4 text-primary" />
                                <span className="font-black text-sm">{"ورود / ثبت‌نام"}</span>
                            </Button>
                        </Link>
                    )}
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

                <form onSubmit={handleSearch} className="relative z-20 w-full lg:max-w-4xl">
                    <div className="relative group">
                        <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-secondary/50 group-focus-within:text-primary transition-all duration-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (!isSearching) setIsSearching(true);
                            }}
                            onFocus={() => setIsSearching(true)}
                            placeholder="جستجو در املاک، اقامتگاه‌ها، دفاتر، مشاورین یا مقالات..."
                            className="w-full bg-white border-2 border-soft-border/50 rounded-[20px] py-4 pr-14 pl-16 text-lg font-bold text-brand focus:ring-8 focus:ring-primary/5 focus:border-primary/30 outline-none transition-all placeholder:text-secondary/40 shadow-xl shadow-brand/5 hover:border-soft-border"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setIsSearching(false);
                                    }}
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

                    {/* Federated Global Search Dropdown */}
                    {isSearching && searchQuery.trim().length > 1 && (
                        <>
                            <div className="fixed inset-0 z-[-1]" onClick={() => setIsSearching(false)} />
                            <div className="absolute top-full left-0 right-0 mt-3 bg-white/98 backdrop-blur-2xl border border-soft-border rounded-[25px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] p-4 animate-in fade-in slide-in-from-top-4 duration-300 max-h-[520px] overflow-y-auto">
                                {/* Autocomplete suggestion pills */}
                                {suggestions && suggestions.length > 0 && (
                                    <div className="mb-3.5 pb-3 border-b border-soft-border/60">
                                        <div className="flex items-center gap-1.5 text-xs text-secondary font-bold mb-2">
                                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                                            <span>پیشنهادهای هوشمند:</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {suggestions.map((item, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => {
                                                        setSearchQuery(item.text);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-soft-bg hover:bg-primary/10 hover:text-primary rounded-full text-xs font-bold text-brand transition-colors"
                                                >
                                                    <Search className="w-3 h-3 opacity-50" />
                                                    <span>{item.text}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Category Tabs */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-3 border-b border-soft-border/60 text-xs font-bold">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("ALL")}
                                        className={`px-3 py-1.5 rounded-full transition-all shrink-0 ${
                                            activeTab === "ALL"
                                                ? "bg-primary text-white shadow-sm"
                                                : "bg-soft-bg text-secondary hover:text-brand"
                                        }`}
                                    >
                                        همه نتایج ({toPersianDigits(totalResultsCount)})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("LISTINGS")}
                                        className={`px-3 py-1.5 rounded-full transition-all shrink-0 ${
                                            activeTab === "LISTINGS"
                                                ? "bg-primary text-white shadow-sm"
                                                : "bg-soft-bg text-secondary hover:text-brand"
                                        }`}
                                    >
                                        املاک ({toPersianDigits(listings.length)})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("RENTALS")}
                                        className={`px-3 py-1.5 rounded-full transition-all shrink-0 ${
                                            activeTab === "RENTALS"
                                                ? "bg-primary text-white shadow-sm"
                                                : "bg-soft-bg text-secondary hover:text-brand"
                                        }`}
                                    >
                                        اجاره روزانه ({toPersianDigits(rentals.length)})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("PROFILES")}
                                        className={`px-3 py-1.5 rounded-full transition-all shrink-0 ${
                                            activeTab === "PROFILES"
                                                ? "bg-primary text-white shadow-sm"
                                                : "bg-soft-bg text-secondary hover:text-brand"
                                        }`}
                                    >
                                        دفاتر و میزبان‌ها ({toPersianDigits(profiles.length)})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("POSTS")}
                                        className={`px-3 py-1.5 rounded-full transition-all shrink-0 ${
                                            activeTab === "POSTS"
                                                ? "bg-primary text-white shadow-sm"
                                                : "bg-soft-bg text-secondary hover:text-brand"
                                        }`}
                                    >
                                        مقالات ({toPersianDigits(posts.length)})
                                    </button>
                                </div>

                                {globalLoading ? (
                                    <div className="flex flex-col items-center justify-center p-12 space-y-2">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                        <span className="text-xs text-secondary font-bold">
                                            در حال جستجو در سراسر پلتفرم...
                                        </span>
                                    </div>
                                ) : totalResultsCount === 0 ? (
                                    <div className="p-8 text-center space-y-2">
                                        <p className="text-secondary font-bold text-sm">
                                            نتیجه‌ای برای «{searchQuery}» یافت نشد.
                                        </p>
                                        <p className="text-xs text-secondary/60">
                                            می‌توانید املای واژه را بررسی کرده یا نام شهر و محله دیگری را جستجو فرمایید.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* 1. Real Estate Listings */}
                                        {(activeTab === "ALL" || activeTab === "LISTINGS") && listings.length > 0 && (
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between px-2 text-xs font-black text-secondary">
                                                    <span className="flex items-center gap-1.5">
                                                        <Building2 className="w-3.5 h-3.5 text-primary" />
                                                        املاک و آگهی‌ها
                                                    </span>
                                                    <Link
                                                        href={`/ads?search=${encodeURIComponent(debouncedQuery)}`}
                                                        onClick={() => setIsSearching(false)}
                                                        className="text-primary hover:underline flex items-center gap-1 text-[11px]"
                                                    >
                                                        مشاهده همه
                                                        <ArrowLeft className="w-3 h-3" />
                                                    </Link>
                                                </div>
                                                <div className="grid gap-1">
                                                    {listings.map((doc) => {
                                                        const pNum = doc.pricing?.number?.price || doc.pricing?.number?.totalPrice;
                                                        return (
                                                            <Link
                                                                key={doc.id}
                                                                href={`/ads/${doc.id}`}
                                                                onClick={() => setIsSearching(false)}
                                                                className="flex items-center justify-between p-2.5 hover:bg-soft-bg rounded-xl transition-all group"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                                                        <Building2 className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="flex flex-col text-right">
                                                                        <span className="text-brand font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                                                            {doc.title}
                                                                        </span>
                                                                        <span className="text-[11px] text-secondary">
                                                                            {doc.geo?.cityName}
                                                                            {doc.geo?.neighbourhoodName ? `، ${doc.geo.neighbourhoodName}` : ""}
                                                                            {pNum ? ` • ${formatPriceNumber(pNum)}` : ""}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <ArrowLeft className="w-4 h-4 text-secondary/40 group-hover:text-primary transition-colors shrink-0" />
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* 2. Temporary Rentals */}
                                        {(activeTab === "ALL" || activeTab === "RENTALS") && rentals.length > 0 && (
                                            <div className="space-y-1.5 pt-2 border-t border-soft-border/40">
                                                <div className="flex items-center justify-between px-2 text-xs font-black text-secondary">
                                                    <span className="flex items-center gap-1.5">
                                                        <Hotel className="w-3.5 h-3.5 text-teal-600" />
                                                        اجاره روزانه و اقامتگاه‌ها
                                                    </span>
                                                    <Link
                                                        href={`/temporary-rent?search=${encodeURIComponent(debouncedQuery)}`}
                                                        onClick={() => setIsSearching(false)}
                                                        className="text-primary hover:underline flex items-center gap-1 text-[11px]"
                                                    >
                                                        مشاهده همه
                                                        <ArrowLeft className="w-3 h-3" />
                                                    </Link>
                                                </div>
                                                <div className="grid gap-1">
                                                    {rentals.map((doc) => {
                                                        const nightly = doc.pricing?.number?.nightlyPrice || doc.pricing?.number?.price;
                                                        return (
                                                            <Link
                                                                key={doc.id}
                                                                href={`/temporary-rent/${doc.id}`}
                                                                onClick={() => setIsSearching(false)}
                                                                className="flex items-center justify-between p-2.5 hover:bg-soft-bg rounded-xl transition-all group"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                                                        <Hotel className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="flex flex-col text-right">
                                                                        <span className="text-brand font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                                                            {doc.title}
                                                                        </span>
                                                                        <span className="text-[11px] text-secondary">
                                                                            {doc.geo?.cityName}
                                                                            {nightly ? ` • هر شب: ${formatPriceNumber(nightly)}` : ""}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <ArrowLeft className="w-4 h-4 text-secondary/40 group-hover:text-primary transition-colors shrink-0" />
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* 3. Profiles (Agencies & Hosts) */}
                                        {(activeTab === "ALL" || activeTab === "PROFILES") && profiles.length > 0 && (
                                            <div className="space-y-1.5 pt-2 border-t border-soft-border/40">
                                                <div className="flex items-center justify-between px-2 text-xs font-black text-secondary">
                                                    <span className="flex items-center gap-1.5">
                                                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                                                        دفاتر املاک و میزبان‌ها
                                                    </span>
                                                </div>
                                                <div className="grid gap-1">
                                                    {profiles.map((doc) => {
                                                        const isAgency = doc.ownerType === "AGENCY";
                                                        const href = isAgency
                                                            ? `/agency/showcase/${doc.slug || doc.id}`
                                                            : `/host/${doc.slug || doc.id}`;
                                                        return (
                                                            <Link
                                                                key={doc.id}
                                                                href={href}
                                                                onClick={() => setIsSearching(false)}
                                                                className="flex items-center justify-between p-2.5 hover:bg-soft-bg rounded-xl transition-all group"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                                        <Users className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="flex flex-col text-right">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span className="text-brand font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                                                                {doc.displayName}
                                                                            </span>
                                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-soft-bg text-secondary font-medium">
                                                                                {isAgency ? "دفتر املاک" : "میزبان"}
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-[11px] text-secondary">
                                                                            {doc.cityName || doc.agencyType || "فعال در پلتفرم"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <ArrowLeft className="w-4 h-4 text-secondary/40 group-hover:text-primary transition-colors shrink-0" />
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* 4. Explore Posts */}
                                        {(activeTab === "ALL" || activeTab === "POSTS") && posts.length > 0 && (
                                            <div className="space-y-1.5 pt-2 border-t border-soft-border/40">
                                                <div className="flex items-center justify-between px-2 text-xs font-black text-secondary">
                                                    <span className="flex items-center gap-1.5">
                                                        <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                                                        مطالب، اخبار و تحلیل‌های ملکی
                                                    </span>
                                                    <Link
                                                        href={`/explore?search=${encodeURIComponent(debouncedQuery)}`}
                                                        onClick={() => setIsSearching(false)}
                                                        className="text-primary hover:underline flex items-center gap-1 text-[11px]"
                                                    >
                                                        مشاهده همه
                                                        <ArrowLeft className="w-3 h-3" />
                                                    </Link>
                                                </div>
                                                <div className="grid gap-1">
                                                    {posts.map((doc) => (
                                                        <Link
                                                            key={doc.id}
                                                            href={`/posts/${doc.slug || doc.id}`}
                                                            onClick={() => setIsSearching(false)}
                                                            className="flex items-center justify-between p-2.5 hover:bg-soft-bg rounded-xl transition-all group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                                                    <BookOpen className="w-4 h-4" />
                                                                </div>
                                                                <div className="flex flex-col text-right">
                                                                    <span className="text-brand font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                                                        {doc.title}
                                                                    </span>
                                                                    <span className="text-[11px] text-secondary line-clamp-1">
                                                                        {doc.summary || doc.category || "مقاله تخصصی"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <ArrowLeft className="w-4 h-4 text-secondary/40 group-hover:text-primary transition-colors shrink-0" />
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
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
