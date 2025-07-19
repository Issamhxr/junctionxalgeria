import type React from "react";
import { Outfit } from "next/font/google";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClientLayoutWrapper } from "@/components/client-layout-wrapper";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AquaCulture Algeria - Système de Surveillance Aquacole",
  description:
    "Système intelligent de surveillance et gestion des fermes aquacoles en Algérie",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AquaCulture DZ",
  },
  openGraph: {
    title: "AquaCulture Algeria",
    description: "Système intelligent de surveillance aquacole",
    type: "website",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "AquaCulture Algeria Logo",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AquaCulture DZ" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-TileImage" content="/icon.svg" />
      </head>
      <body className={outfit.className} suppressHydrationWarning>
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}
