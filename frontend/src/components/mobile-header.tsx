"use client";

import { Bell, Menu, User, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/components/language-context";
import { useTheme } from "@/contexts/theme-context";
import Image from "next/image";

export function MobileHeader() {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300";
      case "FARMER":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300";
      case "TECHNICIAN":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300";
      case "VIEWER":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div
        className={`container flex h-14 items-center ${
          language === "ar" ? "flex-row-reverse" : ""
        }`}
      >
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 w-7 p-0 ${language === "ar" ? "-mr-1" : "-ml-1"}`}
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
        <div
          className={`flex items-center gap-2 ${
            language === "ar" ? "mr-4" : "ml-4"
          }`}
        >
          <Image
            src="/logo.svg"
            alt="AquaMonitor Logo"
            width={80}
            height={35}
          />
        </div>

        {/* Right side actions */}
        <div
          className={`flex items-center gap-1 ${
            language === "ar" ? "mr-auto flex-row-reverse" : "ml-auto"
          }`}
        >
          {/* Language Select */}
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-12 h-8 border-none bg-transparent hover:bg-accent p-1 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇫🇷</span>
                  <span>FR</span>
                </div>
              </SelectItem>
              <SelectItem value="ar">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇩🇿</span>
                  <span>AR</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-8 w-8 p-0 hover:bg-accent shrink-0"
            title={
              theme === "light"
                ? language === "ar"
                  ? "تفعيل الوضع المظلم"
                  : "Mode sombre"
                : language === "ar"
                ? "تفعيل الوضع المضيء"
                : "Mode clair"
            }
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative p-2 shrink-0">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <Badge
              className={`absolute h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 border-0 ${
                language === "ar" ? "-top-1 -left-1" : "-top-1 -right-1"
              }`}
            >
              3
            </Badge>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative p-1 shrink-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback
                    className={`text-xs font-medium ${getRoleColor(
                      user?.role || ""
                    )}`}
                  >
                    {user ? getInitials(user.firstName, user.lastName) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={language === "ar" ? "start" : "end"}
              className="w-56"
            >
              <DropdownMenuLabel>
                <div
                  className={`flex flex-col space-y-1 ${
                    language === "ar" ? "items-end" : ""
                  }`}
                >
                  <p className="text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <Badge
                    className={`text-xs w-fit ${getRoleColor(
                      user?.role || ""
                    )} ${language === "ar" ? "self-end" : ""}`}
                  >
                    {user?.role}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={language === "ar" ? "flex-row-reverse" : ""}
              >
                <User
                  className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`}
                />
                <span>{language === "ar" ? "الملف الشخصي" : "Profil"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={logout}
                className={`text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950 ${
                  language === "ar" ? "flex-row-reverse" : ""
                }`}
              >
                <span>
                  {language === "ar" ? "تسجيل الخروج" : "Se déconnecter"}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
