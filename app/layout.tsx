import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { RouteProgress } from "@/components/layout/RouteProgress";
import { BackToTop } from "@/components/layout/BackToTop";
import { BrandColorProvider } from "@/components/layout/BrandColorProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EventPass - Premium Event Ticketing Platform",
  description: "Book your favorite events with premium experience",
  keywords: ["events", "tickets", "booking", "concerts", "shows"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Suspense fallback={null}><RouteProgress /></Suspense>
        <BackToTop />
        <BrandColorProvider>{children}</BrandColorProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "hsl(240 10% 6%)",
              color: "hsl(0 0% 95%)",
              border: "1px solid hsl(240 4% 16%)",
            },
          }}
        />
      </body>
    </html>
  );
}