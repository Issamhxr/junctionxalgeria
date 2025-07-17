"use client";

import {
  LayoutDashboard,
  Waves,
  AlertTriangle,
  Settings,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-context";

export function AppSidebar() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();

  const items = [
    {
      title: t("nav.dashboard"),
      url: "/",
      icon: LayoutDashboard,
    },
    {
      title: t("nav.alerts"),
      url: "/alerts",
      icon: AlertTriangle,
    },
    {
      title: t("nav.settings"),
      url: "/settings",
      icon: Settings,
    },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-blue-100 bg-white">
      <SidebarHeader className="p-6 bg-gradient-to-r from-blue-50 to-teal-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
            <Waves className="h-7 w-7 text-white" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="font-bold text-gray-800 text-lg">AquaMonitor</h2>
            <p className="text-sm text-gray-600">{t("dashboard.subtitle")}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.url}
                tooltip={item.title}
                className="h-14 rounded-2xl hover:bg-blue-50 data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-100 data-[active=true]:to-teal-100 data-[active=true]:text-blue-700 mb-2"
              >
                <Link href={item.url} className="flex items-center gap-4">
                  <item.icon className="h-6 w-6" />
                  <span className="font-medium text-base">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex gap-2 group-data-[collapsible=icon]:flex-col">
          <Button
            variant={language === "fr" ? "default" : "outline"}
            size="sm"
            onClick={() => setLanguage("fr")}
            className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 group-data-[collapsible=icon]:w-full"
          >
            <Globe className="h-4 w-4 mr-2 group-data-[collapsible=icon]:mr-0" />
            <span className="group-data-[collapsible=icon]:hidden">FR</span>
          </Button>
          <Button
            variant={language === "ar" ? "default" : "outline"}
            size="sm"
            onClick={() => setLanguage("ar")}
            className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 group-data-[collapsible=icon]:w-full"
          >
            <Globe className="h-4 w-4 mr-2 group-data-[collapsible=icon]:mr-0" />
            <span className="group-data-[collapsible=icon]:hidden">AR</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
