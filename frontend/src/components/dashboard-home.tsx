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
  Loader2,
  Building,
  MapPin,
  Users,
  Database,
  TrendingUp,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-context";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, Basin, Alert } from "@/lib/api";

export function DashboardHome() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [basins, setBasins] = useState<Basin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const basinsData = await apiClient.getBasins();
        setBasins(basinsData);
        setError(null);
      } catch (err) {
        console.error("Error fetching basins:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getBasinStatus = (basin: Basin) => {
    if (basin.readings.length === 0) return "offline";

    const latestReading = basin.readings[0];
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
      latestReading.salinity > 35
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
      latestReading.salinity > 30
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

  // Filter basins based on user role
  const getFilteredBasins = () => {
    if (!user) return basins;

    switch (user.role) {
      case "ADMIN":
        return basins; // Admin sees all basins
      case "CENTRE_CHIEF":
        return basins.filter((basin) => basin.base.centre.id === user.centreId);
      case "BASE_CHIEF":
        return basins.filter((basin) => basin.base.id === user.baseId);
      case "OPERATOR":
        return basins.filter((basin) => basin.base.id === user.baseId);
      default:
        return basins;
    }
  };

  const filteredBasins = getFilteredBasins();

  const stats = {
    totalBasins: filteredBasins.length,
    activeAlerts: filteredBasins.reduce(
      (sum, basin) => sum + basin.alerts.length,
      0
    ),
    normalStatus: filteredBasins.filter(
      (basin) => getBasinStatus(basin) === "normal"
    ).length,
    criticalStatus: filteredBasins.filter(
      (basin) => getBasinStatus(basin) === "critical"
    ).length,
    warningStatus: filteredBasins.filter(
      (basin) => getBasinStatus(basin) === "warning"
    ).length,
    offlineStatus: filteredBasins.filter(
      (basin) => getBasinStatus(basin) === "offline"
    ).length,
  };

  // Role-specific stats
  const getRoleSpecificStats = () => {
    switch (user?.role) {
      case "ADMIN":
        return [
          {
            title: "Total Centres",
            value: new Set(basins.map((b) => b.base.centre.id)).size,
            icon: Building,
            color: "from-purple-50 to-purple-100",
            textColor: "text-purple-700",
            iconColor: "text-purple-600",
          },
          {
            title: "Total Bases",
            value: new Set(basins.map((b) => b.base.id)).size,
            icon: MapPin,
            color: "from-indigo-50 to-indigo-100",
            textColor: "text-indigo-700",
            iconColor: "text-indigo-600",
          },
          {
            title: "Taux Normal",
            value: `${Math.round(
              (stats.normalStatus / stats.totalBasins) * 100
            )}%`,
            icon: TrendingUp,
            color: "from-green-50 to-green-100",
            textColor: "text-green-700",
            iconColor: "text-green-600",
          },
        ];
      case "CENTRE_CHIEF":
        return [
          {
            title: "Mes Bases",
            value: new Set(filteredBasins.map((b) => b.base.id)).size,
            icon: MapPin,
            color: "from-blue-50 to-blue-100",
            textColor: "text-blue-700",
            iconColor: "text-blue-600",
          },
          {
            title: "Opérateurs",
            value: "12", // This would come from API
            icon: Users,
            color: "from-cyan-50 to-cyan-100",
            textColor: "text-cyan-700",
            iconColor: "text-cyan-600",
          },
          {
            title: "Performance",
            value: `${Math.round(
              (stats.normalStatus / stats.totalBasins) * 100
            )}%`,
            icon: TrendingUp,
            color: "from-green-50 to-green-100",
            textColor: "text-green-700",
            iconColor: "text-green-600",
          },
        ];
      case "BASE_CHIEF":
        return [
          {
            title: "Mes Bassins",
            value: filteredBasins.length,
            icon: Waves,
            color: "from-teal-50 to-teal-100",
            textColor: "text-teal-700",
            iconColor: "text-teal-600",
          },
          {
            title: "Opérateurs",
            value: "5", // This would come from API
            icon: Users,
            color: "from-orange-50 to-orange-100",
            textColor: "text-orange-700",
            iconColor: "text-orange-600",
          },
          {
            title: "Mesures/Jour",
            value: "24",
            icon: Database,
            color: "from-violet-50 to-violet-100",
            textColor: "text-violet-700",
            iconColor: "text-violet-600",
          },
        ];
      case "OPERATOR":
        return [
          {
            title: "Mes Bassins",
            value: filteredBasins.length,
            icon: Waves,
            color: "from-emerald-50 to-emerald-100",
            textColor: "text-emerald-700",
            iconColor: "text-emerald-600",
          },
          {
            title: "Mesures Aujourd'hui",
            value: "8",
            icon: Database,
            color: "from-yellow-50 to-yellow-100",
            textColor: "text-yellow-700",
            iconColor: "text-yellow-600",
          },
          {
            title: "Prochaine Mesure",
            value: "14:30",
            icon: Clock,
            color: "from-pink-50 to-pink-100",
            textColor: "text-pink-700",
            iconColor: "text-pink-600",
          },
        ];
      default:
        return [];
    }
  };

  const roleStats = getRoleSpecificStats();

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

  const getRoleTitle = () => {
    switch (user?.role) {
      case "ADMIN":
        return "Tableau de Bord Administrateur";
      case "CENTRE_CHIEF":
        return "Tableau de Bord Chef de Centre";
      case "BASE_CHIEF":
        return "Tableau de Bord Chef de Base";
      case "OPERATOR":
        return "Tableau de Bord Opérateur";
      default:
        return "Tableau de Bord";
    }
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3">
              {getRoleTitle()}
            </h1>
            <p className="text-gray-600 text-lg">
              {user?.role === "ADMIN" &&
                "Vue d'ensemble de tous les centres et bases"}
              {user?.role === "CENTRE_CHIEF" &&
                `Centre: ${user.centreId ? "Mon Centre" : "Non assigné"}`}
              {user?.role === "BASE_CHIEF" &&
                `Base: ${user.baseId ? "Ma Base" : "Non assigné"}`}
              {user?.role === "OPERATOR" &&
                `Base: ${user.baseId ? "Ma Base" : "Non assigné"}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-4 py-2">
              {user?.role === "ADMIN" && <Shield className="h-4 w-4 mr-2" />}
              {user?.role === "CENTRE_CHIEF" && (
                <Building className="h-4 w-4 mr-2" />
              )}
              {user?.role === "BASE_CHIEF" && (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              {user?.role === "OPERATOR" && <Users className="h-4 w-4 mr-2" />}
              {user?.name}
            </Badge>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          Dernière mise à jour: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">
              Total Bassins
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
              Alertes Actives
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
              État Normal
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

      {/* Role-specific Stats */}
      {roleStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roleStats.map((stat, index) => (
            <Card
              key={index}
              className={`rounded-3xl border-gray-100 bg-gradient-to-br ${stat.color} shadow-sm`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className={`text-sm font-medium ${stat.textColor}`}>
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-8 w-8 ${stat.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Status Overview */}
      <Card className="rounded-3xl border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800">
            Aperçu des États
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-emerald-50 rounded-2xl">
              <div className="text-2xl font-bold text-emerald-700">
                {stats.normalStatus}
              </div>
              <div className="text-sm text-emerald-600">Normal</div>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-2xl">
              <div className="text-2xl font-bold text-amber-700">
                {stats.warningStatus}
              </div>
              <div className="text-sm text-amber-600">Attention</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-2xl">
              <div className="text-2xl font-bold text-red-700">
                {stats.criticalStatus}
              </div>
              <div className="text-sm text-red-600">Critique</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-2xl">
              <div className="text-2xl font-bold text-gray-700">
                {stats.offlineStatus}
              </div>
              <div className="text-sm text-gray-600">Hors ligne</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBasins.map((basin) => {
          const status = getBasinStatus(basin);
          const latestReading = basin.readings[0];

          return (
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
                      status
                    )} rounded-full px-3 py-1 text-xs font-medium border`}
                  >
                    {getStatusIcon(status)}
                    <span className="ml-2">{status}</span>
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  {basin.base.name} - {basin.base.centre.name}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {status !== "offline" && latestReading ? (
                  <>
                    {/* Parameters Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-orange-50 rounded-2xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          {getParameterIcon("temperature")}
                          <span className="text-xs font-medium text-gray-600">
                            Température
                          </span>
                        </div>
                        <div className="text-lg font-bold text-gray-800">
                          {latestReading.temperature.toFixed(1)}°C
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-2xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          {getParameterIcon("ph")}
                          <span className="text-xs font-medium text-gray-600">
                            pH
                          </span>
                        </div>
                        <div className="text-lg font-bold text-gray-800">
                          {latestReading.ph.toFixed(1)}
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-2xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          {getParameterIcon("oxygen")}
                          <span className="text-xs font-medium text-gray-600">
                            O₂
                          </span>
                        </div>
                        <div className="text-lg font-bold text-gray-800">
                          {latestReading.oxygen.toFixed(1)} mg/L
                        </div>
                      </div>

                      <div className="bg-teal-50 rounded-2xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          {getParameterIcon("salinity")}
                          <span className="text-xs font-medium text-gray-600">
                            Salinité
                          </span>
                        </div>
                        <div className="text-lg font-bold text-gray-800">
                          {latestReading.salinity.toFixed(1)} ppt
                        </div>
                      </div>
                    </div>

                    {/* Alerts */}
                    {basin.alerts.length > 0 && (
                      <div className="bg-red-50 rounded-2xl p-3 border border-red-100">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-medium text-red-700">
                            {basin.alerts.length} alerte
                            {basin.alerts.length > 1 ? "s" : ""} active
                            {basin.alerts.length > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-gray-50 rounded-2xl p-6 text-center">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">
                      Bassin hors ligne
                    </p>
                    <p className="text-sm text-gray-500">
                      {basin.readings.length > 0
                        ? `Dernière mesure: ${getTimeAgo(
                            basin.readings[0].timestamp
                          )}`
                        : "Aucune mesure disponible"}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {latestReading
                      ? `Mis à jour il y a ${getTimeAgo(
                          latestReading.timestamp
                        )}`
                      : "Aucune donnée"}
                  </div>
                  <Link href={`/basin/${basin.id}`}>
                    <Button
                      size="sm"
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
