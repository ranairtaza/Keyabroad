import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import dynamic from 'next/dynamic';
import PageTracker from "@/components/PageTracker";
import { AIChatbot } from "@/components/ai/AIChatbot";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@keyabroad/ui/components/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: 'swap',
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | KeyAbroad',
    default: 'KeyAbroad | Study Abroad Consultants',
  },
  description: "Your trusted partner for overseas education, university admissions, scholarships, and student visas. Start your international journey with KeyAbroad.",
  keywords: ["study abroad", "international education", "study overseas", "student visa", "study in UK", "study in USA"],
  openGraph: {
    title: "KeyAbroad | Study Abroad Consultants",
    description: "Your trusted partner for overseas education, university admissions, scholarships, and student visas.",
    url: "https://www.keyabroad.com",
    siteName: "KeyAbroad",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KeyAbroad | Study Abroad Consultants",
    description: "Your trusted partner for overseas education, university admissions, scholarships, and student visas.",
  },
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
      className={`${inter.variable} ${outfit.variable} h-full antialiased`}
      suppressHydrationWarning
    >
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
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PageTracker />
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <AIChatbot />
          <Toaster />
          <SpeedInsights />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
