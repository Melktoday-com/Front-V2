"use client";

import { AccessGuard } from "@/components/AccessGuard";
import React from "react";

export default function ProfileLayout({
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
