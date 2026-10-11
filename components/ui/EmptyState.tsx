import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl border border-border-subtle bg-surface/50 shadow-xs",
                className
            )}
        >
            {Icon && (
                <div className="w-14 h-14 rounded-2xl bg-surface-secondary text-foreground-secondary flex items-center justify-center mb-4 border border-border-subtle/50">
                    <Icon className="w-7 h-7 stroke-[1.75]" />
                </div>
            )}
            <h4 className="text-base font-black text-foreground mb-1.5">{title}</h4>
            {description && (
                <p className="text-xs text-foreground-muted max-w-sm leading-relaxed mb-6">
                    {description}
                </p>
            )}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}
