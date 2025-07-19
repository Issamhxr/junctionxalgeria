"use client";

import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/components/language-context";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  User,
  Settings,
  LogOut,
  Bell,
  Shield,
  Clock,
  ChevronDown,
  Circle,
  Sun,
  Moon,
  Languages,
} from "lucide-react";
import Link from "next/link";

export function HeaderUserDetails() {
  const { user, logout, isAuthenticated } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800 border-red-200";
      case "FARMER":
        return "bg-green-100 text-green-800 border-green-200";
      case "TECHNICIAN":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "VIEWER":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="h-3 w-3" />;
      case "FARMER":
        return <User className="h-3 w-3" />;
      case "TECHNICIAN":
        return <Settings className="h-3 w-3" />;
      case "VIEWER":
        return <Circle className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrateur";
      case "FARMER":
        return "Fermier";
      case "TECHNICIAN":
        return "Technicien";
      case "VIEWER":
        return "Visualiseur";
      default:
        return role;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (!isAuthenticated || !user) {
    return (
      <div
        className={`flex items-center gap-3 ${
          language === "ar" ? "flex-row-reverse" : ""
        }`}
      >
        {/* Language Select */}
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-16 h-8 border-none bg-transparent hover:bg-accent">
            <div
              className={`flex items-center gap-1 ${
                language === "ar" ? "flex-row-reverse" : ""
              }`}
            >
              <Languages className="h-3 w-3" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fr">
              <div className="flex items-center gap-2">
                <span className="text-sm">🇫🇷</span>
              </div>
            </SelectItem>
            <SelectItem value="ar">
              <div className="flex items-center gap-2">
                <span className="text-sm">🇩🇿</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Dark Mode Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="h-8 w-8 p-0 shrink-0"
          title={
            theme === "light"
              ? language === "ar"
                ? "تفعيل الوضع المظلم"
                : "Activer le mode sombre"
              : language === "ar"
              ? "تفعيل الوضع المضيء"
              : "Activer le mode clair"
          }
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>

        <Link href="/login">
          <Button variant="ghost" size="sm">
            {language === "ar" ? "تسجيل الدخول" : "Se connecter"}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 ${
        language === "ar" ? "flex-row-reverse" : ""
      }`}
    >
      {/* Language Select */}
      <Select value={language} onValueChange={setLanguage}>
        <SelectTrigger className="w-16 h-8 border-none bg-transparent hover:bg-accent shrink-0">
          <div
            className={`flex items-center gap-1 ${
              language === "ar" ? "flex-row-reverse" : ""
            }`}
          >
            <Languages className="h-3 w-3" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fr">
            <div className="flex items-center gap-2">
              <span className="text-sm">🇫🇷</span>
            </div>
          </SelectItem>
          <SelectItem value="ar">
            <div className="flex items-center gap-2">
              <span className="text-sm">🇩🇿</span>
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
              : "Activer le mode sombre"
            : language === "ar"
            ? "تفعيل الوضع المضيء"
            : "Activer le mode clair"
        }
      >
        {theme === "light" ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </Button>

      {/* Notifications */}
      <Button
        variant="ghost"
        size="sm"
        className="relative h-8 w-8 p-0 shrink-0"
      >
        <Bell className="h-4 w-4" />
        <span
          className={`absolute ${
            language === "ar" ? "-top-1 -left-1" : "-top-1 -right-1"
          } h-2 w-2 bg-red-500 rounded-full animate-pulse`}
        ></span>
      </Button>

      {/* User Status Indicator */}
      <div
        className={`hidden lg:flex items-center gap-2 ${
          language === "ar" ? "flex-row-reverse" : ""
        }`}
      >
        <div
          className={`flex items-center gap-1 ${
            language === "ar" ? "flex-row-reverse" : ""
          }`}
        >
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-600 font-medium">
            {language === "ar" ? "متصل" : "En ligne"}
          </span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div
          className={`flex items-center gap-1 ${
            language === "ar" ? "flex-row-reverse" : ""
          }`}
        >
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {new Date().toLocaleTimeString(
              language === "ar" ? "ar-DZ" : "fr-FR",
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            )}
          </span>
        </div>
      </div>

      {/* User Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`flex items-center gap-2 p-2 hover:bg-accent rounded-lg ${
              language === "ar" ? "flex-row-reverse" : ""
            }`}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={`/avatars/${user.id}.jpg`}
                alt={user.firstName}
              />
              <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div
              className={`hidden xl:flex flex-col ${
                language === "ar" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`flex items-center gap-2 ${
                  language === "ar" ? "flex-row-reverse" : ""
                }`}
              >
                <span className="text-sm font-medium text-foreground">
                  {user.firstName} {user.lastName}
                </span>
                <Badge
                  className={`${getRoleBadgeColor(
                    user.role
                  )} text-xs px-2 py-0.5 rounded-full border`}
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
              <span className="text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground ${
                language === "ar" ? "rotate-180" : ""
              }`}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={language === "ar" ? "start" : "end"}
          className="w-64"
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2">
              <div
                className={`flex items-center gap-2 ${
                  language === "ar" ? "flex-row-reverse" : ""
                }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={`/avatars/${user.id}.jpg`}
                    alt={user.firstName}
                  />
                  <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`flex flex-col ${
                    language === "ar" ? "items-end" : ""
                  }`}
                >
                  <p className="text-sm font-medium leading-none">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground pt-1">
                    {user.email}
                  </p>
                </div>
              </div>
              <Badge
                className={`${getRoleBadgeColor(
                  user.role
                )} text-xs px-2 py-1 rounded-full border w-fit ${
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
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              href="/profile"
              className={`cursor-pointer ${
                language === "ar" ? "flex-row-reverse" : ""
              }`}
            >
              <User
                className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`}
              />
              <span>{language === "ar" ? "الملف الشخصي" : "Mon Profil"}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href="/settings"
              className={`cursor-pointer ${
                language === "ar" ? "flex-row-reverse" : ""
              }`}
            >
              <Settings
                className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`}
              />
              <span>{language === "ar" ? "الإعدادات" : "Paramètres"}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={logout}
            className={`cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950 ${
              language === "ar" ? "flex-row-reverse" : ""
            }`}
          >
            <LogOut
              className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`}
            />
            <span>{language === "ar" ? "تسجيل الخروج" : "Se déconnecter"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
