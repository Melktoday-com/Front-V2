import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes } from "react";

const badgeVariants = cva(
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 select-none",
    {
        variants: {
            variant: {
                default: "border-transparent bg-primary/10 text-primary",
                primary: "border-transparent bg-primary text-primary-foreground",
                brand: "border-transparent bg-brand/10 text-brand",
                secondary: "border-border-subtle bg-surface-secondary text-foreground-muted",
                outline: "border-border-subtle text-foreground bg-transparent",
                accent: "border-transparent bg-accent text-accent-foreground font-black",
                "accent-subtle": "border-accent/30 bg-accent-subtle text-accent-text font-black",
                success: "border-success/20 bg-success-subtle text-success font-bold",
                warning: "border-warning/20 bg-warning-subtle text-warning font-bold",
                error: "border-error/20 bg-error-subtle text-error font-bold",
                info: "border-info/20 bg-info-subtle text-info font-bold",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface BadgeProps
    extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
