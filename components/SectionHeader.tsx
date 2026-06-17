import { Button } from "@/components/ui/Button";

interface SectionHeaderProps {
    title: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function SectionHeader({ title, actionLabel = "مشاهده همه", onAction }: SectionHeaderProps) {
    return (
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-brand font-black text-lg lg:text-2xl">{title}</h2>
            <Button variant="link" size="sm" onClick={onAction} className="text-secondary font-bold text-xs lg:text-sm p-0 transition-colors hover:text-primary">
                {actionLabel}
            </Button>
        </div>
    );
}
