import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-button text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
    {
        variants: {
            variant: {
                primary: "bg-primary text-white hover:bg-primary/90 shadow-md",
                brand: "bg-brand text-white hover:bg-brand/90 shadow-md",
                secondary: "bg-white text-secondary border border-soft-border hover:bg-soft-bg shadow-sm",
                outline: "border-2 border-primary text-primary bg-transparent hover:bg-primary/5",
                ghost: "hover:bg-soft-bg text-secondary",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-[50px] px-8 py-4",
                sm: "h-9 px-3",
                lg: "h-12 px-8",
                icon: "h-10 w-10 rounded-full",
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
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
