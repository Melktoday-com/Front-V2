import { cn } from "@/lib/utils";
import { ExternalLink, ShieldCheck } from "lucide-react";
import Image from "next/image";
import React from "react";

export interface EnamadProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children"> {
  id?: string;
  code?: string;
  width?: number;
  height?: number;
  imageClassName?: string;
  alt?: string;
  variant?: "card" | "compact" | "badge";
  showTrustBadge?: boolean;
}

const defaultDimensions = {
  card: { width: 44, height: 48 },
  compact: { width: 36, height: 40 },
  badge: { width: 72, height: 78 },
};

export function Enamad({
  id = "576218",
  code = "r9Qtou1EP9PHzssUcEl84JIA4kb7wNAn",
  width,
  height,
  className,
  imageClassName,
  alt = "نماد اعتماد الکترونیکی ملک تودی",
  variant = "card",
  showTrustBadge = true,
  ...props
}: EnamadProps) {
  const href = `https://trustseal.enamad.ir/?id=${id}&Code=${code}`;
  const src = `https://trustseal.enamad.ir/logo.aspx?id=${id}&Code=${code}`;

  const imgWidth = width ?? defaultDimensions[variant].width;
  const imgHeight = height ?? defaultDimensions[variant].height;

  if (variant === "badge") {
    return (
      <a
        referrerPolicy="origin"
        target="_blank"
        rel="noopener noreferrer"
        href={href}
        title={alt}
        className={cn(
          "p-2.5 rounded-2xl bg-surface/[0.04] hover:bg-surface/[0.08] border border-white/10 hover:border-accent/40 transition-all duration-200 inline-flex items-center justify-center group/enamad shadow-xs hover:shadow-md cursor-pointer select-none",
          className
        )}
        {...props}
      >
        <div className="p-1.5 rounded-xl bg-white flex items-center justify-center border border-white/20 shadow-xs group-hover/enamad:scale-105 transition-transform duration-200">
          <Image
            referrerPolicy="origin"
            src={src}
            alt={alt}
            width={imgWidth}
            height={imgHeight}
            unoptimized
            className={cn("cursor-pointer object-contain", imageClassName)}
            {...({ code } as Record<string, unknown>)}
          />
        </div>
      </a>
    );
  }

  if (variant === "compact") {
    return (
      <a
        referrerPolicy="origin"
        target="_blank"
        rel="noopener noreferrer"
        href={href}
        title={alt}
        className={cn(
          "p-2.5 rounded-2xl bg-surface/[0.04] hover:bg-surface/[0.08] border border-white/10 hover:border-accent/40 transition-all duration-200 inline-flex items-center gap-2.5 group/enamad shadow-xs hover:shadow-md cursor-pointer select-none",
          className
        )}
        {...props}
      >
        <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 border border-white/20 shadow-xs group-hover/enamad:scale-105 transition-transform duration-200">
          <Image
            referrerPolicy="origin"
            src={src}
            alt={alt}
            width={imgWidth}
            height={imgHeight}
            unoptimized
            className={cn("cursor-pointer object-contain", imageClassName)}
            {...({ code } as Record<string, unknown>)}
          />
        </div>
        <div className="min-w-0 text-right">
          <span className="text-xs font-bold text-white group-hover/enamad:text-accent transition-colors block">
            نماد اعتماد الکترونیکی
          </span>
          <span className="text-[10px] text-white/60 block mt-0.5 truncate font-medium">
            اینماد رسمی
          </span>
        </div>
      </a>
    );
  }

  return (
    <a
      referrerPolicy="origin"
      target="_blank"
      rel="noopener noreferrer"
      href={href}
      title={alt}
      className={cn(
        "p-3 rounded-2xl bg-surface/[0.04] hover:bg-surface/[0.08] border border-white/10 hover:border-accent/40 transition-all duration-200 flex items-center justify-between gap-3 group/enamad shadow-xs hover:shadow-md cursor-pointer select-none",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 border border-white/20 shadow-xs group-hover/enamad:scale-105 transition-transform duration-200">
          <Image
            referrerPolicy="origin"
            src={src}
            alt={alt}
            width={imgWidth}
            height={imgHeight}
            unoptimized
            className={cn("cursor-pointer object-contain", imageClassName)}
            {...({ code } as Record<string, unknown>)}
          />
        </div>

        <div className="min-w-0 text-right">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-white group-hover/enamad:text-accent transition-colors">
              نماد اعتماد الکترونیکی
            </span>
            <span className="text-[10px] font-black bg-accent/20 text-accent px-1.5 py-0.5 rounded-full border border-accent/30 leading-none">
              اینماد
            </span>
          </div>
          <span className="text-[10px] text-white/60 block mt-0.5 truncate font-medium">
            مرکز توسعه تجارت الکترونیکی
          </span>
          {showTrustBadge && (
            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-accent font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>دارای تاییدیه و اعتبار رسمی</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-8 h-8 rounded-xl bg-surface/10 flex items-center justify-center text-white/50 group-hover/enamad:text-accent group-hover/enamad:bg-accent/20 transition-all shrink-0">
        <ExternalLink className="w-4 h-4" />
      </div>
    </a>
  );
}

export default Enamad;
