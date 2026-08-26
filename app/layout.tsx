import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. Add viewport settings to stop double-tap zooming on mobile
export const viewport: Viewport = {
  themeColor: "#0B061A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Crucial for games!
};

// 2. Link the PWA Manifest, Favicon, and Apple icons
export const metadata: Metadata = {
  title: "Kurukshetra Archery",
  description: "A meditative, offline-first archery experience.",
  manifest: "/manifest.json",
  icons: {
    icon: "/high-shot.svg", // Changes the browser tab Favicon
    apple: "/apple-icon.png", // Used by iPhones for the home screen icon
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kurukshetra",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
