"use client";

import {
  LayoutDashboard,
  Waves,
  AlertTriangle,
  Settings,
  Building,
  Users,
  MapPin,
  Database,
  BarChart3,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/components/language-context";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { language, t } = useLanguage();

  // Standardized navigation items by role - Fixed items that don't change
  const getStandardNavigationByRole = () => {
    switch (user?.role) {
      case "ADMIN":
        return [
          {
            title: "Accueil",
            url: "/",
            icon: LayoutDashboard,
          },
          {
            title: "Centres",
            url: "/centres",
            icon: Building,
          },
          {
            title: "Capteurs",
            url: "/sensor-data",
            icon: Activity,
          },
          {
            title: "Alertes",
            url: "/alerts",
            icon: AlertTriangle,
          },
          {
            title: "Paramètres",
            url: "/settings",
            icon: Settings,
          },
        ];

      case "CENTRE_CHIEF":
        return [
          {
            title: "Accueil",
            url: "/",
            icon: LayoutDashboard,
          },
          {
            title: "Mes Bases",
            url: "/bases",
            icon: MapPin,
          },
          {
            title: "Capteurs",
            url: "/sensor-data",
            icon: Activity,
          },
          {
            title: "Alertes",
            url: "/alerts",
            icon: AlertTriangle,
          },
          {
            title: "Paramètres",
            url: "/settings",
            icon: Settings,
          },
        ];

      case "BASE_CHIEF":
        return [
          {
            title: "Accueil",
            url: "/",
            icon: LayoutDashboard,
          },
          {
            title: "Bassins",
            url: "/basins",
            icon: Waves,
          },
          {
            title: "Capteurs",
            url: "/sensor-data",
            icon: Activity,
          },
          {
            title: "Alertes",
            url: "/alerts",
            icon: AlertTriangle,
          },
          {
            title: "Paramètres",
            url: "/settings",
            icon: Settings,
          },
        ];

      case "OPERATOR":
        return [
          {
            title: "Accueil",
            url: "/",
            icon: LayoutDashboard,
          },
          {
            title: "Bassins",
            url: "/basins",
            icon: Waves,
          },
          {
            title: "Capteurs",
            url: "/sensor-data",
            icon: Activity,
          },
          {
            title: "Saisie",
            url: "/data-entry",
            icon: Database,
          },
          {
            title: "Paramètres",
            url: "/settings",
            icon: Settings,
          },
        ];

      default:
        // Fallback navigation for any undefined roles
        return [
          {
            title: "Accueil",
            url: "/",
            icon: LayoutDashboard,
          },
          {
            title: "Capteurs",
            url: "/sensor-data",
            icon: Activity,
          },
          {
            title: "Alertes",
            url: "/alerts",
            icon: AlertTriangle,
          },
          {
            title: "Paramètres",
            url: "/settings",
            icon: Settings,
          },
        ];
    }
  };

  const items = getStandardNavigationByRole();

  return (
    <div
      className={`mobile-nav-fixed fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg md:hidden w-full ${
        language === "ar" ? "rtl" : ""
      }`}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        width: "100vw",
        zIndex: 100,
        transform: "translateZ(0)", // Force hardware acceleration
        backfaceVisibility: "hidden", // Prevent rendering glitches
        willChange: "transform", // Optimize for position changes
      }}
    >
      <div
        className={`flex items-center justify-around px-2 py-2 ${
          language === "ar" ? "flex-row-reverse" : ""
        }`}
      >
        {items.map((item) => {
          const isActive = pathname === item.url;
          const hasAlertBadge = item.title === "Alertes";

          return (
            <Link
              key={item.title}
              href={item.url}
              className={cn(
                "flex flex-col items-center justify-center p-2 min-w-0 flex-1 rounded-lg transition-colors duration-200",
                isActive
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              <div className="relative">
                <item.icon className="h-6 w-6 mb-1" />
                {hasAlertBadge && (
                  <Badge
                    className={`absolute h-4 w-4 p-0 flex items-center justify-center text-xs bg-red-500 dark:bg-red-600 border-0 ${
                      language === "ar" ? "-top-2 -left-2" : "-top-2 -right-2"
                    }`}
                  >
                    3
                  </Badge>
                )}
              </div>
              <span
                className={`text-xs font-medium truncate max-w-full ${
                  language === "ar" ? "text-center" : ""
                }`}
              >
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
