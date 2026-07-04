import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "AquaCore — AI Fish Farm Management Software | Aquaculture ERP",
  description:
    "AquaCore is the AI-powered fish farm operating system for commercial aquaculture. Manage ponds, fish batches, feeding schedules, feed inventory, harvests, water quality, vendors, and farm finances from one dashboard.",
  keywords: [
    "AI fish farm management",
    "aquaculture software",
    "fish farm ERP",
    "fish farm management system",
    "aquaculture ERP",
    "fish farming dashboard",
    "pond management software",
    "harvest management",
    "feed inventory management",
    "commercial fish farming",
    "farm analytics",
    "agritech SaaS",
  ],
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
