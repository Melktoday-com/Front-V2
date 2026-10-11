import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { HTMLAttributes, forwardRef } from "react";

const alertVariants = cva(
    "relative w-full rounded-2xl border p-4 text-sm leading-relaxed flex items-start gap-3 shadow-xs",
    {
        variants: {
            variant: {
                info: "bg-info-subtle border-info/30 text-info [&>svg]:text-info",
                success: "bg-success-subtle border-success/30 text-success [&>svg]:text-success",
                warning: "bg-warning-subtle border-warning/30 text-warning [&>svg]:text-warning",
                error: "bg-error-subtle border-error/30 text-error [&>svg]:text-error",
                default: "bg-surface-secondary border-border-subtle text-foreground [&>svg]:text-foreground-secondary",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

const iconMap = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
    default: Info,
};

export interface AlertProps
    extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
    showIcon?: boolean;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
    ({ className, variant = "default", showIcon = true, children, ...props }, ref) => {
        const IconComponent = iconMap[variant || "default"];
        return (
            <div
                ref={ref}
                role="alert"
                className={cn(alertVariants({ variant }), className)}
                {...props}
            >
                {showIcon && <IconComponent className="w-5 h-5 shrink-0 mt-0.5" />}
                <div className="flex-1 space-y-1">{children}</div>
            </div>
        );
    }
);
Alert.displayName = "Alert";

const AlertTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h5
            ref={ref}
            className={cn("font-black text-sm leading-tight tracking-tight", className)}
            {...props}
        />
    )
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("text-xs opacity-90 leading-relaxed", className)}
            {...props}
        />
    )
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
