"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  usePlatformProfile,
  useUpdatePlatformProfile,
  useShowcasePosts,
} from "@/hooks/useShowcase";
import { Button } from "@/components/ui/Button";
import {
  Calendar,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { toPersianDigits, getMediaUrl } from "@/lib/utils";

export default function AdminPlatformScene() {
  const router = useRouter();
  const { data: profile, isLoading } = usePlatformProfile();
  const updateProfileMutation = useUpdatePlatformProfile();
  const { data: postsData, refetch: refetchPosts } = useShowcasePosts("platform", "melktoday");

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-brand flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              پست‌ها و اطلاعیه‌های رسمی پلتفرم
            </h2>
            <p className="text-xs text-secondary mt-1">
              مدیریت و انتشار مطالب رسمی، گزارش‌های تحلیلی و اخبار در استودیو پیشرفته
            </p>
          </div>
          <Button
            onClick={() => router.push("/posts/create")}
            className="rounded-2xl gap-2 font-black text-xs shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            ایجاد پست در استودیو محتوا
          </Button>
        </div>

        {/* Existing Posts Table */}
        <div className="space-y-3">
          {postsData?.items?.length === 0 ? (
            <p className="text-center py-10 text-xs font-bold text-secondary">
              هنوز پستی برای پلتفرم رسمی منتشر نشده است.
            </p>
          ) : (
            postsData?.items?.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-2xl border border-soft-border hover:bg-soft-bg flex items-center justify-between gap-4 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {post.mediaUrls?.[0] && (
                    <img
                      src={getMediaUrl(post.mediaUrls[0])}
                      alt={post.title}
                      className="w-14 h-14 rounded-xl object-cover border border-soft-border flex-shrink-0"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {post.category || "اطلاعیه"}
                      </span>
                      <h4 className="font-black text-brand text-sm">{post.title}</h4>
                    </div>
                    <div className="text-[11px] text-secondary font-medium mt-1 flex items-center gap-4">
                      <span>تاریخ: {new Date(post.createdAt).toLocaleDateString("fa-IR")}</span>
                      <span>بازدید: {toPersianDigits(post.viewCount || 0)}</span>
                      <span>لایک: {toPersianDigits(post.likeCount || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
