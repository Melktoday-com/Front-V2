"use client";

import React, { useRef, useState, useMemo } from "react";
import { useUploadMedia } from "@/hooks/useMedia";
import { getMediaUrl, toPersianDigits, cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import {
  BookOpen,
  UploadCloud,
  FileCode,
  ImagePlus,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Code,
  Minus,
  Link2,
  Table,
  Eye,
  Edit3,
  Columns,
  Feather,
  Loader2,
  X,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
  Hotel,
  ShieldCheck,
  Verified,
  Share2,
  Bookmark,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { PublisherType } from "@/types/api/post.types";

interface PublisherInfo {
  type: PublisherType;
  id: string;
  name: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

interface MediumPostEditorProps {
  publisher: PublisherInfo;
  title: string;
  setTitle: (v: string) => void;
  summary: string;
  setSummary: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  slug: string;
  setSlug: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  featuredImageUrl: string;
  setFeaturedImageUrl: (v: string) => void;
}

const MEDIUM_CATEGORIES = [
  "تحلیل بازار مسکن",
  "راهنمای خرید و فروش",
  "رهن و اجاره خانه",
  "نکات حقوقی و قراردادها",
  "فرصت‌های سرمایه‌گذاری",
  "معماری و دکوراسیون",
  "اخبار و قوانین ملکی",
  "راهنمای گردشگری و اقامت",
];

export function MediumPostEditor({
  publisher,
  title,
  setTitle,
  summary,
  setSummary,
  content,
  setContent,
  slug,
  setSlug,
  category,
  setCategory,
  featuredImageUrl,
  setFeaturedImageUrl,
}: MediumPostEditorProps) {
  const [editorTab, setEditorTab] = useState<"edit" | "preview" | "split">("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mdFileInputRef = useRef<HTMLInputElement>(null);
  const inlineImageInputRef = useRef<HTMLInputElement>(null);
  const featuredImageInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: uploadMedia, isPending: isUploading } = useUploadMedia();
  const [isInsertingInlineImage, setIsInsertingInlineImage] = useState(false);

  // Calculate estimated reading time & word count (Persian reading speed ~ 180 words/min)
  const readingStats = useMemo(() => {
    if (!content) return { words: 0, minutes: 1 };
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 180));
    return { words, minutes };
  }, [content]);

  // Insert markdown helper at cursor position
  const insertTextAtCursor = (prefix: string, suffix: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent(`${content}\n${prefix}${placeholder}${suffix}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end) || placeholder;
    const replacement = `${prefix}${selected}${suffix}`;

    const newContent =
      textarea.value.substring(0, start) +
      replacement +
      textarea.value.substring(end);

    setContent(newContent);

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      );
    }, 0);
  };

  // Handle Markdown file upload (.md / .markdown)
  const handleMarkdownFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown") && !file.name.endsWith(".txt")) {
      toast.error("لطفاً یک فایل با پسوند .md یا .markdown انتخاب کنید.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      // Simple frontmatter parsing if exists (e.g. --- title: ... ---)
      let bodyText = text;
      const frontmatterMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
      if (frontmatterMatch) {
        const fm = frontmatterMatch[1];
        bodyText = frontmatterMatch[2];

        // Try extracting title:
        const titleMatch = fm.match(/title:\s*["']?(.*?)["']?$/m);
        if (titleMatch && titleMatch[1]) {
          setTitle(titleMatch[1]);
        }

        // Try extracting summary / description:
        const descMatch = fm.match(/(summary|description):\s*["']?(.*?)["']?$/m);
        if (descMatch && descMatch[2]) {
          setSummary(descMatch[2]);
        }
      } else {
        // If first line starts with # Title, set it as title if empty
        const firstLineMatch = bodyText.match(/^#\s+(.+)$/m);
        if (firstLineMatch && firstLineMatch[1] && !title.trim()) {
          setTitle(firstLineMatch[1]);
          // Remove the first H1 from body to avoid duplication with article title
          bodyText = bodyText.replace(/^#\s+.+\r?\n?/, "");
        }
      }

      setContent(bodyText.trim());
      toast.success(`فایل ${file.name} با موفقیت بارگذاری شد.`);
    };

    reader.onerror = () => {
      toast.error("خطا در خواندن فایل مارک‌داون.");
    };

    reader.readAsText(file, "UTF-8");

    if (mdFileInputRef.current) {
      mdFileInputRef.current.value = "";
    }
  };

  // Handle Upload of Featured Image
  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("حجم تصویر شاخص نباید بیشتر از ۱۰ مگابایت باشد.");
      return;
    }

    try {
      const result = await uploadMedia(file);
      const mediaId = result?.mediaId ?? result?.id;
      if (mediaId) {
        setFeaturedImageUrl(mediaId);
        toast.success("تصویر شاخص با موفقیت بارگذاری شد.");
      }
    } catch {
      toast.error("خطا در آپلود تصویر شاخص.");
    }

    if (featuredImageInputRef.current) {
      featuredImageInputRef.current.value = "";
    }
  };

  // Handle Upload of Inline Image and insert ![alt](url)
  const handleInlineImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد.");
      return;
    }

    setIsInsertingInlineImage(true);
    try {
      const result = await uploadMedia(file);
      const mediaId = result?.mediaId ?? result?.id;
      if (mediaId) {
        const altText = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        const imageMarkdown = `\n\n![${altText}](${mediaId})\n\n`;
        insertTextAtCursor(imageMarkdown);
        toast.success("تصویر به متن اضافه شد.");
      }
    } catch {
      toast.error("خطا در آپلود تصویر بین متنی.");
    } finally {
      setIsInsertingInlineImage(false);
    }

    if (inlineImageInputRef.current) {
      inlineImageInputRef.current.value = "";
    }
  };

  // Auto slug generator helper
  const handleAutoSlug = () => {
    if (!title.trim()) {
      toast.info("ابتدا عنوان مقاله را وارد کنید.");
      return;
    }
    const generated = title
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);

    if (generated) {
      setSlug(generated);
      toast.success("نامک بر اساس عنوان تولید شد.");
    } else {
      setSlug("article-" + Math.floor(Math.random() * 10000));
    }
  };

  return (
    <div className="space-y-8">
      {/* ── HEADER BANNER: MEDIUM STYLE GUIDE ──────────────────────── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-success/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">
              قالب مقاله و گزارش جامع (مشابه مدیوم و ویرگول)
            </h3>
            <p className="text-xs text-foreground-secondary mt-0.5 leading-relaxed">
              با یک تصویر شاخص، پشتیبانی کامل از فایل‌های Markdown، تیتربندی‌های استاندارد و امکان درج تصاویر نامحدود بین متن.
            </p>
          </div>
        </div>

        {/* Action: Import Markdown File */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <input
            ref={mdFileInputRef}
            type="file"
            accept=".md,.markdown,.txt"
            className="hidden"
            onChange={handleMarkdownFileUpload}
          />
          <button
            type="button"
            onClick={() => mdFileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-surface hover:bg-surface-secondary text-foreground border border-border-subtle text-xs font-bold shadow-xs hover:border-emerald-500 transition-all w-full sm:w-auto"
          >
            <UploadCloud className="w-4 h-4 text-success" />
            <span>بارگذاری فایل مارک‌داون (.md)</span>
          </button>
        </div>
      </div>

      {/* ── SECTION 1: FEATURED IMAGE (تصویر شاخص) ─────────────────── */}
      <div className="bg-surface p-5 sm:p-6 rounded-3xl border border-border-subtle/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-foreground flex items-center gap-1.5">
            <span>تصویر شاخص مقاله (Featured Cover)</span>
            <span className="text-error">*</span>
          </label>
          <span className="text-xs text-foreground-muted font-medium">نسبت استاندارد ۱۶:۹</span>
        </div>

        <input
          ref={featuredImageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFeaturedImageUpload}
        />

        {featuredImageUrl ? (
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border border-border-subtle shadow-xs group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getMediaUrl(featuredImageUrl)}
              alt="تصویر شاخص مقاله"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => featuredImageInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-surface/90 hover:bg-surface text-foreground text-xs font-bold shadow-md transition-all"
              >
                تغییر تصویر شاخص
              </button>
              <button
                type="button"
                onClick={() => setFeaturedImageUrl("")}
                className="p-2 rounded-xl bg-red-600 text-white hover:bg-red-700 shadow-md transition-all"
                title="حذف تصویر شاخص"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => featuredImageInputRef.current?.click()}
            disabled={isUploading}
            className="w-full aspect-video sm:aspect-21/9 rounded-2xl border-2 border-dashed border-border-subtle hover:border-emerald-500 bg-surface-secondary/60 hover:bg-success-subtle/20 transition-all flex flex-col items-center justify-center gap-2 text-foreground-muted group"
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-success animate-spin" />
                <span className="text-xs font-bold text-foreground-secondary">در حال آپلود تصویر شاخص...</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-surface-secondary group-hover:bg-success-subtle text-foreground-muted group-hover:text-success flex items-center justify-center transition-colors">
                  <ImagePlus className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1">
                  <span className="text-xs font-black text-foreground-secondary block">
                    انتخاب یا کشیدن تصویر شاخص مقاله
                  </span>
                  <span className="text-[11px] text-foreground-muted">
                    فرمت‌های JPG, PNG, WebP (حداکثر ۱۰ مگابایت)
                  </span>
                </div>
              </>
            )}
          </button>
        )}
      </div>

      {/* ── SECTION 2: METADATA & TITLE ────────────────────────────── */}
      <div className="bg-surface p-5 sm:p-6 rounded-3xl border border-border-subtle/80 shadow-xs space-y-5">
        {/* Main Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-foreground flex items-center gap-1.5">
            <span>عنوان اصلی مقاله</span>
            <span className="text-error">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="مثلاً: تحلیل جامع روند قیمت مسکن در پاییز ۱۴۰۵ و چشم‌انداز سرمایه‌گذاری"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3.5 rounded-2xl bg-surface-secondary border border-border-subtle text-base sm:text-lg font-black text-foreground focus:bg-surface focus:border-emerald-500 focus:outline-hidden transition-all placeholder:text-foreground-muted"
          />
        </div>

        {/* Subtitle / Summary */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-foreground flex items-center gap-1.5">
            <span>خلاصه / زیرعنوان مقاله (Summary)</span>
          </label>
          <input
            type="text"
            placeholder="یک یا دو جمله کوتاه و گیرا برای نمایش در کارت‌ها و پیش‌نمایش شبکه‌های اجتماعی..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-surface-secondary border border-border-subtle text-xs sm:text-sm font-medium text-foreground focus:bg-surface focus:border-emerald-500 focus:outline-hidden transition-all placeholder:text-foreground-muted"
          />
        </div>

        {/* Category & Slug */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-foreground">دسته‌بندی موضوعی مقاله</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-surface-secondary border border-border-subtle text-xs font-bold text-foreground focus:bg-surface focus:border-emerald-500 focus:outline-hidden transition-all"
            >
              {MEDIUM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-foreground">نامک انگلیسی (SEO Slug)</label>
              <button
                type="button"
                onClick={handleAutoSlug}
                className="text-[11px] text-success font-bold hover:underline"
              >
                تولید خودکار
              </button>
            </div>
            <input
              type="text"
              dir="ltr"
              placeholder="housing-market-analysis-fall"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-surface-secondary border border-border-subtle text-xs font-mono text-foreground focus:bg-surface focus:border-emerald-500 focus:outline-hidden transition-all placeholder:text-foreground-muted"
            />
          </div>
        </div>
      </div>

      {/* ── SECTION 3: RICH MARKDOWN EDITOR & LIVE PREVIEW ─────────── */}
      <div className="bg-surface rounded-3xl border border-border-subtle/80 shadow-xs overflow-hidden">
        {/* Editor Top Bar & Controls */}
        <div className="p-4 bg-surface-secondary/80 border-b border-border-subtle flex flex-wrap items-center justify-between gap-3">
          {/* View Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setEditorTab("edit")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                editorTab === "edit"
                  ? "bg-surface text-foreground shadow-xs font-black"
                  : "text-foreground-secondary hover:text-foreground"
              )}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>ویرایشگر</span>
            </button>
            <button
              type="button"
              onClick={() => setEditorTab("preview")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                editorTab === "preview"
                  ? "bg-surface text-foreground shadow-xs font-black"
                  : "text-foreground-secondary hover:text-foreground"
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>پیش‌نمایش خروجی</span>
            </button>
            <button
              type="button"
              onClick={() => setEditorTab("split")}
              className={cn(
                "hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                editorTab === "split"
                  ? "bg-surface text-foreground shadow-xs font-black"
                  : "text-foreground-secondary hover:text-foreground"
              )}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>حالت همزمان (Split)</span>
            </button>
          </div>

          {/* Reading Time and Word Count */}
          <div className="flex items-center gap-4 text-xs text-foreground-muted font-medium">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-foreground-muted" />
              <span>{toPersianDigits(readingStats.words)} کلمه</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-success font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>خواندن حدود {toPersianDigits(readingStats.minutes)} دقیقه</span>
            </span>
          </div>
        </div>

        {/* Markdown Toolbar (Shown when in Edit or Split mode) */}
        {(editorTab === "edit" || editorTab === "split") && (
          <div className="p-3 bg-surface border-b border-border-subtle flex flex-wrap items-center gap-1 text-foreground-secondary select-none">
            {/* Inline Image Upload Trigger */}
            <input
              ref={inlineImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleInlineImageUpload}
            />
            <button
              type="button"
              onClick={() => inlineImageInputRef.current?.click()}
              disabled={isInsertingInlineImage}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-success-subtle hover:bg-success-subtle text-success text-xs font-black transition-colors"
              title="آپلود و درج تصویر بین متن"
            >
              {isInsertingInlineImage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-success" />
              ) : (
                <ImagePlus className="w-3.5 h-3.5" />
              )}
              <span>درج عکس بین متن</span>
            </button>

            <div className="w-px h-5 bg-slate-200 mx-1" />

            {/* Headings */}
            <button
              type="button"
              onClick={() => insertTextAtCursor("\n## ", "\n", "عنوان بخش")}
              className="p-1.5 rounded-lg hover:bg-surface-secondary text-xs font-black flex items-center gap-0.5"
              title="تیتر اصلی (H2)"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor("\n### ", "\n", "زیرعنوان")}
              className="p-1.5 rounded-lg hover:bg-surface-secondary text-xs font-black flex items-center gap-0.5"
              title="میان‌تیتر (H3)"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor("\n#### ", "\n", "تیتر فرعی")}
              className="p-1.5 rounded-lg hover:bg-surface-secondary text-xs font-black flex items-center gap-0.5"
              title="تیتر کوچک (H4)"
            >
              <Heading3 className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-200 mx-1" />

            {/* Formats */}
            <button
              type="button"
              onClick={() => insertTextAtCursor("**", "**", "متن پررنگ")}
              className="p-1.5 rounded-lg hover:bg-surface-secondary text-foreground-secondary"
              title="ضخیم (Bold)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor("*", "*", "متن مورب")}
              className="p-1.5 rounded-lg hover:bg-surface-secondary text-foreground-secondary"
              title="مورب (Italic)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor("\n> ", "\n", "نقل‌قول یا نکته مهم")}
              className="p-1.5 rounded-lg hover:bg-surface-secondary text-foreground-secondary"
              title="نقل‌قول (Quote)"
            >
              <Quote className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-200 mx-1" />

            {/* Lists */}
            <button
              type="button"
              onClick={() => insertTextAtCursor("\n- ", "\n", "مورد اول")}
              className="p-1.5 rounded-lg hover:bg-surface-secondary text-foreground-secondary"
              title="لیست نقطه‌ای"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor("\n1. ", "\n", "مورد اول")}
              className="p-1.5 rounded-lg hover:bg-surface-secondary text-foreground-secondary"
              title="لیست شماره‌دار"
            >
              <ListOrdered className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-200 mx-1" />

            {/* Code / Table / Link / Divider */}
            <button
              type="button"
              onClick={() => insertTextAtCursor("\n```\n", "\n```\n", "// کد یا داده")}
              className="p-1.5 rounded-lg hover:bg-surface-secondary text-foreground-secondary"
              title="بلوک کد"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                insertTextAtCursor(
                  "\n| ستون اول | ستون دوم | ستون سوم |\n| --- | --- | --- |\n| داده ۱ | داده ۲ | داده ۳ |\n"
                )
              }
              className="p-1.5 rounded-lg hover:bg-surface-secondary text-foreground-secondary"
              title="درج جدول"
            >
              <Table className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor("[عنوان پیوند](", ")", "https://example.com")}
              className="p-1.5 rounded-lg hover:bg-surface-secondary text-foreground-secondary"
              title="درج لینک"
            >
              <Link2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor("\n---\n")}
              className="p-1.5 rounded-lg hover:bg-surface-secondary text-foreground-secondary"
              title="خط جداکننده"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Editor / Preview Content Area */}
        <div className="p-4 sm:p-6 bg-surface min-h-[450px]">
          {editorTab === "edit" && (
            <textarea
              ref={textareaRef}
              required
              rows={18}
              placeholder="متن کامل مقاله، تحلیل یا گزارش خود را به صورت مارک‌داون یا متن ساده در اینجا بنویسید... (می‌توانید با دکمه درج عکس بالا، تصاویر را بین بندهای مقاله قرار دهید)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle text-sm sm:text-base text-foreground font-normal focus:bg-surface focus:border-emerald-500 focus:outline-hidden transition-all leading-loose resize-y placeholder:text-foreground-muted"
            />
          )}

          {editorTab === "preview" && (
            <div className="max-w-3xl mx-auto py-6 space-y-8">
              {/* Medium Article Header Preview */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-success bg-success-subtle px-3 py-1 rounded-full border border-success/30">
                    {category || "مقاله تحلیلی"}
                  </span>
                  <span className="text-xs text-foreground-muted font-medium">
                    {toPersianDigits(readingStats.minutes)} دقیقه زمان مطالعه
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-foreground leading-tight">
                  {title || "عنوان اصلی مقاله در اینجا قرار می‌گیرد"}
                </h1>

                {summary && (
                  <p className="text-base sm:text-lg text-foreground-secondary font-medium leading-relaxed">
                    {summary}
                  </p>
                )}

                {/* Author Info Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-b border-border-subtle py-3 my-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-full overflow-hidden bg-surface-secondary border border-border-subtle shrink-0">
                      {publisher.avatarUrl ? (
                        <Image
                          src={getMediaUrl(publisher.avatarUrl)}
                          alt={publisher.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-secondary text-foreground-secondary">
                          {publisher.type === "PLATFORM" && <ShieldCheck className="w-5 h-5 text-primary" />}
                          {publisher.type === "HOST" && <Hotel className="w-5 h-5 text-success" />}
                          {publisher.type === "AGENCY" && <Building2 className="w-5 h-5 text-info" />}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-foreground">
                          {publisher.name || "نام نویسنده / ناشر"}
                        </span>
                        {publisher.isVerified && (
                          <Verified className="w-3.5 h-3.5 text-primary fill-primary/10" />
                        )}
                      </div>
                      <p className="text-[11px] text-foreground-muted">
                        منتشر شده در ملک تودی • همین حالا
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-foreground-muted">
                    <button type="button" className="p-2 hover:text-foreground-secondary transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button type="button" className="p-2 hover:text-foreground-secondary transition-colors">
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Featured Image Render */}
              {featuredImageUrl && (
                <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-surface-secondary border border-border-subtle shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getMediaUrl(featuredImageUrl)}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Rendered Article Body */}
              <div className="pt-2">
                <MarkdownRenderer content={content} />
              </div>
            </div>
          )}

          {editorTab === "split" && (
            <div className="grid grid-cols-2 gap-6 items-start">
              <div className="space-y-2">
                <span className="text-xs font-bold text-foreground-muted">متن مارک‌داون (ویرایش):</span>
                <textarea
                  ref={textareaRef}
                  rows={20}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-surface-secondary border border-border-subtle text-sm font-mono text-foreground focus:bg-surface focus:border-emerald-500 focus:outline-hidden transition-all leading-relaxed resize-y"
                />
              </div>

              <div className="space-y-2 border-r border-border-subtle pr-6 overflow-y-auto max-h-[700px]">
                <span className="text-xs font-bold text-foreground-muted">پیش‌نمایش خروجی زنده:</span>
                {featuredImageUrl && (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-surface-secondary border border-border-subtle mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getMediaUrl(featuredImageUrl)}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <MarkdownRenderer content={content} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
