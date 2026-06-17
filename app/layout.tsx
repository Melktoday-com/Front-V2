import { MobileNav, Sidebar } from "@/components/layout/Navigation";
import { QueryProvider } from "@/components/providers/QueryProvider";
import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "Melktoday",
  description: "Find the property of your dreams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body
        className={`${vazirmatn.variable} antialiased font-vazirmatn flex min-h-screen`}
      >
        <QueryProvider>
          <Sidebar />
          <main className="flex-1 w-full bg-white lg:bg-soft-bg/30">
            <div className="max-w-screen-2xl mx-auto min-h-screen bg-white">
              {children}
            </div>
          </main>
          <MobileNav />
          <Toaster position="top-center" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
