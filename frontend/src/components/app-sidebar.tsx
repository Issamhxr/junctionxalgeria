"use client";

import {
  LayoutDashboard,
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
import Image from "next/image";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
    <Sidebar
      collapsible="icon"
      className={`border-r bg-sidebar ${
        language === "ar" ? "border-l border-r-0" : ""
      }`}
    >
      <SidebarHeader className="p-6 bg-gradient-to-r from-sidebar-accent/50 to-sidebar-accent/30">
        <div
          className={`flex items-center gap-3 ${
            language === "ar" ? "flex-row-reverse" : ""
          }`}
        >
          <Image
            src="/logo.svg"
            alt="AquaMonitor Logo"
            width={150}
            height={80}
          />
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
                className="h-14 rounded-2xl hover:bg-sidebar-accent data-[active=true]:bg-gradient-to-r data-[active=true]:from-sidebar-accent data-[active=true]:to-sidebar-accent data-[active=true]:text-sidebar-accent-foreground mb-2"
              >
                <Link
                  href={item.url}
                  className={`flex items-center gap-4 ${
                    language === "ar" ? "flex-row-reverse text-right" : ""
                  }`}
                >
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
          {/* User info */}
          {user && (
            <div
              className={`flex items-center gap-3 p-3 rounded-2xl bg-sidebar-accent/50 group-data-[collapsible=icon]:justify-center ${
                language === "ar" ? "flex-row-reverse" : ""
              }`}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm">
                {user.firstName?.charAt(0) || user.email.charAt(0)}
              </div>
              <div
                className={`group-data-[collapsible=icon]:hidden flex-1 ${
                  language === "ar" ? "text-right" : ""
                }`}
              >
                <p className="font-medium text-sidebar-foreground text-sm">
                  {user.firstName} {user.lastName}
                </p>
                <Badge
                  className={`${getRoleColor(user.role)} text-xs mt-1 ${
                    language === "ar" ? "self-end" : ""
                  }`}
                >
                  <span
                    className={`flex items-center gap-1 ${
                      language === "ar" ? "flex-row-reverse" : ""
                    }`}
                  >
                    {getRoleIcon(user.role)}
                    {getRoleLabel(user.role)}
                  </span>
                </Badge>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className={`w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive ${
              language === "ar" ? "flex-row-reverse" : ""
            }`}
          >
            <LogOut
              className={`h-4 w-4 group-data-[collapsible=icon]:mr-0 ${
                language === "ar" ? "ml-2" : "mr-2"
              }`}
            />
            <span className="group-data-[collapsible=icon]:hidden">
              {language === "ar" ? "تسجيل الخروج" : "Déconnexion"}
            </span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
