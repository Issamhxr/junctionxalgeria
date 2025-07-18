"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Waves,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Thermometer,
  Droplets,
  Activity,
  Search,
  Filter,
} from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient, Basin } from "@/lib/api";
import Link from "next/link";

export default function BasinsPage() {
  const { user } = useAuth();
  const [basins, setBasins] = useState<Basin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchBasins = async () => {
      try {
        setLoading(true);
        setError(null);
        // Try to fetch basins from API
        const response = await apiClient.getBasins();
        const ponds = response.data?.ponds || [];
        setBasins(ponds);
      } catch (err) {
        console.warn("Failed to fetch basins:", err);
        // Set mock basins data as fallback
        setBasins([
          {
            id: "pond1",
            name: "Bassin Principal A1",
            type: "SALTWATER",
            volume: 1000,
            depth: 3.5,
            farm: {
              id: "farm1",
              name: "Ferme Aquacole Nord",
              location: "Alger",
            },
            sensorData: [
              {
                temperature: 22.5,
                ph: 7.8,
                oxygen: 6.8,
                salinity: 34.5,
                timestamp: new Date().toISOString(),
              },
            ],
            alerts: [],
          },
          {
            id: "pond2",
            name: "Bassin Secondaire B1",
            type: "FRESHWATER",
            volume: 750,
            depth: 2.8,
            farm: {
              id: "farm1",
              name: "Ferme Aquacole Nord",
              location: "Alger",
            },
            sensorData: [
              {
                temperature: 19.2,
                ph: 7.2,
                oxygen: 8.1,
                salinity: 0.5,
                timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              },
            ],
            alerts: [],
          },
          {
            id: "pond3",
            name: "Bassin Expérimental C1",
            type: "BRACKISH",
            volume: 500,
            depth: 2.0,
            farm: {
              id: "farm2",
              name: "Ferme Aquacole Sud",
              location: "Oran",
            },
            sensorData: [
              {
                temperature: 25.1,
                ph: 8.1,
                oxygen: 5.9,
                salinity: 15.0,
                timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              },
            ],
            alerts: [
              {
                id: "alert1",
                type: "THRESHOLD_EXCEEDED",
                severity: "HIGH",
                message: "Température élevée",
                createdAt: new Date().toISOString(),
              },
            ],
          },
        ]);
        setError(null); // Clear any previous errors
      } finally {
        setLoading(false);
      }
    };

    fetchBasins();

    // Set up auto-refresh every 5 seconds instead of 1 second
    const interval = setInterval(fetchBasins, 5000);

    return () => clearInterval(interval);
  }, []);

  // Filter basins based on user role
  const getFilteredBasins = () => {
    let filtered = basins;

    // Role-based filtering
    if (user?.role === "FARMER") {
      // Farmers can only see basins from their own farm
      filtered = basins.filter((basin) => basin.farm.id === user.id);
    } else if (user?.role === "TECHNICIAN") {
      // Technicians can see basins they're assigned to
      filtered = basins.filter((basin) => basin.farm.id === user.id);
    }

    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter(
        (basin) =>
          basin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          basin.farm.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filtering
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (basin) => getBasinStatus(basin) === statusFilter
      );
    }

    return filtered;
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

  const filteredBasins = getFilteredBasins();
  const stats = {
    total: filteredBasins.length,
    normal: filteredBasins.filter((b) => getBasinStatus(b) === "normal").length,
    warning: filteredBasins.filter((b) => getBasinStatus(b) === "warning")
      .length,
    critical: filteredBasins.filter((b) => getBasinStatus(b) === "critical")
      .length,
    offline: filteredBasins.filter((b) => getBasinStatus(b) === "offline")
      .length,
  };

  // Check if user has permission to manage basins
  const canManageBasins = user?.role === "FARMER" || user?.role === "ADMIN";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {user?.role === "TECHNICIAN"
              ? "Mes Bassins"
              : "Gestion des Bassins"}
          </h1>
          <p className="text-gray-600">
            {user?.role === "TECHNICIAN"
              ? "Bassins sous votre responsabilité"
              : "Vue d'ensemble et gestion des bassins"}
          </p>
        </div>
        {canManageBasins && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Bassin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Créer un nouveau bassin</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du bassin</Label>
                  <Input id="name" placeholder="ex: Bassin Principal A" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input id="type" placeholder="ex: Production, Nurserie" />
                </div>
                <Button className="w-full">Créer le bassin</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="rounded-3xl border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-800">
                {stats.total}
              </div>
              <div className="text-sm text-blue-600">Total</div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-800">
                {stats.normal}
              </div>
              <div className="text-sm text-emerald-600">Normal</div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-amber-100 bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-800">
                {stats.warning}
              </div>
              <div className="text-sm text-amber-600">Attention</div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-red-100 bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-800">
                {stats.critical}
              </div>
              <div className="text-sm text-red-600">Critique</div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {stats.offline}
              </div>
              <div className="text-sm text-gray-600">Hors ligne</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un bassin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            size="sm"
          >
            Tous
          </Button>
          <Button
            variant={statusFilter === "normal" ? "default" : "outline"}
            onClick={() => setStatusFilter("normal")}
            size="sm"
          >
            Normal
          </Button>
          <Button
            variant={statusFilter === "warning" ? "default" : "outline"}
            onClick={() => setStatusFilter("warning")}
            size="sm"
          >
            Attention
          </Button>
          <Button
            variant={statusFilter === "critical" ? "default" : "outline"}
            onClick={() => setStatusFilter("critical")}
            size="sm"
          >
            Critique
          </Button>
        </div>
      </div>

      {/* Basins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBasins.map((basin) => {
          const status = getBasinStatus(basin);
          const latestReading = basin.sensorData?.[0];

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
                  {basin.farm.name} - {basin.farm.location}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {status !== "offline" && latestReading ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-orange-50 rounded-2xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Thermometer className="h-4 w-4 text-orange-500" />
                        <span className="text-xs font-medium text-gray-600">
                          Temp
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-800">
                        {latestReading.temperature.toFixed(1)}°C
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Droplets className="h-4 w-4 text-blue-500" />
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
                        <Activity className="h-4 w-4 text-green-500" />
                        <span className="text-xs font-medium text-gray-600">
                          O₂
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-800">
                        {latestReading.oxygen.toFixed(1)}
                      </div>
                    </div>
                    <div className="bg-teal-50 rounded-2xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Waves className="h-4 w-4 text-teal-500" />
                        <span className="text-xs font-medium text-gray-600">
                          Sal
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-800">
                        {latestReading.salinity.toFixed(1)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-2xl p-6 text-center">
                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Bassin hors ligne</p>
                  </div>
                )}

                {basin.alerts && basin.alerts.length > 0 && (
                  <div className="bg-red-50 rounded-2xl p-3 border border-red-100">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-red-700">
                        {basin.alerts.length} alerte
                        {basin.alerts.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {latestReading
                      ? new Date(latestReading.timestamp).toLocaleTimeString()
                      : "Aucune donnée"}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/basin/${basin.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                      >
                        Voir
                      </Button>
                    </Link>
                    {user?.role === "TECHNICIAN" && (
                      <Button
                        size="sm"
                        className="rounded-xl bg-blue-600 hover:bg-blue-700"
                      >
                        Mesurer
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredBasins.length === 0 && (
        <div className="text-center py-12">
          <Waves className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucun bassin trouvé</p>
        </div>
      )}
    </div>
  );
}
