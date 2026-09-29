"use client";

import { AccessGuard } from "@/components/AccessGuard";
import React from "react";

export default function HostApplyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AccessGuard>
            {children}
        </AccessGuard>
    );
}
