"use client";

import { AccessGuard } from "@/components/AccessGuard";
import { RoleName } from "@/types/access";
import React from "react";

export default function AgencyPanelLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AccessGuard roles={[RoleName.Agent]}>
            {children}
        </AccessGuard>
    );
}
