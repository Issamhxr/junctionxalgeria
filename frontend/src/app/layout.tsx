import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/language-context";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AquaMonitor - Gestion des Bassins Piscicoles",
  description: "Surveillance intelligente des bassins piscicoles en Algérie",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <div className="h-4 w-px bg-gray-200" />
                <h1 className="font-semibold text-gray-800">AquaMonitor</h1>
              </header>
              <main className="flex-1 overflow-auto bg-slate-50">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
