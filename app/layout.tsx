import { MobileNav, Sidebar } from "@/components/layout/Navigation";
import { CityProvider } from "@/components/providers/CityProvider";
import { GlobalModalManager } from "@/components/providers/GlobalModalManager";
import { MapTileCacheInitializer } from "@/components/providers/MapTileCacheInitializer";
import { NavigationHistoryTracker } from "@/components/providers/NavigationHistoryTracker";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { TicketFloatingWidget } from "@/components/ticketing/TicketFloatingWidget";
import { WelcomePackageModal } from "@/components/subscriptions/WelcomePackageModal";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import { Toaster } from "sonner";
import "./globals.css";

const font = localFont({
  src: [
    {
      path: "../assets/font/IRANSansX-Thin.woff",
      weight: "100",
      style: "normal",
    },
    {
      path: "../assets/font/IRANSansX-UltraLight.woff",
      weight: "200",
      style: "normal",
    },
    {
      path: "../assets/font/IRANSansX-Light.woff",
      weight: "300",
      style: "normal",
    },
    {
      path: "../assets/font/IRANSansX-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/font/IRANSansX-Medium.woff",
      weight: "500",
      style: "normal",
    },
    {
      path: "../assets/font/IRANSansX-DemiBold.woff",
      weight: "600",
      style: "normal",
    },
    {
      path: "../assets/font/IRANSansX-Bold.woff",
      weight: "700",
      style: "normal",
    },
    {
      path: "../assets/font/IRANSansX-ExtraBold.woff",
      weight: "800",
      style: "normal",
    },
    {
      path: "../assets/font/IRANSansX-Black.woff",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font",
  display: "swap",
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
        className={`${font.variable} antialiased font flex min-h-screen overflow-x-hidden`}
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
            <WelcomePackageModal />
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
