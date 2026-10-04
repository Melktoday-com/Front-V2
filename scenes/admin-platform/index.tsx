"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  usePlatformProfile,
  useUpdatePlatformProfile,
} from "@/hooks/useShowcase";
import {
  useAdminPosts,
  useUpdatePost,
  useDeletePost,
} from "@/hooks/usePosts";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { useDebounce } from "@/hooks/useDebounce";
import { UnifiedPost } from "@/types/api/post.types";
import { Button } from "@/components/ui/Button";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { toPersianDigits, getMediaUrl, getMediaPosterUrl, cn } from "@/lib/utils";

export default function AdminPlatformScene() {
  const router = useRouter();
  const { data: profile, isLoading } = usePlatformProfile();
  const updateProfileMutation = useUpdatePlatformProfile();
  const { isSuperAdmin, hasPermission } = useAdminPermissions();

  const canCreatePost = isSuperAdmin || hasPermission("posts.create");
  const canEditPost = isSuperAdmin || hasPermission("posts.edit");
  const canDeletePost = isSuperAdmin || hasPermission("posts.delete");

  // Post management state
  const [postSearch, setPostSearch] = useState("");
  const debouncedPostSearch = useDebounce(postSearch, 400);
  const [postStatusFilter, setPostStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [postPage, setPostPage] = useState(1);
  const [togglingPostId, setTogglingPostId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const isPublishedParam =
    postStatusFilter === "published" ? true : postStatusFilter === "draft" ? false : undefined;

  const {
    data: postsData,
    isLoading: isPostsLoading,
    refetch: refetchPosts,
  } = useAdminPosts({
    search: debouncedPostSearch.trim() || undefined,
    isPublished: isPublishedParam,
    page: postPage,
    limit: 10,
  });

  const updatePostMutation = useUpdatePost();
  const deletePostMutation = useDeletePost();

  // Profile Form state
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [telegram, setTelegram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    if (profile) {
      setTitle(profile.title || "");
      setSubtitle(profile.subtitle || "");
      setDescription(profile.description || "");
      setPhone(profile.phone || "");
      setEmail(profile.email || "");
      setAddress(profile.address || "");
      setWebsite(profile.website || "");
      setInstagram(profile.instagram || "");
      setTelegram(profile.telegram || "");
      setWhatsapp(profile.whatsapp || "");
    }
  }, [profile]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      title,
      subtitle,
      description,
      phone,
      email,
      address,
      website,
      instagram,
      telegram,
      whatsapp,
    });
  };

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
            post.isPublished ? "پست با موفقیت به حالت پیش‌نویس درآمد." : "پست با موفقیت منتشر شد."
          );
          setTogglingPostId(null);
        },
        onError: () => {
          toast.error("خطا در تغییر وضعیت انتشار پست");
          setTogglingPostId(null);
        },
      }
    );
  };

  const handleDeletePost = (post: UnifiedPost) => {
    if (!canDeletePost) {
      toast.error("شما مجوز حذف پست را ندارید.");
      return;
    }
    if (confirm(`آیا از حذف پست "${post.title}" اطمینان دارید؟ این عمل غیرقابل بازگشت است.`)) {
      setDeletingPostId(post.id);
      deletePostMutation.mutate(post.id, {
        onSuccess: () => {
          toast.success("پست با موفقیت حذف شد.");
          setDeletingPostId(null);
        },
        onError: () => {
          toast.error("خطا در حذف پست");
          setDeletingPostId(null);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-10 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-soft-border pb-6">
        <div>
          <h1 className="text-2xl font-black text-brand">مدیریت صفحه رسمی پلتفرم</h1>
          <p className="text-xs text-secondary font-medium mt-1">
            ویرایش شناسنامه، لینک‌های شبکه‌های اجتماعی و انتشار پست‌های رسمی ملک‌تودی
          </p>
        </div>
        <Button
          onClick={() => window.open("/platform", "_blank")}
          variant="outline"
          className="rounded-2xl gap-2 font-bold text-xs"
        >
          <Globe className="w-4 h-4" />
          مشاهده صفحه عمومی پلتفرم
        </Button>
      </div>

      {/* Profile & Social Settings Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-soft-border shadow-sm space-y-6">
        <h2 className="text-base font-black text-brand flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          مشخصات و شبکه‌های اجتماعی رسمی
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand mb-1.5">عنوان رسمی پلتفرم</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3.5 border border-soft-border rounded-xl bg-soft-bg text-sm font-bold text-brand focus:bg-white outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand mb-1.5">زیرعنوان / شعار</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full p-3.5 border border-soft-border rounded-xl bg-soft-bg text-sm font-bold text-brand focus:bg-white outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand mb-1.5">درباره پلتفرم و بیانیه ماموریت</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 border border-soft-border rounded-xl bg-soft-bg text-sm font-medium text-brand focus:bg-white outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-brand mb-1.5">تلفن پشتیبانی</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                className="w-full p-3.5 border border-soft-border rounded-xl bg-soft-bg text-sm font-bold text-brand focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand mb-1.5">ایمیل رسمی</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                className="w-full p-3.5 border border-soft-border rounded-xl bg-soft-bg text-sm font-bold text-brand focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand mb-1.5">وب‌سایت</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                dir="ltr"
                className="w-full p-3.5 border border-soft-border rounded-xl bg-soft-bg text-sm font-bold text-brand focus:bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand mb-1.5">نشانی دفتر مرکزی</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-3.5 border border-soft-border rounded-xl bg-soft-bg text-sm font-bold text-brand focus:bg-white outline-none"
            />
          </div>

          {/* Social Links */}
          <div className="pt-4 border-t border-soft-border space-y-4">
            <h3 className="text-xs font-black text-secondary">لینک‌های شبکه‌های اجتماعی پلتفرم</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-pink-600 mb-1">اینستاگرام رسمی</label>
                <input
                  type="text"
                  placeholder="https://instagram.com/..."
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  dir="ltr"
                  className="w-full p-3 border border-soft-border rounded-xl bg-soft-bg text-xs font-bold text-brand focus:bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-sky-600 mb-1">کانال تلگرام</label>
                <input
                  type="text"
                  placeholder="https://t.me/..."
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  dir="ltr"
                  className="w-full p-3 border border-soft-border rounded-xl bg-soft-bg text-xs font-bold text-brand focus:bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-emerald-600 mb-1">واتساپ پشتیبانی</label>
                <input
                  type="text"
                  placeholder="https://wa.me/..."
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  dir="ltr"
                  className="w-full p-3 border border-soft-border rounded-xl bg-soft-bg text-xs font-bold text-brand focus:bg-white outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-8 rounded-2xl font-black text-xs"
            >
              {updateProfileMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات شناسنامه پلتفرم"}
            </Button>
          </div>
        </form>
      </div>

      {/* Posts Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-soft-border shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-brand flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              پست‌ها و اطلاعیه‌های رسمی پلتفرم
            </h2>
            <p className="text-xs text-secondary mt-1">
              مدیریت، بررسی پیش‌نویس‌ها و انتشار مطالب رسمی، مقالات تحلیلی و اخبار در استودیو محتوا
            </p>
          </div>
          {canCreatePost && (
            <Button
              onClick={() => router.push("/posts/create")}
              className="rounded-2xl gap-2 font-black text-xs shadow-md shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              ایجاد پست در استودیو محتوا
            </Button>
          )}
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-soft-bg rounded-2xl border border-soft-border/60">
            <button
              type="button"
              onClick={() => {
                setPostStatusFilter("all");
                setPostPage(1);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors",
                postStatusFilter === "all"
                  ? "bg-white text-brand shadow-sm"
                  : "text-secondary hover:text-brand"
              )}
            >
              همه ({toPersianDigits(postsData?.total || 0)})
            </button>
            <button
              type="button"
              onClick={() => {
                setPostStatusFilter("published");
                setPostPage(1);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors",
                postStatusFilter === "published"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-secondary hover:text-emerald-700"
              )}
            >
              منتشر شده
            </button>
            <button
              type="button"
              onClick={() => {
                setPostStatusFilter("draft");
                setPostPage(1);
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors",
                postStatusFilter === "draft"
                  ? "bg-white text-amber-700 shadow-sm"
                  : "text-secondary hover:text-amber-700"
              )}
            >
              پیش‌نویس
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary/60" />
            <input
              type="text"
              placeholder="جستجو در عنوان مطالب..."
              value={postSearch}
              onChange={(e) => {
                setPostSearch(e.target.value);
                setPostPage(1);
              }}
              className="w-full pr-10 pl-8 py-2 border border-soft-border rounded-xl bg-soft-bg text-xs font-bold text-brand focus:bg-white outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {postSearch && (
              <button
                type="button"
                onClick={() => {
                  setPostSearch("");
                  setPostPage(1);
                }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-brand"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Existing Posts Table */}
        <div className="space-y-3 pt-2">
          {isPostsLoading ? (
            <div className="p-10 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <span className="text-xs font-bold text-secondary">در حال دریافت پست‌ها...</span>
            </div>
          ) : !postsData?.items || postsData.items.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-soft-border bg-soft-bg/50">
              <Calendar className="w-10 h-10 text-secondary/40 mx-auto mb-2" />
              <p className="text-xs font-bold text-secondary">
                {postSearch || postStatusFilter !== "all"
                  ? "هیچ پستی مطابق فیلتر انتخابی یافت نشد."
                  : "هنوز پستی برای پلتفرم رسمی ثبت نشده است."}
              </p>
            </div>
          ) : (
            postsData.items.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-2xl border border-soft-border hover:bg-soft-bg/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {(() => {
                    const firstMedia = post.mediaIds?.[0] || post.mediaUrls?.[0];
                    if (firstMedia) {
                      return (
                        <img
                          src={getMediaPosterUrl(firstMedia)}
                          alt={post.title}
                          className="w-16 h-16 rounded-xl object-cover border border-soft-border flex-shrink-0"
                        />
                      );
                    }
                    return (
                      <div className="w-16 h-16 rounded-xl bg-soft-bg border border-soft-border flex items-center justify-center text-secondary flex-shrink-0">
                        <Calendar className="w-6 h-6 text-secondary/40" />
                      </div>
                    );
                  })()}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {post.category || "اطلاعیه"}
                      </span>
                      {post.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          منتشر شده
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
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
                    <h4 className="font-black text-brand text-sm line-clamp-1">{post.title}</h4>
                    <div className="text-[11px] text-secondary font-medium mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>تاریخ: {new Date(post.createdAt).toLocaleDateString("fa-IR")}</span>
                      <span>بازدید: {toPersianDigits(post.viewCount || 0)}</span>
                      <span>لایک: {toPersianDigits(post.likeCount || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={togglingPostId === post.id}
                      onClick={() => handleTogglePublish(post)}
                      className={cn(
                        "h-8 px-2.5 rounded-xl text-xs gap-1.5 font-bold transition-colors",
                        post.isPublished
                          ? "hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300"
                          : "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                      )}
                      title={post.isPublished ? "تبدیل به پیش‌نویس" : "انتشار فوری"}
                    >
                      {togglingPostId === post.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : post.isPublished ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                          <span>پیش‌نویس شود</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          <span>انتشار</span>
                        </>
                      )}
                    </Button>
                  )}

                  {canDeletePost && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={deletingPostId === post.id}
                      onClick={() => handleDeletePost(post)}
                      className="h-8 px-2.5 rounded-xl text-xs gap-1.5 font-bold text-red-600 border-red-200 hover:bg-red-50 transition-colors"
                      title="حذف دائمی پست"
                    >
                      {deletingPostId === post.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">حذف</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {postsData && postsData.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-soft-border">
            <span className="text-xs text-secondary font-medium">
              صفحه {toPersianDigits(postPage)} از {toPersianDigits(postsData.totalPages)}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={postPage <= 1}
                onClick={() => setPostPage((p) => Math.max(1, p - 1))}
                className="h-8 rounded-xl text-xs gap-1 font-bold"
              >
                <ChevronRight className="w-4 h-4" />
                <span>قبلی</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={postPage >= postsData.totalPages}
                onClick={() => setPostPage((p) => p + 1)}
                className="h-8 rounded-xl text-xs gap-1 font-bold"
              >
                <span>بعدی</span>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
