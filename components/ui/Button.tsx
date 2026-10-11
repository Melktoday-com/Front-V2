import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button text-sm font-bold ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none cursor-pointer",
    {
        variants: {
            variant: {
                primary: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active shadow-sm hover:shadow-md",
                brand: "bg-brand text-primary-foreground hover:bg-primary-hover active:bg-primary-active shadow-sm hover:shadow-md",
                accent: "bg-accent text-accent-foreground hover:bg-accent-hover active:bg-accent-active shadow-sm hover:shadow-md",
                secondary: "bg-surface text-foreground border border-border-subtle hover:bg-surface-secondary active:bg-border/30 shadow-xs",
                outline: "border-2 border-primary text-primary bg-transparent hover:bg-primary/5 active:bg-primary/10",
                ghost: "text-foreground-secondary hover:bg-surface-secondary hover:text-foreground active:bg-border/30",
                muted: "bg-surface-secondary text-foreground-muted hover:bg-border/40 hover:text-foreground",
                destructive: "bg-error text-error-foreground hover:bg-error/90 active:bg-error/95 shadow-sm",
                link: "text-primary underline-offset-4 hover:underline p-0 h-auto font-medium",
            },
            size: {
                default: "h-[50px] px-8 py-4",
                sm: "h-9 px-4 text-xs",
                lg: "h-12 px-8 text-base",
                icon: "h-10 w-10 p-0 rounded-full shrink-0",
                "icon-sm": "h-8 w-8 p-0 rounded-lg shrink-0",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, isLoading, disabled, children, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
