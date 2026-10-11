import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

function Skeleton({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-surface-secondary/80 border border-border-subtle/30",
                className
            )}
            {...props}
        />
    );
}

export { Skeleton };
