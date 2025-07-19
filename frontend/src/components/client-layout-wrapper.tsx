"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { LanguageProvider, useLanguage } from "@/components/language-context";
import { AuthProvider } from "@/contexts/auth-context";
import { NotificationProvider } from "@/contexts/notification-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileHeader } from "@/components/mobile-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { HeaderUserDetails } from "@/components/header-user-details";

// Component to handle the layout logic
function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    // Login page - no header/navbar, just the content
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  // Regular pages with full layout
  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header
              className={`flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background ${
                language === "ar" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`flex items-center gap-2 ${
                  language === "ar" ? "flex-row-reverse" : ""
                }`}
              >
                <SidebarTrigger
                  className={language === "ar" ? "-mr-1" : "-ml-1"}
                />
                <div className="h-4 w-px bg-border" />
                <h1 className="font-semibold text-foreground">
                  {language === "ar"
                    ? "أكوا كلتشر الجزائر"
                    : "AquaCulture Algeria"}
                </h1>
              </div>
              <HeaderUserDetails />
            </header>
            <main className="flex-1 overflow-auto bg-background">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden min-h-screen bg-background">
        <MobileHeader />
        <main className="pb-20 pt-4">{children}</main>
        <MobileBottomNav />
      </div>
    </>
  );
}

export function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <LanguageProvider>
            <LayoutContent>{children}</LayoutContent>
          </LanguageProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
