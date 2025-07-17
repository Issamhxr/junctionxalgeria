"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Thermometer,
  Droplets,
  Activity,
  Waves,
  Download,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/components/language-context";

// Mock historical data
const mockHistoricalData = [
  { time: "00:00", temperature: 24.2, ph: 7.1, oxygen: 8.3, salinity: 0.5 },
  { time: "04:00", temperature: 23.8, ph: 7.2, oxygen: 8.5, salinity: 0.5 },
  { time: "08:00", temperature: 25.1, ph: 7.0, oxygen: 8.1, salinity: 0.6 },
  { time: "12:00", temperature: 26.8, ph: 6.9, oxygen: 7.8, salinity: 0.6 },
  { time: "16:00", temperature: 28.2, ph: 6.8, oxygen: 7.2, salinity: 0.7 },
  { time: "20:00", temperature: 26.5, ph: 7.1, oxygen: 7.9, salinity: 0.6 },
];

const mockAlerts = [
  {
    id: "A001",
    type: "temperature",
    level: "warning",
    message: "Température élevée détectée",
    value: "28.2°C",
    time: "14:25",
    resolved: false,
  },
  {
    id: "A002",
    type: "ph",
    level: "warning",
    message: "pH en dessous du seuil optimal",
    value: "6.8",
    time: "14:20",
    resolved: false,
  },
  {
    id: "A003",
    type: "oxygen",
    level: "critical",
    message: "Niveau d'oxygène critique",
    value: "6.2 mg/L",
    time: "13:45",
    resolved: true,
  },
];

interface BasinDetailPageProps {
  basinId: string;
}

export function BasinDetailPage({ basinId }: BasinDetailPageProps) {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState(mockAlerts);

  const basinData = {
    id: basinId,
    name: "Bassin Principal B",
    status: "warning",
    temperature: 28.2,
    ph: 6.8,
    oxygen: 6.2,
    salinity: 0.7,
    lastUpdate: "5 min",
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(
      alerts.map((alert) =>
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "warning":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

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
      case "salinity":
        return <Waves className="h-5 w-5 text-teal-500" />;
      default:
        return <Droplets className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-blue-100">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl bg-transparent border-gray-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800">
              {basinData.name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-gray-600">Statut:</span>
              <Badge
                className={`${getStatusColor(
                  basinData.status
                )} rounded-full px-3 py-1 text-sm font-medium border`}
              >
                {t(`status.${basinData.status}`)}
              </Badge>
              <span className="text-gray-500">•</span>
              <span className="text-gray-600">ID: {basinData.id}</span>
            </div>
          </div>
          <Button className="rounded-2xl bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            {t("basin.export")}
          </Button>
        </div>
      </div>

      {/* Current Values */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-3xl border-orange-100 bg-gradient-to-br from-orange-50 to-orange-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-orange-700">
              {t("param.temperature")}
            </CardTitle>
            <Thermometer className="h-6 w-6 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-800">
              {basinData.temperature}°C
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">
              {t("param.ph")}
            </CardTitle>
            <Droplets className="h-6 w-6 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800">
              {basinData.ph}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-green-100 bg-gradient-to-br from-green-50 to-green-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-green-700">
              {t("param.oxygen")}
            </CardTitle>
            <Activity className="h-6 w-6 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">
              {basinData.oxygen} mg/L
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-teal-100 bg-gradient-to-br from-teal-50 to-teal-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-teal-700">
              {t("param.salinity")}
            </CardTitle>
            <Waves className="h-6 w-6 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-800">
              {basinData.salinity} ppt
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="history" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-gray-100 p-1">
          <TabsTrigger
            value="history"
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            {t("basin.history")}
          </TabsTrigger>
          <TabsTrigger
            value="alerts"
            className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            {t("basin.alerts")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-3xl border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-orange-500" />
                  {t("param.temperature")} (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={mockHistoricalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke="#f97316"
                      strokeWidth={3}
                      dot={{ fill: "#f97316", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  {t("param.ph")} (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={mockHistoricalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ph"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  {t("param.oxygen")} (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={mockHistoricalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="oxygen"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Waves className="h-5 w-5 text-teal-500" />
                  {t("param.salinity")} (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={mockHistoricalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" stroke="#666" fontSize={12} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="salinity"
                      stroke="#14b8a6"
                      strokeWidth={3}
                      dot={{ fill: "#14b8a6", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              className="rounded-3xl border-gray-100 shadow-sm"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getParameterIcon(alert.type)}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-800">
                          {alert.message}
                        </h3>
                        <Badge
                          className={`${getAlertColor(
                            alert.level
                          )} rounded-full px-3 py-1 text-xs font-medium border`}
                        >
                          {alert.level === "warning" ? "Alerte" : "Critique"}
                        </Badge>
                        {alert.resolved && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 rounded-full px-3 py-1 text-xs font-medium border">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Résolu
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Valeur: {alert.value} • {alert.time}
                      </div>
                    </div>
                  </div>
                  {!alert.resolved && (
                    <Button
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {t("alerts.resolve")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
