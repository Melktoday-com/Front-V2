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
            <h2 className="text-brand font-black text-lg lg:text-xl tracking-tight">{title}</h2>
            {subtitle && <p className="text-text-light text-[10px] lg:text-xs mt-0.5">{subtitle}</p>}
        </div>
    );

    const actionButton = (
        <Button variant="link" size="sm" onClick={onAction} className="text-secondary font-bold text-[11px] lg:text-xs p-0 transition-colors hover:text-primary">
            {actionLabel}
        </Button>
    );

    return (
        <div className="flex justify-between items-end mb-5">
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
