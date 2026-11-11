import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

import { Toaster } from "react-hot-toast";
import CustomCursor from "@/components/CustomCursor";
import Header from "@/components/Header";
import { Analytics } from "@vercel/analytics/next";

import { RoleProvider } from "@/components/RoleContext";
import { ThemeProvider } from "@/components/ThemeContext";
import { SidebarProvider } from "@/components/SidebarContext";

/**
 * System-font fallback stack replacing Google Fonts (Inter).
 * Applied directly via className on <body> to preserve existing behavior.
 * No outbound network requests at build or runtime.
 */
const systemFontClassName = 'font-sans';

export const metadata: Metadata = {
  title: "Keyabroad Admin",
  description: "Admin panel for Keyabroad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-HXY2EHQNDX"
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-HXY2EHQNDX');
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className={`${systemFontClassName} bg-slate-50 dark:bg-slate-900 flex h-screen overflow-hidden text-slate-900 dark:text-slate-50 transition-colors duration-300`}>
        <ThemeProvider>
          <RoleProvider>
            <SidebarProvider>
              <CustomCursor />
              <Toaster position="top-right" toastOptions={{
                style: {
                  background: '#ffffff',
                  color: '#1e293b',
                  border: '1px solid #e2e8f0'
                }
              }} />
              <Sidebar />
              <main className="flex-1 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 overflow-y-auto p-4 md:p-8 relative flex flex-col transition-colors duration-300 w-full">
                <Header />
                {children}
              </main>
            </SidebarProvider>
          </RoleProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
