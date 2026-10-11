import { cn } from "@/lib/utils";
import { LabelHTMLAttributes, forwardRef } from "react";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
    isRequired?: boolean;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, isRequired, children, ...props }, ref) => (
        <label
            ref={ref}
            className={cn(
                "text-xs font-bold text-foreground inline-flex items-center gap-1 select-none leading-none mb-1.5",
                className
            )}
            {...props}
        >
            {children}
            {isRequired && <span className="text-error font-black">*</span>}
        </label>
    )
);
Label.displayName = "Label";

export { Label };
