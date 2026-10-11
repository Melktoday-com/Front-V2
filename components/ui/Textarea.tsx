import { cn } from "@/lib/utils";
import { TextareaHTMLAttributes, forwardRef } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    hasError?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, hasError, disabled, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[100px] w-full rounded-input border bg-surface p-4 text-sm text-foreground transition-all duration-150 resize-y",
                    "border-input-border placeholder:text-foreground-muted/60 leading-relaxed",
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
Textarea.displayName = "Textarea";

export { Textarea };
