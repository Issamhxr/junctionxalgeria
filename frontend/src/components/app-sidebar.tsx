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
  Waves,
  Activity, // Add Activity icon for sensor data
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

    // Sensor Data item for all roles
    const sensorDataItem = {
      title: "Données Capteurs",
      url: "/sensor-data",
      icon: Activity,
      roles: ["ADMIN", "CENTRE_CHIEF", "BASE_CHIEF", "OPERATOR"],
    };

    const settingsItem = {
      title: t("nav.settings"),
      url: "/settings",
      icon: Settings,
      roles: ["ADMIN", "CENTRE_CHIEF", "BASE_CHIEF", "OPERATOR"],
    };

    return [...baseItems, ...roleSpecificItems, sensorDataItem, settingsItem];
  };

  const items = getNavigationItems();

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/30 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-700/50 shadow-sm";
      case "CENTRE_CHIEF":
        return "bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50 shadow-sm";
      case "BASE_CHIEF":
        return "bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-700/50 shadow-sm";
      case "OPERATOR":
        return "bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/30 text-orange-700 dark:text-orange-300 border-orange-200/50 dark:border-orange-700/50 shadow-sm";
      default:
        return "bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-800/40 dark:to-gray-800/30 text-slate-700 dark:text-slate-300 border-slate-200/50 dark:border-slate-700/50 shadow-sm";
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
      className={`border-r bg-gradient-to-b from-slate-50/95 to-cyan-50/90 dark:bg-gradient-to-b dark:from-slate-900/95 dark:to-cyan-900/90 dark:sidebar-bg-light backdrop-blur-sm shadow-lg ${
        language === "ar" ? "border-l border-r-0" : ""
      } border-cyan-200/30 dark:border-cyan-800/30`}
    >
      <SidebarHeader className="p-6 bg-gradient-to-br from-cyan-500/10 via-teal-500/5 to-blue-500/10 dark:bg-gradient-to-br dark:from-cyan-900/30 dark:via-teal-900/20 dark:to-blue-900/30 dark:sidebar-header-bg border-b border-cyan-200/30 dark:border-cyan-800/40">
        <div
          className={`flex items-center gap-3 ${
            language === "ar" ? "flex-row-reverse" : ""
          }`}
        >
          <div className="p-3 bg-gradient-to-br from-cyan-500 to-teal-600 dark:from-cyan-400 dark:to-teal-500 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 group">
            <Image
              src="/logo.svg"
              alt="AquaMonitor Logo"
              width={120}
              height={60}
              className="filter brightness-0 invert group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6 space-y-2 sidebar-content">
        {/* Main Navigation */}
        <div className="space-y-1">
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-cyan-300 dark:sidebar-text-muted uppercase tracking-wider sidebar-section-title">
              Navigation Principale
            </h3>
          </div>
          <SidebarMenu>
            {items.slice(0, 2).map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url}
                  tooltip={item.title}
                  className="h-12 rounded-xl sidebar-menu-item transition-all duration-200 hover:bg-gradient-to-r hover:from-cyan-100/80 hover:to-teal-100/60 dark:hover:from-cyan-900/40 dark:hover:to-teal-900/30 hover:shadow-sm data-[active=true]:bg-gradient-to-r data-[active=true]:from-cyan-500 data-[active=true]:to-teal-600 dark:data-[active=true]:from-cyan-400 dark:data-[active=true]:to-teal-500 data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:scale-[1.02] mb-1 border border-transparent hover:border-cyan-200/50 dark:hover:border-cyan-700/50"
                >
                  <Link
                    href={item.url}
                    className={`flex items-center gap-4 px-3 ${
                      language === "ar" ? "flex-row-reverse text-right" : ""
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                        pathname === item.url
                          ? "bg-white/20"
                          : "group-hover:bg-cyan-500/10 dark:group-hover:bg-cyan-400/20"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-sm">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>

        {/* Role-specific Navigation */}
        {items.length > 2 && (
          <div className="space-y-1">
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-cyan-300 dark:sidebar-text-muted uppercase tracking-wider sidebar-section-title">
                Gestion
              </h3>
            </div>
            <SidebarMenu>
              {items.slice(2, -2).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className="h-12 rounded-xl sidebar-menu-item transition-all duration-200 hover:bg-gradient-to-r hover:from-cyan-100/80 hover:to-teal-100/60 dark:hover:from-cyan-900/40 dark:hover:to-teal-900/30 hover:shadow-sm data-[active=true]:bg-gradient-to-r data-[active=true]:from-cyan-500 data-[active=true]:to-teal-600 dark:data-[active=true]:from-cyan-400 dark:data-[active=true]:to-teal-500 data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:scale-[1.02] mb-1 border border-transparent hover:border-cyan-200/50 dark:hover:border-cyan-700/50"
                  >
                    <Link
                      href={item.url}
                      className={`flex items-center gap-4 px-3 ${
                        language === "ar" ? "flex-row-reverse text-right" : ""
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                          pathname === item.url
                            ? "bg-white/20"
                            : "group-hover:bg-cyan-500/10 dark:group-hover:bg-cyan-400/20"
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        )}

        {/* System Navigation */}
        <div className="space-y-1">
          <div className="px-3 py-2">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-cyan-300 dark:sidebar-text-muted uppercase tracking-wider sidebar-section-title">
              Système
            </h3>
          </div>
          <SidebarMenu>
            {items.slice(-2).map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.url}
                  tooltip={item.title}
                  className="h-12 rounded-xl sidebar-menu-item transition-all duration-200 hover:bg-gradient-to-r hover:from-cyan-100/80 hover:to-teal-100/60 dark:hover:from-cyan-900/40 dark:hover:to-teal-900/30 hover:shadow-sm data-[active=true]:bg-gradient-to-r data-[active=true]:from-cyan-500 data-[active=true]:to-teal-600 dark:data-[active=true]:from-cyan-400 dark:data-[active=true]:to-teal-500 data-[active=true]:text-white data-[active=true]:shadow-md data-[active=true]:scale-[1.02] mb-1 border border-transparent hover:border-cyan-200/50 dark:hover:border-cyan-700/50"
                >
                  <Link
                    href={item.url}
                    className={`flex items-center gap-4 px-3 ${
                      language === "ar" ? "flex-row-reverse text-right" : ""
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                        pathname === item.url
                          ? "bg-white/20"
                          : "group-hover:bg-cyan-500/10 dark:group-hover:bg-cyan-400/20"
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-sm">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-cyan-200/30 dark:border-cyan-800/40 bg-gradient-to-br from-cyan-50/50 to-teal-50/30 dark:bg-gradient-to-br dark:from-slate-900/50 dark:to-cyan-900/30 dark:sidebar-footer-bg">
        <div className="space-y-3">
          {/* User info */}
          {user && (
            <div
              className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-white/60 to-cyan-50/80 dark:bg-gradient-to-r dark:from-slate-800/60 dark:to-cyan-900/80 dark:sidebar-user-card backdrop-blur-sm border border-cyan-200/30 dark:border-cyan-700/30 shadow-sm group-data-[collapsible=icon]:justify-center ${
                language === "ar" ? "flex-row-reverse" : ""
              }`}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 dark:from-cyan-400 dark:to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                {user.firstName?.charAt(0) || user.email.charAt(0)}
              </div>
              <div
                className={`group-data-[collapsible=icon]:hidden flex-1 ${
                  language === "ar" ? "text-right" : ""
                }`}
              >
                <p className="font-semibold text-slate-700 dark:text-slate-200 dark:sidebar-text-primary text-sm">
                  {user.firstName} {user.lastName}
                </p>
                <Badge
                  className={`${getRoleColor(
                    user.role
                  )} text-xs mt-1 shadow-sm border-0 ${
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
            className={`w-full rounded-xl border-red-200 dark:border-red-800/50 bg-gradient-to-r from-red-50/80 to-rose-50/60 dark:from-red-900/30 dark:to-rose-900/20 text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-100 hover:to-rose-100 dark:hover:from-red-800/40 dark:hover:to-rose-800/30 hover:text-red-700 dark:hover:text-red-300 hover:shadow-sm transition-all duration-200 ${
              language === "ar" ? "flex-row-reverse" : ""
            }`}
          >
            <LogOut
              className={`h-4 w-4 group-data-[collapsible=icon]:mr-0 ${
                language === "ar" ? "ml-2" : "mr-2"
              }`}
            />
            <span className="group-data-[collapsible=icon]:hidden font-medium">
              {language === "ar" ? "تسجيل الخروج" : "Déconnexion"}
            </span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
