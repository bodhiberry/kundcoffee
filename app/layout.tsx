import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import AuthProvider from "@/components/providers/SessionProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bodhiberry | Premium Restaurant & Cafe POS System in Kathmandu",
  description: "Experience the future of restaurant management with KundCoffee. The most intuitive POS system for cafes and restaurants in Kathmandu. Streamline your operations today.",
  keywords: ["Restaurant POS Kathmandu", "Cafe Management System Nepal", "KundCoffee", "Coffee Shop POS", "Restaurant Software Nepal"],
  authors: [{ name: "KundCoffee Team" }],
  creator: "KundCoffee",
  publisher: "KundCoffee",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://bodhiberry.com"), // Replace with actual domain if different
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Bodhiberry | Premium Restaurant & Cafe POS System in Kathmandu",
    description: "Streamline your restaurant operations with KundCoffee POS. Built for the modern culinary experience.",
    url: "https://bodhiberry.com",
    siteName: "Bodhiberry",
    images: [
      {
        url: "/Logo.jpeg",
        width: 800,
        height: 600,
        alt: "Bodhiberry Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bodhiberry | Premium Restaurant & Cafe POS System in Kathmandu",
    description: "Streamline your restaurant operations with KundCoffee POS.",
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
            {children}
            <Toaster position="top-right" richColors duration={2000} />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
