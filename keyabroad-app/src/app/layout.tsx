import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import dynamic from 'next/dynamic';
import PageTracker from "@/components/PageTracker";
const AIChatbot = dynamic(() => import("@/components/AIChatbot"));
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KeyAbroad | Open the door to success",
  description: "Study abroad consultants. Your trusted partner for overseas education, admissions, and visas.",
  icons: {
    icon: '/keyabroad.png',
    shortcut: '/keyabroad.png',
    apple: '/keyabroad.png',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <PageTracker />
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <AIChatbot />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
