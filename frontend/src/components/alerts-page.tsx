"use client";

import { useState, useEffect } from "react";
import { apiClient, Alert, Basin } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  Search,
  RefreshCw,
  Loader2,
  Bell,
  BellOff,
  Thermometer,
  Droplets,
  Activity,
  Waves,
} from "lucide-react";
import Link from "next/link";

export function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [basins, setBasins] = useState<Basin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Try to fetch real alerts from API first
        try {
          const alertsResponse = await apiClient.getAlerts();
          const realAlerts = alertsResponse.data?.alerts || [];

          // If we get real alerts, use them
          if (realAlerts.length > 0) {
            setAlerts(realAlerts);
          } else {
            // If no real alerts, use mock data
            throw new Error("No alerts from API, using mock data");
          }
        } catch (alertsError) {
          console.warn("Failed to fetch alerts from API:", alertsError);

          // Use mock alerts data as fallback
          const mockAlerts: Alert[] = [
            {
              id: "1",
              pondId: "pond1",
              farmId: "farm1",
              type: "THRESHOLD_EXCEEDED",
              severity: "HIGH",
              parameter: "temperature",
              value: 32.5,
              threshold: 30.0,
              message: "Température trop élevée dans le bassin principal",
              isRead: false,
              isResolved: false,
              createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            },
            {
              id: "2",
              pondId: "pond2",
              farmId: "farm1",
              type: "WATER_QUALITY",
              severity: "MEDIUM",
              parameter: "ph",
              value: 6.2,
              threshold: 6.5,
              message: "pH en dessous du seuil optimal",
              isRead: true,
              isResolved: false,
              createdAt: new Date(
                Date.now() - 2 * 60 * 60 * 1000
              ).toISOString(),
            },
            {
              id: "3",
              pondId: "pond3",
              farmId: "farm2",
              type: "SENSOR_MALFUNCTION",
              severity: "CRITICAL",
              message: "Capteur d'oxygène défaillant",
              isRead: false,
              isResolved: false,
              createdAt: new Date(
                Date.now() - 6 * 60 * 60 * 1000
              ).toISOString(),
            },
            {
              id: "4",
              pondId: "pond1",
              farmId: "farm1",
              type: "MAINTENANCE_DUE",
              severity: "LOW",
              message: "Maintenance préventive programmée",
              isRead: true,
              isResolved: true,
              createdAt: new Date(
                Date.now() - 24 * 60 * 60 * 1000
              ).toISOString(),
            },
          ];

          setAlerts(mockAlerts);
        }

        // Try to get basins for reference, but don't fail if it doesn't work
        setBasins([
          {
            id: "pond1",
            name: "Bassin Principal",
            type: "FRESHWATER",
            farm: {
              id: "farm1",
              name: "Ferme Aquacole Nord",
              location: "Alger",
            },
          },
          {
            id: "pond2",
            name: "Bassin Secondaire",
            type: "SALTWATER",
            farm: {
              id: "farm1",
              name: "Ferme Aquacole Nord",
              location: "Alger",
            },
          },
          {
            id: "pond3",
            name: "Bassin Expérimental",
            type: "BRACKISH",
            farm: {
              id: "farm2",
              name: "Ferme Aquacole Sud",
              location: "Oran",
            },
          },
        ]);

        // Try to get real basins in background (non-blocking)
        apiClient
          .getBasins()
          .then((basinsResponse) => {
            const realBasins = basinsResponse.data?.ponds || [];
            if (realBasins.length > 0) {
              setBasins(realBasins);
            }
          })
          .catch((basinsError) => {
            console.warn("Failed to fetch basins:", basinsError);
            // Already have mock data set above, so do nothing
          });
      } catch (error) {
        console.error("Error fetching alerts data:", error);
        // Even if everything fails, we'll show empty alerts
        setAlerts([]);
        setBasins([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "low":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "THRESHOLD_EXCEEDED":
        return <AlertTriangle className="h-4 w-4" />;
      case "WATER_QUALITY":
        return <Droplets className="h-4 w-4" />;
      case "SENSOR_MALFUNCTION":
        return <Activity className="h-4 w-4" />;
      case "MAINTENANCE_DUE":
        return <Clock className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getParameterIcon = (parameter?: string) => {
    switch (parameter) {
      case "temperature":
        return <Thermometer className="h-4 w-4 text-orange-500" />;
      case "ph":
        return <Droplets className="h-4 w-4 text-blue-500" />;
      case "oxygen":
        return <Activity className="h-4 w-4 text-green-500" />;
      case "salinity":
        return <Waves className="h-4 w-4 text-teal-500" />;
      default:
        return null;
    }
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

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch = alert.message
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesSeverity =
      severityFilter === "all" ||
      alert.severity.toLowerCase() === severityFilter;
    const matchesType = typeFilter === "all" || alert.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "resolved" && alert.isResolved) ||
      (statusFilter === "unresolved" && !alert.isResolved) ||
      (statusFilter === "unread" && !alert.isRead);

    return matchesSearch && matchesSeverity && matchesType && matchesStatus;
  });

  const stats = {
    total: alerts.length,
    unread: alerts.filter((a) => !a.isRead).length,
    critical: alerts.filter((a) => a.severity.toLowerCase() === "critical")
      .length,
    resolved: alerts.filter((a) => a.isResolved).length,
  };

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await apiClient.markAlertAsRead(alertId);
      setAlerts(
        alerts.map((alert) =>
          alert.id === alertId ? { ...alert, isRead: true } : alert
        )
      );
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des alertes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-blue-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Alertes</h1>
            <p className="text-gray-600 text-lg">
              Surveillance des événements et anomalies
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="rounded-xl">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl">
              <Bell className="h-4 w-4 mr-2" />
              Configurer
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-3xl border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-700">
                Total Alertes
              </CardTitle>
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800">
              {stats.total}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-orange-100 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-orange-700">
                Non lues
              </CardTitle>
              <BellOff className="h-6 w-6 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-800">
              {stats.unread}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-red-100 bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-red-700">
                Critiques
              </CardTitle>
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-800">
              {stats.critical}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-green-100 bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-700">
                Résolues
              </CardTitle>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">
              {stats.resolved}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-3xl border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <Select
              value={severityFilter}
              onValueChange={setSeverityFilter}
              className="rounded-xl"
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Sévérité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sévérités</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
              className="rounded-xl"
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="THRESHOLD_EXCEEDED">
                  Seuil dépassé
                </SelectItem>
                <SelectItem value="WATER_QUALITY">Qualité eau</SelectItem>
                <SelectItem value="SENSOR_MALFUNCTION">
                  Capteur défaillant
                </SelectItem>
                <SelectItem value="MAINTENANCE_DUE">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              className="rounded-xl"
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="unread">Non lues</SelectItem>
                <SelectItem value="unresolved">Non résolues</SelectItem>
                <SelectItem value="resolved">Résolues</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card className="rounded-3xl border-gray-100 shadow-sm">
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune alerte trouvée</p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <Card
              key={alert.id}
              className={`rounded-3xl border-gray-100 shadow-sm hover:shadow-md transition-shadow ${
                !alert.isRead ? "bg-blue-50 border-blue-200" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(alert.type)}
                      {alert.parameter && getParameterIcon(alert.parameter)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800">
                          {alert.message}
                        </h3>
                        {!alert.isRead && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">
                            Nouveau
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span>Type: {alert.type.replace("_", " ")}</span>
                        {alert.parameter && (
                          <span>Paramètre: {alert.parameter}</span>
                        )}
                        {alert.value && alert.threshold && (
                          <span>
                            Valeur: {alert.value} (seuil: {alert.threshold})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>Il y a {getTimeAgo(alert.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`${getSeverityColor(
                        alert.severity
                      )} rounded-full px-3 py-1 text-xs font-medium border`}
                    >
                      {alert.severity}
                    </Badge>
                    {alert.isResolved && (
                      <Badge className="bg-green-100 text-green-700 rounded-full px-3 py-1 text-xs font-medium border border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Résolu
                      </Badge>
                    )}
                    <div className="flex gap-2">
                      {!alert.isRead && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsRead(alert.id)}
                          className="rounded-xl"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Marquer lu
                        </Button>
                      )}
                      <Link href={`/basin/${alert.pondId}`}>
                        <Button
                          size="sm"
                          className="rounded-xl bg-blue-600 hover:bg-blue-700"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir bassin
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
