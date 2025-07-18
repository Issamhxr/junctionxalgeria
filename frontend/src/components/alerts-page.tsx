"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Thermometer,
  Droplets,
  Activity,
  Filter,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/components/language-context";

const mockAlerts = [
  {
    id: "A001",
    basinId: "B002",
    basinName: "Bassin Principal B",
    type: "temperature",
    level: "warning",
    message: "Température élevée détectée",
    value: "28.2°C",
    time: "14:25",
    date: "2024-01-15",
    resolved: false,
  },
  {
    id: "A002",
    basinId: "B002",
    basinName: "Bassin Principal B",
    type: "ph",
    level: "warning",
    message: "pH en dessous du seuil optimal",
    value: "6.8",
    time: "14:20",
    date: "2024-01-15",
    resolved: false,
  },
  {
    id: "A003",
    basinId: "B003",
    basinName: "Bassin Nurserie",
    type: "oxygen",
    level: "critical",
    message: "Niveau d'oxygène critique",
    value: "4.1 mg/L",
    time: "13:45",
    date: "2024-01-15",
    resolved: false,
  },
  {
    id: "A004",
    basinId: "B003",
    basinName: "Bassin Nurserie",
    type: "temperature",
    level: "critical",
    message: "Température critique atteinte",
    value: "31.5°C",
    time: "13:30",
    date: "2024-01-15",
    resolved: false,
  },
  {
    id: "A005",
    basinId: "B001",
    basinName: "Bassin Principal A",
    type: "ph",
    level: "warning",
    message: "pH légèrement élevé",
    value: "7.8",
    time: "12:15",
    date: "2024-01-14",
    resolved: true,
  },
  {
    id: "A006",
    basinId: "B005",
    basinName: "Bassin Reproduction",
    type: "oxygen",
    level: "critical",
    message: "Capteur hors ligne",
    value: "N/A",
    time: "10:00",
    date: "2024-01-14",
    resolved: true,
  },
];

export function AlertsPage() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState(mockAlerts);
  const [filterType, setFilterType] = useState("all");
  const [filterBasin, setFilterBasin] = useState("all");

  const resolveAlert = (alertId: string) => {
    setAlerts(
      alerts.map((alert) =>
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
  };

  const activeAlerts = alerts.filter((alert) => !alert.resolved);
  const resolvedAlerts = alerts.filter((alert) => alert.resolved);

  const filteredActiveAlerts = activeAlerts.filter((alert) => {
    const typeMatch = filterType === "all" || alert.type === filterType;
    const basinMatch = filterBasin === "all" || alert.basinId === filterBasin;
    return typeMatch && basinMatch;
  });

  const filteredResolvedAlerts = resolvedAlerts.filter((alert) => {
    const typeMatch = filterType === "all" || alert.type === filterType;
    const basinMatch = filterBasin === "all" || alert.basinId === filterBasin;
    return typeMatch && basinMatch;
  });

  const getAlertColor = (level: string) => {
    switch (level) {
      case "warning":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
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
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const uniqueBasins = [
    ...new Set(
      alerts.map((alert) => ({ id: alert.basinId, name: alert.basinName }))
    ),
  ];

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-blue-100">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          {t("alerts.title")}
        </h1>
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              {activeAlerts.length} alertes actives
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-sm text-gray-600">
              {resolvedAlerts.length} alertes résolues
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-3xl border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-500" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'alerte
              </label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="rounded-2xl border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">{t("alerts.all")}</SelectItem>
                  <SelectItem value="temperature">
                    {t("alerts.temperature")}
                  </SelectItem>
                  <SelectItem value="ph">{t("alerts.ph")}</SelectItem>
                  <SelectItem value="oxygen">{t("alerts.oxygen")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bassin
              </label>
              <Select value={filterBasin} onValueChange={setFilterBasin}>
                <SelectTrigger className="rounded-2xl border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all">Tous les bassins</SelectItem>
                  {uniqueBasins.map((basin) => (
                    <SelectItem key={basin.id} value={basin.id}>
                      {basin.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-gray-100 p-1">
          <TabsTrigger
            value="active"
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            {t("alerts.active")} ({filteredActiveAlerts.length})
          </TabsTrigger>
          <TabsTrigger
            value="resolved"
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {t("alerts.resolved")} ({filteredResolvedAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {filteredActiveAlerts.length === 0 ? (
            <Card className="rounded-3xl border-gray-100 shadow-sm">
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Aucune alerte active
                </h3>
                <p className="text-gray-600">
                  Tous vos bassins fonctionnent normalement.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredActiveAlerts.map((alert) => (
              <Card
                key={alert.id}
                className="rounded-3xl border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getParameterIcon(alert.type)}
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-800 text-lg">
                            {alert.message}
                          </h3>
                          <Badge
                            className={`${getAlertColor(
                              alert.level
                            )} rounded-full px-3 py-1 text-sm font-medium border`}
                          >
                            {alert.level === "warning" ? "Alerte" : "Critique"}
                          </Badge>
                        </div>
                        <div className="text-gray-600 mb-1">
                          <strong>{alert.basinName}</strong> • Valeur:{" "}
                          {alert.value}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {alert.date} à {alert.time}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => resolveAlert(alert.id)}
                      className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t("alerts.resolve")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {filteredResolvedAlerts.length === 0 ? (
            <Card className="rounded-3xl border-gray-100 shadow-sm">
              <CardContent className="p-12 text-center">
                <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Aucune alerte résolue
                </h3>
                <p className="text-gray-600">
                  Les alertes résolues apparaîtront ici.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredResolvedAlerts.map((alert) => (
              <Card
                key={alert.id}
                className="rounded-3xl border-gray-100 shadow-sm opacity-75"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {getParameterIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800">
                          {alert.message}
                        </h3>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 rounded-full px-3 py-1 text-sm font-medium border">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Résolu
                        </Badge>
                      </div>
                      <div className="text-gray-600 mb-1">
                        <strong>{alert.basinName}</strong> • Valeur:{" "}
                        {alert.value}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        {alert.date} à {alert.time}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
