import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import { PrinterProvider } from "@/components/providers/PrinterProvider";
import AuthProvider from "@/components/providers/SessionProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XolaCloud | Premium Restaurant & Cafe POS System in Kathmandu",
  description: "Experience the future of restaurant management with XolaCloud. The most intuitive POS system for cafes and restaurants in Kathmandu. Streamline your operations today.",
  keywords: ["Restaurant POS Kathmandu", "Cafe Management System Nepal", "XolaCloud", "Coffee Shop POS", "Restaurant Software Nepal"],
  authors: [{ name: "XolaCloud Team" }],
  creator: "XolaCloud",
  publisher: "XolaCloud",

  formatDetection: {
    email: false,
    address: false,
    telephone: false, 
  },
  metadataBase: new URL("https://xolacloud.com"), // Replace with actual domain if different
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "XolaCloud | Premium Restaurant & Cafe POS System in Kathmandu",
    description: "Streamline your restaurant operations with XolaCloud POS. Built for the modern culinary experience.",

    url: "https://xolacloud.com",
    siteName: "XolaCloud",
    images: [
      {
        url: "/Logo.jpeg",
        width: 800,
        height: 600,
        alt: "XolaCloud Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "XolaCloud | Premium Restaurant & Cafe POS System in Kathmandu",
    description: "Streamline your restaurant operations with XolaCloud POS.",

    images: ["/Logo.jpeg"],
  },
  icons: {
    icon: [
      {
        url: "/Logo.jpeg",
        href: "/Logo.jpeg",
      },
    ],
    shortcut: "/Logo.jpeg",
    apple: "/Logo.jpeg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased bg-white text-zinc-900`}
      >
        <AuthProvider>
          <SettingsProvider>
            <PrinterProvider>
              {children}
              <Toaster position="top-right" richColors duration={2000} />
            </PrinterProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
