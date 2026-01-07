import type { Metadata } from "next";
import { VT323, Press_Start_2P, Orbitron } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastProvider";

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
  title: "RetroStack - Vintage Computing Hardware & Software",
  description:
    "Open-source hardware replicas, ROM adapters, KiCAD libraries, and development tools for vintage computing enthusiasts.",
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
    title: "RetroStack - Vintage Computing Hardware & Software",
    description:
      "Open-source hardware replicas, ROM adapters, KiCAD libraries, and development tools for vintage computing enthusiasts.",
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
      <body
        className={`${vt323.variable} ${pressStart2P.variable} ${orbitron.variable} antialiased`}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
