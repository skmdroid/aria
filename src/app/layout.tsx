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

export const metadata: Metadata = {
  title: "Aria — the AI operating system in your browser",
  description:
    "Aria is an open-source, macOS-style web desktop with a built-in multi-agent brain. Talk to it, watch agents collaborate live, and run everything from one beautiful OS.",
  applicationName: "Aria",
  authors: [{ name: "Sumanth" }],
  keywords: [
    "AI operating system",
    "multi-agent",
    "web desktop",
    "AI agents",
    "open source",
  ],
  openGraph: {
    title: "Aria — the AI operating system in your browser",
    description:
      "An open-source web OS with a live multi-agent brain. Talk to it. Watch agents collaborate.",
    type: "website",
    images: ["/screenshots/00-desktop-clean.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aria — the AI operating system in your browser",
    description:
      "An open-source web OS with a live multi-agent brain. Talk to it. Watch agents collaborate.",
    images: ["/screenshots/00-desktop-clean.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#05060a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
