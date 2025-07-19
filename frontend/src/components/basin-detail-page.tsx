"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiClient, Basin } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import {
  ArrowLeft,
  Thermometer,
  Droplets,
  Activity,
  Waves,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Settings,
  Download,
  RefreshCw,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function BasinDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [basin, setBasin] = useState<Basin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const basinId = params.id as string;

  useEffect(() => {
    const fetchBasin = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getPond(basinId);
        setBasin(response.data.pond);
        setError(null);
      } catch (err) {
        console.error("Error fetching basin:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch basin");
      } finally {
        setLoading(false);
      }
    };

    if (basinId) {
      fetchBasin();
    }
  }, [basinId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700";
      case "warning":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700";
      case "critical":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700";
      case "offline":
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600";
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

  const getBasinStatus = (basin: Basin) => {
    if (!basin.sensorData || basin.sensorData.length === 0) return "offline";

    const latestReading = basin.sensorData[0];
    const now = new Date();
    const lastUpdate = new Date(latestReading.timestamp);
    const hoursSinceUpdate =
      (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceUpdate > 2) return "offline";

    // Check for critical parameters
    if (
      latestReading.ph < 6.0 ||
      latestReading.ph > 8.5 ||
      latestReading.temperature < 18 ||
      latestReading.temperature > 30 ||
      latestReading.oxygen < 4.0 ||
      latestReading.salinity > 35 ||
      (latestReading.turbidity && latestReading.turbidity > 10) // Critical MES level
    ) {
      return "critical";
    }

    // Check for warning parameters
    if (
      latestReading.ph < 6.5 ||
      latestReading.ph > 8.0 ||
      latestReading.temperature < 20 ||
      latestReading.temperature > 28 ||
      latestReading.oxygen < 5.0 ||
      latestReading.salinity > 30 ||
      (latestReading.turbidity && latestReading.turbidity > 5) // Warning MES level
    ) {
      return "warning";
    }

    return "normal";
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}j`;
    }
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-300" />
          <p className="text-gray-600 dark:text-gray-300">
            Chargement des données du bassin...
          </p>
        </div>
      </div>
    );
  }

  if (error || !basin) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error || "Bassin non trouvé"}
          </p>
          <Link href="/basins">
            <Button>Retour aux Bassins</Button>
          </Link>
        </div>
      </div>
    );
  }

  const status = getBasinStatus(basin);
  const latestReading = basin.sensorData?.[0];

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-blue-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/basins">
              <Button variant="outline" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
                {basin.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                {basin.farm.name} - {basin.farm.location}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              className={`${getStatusColor(
                status
              )} rounded-full px-4 py-2 text-sm font-medium border`}
            >
              {getStatusIcon(status)}
              <span className="ml-2 capitalize">{status}</span>
            </Badge>
            <Button variant="outline" size="sm" className="rounded-xl">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-2xl p-4">
            <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">
              Type
            </div>
            <div className="text-lg font-semibold text-blue-800 dark:text-blue-200 capitalize">
              {basin.type}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 rounded-2xl p-4">
            <div className="text-sm text-green-600 dark:text-green-400 mb-1">
              Volume
            </div>
            <div className="text-lg font-semibold text-green-800 dark:text-green-200">
              {basin.volume || "N/A"} m³
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-2xl p-4">
            <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">
              Profondeur
            </div>
            <div className="text-lg font-semibold text-purple-800 dark:text-purple-200">
              {basin.depth || "N/A"} m
            </div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/30 rounded-2xl p-4">
            <div className="text-sm text-orange-600 dark:text-orange-400 mb-1">
              Dernière mesure
            </div>
            <div className="text-lg font-semibold text-orange-800 dark:text-orange-200">
              {latestReading ? getTimeAgo(latestReading.timestamp) : "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Current Parameters */}
      {latestReading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="rounded-3xl border-orange-100 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Température
                </CardTitle>
                <Thermometer className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-800 dark:text-orange-200 mb-1">
                {latestReading.temperature.toFixed(1)}°C
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">
                Optimal: 18-25°C
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-blue-100 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  pH
                </CardTitle>
                <Droplets className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-800 dark:text-blue-200 mb-1">
                {latestReading.ph.toFixed(1)}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Optimal: 6.5-8.5
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-green-100 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                  Oxygène
                </CardTitle>
                <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-800 dark:text-green-200 mb-1">
                {latestReading.oxygen.toFixed(1)}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                mg/L - Optimal: &gt;5.0
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-teal-100 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-teal-700 dark:text-teal-300">
                  Salinité
                </CardTitle>
                <Waves className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-800 dark:text-teal-200 mb-1">
                {latestReading.salinity.toFixed(1)}
              </div>
              <div className="text-xs text-teal-600 dark:text-teal-400">
                ppt - Selon type
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-yellow-100 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                  MES (Turbidité)
                </CardTitle>
                <Droplets className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-800 dark:text-yellow-200 mb-1">
                {latestReading.turbidity
                  ? latestReading.turbidity.toFixed(1)
                  : "N/A"}
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">
                NTU - Optimal: &lt;5.0
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {basin.alerts && basin.alerts.length > 0 && (
        <Card className="rounded-3xl border-red-100 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-red-800 dark:text-red-200 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              Alertes Actives ({basin.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {basin.alerts.map((alert, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-red-200 dark:border-red-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-red-800 dark:text-red-200">
                        {alert.message}
                      </div>
                      <div className="text-sm text-red-600 dark:text-red-400">
                        {alert.type} - Sévérité: {alert.severity}
                      </div>
                    </div>
                    <Badge className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                      {alert.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl">
          <Settings className="h-4 w-4 mr-2" />
          Configurer
        </Button>
        <Button variant="outline" className="rounded-xl">
          <Download className="h-4 w-4 mr-2" />
          Exporter Données
        </Button>
        <Button variant="outline" className="rounded-xl">
          <TrendingUp className="h-4 w-4 mr-2" />
          Historique
        </Button>
      </div>
    </div>
  );
}
