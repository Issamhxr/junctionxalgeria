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

  // Get navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      {
        title: t("nav.dashboard"),
        url: "/",
        icon: LayoutDashboard,
        roles: ["ADMIN", "FARMER", "TECHNICIAN", "VIEWER"],
      },
      {
        title: t("nav.alerts"),
        url: "/alerts",
        icon: AlertTriangle,
        roles: ["ADMIN", "FARMER", "TECHNICIAN", "VIEWER"],
      },
    ];

    const roleSpecificItems = [];

    // Admin specific items
    if (user?.role === "ADMIN") {
      roleSpecificItems.push(
        {
          title: language === "ar" ? "المراكز" : "Centres",
          url: "/centres",
          icon: Building,
          roles: ["ADMIN"],
        },
        {
          title: language === "ar" ? "التقارير" : "Reports",
          url: "/reports",
          icon: BarChart3,
          roles: ["ADMIN"],
        }
      );
    }

    // Farmer specific items
    if (user?.role === "FARMER") {
      roleSpecificItems.push(
        {
          title: t("nav.basins"),
          url: "/basins",
          icon: Waves,
          roles: ["FARMER"],
        },
        {
          title: language === "ar" ? "إدخال البيانات" : "Data Entry",
          url: "/data-entry",
          icon: Database,
          roles: ["FARMER"],
        }
      );
    }

    // Technician specific items
    if (user?.role === "TECHNICIAN") {
      roleSpecificItems.push(
        {
          title: t("nav.basins"),
          url: "/basins",
          icon: Waves,
          roles: ["TECHNICIAN"],
        },
        {
          title: language === "ar" ? "الصيانة" : "Maintenance",
          url: "/maintenance",
          icon: Settings,
          roles: ["TECHNICIAN"],
        }
      );
    }

    // Viewer specific items
    if (user?.role === "VIEWER") {
      roleSpecificItems.push({
        title: t("nav.basins"),
        url: "/basins",
        icon: Waves,
        roles: ["VIEWER"],
      });
    }

    // Always include settings as the last item
    const settingsItem = {
      title: t("nav.settings"),
      url: "/settings",
      icon: Settings,
      roles: ["ADMIN", "FARMER", "TECHNICIAN", "VIEWER"],
    };

    // Combine all items and limit to 5 for mobile
    const allItems = [...baseItems, ...roleSpecificItems];

    // Take first 4 items + settings
    const mobileItems = allItems.slice(0, 4);
    mobileItems.push(settingsItem);

    return mobileItems.slice(0, 5); // Ensure max 5 items
  };

  const items = getNavigationItems();

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg md:hidden ${
        language === "ar" ? "rtl" : ""
      }`}
    >
      <div
        className={`flex items-center justify-around px-2 py-2 ${
          language === "ar" ? "flex-row-reverse" : ""
        }`}
      >
        {items.map((item) => {
          const isActive = pathname === item.url;
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
                {item.title === t("nav.alerts") && (
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
