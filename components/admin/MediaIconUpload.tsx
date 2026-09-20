'use client';

import React, { useRef, useState } from 'react';
import { useUploadMedia } from '@/hooks/useMedia';
import { getMediaUrl } from '@/lib/utils';
import { Loader2, ImagePlus, Trash2, RefreshCw, Link as LinkIcon, Check } from 'lucide-react';
import { toast } from 'sonner';

interface MediaIconUploadProps {
    value?: string;
    onChange: (mediaIdOrUrl: string) => void;
    label?: string;
    helperText?: string;
    placeholder?: string;
    disabled?: boolean;
}

export default function MediaIconUpload({
    value,
    onChange,
    label = 'آیکون',
    helperText,
    disabled = false,
}: MediaIconUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { mutateAsync: uploadMedia, isPending: isUploading } = useUploadMedia();
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [customUrl, setCustomUrl] = useState(value || '');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        // Validate file size (<= 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('حجم فایل نباید بیشتر از ۵ مگابایت باشد');
            return;
        }

        // Validate image type
        const isImage = file.type.startsWith('image/') || /\.(svg|png|jpg|jpeg|webp|gif)$/i.test(file.name);
        if (!isImage) {
            toast.error('لطفاً یک فایل تصویری (SVG, PNG, JPG, WebP) انتخاب کنید');
            return;
        }

        try {
            const result = await uploadMedia(file);
            // Backend returns both `mediaId` and `id` — prefer `mediaId`
            const uploadedId = result?.mediaId ?? result?.id;
            if (uploadedId) {
                onChange(uploadedId);
                setCustomUrl(uploadedId);
                toast.success('آیکون با موفقیت آپلود شد');
            } else {
                toast.error('خطا در دریافت شناسه فایل آپلود شده');
            }
        } catch (err) {
            console.error('Failed to upload icon:', err);
            toast.error('خطا در آپلود آیکون، لطفاً مجدداً تلاش کنید');
        } finally {
            // Reset input so re-selecting same file triggers onChange
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        setCustomUrl('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleApplyCustomUrl = () => {
        onChange(customUrl.trim());
        setShowUrlInput(false);
        toast.success('آدرس آیکون اعمال شد');
    };

    const fullImageUrl = value ? getMediaUrl(value) : '';

    return (
        <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-700">
                    {label}
                </label>
                <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 font-medium"
                >
                    <LinkIcon className="w-3 h-3" />
                    {showUrlInput ? 'انصراف از آدرس دستی' : 'یا درج آدرس مستقیم (URL)'}
                </button>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.svg"
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled || isUploading}
            />

            {/* Custom URL Input Mode */}
            {showUrlInput ? (
                <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <input
                        type="text"
                        placeholder="https://... یا شناسه مدیا"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-left focus:outline-none focus:ring-1 focus:ring-blue-500"
                        dir="ltr"
                    />
                    <button
                        type="button"
                        onClick={handleApplyCustomUrl}
                        className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        title="اعمال"
                    >
                        <Check className="w-4 h-4" />
                    </button>
                </div>
            ) : null}

            {/* Main Upload / Preview Area */}
            {value ? (
                <div className="flex items-center justify-between p-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl hover:border-slate-300 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={fullImageUrl}
                                alt="پیش‌نمایش آیکون"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    // Fallback if image fails to load
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                        <div className="min-w-0 text-right">
                            <span className="font-bold text-slate-800 block text-xs truncate">
                                آیکون آپلود شده
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 block truncate" dir="ltr">
                                {value}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={disabled || isUploading}
                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-200 hover:border-blue-200 bg-white"
                            title="تغییر فایل آیکون"
                        >
                            {isUploading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            ) : (
                                <RefreshCw className="w-4 h-4" />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handleRemove}
                            disabled={disabled || isUploading}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-200 hover:border-red-200 bg-white"
                            title="حذف آیکون"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => !isUploading && !disabled && fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                        isUploading
                            ? 'bg-blue-50/50 border-blue-300 pointer-events-none'
                            : 'bg-slate-50/60 hover:bg-slate-100/60 border-slate-200 hover:border-blue-400'
                    }`}
                >
                    {isUploading ? (
                        <div className="flex flex-col items-center gap-2 text-blue-600">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-xs font-bold">در حال آپلود و ذخیره آیکون در سرویس فایل...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-1.5 text-center">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <ImagePlus className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs font-bold text-slate-700 block">
                                    کلیک برای آپلود آیکون
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                    فرمت‌های مجاز: SVG, PNG, WebP, JPG (حداکثر ۵ مگابایت)
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {helperText && (
                <p className="text-[10px] text-slate-400 mt-1">{helperText}</p>
            )}
        </div>
    );
}
