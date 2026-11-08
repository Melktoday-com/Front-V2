"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAdminPosts,
  useUpdatePost,
  useDeletePost,
} from "@/hooks/usePosts";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { useDebounce } from "@/hooks/useDebounce";
import { PublisherType, UnifiedPost } from "@/types/api/post.types";
import { Button } from "@/components/ui/Button";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  Globe,
  Heart,
  Home,
  Loader2,
  Newspaper,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { toPersianDigits, getMediaPosterUrl, cn } from "@/lib/utils";

type PublisherFilterType = "ALL" | PublisherType;
type StatusFilterType = "all" | "published" | "draft";

export default function AdminPostsScene() {
  const router = useRouter();
  const { isSuperAdmin, hasPermission } = useAdminPermissions();

  const canCreatePost = isSuperAdmin || hasPermission("posts.create");
  const canEditPost = isSuperAdmin || hasPermission("posts.edit");
  const canDeletePost = isSuperAdmin || hasPermission("posts.delete");

  // Filters & Pagination State
  const [publisherFilter, setPublisherFilter] = useState<PublisherFilterType>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [page, setPage] = useState(1);
  const [togglingPostId, setTogglingPostId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const isPublishedParam =
    statusFilter === "published" ? true : statusFilter === "draft" ? false : undefined;
  const publisherTypeParam = publisherFilter === "ALL" ? undefined : publisherFilter;

  // Fetch admin posts with combined filters
  const {
    data: postsData,
    isLoading: isPostsLoading,
    refetch: refetchPosts,
  } = useAdminPosts({
    publisherType: publisherTypeParam,
    isPublished: isPublishedParam,
    search: debouncedSearch.trim() || undefined,
    page,
    limit: 12,
  });

  const updatePostMutation = useUpdatePost();
  const deletePostMutation = useDeletePost();



  const handleTogglePublish = (post: UnifiedPost) => {
    if (!canEditPost) {
      toast.error("شما مجوز ویرایش پست را ندارید.");
      return;
    }
    setTogglingPostId(post.id);
    updatePostMutation.mutate(
      { id: post.id, data: { isPublished: !post.isPublished } },
      {
        onSuccess: () => {
          toast.success(
            post.isPublished
              ? "مطلب به حالت پیش‌نویس درآمد."
              : "مطلب با موفقیت منتشر شد."
          );
          setTogglingPostId(null);
          refetchPosts();
        },
        onError: () => {
          toast.error("خطا در تغییر وضعیت انتشار مطلب.");
          setTogglingPostId(null);
        },
      }
    );
  };

  const [postToDelete, setPostToDelete] = useState<UnifiedPost | null>(null);

  const handleDeletePost = (post: UnifiedPost) => {
    if (!canDeletePost) {
      toast.error("شما مجوز حذف پست را ندارید.");
      return;
    }
    setPostToDelete(post);
  };

  const handleConfirmDelete = () => {
    if (!postToDelete) return;
    setDeletingPostId(postToDelete.id);
    deletePostMutation.mutate(postToDelete.id, {
      onSuccess: () => {
        toast.success("مطلب با موفقیت حذف شد.");
        setDeletingPostId(null);
        setPostToDelete(null);
        refetchPosts();
      },
      onError: () => {
        toast.error("خطا در حذف مطلب.");
        setDeletingPostId(null);
        setPostToDelete(null);
      },
    });
  };

  const renderPublisherBadge = (post: UnifiedPost) => {
    const pubType = post.publisherType || (post.agencyId ? PublisherType.AGENCY : PublisherType.PLATFORM);
    const pub = post.publisher || post.agency;

    if (pubType === PublisherType.PLATFORM) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
          <Globe className="w-3.5 h-3.5 text-blue-600" />
          <span>پلتفرم ملک‌تودی</span>
        </span>
      );
    }

    if (pubType === PublisherType.AGENCY) {
      return (
        <a
          href={pub?.slug ? `/agency/${pub.slug}` : `/agency/${post.publisherId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 transition-colors"
          title="مشاهده پروفایل آژانس"
          onClick={(e) => e.stopPropagation()}
        >
          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>آژانس: {pub?.name || "مشاور املاک"}</span>
        </a>
      );
    }

    if (pubType === PublisherType.HOST) {
      return (
        <a
          href={pub?.slug ? `/host/${pub.slug}` : `/host/${post.publisherId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200/80 hover:bg-purple-100 transition-colors"
          title="مشاهده پروفایل میزبان"
          onClick={(e) => e.stopPropagation()}
        >
          <Home className="w-3.5 h-3.5 text-purple-600" />
          <span>میزبان: {pub?.name || "اقامتگاه"}</span>
        </a>
      );
    }

    return null;
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-soft-border pb-6">
        <div>
          <h1 className="text-2xl font-black text-brand flex items-center gap-2.5">
            <Newspaper className="w-7 h-7 text-primary" />
            مدیریت پست‌ها و مقالات همه ناشران
          </h1>
          <p className="text-xs text-secondary font-medium mt-1">
            مشاهده، فیلتر، بررسی پیش‌نویس‌ها، ویرایش و مدیریت انتشار مقالات تولید شده توسط پلتفرم، آژانس‌ها و میزبانان
          </p>
        </div>
        {canCreatePost && (
          <Button
            onClick={() => router.push("/posts/create")}
            className="rounded-2xl gap-2 font-black text-xs shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            ارسال مطلب جدید
          </Button>
        )}
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-surface rounded-3xl p-5 sm:p-6 border border-soft-border shadow-xs space-y-4">
        {/* Publisher Type Tabs */}
        <div>
          <span className="text-xs font-bold text-secondary mb-2 block">فیلتر بر اساس نوع ناشر:</span>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "ALL", label: "همه ناشران", icon: Filter },
              { id: PublisherType.PLATFORM, label: "پلتفرم رسمی", icon: Globe },
              { id: PublisherType.AGENCY, label: "آژانس‌های املاک", icon: Building2 },
              { id: PublisherType.HOST, label: "میزبانان اقامتگاه", icon: Home },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = publisherFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setPublisherFilter(tab.id as PublisherFilterType);
                    setPage(1);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer border",
                    isActive
                      ? "bg-brand text-white border-brand shadow-sm"
                      : "bg-soft-bg text-secondary border-soft-border hover:text-brand hover:bg-slate-100"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Row: Status tabs & Search Input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-soft-border/70">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-soft-bg rounded-2xl border border-soft-border/60">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setPage(1);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                statusFilter === "all"
                  ? "bg-surface text-brand shadow-sm"
                  : "text-secondary hover:text-brand"
              )}
            >
              همه ({toPersianDigits(postsData?.total || 0)})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("published");
                setPage(1);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                statusFilter === "published"
                  ? "bg-surface text-success shadow-sm"
                  : "text-secondary hover:text-success"
              )}
            >
              منتشر شده
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("draft");
                setPage(1);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                statusFilter === "draft"
                  ? "bg-surface text-warning shadow-sm"
                  : "text-secondary hover:text-warning"
              )}
            >
              پیش‌نویس
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary/60" />
            <input
              type="text"
              placeholder="جستجو در عنوان یا متن مطالب..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pr-10 pl-8 py-2 border border-soft-border rounded-xl bg-soft-bg text-xs font-bold text-brand focus:bg-surface outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-brand cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Posts List Section */}
      <div className="bg-surface rounded-3xl p-5 sm:p-8 border border-soft-border shadow-xs space-y-4">
        {isPostsLoading ? (
          <div className="p-14 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs font-bold text-secondary">در حال دریافت فهرست مطالب...</span>
          </div>
        ) : !postsData?.items || postsData.items.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-soft-border bg-soft-bg/50">
            <Newspaper className="w-12 h-12 text-secondary/40 mx-auto mb-3" />
            <p className="text-sm font-bold text-secondary">
              {searchQuery || statusFilter !== "all" || publisherFilter !== "ALL"
                ? "هیچ پستی مطابق فیلترهای انتخابی پیدا نشد."
                : "هیچ پستی در سیستم ثبت نشده است."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {postsData.items.map((post) => (
              <div
                key={post.id}
                className="p-4 sm:p-5 rounded-2xl border border-soft-border hover:bg-soft-bg/50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
              >
                {/* Post details */}
                <div className="flex items-start gap-4 min-w-0">
                  {/* Thumbnail */}
                  {(() => {
                    const firstMedia = post.mediaIds?.[0];
                    if (firstMedia) {
                      return (
                        <img
                          src={getMediaPosterUrl(firstMedia)}
                          alt={post.title}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-soft-border shrink-0 bg-slate-100"
                        />
                      );
                    }
                    return (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-soft-bg border border-soft-border flex items-center justify-center text-secondary shrink-0">
                        <Newspaper className="w-7 h-7 text-secondary/40" />
                      </div>
                    );
                  })()}

                  <div className="min-w-0 flex-1 space-y-1.5">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2">
                      {renderPublisherBadge(post)}

                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {post.category || "عمومی"}
                      </span>

                      {post.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success bg-success-subtle px-2 py-0.5 rounded-md border border-success/30">
                          <CheckCircle2 className="w-3 h-3" />
                          منتشر شده
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-warning bg-warning-subtle px-2 py-0.5 rounded-md border border-warning/30">
                          <Clock className="w-3 h-3" />
                          پیش‌نویس
                        </span>
                      )}

                      {post.isFeatured && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          <Sparkles className="w-3 h-3" />
                          ویژه
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-black text-brand text-sm sm:text-base line-clamp-1">
                      {post.title}
                    </h3>

                    {/* Summary */}
                    {post.summary && (
                      <p className="text-xs text-secondary line-clamp-1 font-medium">
                        {post.summary}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="text-[11px] text-secondary font-medium flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-secondary/60" />
                        {new Date(post.createdAt).toLocaleDateString("fa-IR")}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3 h-3 text-secondary/60" />
                        {toPersianDigits(post.viewCount || 0)} بازدید
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Heart className="w-3 h-3 text-secondary/60" />
                        {toPersianDigits(post.likeCount || 0)} پسند
                      </span>
                      {post.slug && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md" dir="ltr">
                          /{post.slug}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-2 md:pt-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/posts/${post.slug || post.id}`, "_blank")}
                    className="h-8 px-2.5 rounded-xl text-xs gap-1.5 font-bold"
                    title="مشاهده صفحه عمومی مطلب"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>مشاهده</span>
                  </Button>

                  {canEditPost && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/posts/create?edit=${post.id}`)}
                        className="h-8 px-2.5 rounded-xl text-xs gap-1.5 font-bold hover:bg-primary/10 hover:text-primary transition-colors"
                        title="ویرایش مطلب"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>ویرایش</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={togglingPostId === post.id}
                        onClick={() => handleTogglePublish(post)}
                        className={cn(
                          "h-8 px-2.5 rounded-xl text-xs gap-1.5 font-bold transition-colors",
                          post.isPublished
                            ? "hover:bg-warning-subtle hover:text-warning hover:border-amber-300"
                            : "hover:bg-success-subtle hover:text-success hover:border-emerald-300"
                        )}
                        title={post.isPublished ? "تبدیل به پیش‌نویس" : "انتشار فوری"}
                      >
                        {togglingPostId === post.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : post.isPublished ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-warning" />
                            <span>پیش‌نویس</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                            <span>انتشار</span>
                          </>
                        )}
                      </Button>
                    </>
                  )}

                  {canDeletePost && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={deletingPostId === post.id}
                      onClick={() => handleDeletePost(post)}
                      className="h-8 px-2.5 rounded-xl text-xs gap-1.5 font-bold text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
                      title="حذف دائمی مطلب"
                    >
                      {deletingPostId === post.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {postsData && postsData.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-soft-border">
            <span className="text-xs text-secondary font-medium">
              صفحه {toPersianDigits(page)} از {toPersianDigits(postsData.totalPages)} (مجموع: {toPersianDigits(postsData.total)} مطلب)
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 rounded-xl text-xs gap-1 font-bold"
              >
                <ChevronRight className="w-4 h-4" />
                <span>قبلی</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= postsData.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 rounded-xl text-xs gap-1 font-bold"
              >
                <span>بعدی</span>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>



      {/* Delete Post Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(postToDelete)}
        onClose={() => setPostToDelete(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deletePostMutation.isPending}
        title="حذف مطلب"
        description={
          postToDelete?.title
            ? `آیا از حذف مطلب «${postToDelete.title}» اطمینان دارید؟ این عمل غیرقابل بازگشت است.`
            : "آیا از حذف این مطلب اطمینان دارید؟ این عمل غیرقابل بازگشت است."
        }
      />
    </div>
  );
}
