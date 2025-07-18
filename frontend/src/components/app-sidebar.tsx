"use client";

import {
  LayoutDashboard,
  Waves,
  AlertTriangle,
  Settings,
  Globe,
  Users,
  Building,
  MapPin,
  Database,
  BarChart3,
  LogOut,
  Shield,
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
import { useAuth } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function AppSidebar() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();

  // Role-specific navigation items
  const getNavigationItems = () => {
    const baseItems = [
      {
        title: t("nav.dashboard"),
        url: "/",
        icon: LayoutDashboard,
        roles: ["ADMIN", "CENTRE_CHIEF", "BASE_CHIEF", "OPERATOR"],
      },
      {
        title: t("nav.alerts"),
        url: "/alerts",
        icon: AlertTriangle,
        roles: ["ADMIN", "CENTRE_CHIEF", "BASE_CHIEF", "OPERATOR"],
      },
    ];

    const roleSpecificItems = [];

    // Admin specific items
    if (user?.role === "ADMIN") {
      roleSpecificItems.push(
        {
          title: "Centres",
          url: "/centres",
          icon: Building,
          roles: ["ADMIN"],
        },
        {
          title: "Utilisateurs",
          url: "/users",
          icon: Users,
          roles: ["ADMIN"],
        },
        {
          title: "Rapports",
          url: "/reports",
          icon: BarChart3,
          roles: ["ADMIN"],
        }
      );
    }

    // Centre Chief specific items
    if (user?.role === "CENTRE_CHIEF") {
      roleSpecificItems.push(
        {
          title: "Mes Bases",
          url: "/bases",
          icon: MapPin,
          roles: ["CENTRE_CHIEF"],
        },
        {
          title: "Opérateurs",
          url: "/operators",
          icon: Users,
          roles: ["CENTRE_CHIEF"],
        },
        {
          title: "Rapports Centre",
          url: "/centre-reports",
          icon: BarChart3,
          roles: ["CENTRE_CHIEF"],
        }
      );
    }

    // Base Chief specific items
    if (user?.role === "BASE_CHIEF") {
      roleSpecificItems.push(
        {
          title: "Mes Bassins",
          url: "/basins",
          icon: Waves,
          roles: ["BASE_CHIEF"],
        },
        {
          title: "Opérateurs",
          url: "/operators",
          icon: Users,
          roles: ["BASE_CHIEF"],
        },
        {
          title: "Données",
          url: "/data",
          icon: Database,
          roles: ["BASE_CHIEF"],
        }
      );
    }

    // Operator specific items
    if (user?.role === "OPERATOR") {
      roleSpecificItems.push(
        {
          title: "Mes Bassins",
          url: "/basins",
          icon: Waves,
          roles: ["OPERATOR"],
        },
        {
          title: "Saisie Données",
          url: "/data-entry",
          icon: Database,
          roles: ["OPERATOR"],
        }
      );
    }

    const settingsItem = {
      title: t("nav.settings"),
      url: "/settings",
      icon: Settings,
      roles: ["ADMIN", "CENTRE_CHIEF", "BASE_CHIEF", "OPERATOR"],
    };

    return [...baseItems, ...roleSpecificItems, settingsItem];
  };

  const items = getNavigationItems();

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "CENTRE_CHIEF":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "BASE_CHIEF":
        return "bg-green-100 text-green-700 border-green-200";
      case "OPERATOR":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="h-3 w-3" />;
      case "CENTRE_CHIEF":
        return <Building className="h-3 w-3" />;
      case "BASE_CHIEF":
        return <MapPin className="h-3 w-3" />;
      case "OPERATOR":
        return <Users className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrateur";
      case "CENTRE_CHIEF":
        return "Chef de Centre";
      case "BASE_CHIEF":
        return "Chef de Base";
      case "OPERATOR":
        return "Opérateur";
      default:
        return role;
    }
  };

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
        <div className="space-y-3">
          {/* Language Toggle */}
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

          {/* Logout Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4 mr-2 group-data-[collapsible=icon]:mr-0" />
            <span className="group-data-[collapsible=icon]:hidden">
              Déconnexion
            </span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
