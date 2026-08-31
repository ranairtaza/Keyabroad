import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTracker from "@/components/PageTracker";
import { AIChatbot } from "@/components/ai/AIChatbot";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@keyabroad/ui/components/sonner";
import GoogleTagManager from "@/components/analytics/GoogleTagManager";

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
  metadataBase: new URL('https://keyabroad.com'),
  title: {
    template: '%s | KeyAbroad',
    default: 'KeyAbroad | Best Study Abroad Consultants & Visa Experts',
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
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "KeyAbroad",
              "url": "https://keyabroad.com",
              "logo": "https://keyabroad.com/keyabroad-with-tagline.png",
              "description": "Your trusted partner for overseas education, university admissions, scholarships, and student visas.",
              "sameAs": [
                "https://www.facebook.com/keyabroad",
                "https://www.instagram.com/keyabroad"
              ]
            })
          }}
        />
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
