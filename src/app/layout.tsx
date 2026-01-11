/**
 * Root Layout
 *
 * The top-level layout for the entire application. Provides:
 * - Font loading (VT323 for terminal, Press Start 2P for headings, Orbitron for UI)
 * - Global CSS via globals.css
 * - ToastProvider for notifications
 * - SEO metadata
 *
 * All pages inherit from this layout.
 *
 * @module app/layout
 */
import type { Metadata } from "next";
import { VT323, Press_Start_2P, Orbitron } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { description, title } from "@/lib/constants";

const vt323 = VT323({
  weight: "400",
  variable: "--font-terminal",
  subsets: ["latin"],
  display: "swap",
});

const pressStart2P = Press_Start_2P({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const orbitron = Orbitron({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: title,
  description: description,
  keywords: [
    "retro computing",
    "vintage hardware",
    "TRS-80",
    "Apple I",
    "Z80",
    "6502",
    "open source",
    "hardware replicas",
  ],
  authors: [{ name: "RetroStack" }],
  openGraph: {
    title: title,
    description: description,
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <meta name="apple-mobile-web-app-title" content="RetroStack" />
        <meta name="theme-color" content="#0a0a1a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/web-app-manifest-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.__pwaInstallPrompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.__pwaInstallPrompt = e;
              });
            `,
          }}
        />
      </head>
      <body className={`${vt323.variable} ${pressStart2P.variable} ${orbitron.variable} antialiased`}>
        <ToastProvider>{children}</ToastProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
