'use client';

import React, { useRef } from 'react';
import { useUploadMedia } from '@/hooks/useMedia';
import { getMediaUrl } from '@/lib/utils';
import { Loader2, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';

interface MediaGalleryUploadProps {
    value?: string[];
    onChange: (mediaIds: string[]) => void;
    label?: string;
    helperText?: string;
    maxFiles?: number;
    disabled?: boolean;
}

export default function MediaGalleryUpload({
    value = [],
    onChange,
    label = 'تصاویر',
    helperText = 'فرمت‌های مجاز: PNG, JPG, WebP (حداکثر ۱۰ مگابایت برای هر تصویر)',
    maxFiles = 10,
    disabled = false,
}: MediaGalleryUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { mutateAsync: uploadMedia, isPending: isUploading } = useUploadMedia();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (value.length + files.length > maxFiles) {
            toast.error(`حداکثر می‌توانید ${maxFiles} تصویر اضافه کنید`);
            return;
        }

        const newIds: string[] = [...value];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            if (file.size > 10 * 1024 * 1024) {
                toast.error(`فایل ${file.name} بیشتر از ۱۰ مگابایت است`);
                continue;
            }

            const isImage = file.type.startsWith('image/') || /\.(svg|png|jpg|jpeg|webp|gif)$/i.test(file.name);
            if (!isImage) {
                toast.error(`فایل ${file.name} یک تصویر معتبر نیست`);
                continue;
            }

            try {
                const result = await uploadMedia(file);
                const uploadedId = result?.mediaId ?? result?.id;
                if (uploadedId) {
                    newIds.push(uploadedId);
                }
            } catch (err) {
                console.error('Failed to upload image:', err);
                toast.error(`خطا در آپلود ${file.name}`);
            }
        }

        onChange(newIds);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemove = (indexToRemove: number) => {
        const updated = value.filter((_, idx) => idx !== indexToRemove);
        onChange(updated);
    };

    return (
        <div className="space-y-2 text-xs">
            {label && <label className="block font-bold text-slate-700">{label}</label>}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled || isUploading}
            />

            {/* Previews and Add Button Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {value.map((mediaId, idx) => {
                    const fullUrl = getMediaUrl(mediaId);
                    return (
                        <div
                            key={`${mediaId}-${idx}`}
                            className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group shadow-xs"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={fullUrl}
                                alt={`تصویر ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/property-placeholder.svg';
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => handleRemove(idx)}
                                disabled={disabled || isUploading}
                                className="absolute top-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-700 text-white p-1 rounded-full shadow-sm transition-opacity"
                                title="حذف تصویر"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    );
                })}

                {value.length < maxFiles && (
                    <button
                        type="button"
                        onClick={() => !isUploading && !disabled && fileInputRef.current?.click()}
                        disabled={disabled || isUploading}
                        className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                            isUploading
                                ? 'bg-blue-50/50 border-blue-300 pointer-events-none'
                                : 'bg-slate-50/60 hover:bg-slate-100/60 border-slate-200 hover:border-blue-400'
                        }`}
                    >
                        {isUploading ? (
                            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                        ) : (
                            <div className="flex flex-col items-center gap-1 text-center p-2">
                                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <ImagePlus className="w-4 h-4" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-600">افزودن تصویر</span>
                            </div>
                        )}
                    </button>
                )}
            </div>

            {helperText && (
                <p className="text-[10px] text-slate-400 mt-1">{helperText}</p>
            )}
        </div>
    );
}
