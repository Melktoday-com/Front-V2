import { cn } from "@/lib/utils";
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
}

export function Enamad({
  id = "576218",
  code = "r9Qtou1EP9PHzssUcEl84JIA4kb7wNAn",
  width = 90,
  height = 100,
  className,
  imageClassName,
  alt = "نماد اعتماد الکترونیکی ملک تودی",
  ...props
}: EnamadProps) {
  const href = `https://trustseal.enamad.ir/?id=${id}&Code=${code}`;
  const src = `https://trustseal.enamad.ir/logo.aspx?id=${id}&Code=${code}`;

  return (
    <a
      referrerPolicy="origin"
      target="_blank"
      rel="noopener noreferrer"
      href={href}
      title={alt}
      className={cn(
        "inline-flex items-center justify-center p-2.5 rounded-2xl bg-white hover:bg-white/95 transition-all duration-200 shadow-sm hover:shadow-md shrink-0 border border-white/20 select-none group",
        className
      )}
      {...props}
    >
      <Image
        referrerPolicy="origin"
        src={src}
        alt={alt}
        width={width}
        height={height}
        unoptimized
        className={cn(
          "cursor-pointer object-contain transition-transform duration-200 group-hover:scale-105",
          imageClassName
        )}
        {...({ code } as Record<string, unknown>)}
      />
    </a>
  );
}

export default Enamad;
