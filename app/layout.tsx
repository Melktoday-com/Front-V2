import { MobileNav, Sidebar } from "@/components/layout/Navigation";
import { CityProvider } from "@/components/providers/CityProvider";
import { GlobalModalManager } from "@/components/providers/GlobalModalManager";
import { MapTileCacheInitializer } from "@/components/providers/MapTileCacheInitializer";
import { NavigationHistoryTracker } from "@/components/providers/NavigationHistoryTracker";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { TicketFloatingWidget } from "@/components/ticketing/TicketFloatingWidget";
import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Melktoday",
  description: "Find the property of your dreams",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body
        className={`${vazirmatn.variable} antialiased font-vazirmatn flex min-h-screen overflow-x-hidden`}
      >
        <QueryProvider>
          <CityProvider>
            <MapTileCacheInitializer />
            <NavigationHistoryTracker />
            <Sidebar />
            <main className="flex-1 w-full ">
              <div className="mx-auto min-h-screen  has-[.chat-page-content]:max-w-none has-[.chat-page-content]:p-0 has-[.chat-page-content]:pb-0 has-[.admin-layout]:max-w-none has-[.admin-layout]:p-0 has-[.admin-layout]:pb-0 has-[.h-screen]:pb-0 max-w-screen-2xl">
                {children}
              </div>
            </main>
            <GlobalModalManager />
            <MobileNav />
            <Suspense fallback={null}>
              <TicketFloatingWidget />
            </Suspense>
            <Toaster position="top-center" richColors />
          </CityProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
