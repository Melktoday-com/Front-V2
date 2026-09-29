"use client";

import { AccessGuard } from "@/components/AccessGuard";
import React from "react";

export default function AgencyApplyLayout({
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
