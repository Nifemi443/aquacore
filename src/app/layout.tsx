import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

const siteName = "PondDesk";
const tagline = "The operating system for modern fish farms.";
const description =
  "PondDesk helps fish farmers manage every aspect of their operation from one dashboard — fish batches, ponds, daily feeding, feed inventory, water quality, mortality, harvest planning, vendor deliveries, reports, and AI-powered farm insights.";

export const metadata: Metadata = {
  metadataBase: new URL("https://ponddesk.app"),
  title: {
    default: `${siteName} — ${tagline}`,
    template: `%s · ${siteName}`,
  },
  description,
  applicationName: siteName,
  keywords: [
    "PondDesk",
    "fish farm management",
    "aquaculture software",
    "fish farm ERP",
    "pond management software",
    "fish farming dashboard",
    "feed inventory management",
    "harvest planning",
    "water quality records",
    "commercial fish farming",
    "farm analytics",
    "agritech SaaS",
  ],
  authors: [{ name: "PondDesk" }],
  creator: "PondDesk",
  publisher: "PondDesk",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ponddesk.app",
    siteName,
    title: `${siteName} — ${tagline}`,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — ${tagline}`,
    description,
    creator: "@ponddesk",
  },
  robots: {
    index: true,
    follow: true,
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
      <body className={`${GeistSans.className} min-h-screen bg-white text-[#0a0a0a] antialiased`}>
        {children}
      </body>
    </html>
  );
}
