"use client";
import {
  Thermometer,
  Droplets,
  Activity,
  Waves,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-context";

// Mock data for basins
const mockBasins = [
  {
    id: "B001",
    name: "Bassin Principal A",
    status: "normal",
    temperature: 24.5,
    ph: 7.2,
    oxygen: 8.5,
    salinity: 0.5,
    lastUpdate: "2 min",
    alerts: 0,
  },
  {
    id: "B002",
    name: "Bassin Principal B",
    status: "warning",
    temperature: 28.2,
    ph: 6.8,
    oxygen: 6.2,
    salinity: 0.7,
    lastUpdate: "5 min",
    alerts: 2,
  },
  {
    id: "B003",
    name: "Bassin Nurserie",
    status: "critical",
    temperature: 31.5,
    ph: 8.5,
    oxygen: 4.1,
    salinity: 1.2,
    lastUpdate: "1 min",
    alerts: 4,
  },
  {
    id: "B004",
    name: "Bassin Quarantaine",
    status: "normal",
    temperature: 25.1,
    ph: 7.4,
    oxygen: 8.8,
    salinity: 0.4,
    lastUpdate: "3 min",
    alerts: 0,
  },
  {
    id: "B005",
    name: "Bassin Reproduction",
    status: "offline",
    temperature: 0,
    ph: 0,
    oxygen: 0,
    salinity: 0,
    lastUpdate: "2h",
    alerts: 1,
  },
  {
    id: "B006",
    name: "Bassin Croissance",
    status: "normal",
    temperature: 26.3,
    ph: 7.1,
    oxygen: 7.9,
    salinity: 0.6,
    lastUpdate: "4 min",
    alerts: 0,
  },
];

export function DashboardHome() {
  const { t } = useLanguage();

  const stats = {
    totalBasins: mockBasins.length,
    activeAlerts: mockBasins.reduce((sum, basin) => sum + basin.alerts, 0),
    normalStatus: mockBasins.filter((basin) => basin.status === "normal")
      .length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "warning":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "offline":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "normal":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "critical":
        return <AlertTriangle className="h-4 w-4" />;
      case "offline":
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getParameterIcon = (param: string) => {
    switch (param) {
      case "temperature":
        return <Thermometer className="h-5 w-5 text-orange-500" />;
      case "ph":
        return <Droplets className="h-5 w-5 text-blue-500" />;
      case "oxygen":
        return <Activity className="h-5 w-5 text-green-500" />;
      case "salinity":
        return <Waves className="h-5 w-5 text-teal-500" />;
      default:
        return <Droplets className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-blue-100">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          {t("dashboard.title")}
        </h1>
        <p className="text-gray-600 text-lg">{t("dashboard.subtitle")}</p>
        <div className="mt-4 text-sm text-gray-500">
          {t("dashboard.last.update")}: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">
              {t("dashboard.total.basins")}
            </CardTitle>
            <Waves className="h-8 w-8 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-800">
              {stats.totalBasins}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-amber-100 bg-gradient-to-br from-amber-50 to-amber-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-amber-700">
              {t("dashboard.active.alerts")}
            </CardTitle>
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-amber-800">
              {stats.activeAlerts}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-emerald-700">
              {t("dashboard.normal.status")}
            </CardTitle>
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-800">
              {stats.normalStatus}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Basins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockBasins.map((basin) => (
          <Card
            key={basin.id}
            className="rounded-3xl border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-800">
                  {basin.name}
                </CardTitle>
                <Badge
                  className={`${getStatusColor(
                    basin.status
                  )} rounded-full px-3 py-1 text-xs font-medium border`}
                >
                  {getStatusIcon(basin.status)}
                  <span className="ml-2">{t(`status.${basin.status}`)}</span>
                </Badge>
              </div>
              <div className="text-sm text-gray-500">ID: {basin.id}</div>
            </CardHeader>

            <CardContent className="space-y-4">
              {basin.status !== "offline" ? (
                <>
                  {/* Parameters Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-orange-50 rounded-2xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        {getParameterIcon("temperature")}
                        <span className="text-xs font-medium text-gray-600">
                          {t("param.temperature")}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-800">
                        {basin.temperature}
                        {t("unit.celsius")}
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-2xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        {getParameterIcon("ph")}
                        <span className="text-xs font-medium text-gray-600">
                          {t("param.ph")}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-800">
                        {basin.ph}
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-2xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        {getParameterIcon("oxygen")}
                        <span className="text-xs font-medium text-gray-600">
                          {t("param.oxygen")}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-800">
                        {basin.oxygen} {t("unit.oxygen")}
                      </div>
                    </div>

                    <div className="bg-teal-50 rounded-2xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        {getParameterIcon("salinity")}
                        <span className="text-xs font-medium text-gray-600">
                          {t("param.salinity")}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-800">
                        {basin.salinity} {t("unit.salinity")}
                      </div>
                    </div>
                  </div>

                  {/* Alerts */}
                  {basin.alerts > 0 && (
                    <div className="bg-red-50 rounded-2xl p-3 border border-red-100">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-700">
                          {basin.alerts} alerte{basin.alerts > 1 ? "s" : ""}{" "}
                          active{basin.alerts > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-6 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Bassin hors ligne</p>
                  <p className="text-sm text-gray-500">
                    Dernière connexion: {basin.lastUpdate}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Mis à jour il y a {basin.lastUpdate}
                </div>
                <Link href={`/basin/${basin.id}`}>
                  <Button
                    size="sm"
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {t("common.view")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
