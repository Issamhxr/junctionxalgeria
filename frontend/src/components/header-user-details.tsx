"use client";

import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/components/language-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "lucide-react";
import Link from "next/link";

export function HeaderUserDetails() {
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Se connecter
          </Button>
        </Link>
      </div>
    );
  }

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

  return (
    <div className="flex items-center gap-3">
      {/* Notifications */}
      <Button variant="ghost" size="sm" className="relative">
        <Bell className="h-4 w-4" />
        <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
      </Button>

      {/* User Status Indicator */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-600 font-medium">En ligne</span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-gray-500" />
          <span className="text-xs text-gray-500">
            {new Date().toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* User Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={`/avatars/${user.id}.jpg`}
                alt={user.firstName}
              />
              <AvatarFallback className="text-xs font-medium bg-blue-100 text-blue-800">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">
                  {user.firstName} {user.lastName}
                </span>
                <Badge
                  className={`${getRoleBadgeColor(
                    user.role
                  )} text-xs px-2 py-0.5 rounded-full border`}
                >
                  <span className="flex items-center gap-1">
                    {getRoleIcon(user.role)}
                    {getRoleLabel(user.role)}
                  </span>
                </Badge>
              </div>
              <span className="text-xs text-gray-500">{user.email}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={`/avatars/${user.id}.jpg`}
                    alt={user.firstName}
                  />
                  <AvatarFallback className="text-sm font-medium bg-blue-100 text-blue-800">
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
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
                )} text-xs px-2 py-1 rounded-full border w-fit`}
              >
                <span className="flex items-center gap-1">
                  {getRoleIcon(user.role)}
                  {getRoleLabel(user.role)}
                </span>
              </Badge>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Mon Profil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Paramètres</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={logout}
            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Se déconnecter</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
