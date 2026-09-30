"use client";

import { PageSectionDivider } from "@/components/ui/PageSectionDivider";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { useInfiniteExplorePosts, useLikePost, useMyAgency } from "@/hooks/useAgencies";
import { useAuth } from "@/hooks/useAuth";
import { cn, toPersianDigits, getMediaUrl } from "@/lib/utils";
import { agencyService } from "@/services/agency.service";
import MediaGalleryUpload from "@/components/MediaGalleryUpload";
import { AgencyPost } from "@/types/api/agency.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    BookOpen,
    Building2,
    Calendar,
    ChevronLeft,
    Eye,
    Grid,
    Heart,
    List,
    Loader2,
    Newspaper,
    PenTool,
    Search,
    Share2,
    Verified,
    X
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const TOPIC_TAGS = [
    { id: "all", label: "همه موضوعات" },
    { id: "market", label: "تحلیل بازار مسکن" },
    { id: "guide", label: "راهنمای خرید و رهن" },
    { id: "legal", label: "نکات حقوقی و قرارداد" },
    { id: "investment", label: "فرصت‌های سرمایه‌گذاری" },
    { id: "news", label: "اخبار ملکی" },
];

export default function ExploreScene() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { isLoggedIn } = useAuth();
    const { data: myAgency } = useMyAgency();

    const [searchQuery, setSearchQuery] = useState("");
    const [activeSearch, setActiveSearch] = useState("");
    const [selectedTag, setSelectedTag] = useState("all");
    const [viewMode, setViewMode] = useState<"feed" | "grid">("feed");
    const [startPage, setStartPage] = useState<number>(1);

    const observerTargetRef = useRef<HTMLDivElement | null>(null);

    // Modal state for reading a full post
    const [readingPost, setReadingPost] = useState<AgencyPost | null>(null);

    // Modal state for quick content creation
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [postTitle, setPostTitle] = useState("");
    const [postSummary, setPostSummary] = useState("");
    const [postContent, setPostContent] = useState("");
    const [postMediaIds, setPostMediaIds] = useState<string[]>([]);

    // Fetch published posts with infinite scroll
    const {
        data: postsData,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        isError,
        refetch,
    } = useInfiniteExplorePosts(
        {
            limit: 12,
            search: activeSearch || undefined,
        },
        { startPage, maxPages: 7 }
    );

    // Auto-scroll infinite scroll up to 7 pages
    useEffect(() => {
        const target = observerTargetRef.current;
        if (!target) return;

        const currentBatchPageCount = postsData?.pages.length ?? 0;
        if (currentBatchPageCount >= 7) return;
        if (!hasNextPage || isFetchingNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    fetchNextPage();
                }
            },
            { rootMargin: "300px" }
        );

        observer.observe(target);
        return () => {
            observer.disconnect();
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, postsData?.pages.length]);

    const likeMutation = useLikePost();

    const createPostMutation = useMutation({
        mutationFn: () =>
            agencyService.createMyPost({
                title: postTitle.trim(),
                summary: postSummary.trim() || undefined,
                content: postContent.trim(),
                mediaUrls: postMediaIds.length > 0 ? postMediaIds : [],
                isPublished: true,
            }),
        onSuccess: () => {
            toast.success("پست با موفقیت منتشر شد.");
            setIsCreateModalOpen(false);
            setPostTitle("");
            setPostSummary("");
            setPostContent("");
            setPostMediaIds([]);
            queryClient.invalidateQueries({ queryKey: ["explore-posts"] });
            queryClient.invalidateQueries({ queryKey: ["explore-posts-infinite"] });
            refetch();
        },
        onError: () => {
            toast.error("خطا در انتشار پست. لطفاً دوباره تلاش کنید.");
        },
    });

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setActiveSearch(searchQuery.trim());
        setStartPage(1);
    };

    const handleLike = (e: React.MouseEvent, postId: string) => {
        e.stopPropagation();
        if (!isLoggedIn) {
            toast.info("برای پسندیدن پست، لطفاً ابتدا وارد حساب کاربری شوید.");
            router.push("/auth?returnUrl=/explore");
            return;
        }
        likeMutation.mutate(postId, {
            onSuccess: (res: { hasLiked?: boolean; likeCount?: number }) => {
                if (readingPost && readingPost.id === postId) {
                    setReadingPost({
                        ...readingPost,
                        hasLiked: res.hasLiked ?? !readingPost.hasLiked,
                        likeCount: res.likeCount ?? readingPost.likeCount,
                    });
                }
            },
        });
    };

    const handleShare = (e: React.MouseEvent, post: AgencyPost) => {
        e.stopPropagation();
        const agencySlugOrId = post.agency?.slug || post.agency?.id || post.agencyId;
        const url = `${window.location.origin}/agency/showcase/${encodeURIComponent(agencySlugOrId)}`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url);
            toast.success("لینک پست کپی شد.");
        } else {
            toast.info(url);
        }
    };

    const handleOpenCreateModal = () => {
        if (!isLoggedIn) {
            toast.info("برای انتشار محتوا، لطفاً ابتدا وارد حساب کاربری خود شوید.");
            router.push("/auth?returnUrl=/explore");
            return;
        }
        if (!myAgency) {
            toast.info("برای تولید محتوا، لطفاً ابتدا درخواست همکاری به عنوان مشاور املاک را ثبت کنید.");
            router.push("/agency/apply");
            return;
        }
        setIsCreateModalOpen(true);
    };

    // Filter helper
    const filterPostByTag = (post: AgencyPost, tag: string) => {
        if (tag === "all") return true;
        const text = `${post.title} ${post.summary || ""} ${post.content}`.toLowerCase();
        if (tag === "market") return text.includes("بازار") || text.includes("قیمت") || text.includes("تحلیل");
        if (tag === "guide") return text.includes("راهنما") || text.includes("خرید") || text.includes("رهن");
        if (tag === "legal") return text.includes("حقوق") || text.includes("سند") || text.includes("قرارداد");
        if (tag === "investment") return text.includes("سرمایه") || text.includes("سود") || text.includes("سرمایه‌گذاری");
        if (tag === "news") return text.includes("خبر") || text.includes("قانون") || text.includes("جدید");
        return true;
    };

    // Flatten all loaded posts across pages in current batch
    const allLoadedPosts = useMemo(() => {
        return postsData?.pages.flatMap((page) => page.items) || [];
    }, [postsData]);

    const filteredPosts = useMemo(() => {
        return allLoadedPosts.filter((post) => filterPostByTag(post, selectedTag));
    }, [allLoadedPosts, selectedTag]);

    // Pagination metrics
    const totalCount = postsData?.pages[0]?.total ?? 0;
    const limitPerPage = postsData?.pages[0]?.limit ?? 12;
    const totalPages = postsData?.pages[0]?.totalPages || Math.ceil(totalCount / limitPerPage);
    const lastLoadedPage = postsData?.pages[postsData.pages.length - 1]?.page ?? startPage;
    const isBatchFinished = (postsData?.pages.length ?? 0) >= 7 || !hasNextPage;
    const loadedPages = useMemo(() => postsData?.pages.map((p) => p.page) || [], [postsData]);

    const handlePageSelect = (targetPage: number) => {
        const isLoadedInCurrentBatch = loadedPages.includes(targetPage);
        if (isLoadedInCurrentBatch) {
            if (targetPage === startPage) {
                document.getElementById("explore-top")?.scrollIntoView({ behavior: "smooth" });
            } else {
                const sectionElem = document.getElementById(`explore-page-section-${targetPage}`);
                if (sectionElem) {
                    sectionElem.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            }
        } else {
            setStartPage(targetPage);
            document.getElementById("explore-top")?.scrollIntoView({ behavior: "smooth" });
        }
    };

    const handleNextPage = () => {
        if (lastLoadedPage < totalPages) {
            handlePageSelect(lastLoadedPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (startPage > 1) {
            handlePageSelect(Math.max(1, startPage - 7));
        }
    };

    const handleScrollToTop = () => {
        document.getElementById("explore-top")?.scrollIntoView({ behavior: "smooth" });
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "";
        try {
            return new Date(dateString).toLocaleDateString("fa-IR", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return "";
        }
    };

    return (
        <div className="min-w-0 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8" dir="rtl">

            {/* ── SEARCH & TOPIC FILTERS ────────────────────────────────── */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="جستجو در مقالات، تحلیل‌ها و اخبار ملکی..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pr-11 pl-24 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white focus:border-primary focus:outline-hidden transition-all placeholder:text-slate-400"
                        />
                        <button
                            type="submit"
                            className="absolute left-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-all"
                        >
                            جستجو
                        </button>
                    </form>

                    {/* View mode toggle */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl self-end sm:self-center">
                        <button
                            onClick={() => setViewMode("feed")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                                viewMode === "feed"
                                    ? "bg-white text-brand shadow-xs"
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            <List className="w-3.5 h-3.5" />
                            <span>فید</span>
                        </button>
                        <button
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                                viewMode === "grid"
                                    ? "bg-white text-brand shadow-xs"
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            <Grid className="w-3.5 h-3.5" />
                            <span>شبکه</span>
                        </button>
                    </div>
                </div>

                {/* Filter tags */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {TOPIC_TAGS.map((tag) => (
                        <button
                            key={tag.id}
                            onClick={() => setSelectedTag(tag.id)}
                            className={cn(
                                "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border",
                                selectedTag === tag.id
                                    ? "bg-primary text-white border-primary shadow-xs"
                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                            )}
                        >
                            {tag.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Anchor for top of explore */}
            <div id="explore-top" />

            {/* ── POSTS LIST ────────────────────────────────────────────── */}
            {isLoading ? (
                <div
                    className={cn(
                        viewMode === "grid"
                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                            : "space-y-5 max-w-3xl mx-auto"
                    )}
                >
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200" />
                                <div className="space-y-1.5 flex-1">
                                    <div className="w-24 h-3 bg-slate-200 rounded-md" />
                                    <div className="w-16 h-2 bg-slate-100 rounded-md" />
                                </div>
                            </div>
                            <div className="h-44 bg-slate-100 rounded-2xl" />
                            <div className="space-y-2">
                                <div className="w-3/4 h-4 bg-slate-200 rounded-md" />
                                <div className="w-full h-3 bg-slate-100 rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : isError ? (
                <div className="bg-white p-10 rounded-3xl border border-dashed border-red-200 text-center space-y-3">
                    <p className="text-sm font-bold text-red-500">خطا در بارگذاری محتوا. لطفاً اتصال اینترنت خود را بررسی نمایید.</p>
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all"
                    >
                        تلاش مجدد
                    </button>
                </div>
            ) : filteredPosts.length === 0 ? (
                <div className="bg-white p-12 sm:p-16 rounded-3xl border border-dashed border-slate-200 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-base sm:text-lg font-black text-slate-800">
                            {activeSearch ? "پستی با این عبارت یافت نشد" : "هنوز پستی در این بخش منتشر نشده است"}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                            شما به عنوان مشاور املاک یا مدیر دفتر می‌توانید اولین پست تخصصی این بخش را تولید و منتشر فرمایید.
                        </p>
                    </div>
                    <button
                        onClick={handleOpenCreateModal}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-all"
                    >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>انتشار اولین پست</span>
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div
                        className={cn(
                            viewMode === "grid"
                                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                                : "space-y-6 max-w-3xl mx-auto"
                        )}
                    >
                        {postsData?.pages.map((page, pageIndex) => {
                            const pagePosts = page.items.filter((post) => filterPostByTag(post, selectedTag));
                            if (pagePosts.length === 0 && pageIndex > 0) return null;

                            return (
                                <div key={`explore-page-${page.page}`} className="contents">
                                    {/* Section Header for page 2 onwards */}
                                    {pageIndex > 0 && (
                                        <PageSectionDivider
                                            id={`explore-page-section-${page.page}`}
                                            page={page.page}
                                            count={pagePosts.length}
                                            itemLabel="پست"
                                        />
                                    )}

                                    {pagePosts.map((post) => {
                                        const agency = post.agency;
                                        const agencySlugOrId = agency?.slug || agency?.id || post.agencyId;
                                        const coverImage = post.mediaUrls && post.mediaUrls.length > 0 ? getMediaUrl(post.mediaUrls[0]) : null;

                                        return (
                                            <article
                                                key={post.id}
                                                onClick={() => setReadingPost(post)}
                                                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer group"
                                            >
                                                {/* Post Author Header */}
                                                <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
                                                    <Link
                                                        href={`/agency/showcase/${encodeURIComponent(agencySlugOrId)}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex items-center gap-3 group/author"
                                                    >
                                                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                                            {agency?.logoUrl ? (
                                                                <Image
                                                                    src={getMediaUrl(agency.logoUrl)}
                                                                    alt={agency?.name || "لوگوی املاک"}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400">
                                                                    <Building2 className="w-5 h-5" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-bold text-sm text-slate-800 group-hover/author:text-primary transition-colors">
                                                                    {agency?.name || "صفحه مشاور املاک"}
                                                                </span>
                                                                {agency?.isVerified && (
                                                                    <Verified className="w-4 h-4 text-primary fill-primary/10 shrink-0" />
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                <span>{formatDate(post.createdAt)}</span>
                                                            </p>
                                                        </div>
                                                    </Link>

                                                    <button
                                                        onClick={(e) => handleShare(e, post)}
                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                                        title="اشتراک‌گذاری"
                                                    >
                                                        <Share2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Post Media Cover */}
                                                {coverImage ? (
                                                    <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                                                        <Image
                                                            src={coverImage}
                                                            alt={post.title}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="h-28 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center text-slate-300">
                                                        <Newspaper className="w-8 h-8" />
                                                    </div>
                                                )}

                                                {/* Post Content Snippet */}
                                                <div className="p-4 sm:p-5 space-y-2 flex-1 flex flex-col justify-between">
                                                    <div className="space-y-2">
                                                        <h2 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                                                            {post.title}
                                                        </h2>
                                                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                                                            {post.summary || post.content}
                                                        </p>
                                                    </div>

                                                    {/* Footer / Stats & CTA */}
                                                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={(e) => handleLike(e, post.id)}
                                                                className={cn(
                                                                    "flex items-center gap-1 transition-colors",
                                                                    post.hasLiked ? "text-red-500 font-bold" : "text-slate-500 hover:text-red-500"
                                                                )}
                                                                aria-label={post.hasLiked ? "حذف پسند" : "پسندیدن"}
                                                            >
                                                                <Heart className={cn(
                                                                    "w-4 h-4 transition-colors",
                                                                    post.hasLiked ? "text-red-500 fill-red-500" : "text-slate-400"
                                                                )} />
                                                                <span>{toPersianDigits(post.likeCount || 0)}</span>
                                                            </button>
                                                            <div className="flex items-center gap-1">
                                                                <Eye className="w-4 h-4 text-slate-400" />
                                                                <span>{toPersianDigits(post.viewCount || 0)}</span>
                                                            </div>
                                                        </div>

                                                        <span className="font-bold text-primary group-hover:underline flex items-center gap-0.5">
                                                            <span>مطالعه کامل</span>
                                                            <ChevronLeft className="w-3.5 h-3.5" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>

                    {/* Sentinel for infinite scroll (auto-loads up to 7 pages) */}
                    {hasNextPage && (postsData?.pages.length ?? 0) < 7 && (
                        <div ref={observerTargetRef} className="py-8 flex flex-col items-center justify-center gap-2">
                            {isFetchingNextPage ? (
                                <div className="flex items-center gap-2 text-xs font-bold text-secondary bg-white px-5 py-2.5 rounded-xl shadow-xs border border-slate-200">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    <span>در حال بارگذاری بخش بعدی پست‌ها...</span>
                                </div>
                            ) : (
                                <div className="h-6" />
                            )}
                        </div>
                    )}

                    {/* Pagination Controls at the End */}
                    {!isLoading && allLoadedPosts.length > 0 && totalPages > 1 && isBatchFinished && (
                        <PaginationControls
                            startPage={startPage}
                            lastLoadedPage={lastLoadedPage}
                            totalPages={totalPages}
                            totalCount={totalCount}
                            itemLabel="پست"
                            loadedPages={loadedPages}
                            onPageSelect={handlePageSelect}
                            onPrevPage={handlePrevPage}
                            onNextPage={handleNextPage}
                            onScrollToTop={handleScrollToTop}
                            className="max-w-3xl mx-auto"
                        />
                    )}
                </div>
            )}

            {/* ── MODAL: READ FULL POST ─────────────────────────────────── */}
            {readingPost && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
                    onClick={() => setReadingPost(null)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 relative border border-slate-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setReadingPost(null)}
                            className="absolute top-5 left-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Agency Author Header in Modal */}
                        <div className="flex items-center justify-between gap-4 pt-1">
                            <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                    {readingPost.agency?.logoUrl ? (
                                        <Image
                                            src={getMediaUrl(readingPost.agency.logoUrl)}
                                            alt={readingPost.agency?.name || ""}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                            <Building2 className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <h4 className="font-black text-slate-800 text-base">
                                            {readingPost.agency?.name || "صفحه مشاور املاک"}
                                        </h4>
                                        {readingPost.agency?.isVerified && (
                                            <Verified className="w-4 h-4 text-primary fill-primary/10" />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400">{formatDate(readingPost.createdAt)}</p>
                                </div>
                            </div>

                            <Link
                                href={`/agency/showcase/${encodeURIComponent(readingPost.agency?.slug || readingPost.agency?.id || readingPost.agencyId)}`}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-primary hover:text-white text-slate-700 text-xs font-bold transition-all"
                            >
                                مشاهده صفحه املاک
                            </Link>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                            {readingPost.title}
                        </h2>

                        {/* Summary callout */}
                        {readingPost.summary && (
                            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-blue-900 text-xs sm:text-sm font-medium leading-relaxed">
                                {readingPost.summary}
                            </div>
                        )}

                        {/* Media gallery */}
                        {readingPost.mediaUrls && readingPost.mediaUrls.length > 0 && (
                            <div className="space-y-3">
                                {readingPost.mediaUrls.map((url, i) => (
                                    <div key={i} className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                                        <Image
                                            src={getMediaUrl(url)}
                                            alt={`تصویر ${i + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Full Content */}
                        <div className="text-slate-700 text-sm sm:text-base leading-loose whitespace-pre-line font-normal space-y-3">
                            {readingPost.content}
                        </div>

                        {/* Stats & Actions */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={(e) => handleLike(e, readingPost.id)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all active:scale-95",
                                        readingPost.hasLiked
                                            ? "bg-red-500 text-white shadow-xs"
                                            : "bg-red-50 text-red-600 hover:bg-red-100"
                                    )}
                                    aria-label={readingPost.hasLiked ? "حذف پسند" : "پسندیدن"}
                                >
                                    <Heart className={cn("w-4 h-4", readingPost.hasLiked ? "fill-white text-white" : "fill-red-500 text-red-500")} />
                                    <span>{toPersianDigits(readingPost.likeCount || 0)} پسند</span>
                                </button>
                                <span className="flex items-center gap-1 text-slate-400">
                                    <Eye className="w-4 h-4" />
                                    <span>{toPersianDigits(readingPost.viewCount || 0)} بازدید</span>
                                </span>
                            </div>

                            <button
                                onClick={(e) => handleShare(e, readingPost)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
                            >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>اشتراک‌گذاری</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: CREATE NEW POST ────────────────────────────────── */}
            {isCreateModalOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
                    onClick={() => setIsCreateModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl relative border border-slate-200 my-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute top-5 left-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 text-primary text-xs font-bold">
                                <PenTool className="w-3.5 h-3.5" />
                                <span>تولید محتوا و انتشار پست</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900">
                                انتشار پست در فید کاوش
                            </h3>
                            <p className="text-xs text-slate-400">
                                این محتوا با نام دفتر املاک شما در صفحه کاوش و ویترین اختصاصی‌تان نمایش داده خواهد شد.
                            </p>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (!postTitle.trim() || !postContent.trim()) {
                                    toast.error("عنوان و متن کامل پست الزامی است.");
                                    return;
                                }
                                createPostMutation.mutate();
                            }}
                            className="space-y-4"
                        >
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">عنوان پست *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="مثال: ۵ نکته طلایی برای خرید خانه در سال جدید"
                                    value={postTitle}
                                    onChange={(e) => setPostTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-primary focus:outline-hidden"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">خلاصه / چکیده (اختیاری)</label>
                                <input
                                    type="text"
                                    placeholder="توضیح کوتاه یک خطی از محتوای مقاله..."
                                    value={postSummary}
                                    onChange={(e) => setPostSummary(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-primary focus:outline-hidden"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <MediaGalleryUpload
                                    label="تصاویر پست (اختیاری)"
                                    helperText="تصاویر مورد نظر برای مقاله یا تحلیل را انتخاب و بارگذاری کنید"
                                    value={postMediaIds}
                                    onChange={setPostMediaIds}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">متن کامل محتوا *</label>
                                <textarea
                                    required
                                    rows={6}
                                    placeholder="متن کامل تحلیل، گزارش، راهنما یا خبر ملکی خود را بنویسید..."
                                    value={postContent}
                                    onChange={(e) => setPostContent(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-primary focus:outline-hidden resize-none leading-relaxed"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-all"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    disabled={createPostMutation.isPending}
                                    className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                                >
                                    {createPostMutation.isPending ? "در حال انتشار..." : "انتشار پست"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
