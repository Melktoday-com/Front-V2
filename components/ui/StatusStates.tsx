"use client";

import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
    message?: string;
    onRetry: () => void;
}

export function ErrorState({ message = "Failed to load data", onRetry }: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-red-50/50 rounded-2xl border border-red-100">
            <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
            <p className="text-brand font-bold mb-4">{message}</p>
            <Button
                variant="secondary"
                size="sm"
                onClick={onRetry}
                className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
            >
                <RefreshCcw className="w-4 h-4" />
                Retry
            </Button>
        </div>
    );
}

export function EmptyState({ message = "No items found" }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-secondary font-medium">{message}</p>
        </div>
    );
}
