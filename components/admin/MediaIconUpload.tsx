'use client';

import React, { useRef } from 'react';
import { useUploadMedia } from '@/hooks/useMedia';
import { getMediaUrl } from '@/lib/utils';
import { Loader2, ImagePlus, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface MediaIconUploadProps {
    value?: string;
    onChange: (mediaId: string) => void;
    label?: string;
    helperText?: string;
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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];

        if (file.size > 5 * 1024 * 1024) {
            toast.error('حجم فایل نباید بیشتر از ۵ مگابایت باشد');
            return;
        }

        const isImage = file.type.startsWith('image/') || /\.(svg|png|jpg|jpeg|webp|gif)$/i.test(file.name);
        if (!isImage) {
            toast.error('لطفاً یک فایل تصویری (SVG, PNG, JPG, WebP) انتخاب کنید');
            return;
        }

        try {
            const result = await uploadMedia(file);
            const uploadedId = result?.mediaId ?? result?.id;
            if (uploadedId) {
                onChange(uploadedId);
                toast.success('آیکون با موفقیت آپلود شد');
            } else {
                toast.error('خطا در دریافت شناسه فایل آپلود شده');
            }
        } catch (err) {
            console.error('Failed to upload icon:', err);
            toast.error('خطا در آپلود آیکون، لطفاً مجدداً تلاش کنید');
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const fullImageUrl = value ? getMediaUrl(value) : '';

    return (
        <div className="space-y-1.5 text-xs">
            <label className="block font-bold text-slate-700">{label}</label>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.svg"
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled || isUploading}
            />

            {/* Preview or Upload Area */}
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
                            <span className="text-xs font-bold">در حال آپلود...</span>
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
