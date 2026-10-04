'use client';

import React, { useRef, useMemo } from 'react';
import { useUploadMedia } from '@/hooks/useMedia';
import { getMediaUrl, getMediaPosterUrl } from '@/lib/utils';
import type { MediaReference, ExistingMediaType } from '@/types/api/media.types';
import { Loader2, ImagePlus, X, Play, Video } from 'lucide-react';
import { toast } from 'sonner';

interface MediaGalleryUploadProps {
    value?: MediaReference[];
    onChange: (media: MediaReference[]) => void;
    label?: string;
    helperText?: string;
    maxFiles?: number;
    disabled?: boolean;
    allowVideos?: boolean;
}

export default function MediaGalleryUpload({
    value = [],
    onChange,
    label = 'تصاویر و ویدئوها',
    helperText = 'تصاویر تا ۱۰ مگابایت (PNG, JPG, WebP) و ویدئوها تا ۲۰۰ مگابایت (MP4, MOV, WebM)',
    maxFiles = 10,
    disabled = false,
    allowVideos = true,
}: MediaGalleryUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const localPreviewsRef = useRef<Map<string, string>>(new Map());
    const { mutateAsync: uploadMedia, isPending: isUploading } = useUploadMedia();

    // Revoke any local blob preview URLs when the component unmounts
    React.useEffect(() => {
        return () => {
            localPreviewsRef.current.forEach((url) => URL.revokeObjectURL(url));
            localPreviewsRef.current.clear();
        };
    }, []);

    const normalizedValue: MediaReference[] = useMemo(() => {
        return value || [];
    }, [value]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (normalizedValue.length + files.length > maxFiles) {
            toast.error(`حداکثر می‌توانید ${maxFiles} فایل رسانه اضافه کنید`);
            return;
        }

        const newMedia: MediaReference[] = [...normalizedValue];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const isVideo =
                file.type.startsWith('video/') ||
                /\.(mp4|mov|webm|m4v)$/i.test(file.name);
            const isImage =
                file.type.startsWith('image/') ||
                /\.(svg|png|jpg|jpeg|webp|gif)$/i.test(file.name);

            if (!isImage && !isVideo) {
                toast.error(`فرمت فایل ${file.name} مجاز نیست`);
                continue;
            }

            if (isVideo && !allowVideos) {
                toast.error(`امکان آپلود ویدئو برای این بخش فعال نیست`);
                continue;
            }

            // Size checks: 10MB for image, 200MB for video
            const maxSizeBytes = isVideo ? 200 * 1024 * 1024 : 10 * 1024 * 1024;
            if (file.size > maxSizeBytes) {
                const maxMb = isVideo ? 200 : 10;
                toast.error(`فایل ${file.name} بیشتر از ${maxMb} مگابایت است`);
                continue;
            }

            const mediaType: ExistingMediaType = isVideo ? 'VIDEO' : 'IMAGE';

            try {
                const result = await uploadMedia({
                    file,
                    visibility: 'PUBLIC',
                    mediaType,
                });
                const uploadedId = result?.mediaId ?? result?.id;
                if (uploadedId) {
                    if (isVideo) {
                        try {
                            const blobUrl = URL.createObjectURL(file);
                            localPreviewsRef.current.set(uploadedId, blobUrl);
                        } catch {
                            // Non-critical fallback
                        }
                    }
                    newMedia.push({
                        id: uploadedId,
                        type: mediaType,
                    });
                }
            } catch (err) {
                console.error(`Failed to upload ${file.name}:`, err);
                toast.error(`خطا در آپلود ${file.name}`);
            }
        }

        onChange(newMedia);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemove = (indexToRemove: number) => {
        const itemToRemove = normalizedValue[indexToRemove];
        if (itemToRemove && localPreviewsRef.current.has(itemToRemove.id)) {
            URL.revokeObjectURL(localPreviewsRef.current.get(itemToRemove.id)!);
            localPreviewsRef.current.delete(itemToRemove.id);
        }
        const updated = normalizedValue.filter((_, idx) => idx !== indexToRemove);
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
                accept={
                    allowVideos
                        ? 'image/*,video/mp4,video/quicktime,video/webm'
                        : 'image/*'
                }
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled || isUploading}
            />

            {/* Previews and Add Button Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {normalizedValue.map((item, idx) => {
                    const fullUrl = getMediaUrl(item.id);
                    const isVideo = item.type === 'VIDEO';

                    return (
                        <div
                            key={`${item.id}-${idx}`}
                            className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 group shadow-xs"
                        >
                            {isVideo ? (
                                <div className="w-full h-full relative bg-slate-900 flex items-center justify-center">
                                    <video
                                        src={localPreviewsRef.current.get(item.id) || fullUrl}
                                        poster={getMediaPosterUrl(item)}
                                        className="w-full h-full object-cover"
                                        muted
                                        playsInline
                                        preload="metadata"
                                    />
                                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center pointer-events-none">
                                        <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-slate-900 shadow-sm">
                                            <Play className="w-4 h-4 fill-current ml-0.5" />
                                        </div>
                                    </div>
                                    <span className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded-md flex items-center gap-1 font-medium">
                                        <Video className="w-3 h-3 text-blue-400" />
                                        ویدئو
                                    </span>
                                </div>
                            ) : (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={fullUrl}
                                    alt={`تصویر ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                            '/property-placeholder.svg';
                                    }}
                                />
                            )}
                            <button
                                type="button"
                                onClick={() => handleRemove(idx)}
                                disabled={disabled || isUploading}
                                className="absolute top-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-700 text-white p-1 rounded-full shadow-sm transition-opacity"
                                title="حذف فایل"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    );
                })}

                {normalizedValue.length < maxFiles && (
                    <button
                        type="button"
                        onClick={() =>
                            !isUploading && !disabled && fileInputRef.current?.click()
                        }
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
                                <span className="text-[11px] font-bold text-slate-600">
                                    {allowVideos ? 'افزودن تصویر یا ویدئو' : 'افزودن تصویر'}
                                </span>
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
