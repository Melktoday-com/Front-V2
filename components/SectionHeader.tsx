import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
    link?: string;
}

export function SectionHeader({ title, subtitle, actionLabel = "مشاهده همه", onAction, link }: SectionHeaderProps) {
    const headerContent = (
        <div className="flex flex-col">
            <h2 className="text-brand font-black text-xl lg:text-3xl tracking-tight">{title}</h2>
            {subtitle && <p className="text-text-light text-xs lg:text-sm mt-1">{subtitle}</p>}
        </div>
    );

    const actionButton = (
        <Button variant="link" size="sm" onClick={onAction} className="text-secondary font-bold text-xs lg:text-base p-0 transition-colors hover:text-primary">
            {actionLabel}
        </Button>
    );

    return (
        <div className="flex justify-between items-center mb-8">
            {headerContent}
            {link ? (
                <Link href={link}>
                    {actionButton}
                </Link>
            ) : (
                actionButton
            )}
        </div>
    );
}
