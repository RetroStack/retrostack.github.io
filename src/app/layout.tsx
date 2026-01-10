import type { Metadata } from "next";
import { VT323, Press_Start_2P, Orbitron } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";
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
      </head>
      <body className={`${vt323.variable} ${pressStart2P.variable} ${orbitron.variable} antialiased`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
