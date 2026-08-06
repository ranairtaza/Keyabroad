import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

import { Toaster } from "react-hot-toast";
import CustomCursor from "@/components/CustomCursor";
import Header from "@/components/Header";

import { RoleProvider } from "@/components/RoleContext";
import { ThemeProvider } from "@/components/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

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
      <body suppressHydrationWarning className={`${inter.className} bg-slate-50 dark:bg-slate-900 flex h-screen overflow-hidden text-slate-900 dark:text-slate-50 transition-colors duration-300`}>
        <ThemeProvider>
          <RoleProvider>
            <CustomCursor />
            <Toaster position="top-right" toastOptions={{
              style: {
                background: '#ffffff',
                color: '#1e293b',
                border: '1px solid #e2e8f0'
              }
            }} />
            <Sidebar />
            <main className="flex-1 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 overflow-y-auto p-4 md:p-8 relative flex flex-col transition-colors duration-300">
              <Header />
              {children}
            </main>
          </RoleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
