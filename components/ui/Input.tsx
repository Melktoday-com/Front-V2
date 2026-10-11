import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    hasError?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, hasError, disabled, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-12 w-full rounded-input border bg-surface px-4 py-2.5 text-sm text-foreground transition-all duration-150",
                    "border-input-border placeholder:text-foreground-muted/60",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-primary",
                    "disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground disabled:opacity-60",
                    hasError && "border-error focus-visible:ring-error text-error placeholder:text-error/60",
                    className
                )}
                ref={ref}
                disabled={disabled}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

export { Input };
