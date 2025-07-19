"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Thermometer,
  Droplets,
  Waves,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Filter,
  RefreshCw,
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Eye,
  Calendar,
  Database,
  Zap,
  WifiOff,
  LineChart,
} from "lucide-react";

interface SensorReading {
  id: string;
  pondId: string;
  pondName: string;
  farmName: string;
  sensorType: string;
  temperature?: number;
  ph?: number;
  dissolvedOxygen?: number;
  salinity?: number;
  turbidity?: number;
  ammonia?: number;
  nitrite?: number;
  nitrate?: number;
  waterLevel?: number;
  timestamp: string;
  status: "normal" | "warning" | "critical";
  quality: "good" | "fair" | "poor";
}

export function SensorDataPage() {
  const { user } = useAuth();
  const [sensorData, setSensorData] = useState<SensorReading[]>([]);
  const [filteredData, setFilteredData] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPond, setSelectedPond] = useState("all");
  const [selectedParameter, setSelectedParameter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("24h");

  // Generate mock sensor data
  useEffect(() => {
    const generateMockData = () => {
      const ponds = [
        {
          id: "pond1",
          name: "Bassin Principal A",
          farm: "Ferme Aquacole Nord",
        },
        {
          id: "pond2",
          name: "Bassin Secondaire B",
          farm: "Ferme Aquacole Nord",
        },
        {
          id: "pond3",
          name: "Bassin Expérimental C",
          farm: "Ferme Aquacole Sud",
        },
        {
          id: "pond4",
          name: "Bassin de Reproduction D",
          farm: "Ferme Aquacole Est",
        },
        {
          id: "pond5",
          name: "Bassin de Croissance E",
          farm: "Ferme Aquacole Ouest",
        },
      ];

      const mockData: SensorReading[] = [];
      const now = Date.now();

      ponds.forEach((pond) => {
        // Generate readings for the last 24 hours (every 15 minutes)
        for (let i = 0; i < 96; i++) {
          const timestamp = new Date(now - i * 15 * 60 * 1000);

          // Base values with some variation
          const temp = 22 + Math.sin(i * 0.1) * 3 + (Math.random() - 0.5) * 2;
          const ph =
            7.5 + Math.sin(i * 0.15) * 0.8 + (Math.random() - 0.5) * 0.3;
          const oxygen =
            6.5 + Math.sin(i * 0.08) * 1.5 + (Math.random() - 0.5) * 0.5;
          const salinity =
            pond.id.includes("1") || pond.id.includes("3")
              ? 34 + (Math.random() - 0.5) * 2
              : 0.5 + (Math.random() - 0.5) * 0.2;

          const getStatus = (
            temp: number,
            ph: number,
            oxygen: number
          ): "normal" | "warning" | "critical" => {
            if (temp < 18 || temp > 30 || ph < 6.5 || ph > 8.5 || oxygen < 5)
              return "critical";
            if (temp < 20 || temp > 28 || ph < 7 || ph > 8 || oxygen < 6)
              return "warning";
            return "normal";
          };

          const status = getStatus(temp, ph, oxygen);

          mockData.push({
            id: `${pond.id}-${i}`,
            pondId: pond.id,
            pondName: pond.name,
            farmName: pond.farm,
            sensorType: "MULTI_PARAMETER",
            temperature: parseFloat(temp.toFixed(1)),
            ph: parseFloat(ph.toFixed(1)),
            dissolvedOxygen: parseFloat(oxygen.toFixed(1)),
            salinity: parseFloat(salinity.toFixed(1)),
            turbidity: parseFloat((1.5 + Math.random() * 2).toFixed(1)),
            ammonia: parseFloat((0.1 + Math.random() * 0.2).toFixed(2)),
            nitrite: parseFloat((0.05 + Math.random() * 0.1).toFixed(2)),
            nitrate: parseFloat((10 + Math.random() * 15).toFixed(1)),
            waterLevel: parseFloat((2.0 + Math.random() * 0.5).toFixed(1)),
            timestamp: timestamp.toISOString(),
            status,
            quality:
              status === "normal"
                ? "good"
                : status === "warning"
                ? "fair"
                : "poor",
          });
        }
      });

      return mockData.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    };

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const data = generateMockData();
      setSensorData(data);
      setLoading(false);
      setLastUpdate(new Date());
    }, 1000);
  }, []);

  // Filter data based on selected filters
  useEffect(() => {
    let filtered = sensorData;

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.pondName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.farmName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedPond !== "all") {
      filtered = filtered.filter((item) => item.pondId === selectedPond);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    // Apply time range filter
    const now = Date.now();
    let timeLimit = now;
    switch (timeRange) {
      case "1h":
        timeLimit = now - 60 * 60 * 1000;
        break;
      case "6h":
        timeLimit = now - 6 * 60 * 60 * 1000;
        break;
      case "24h":
        timeLimit = now - 24 * 60 * 60 * 1000;
        break;
      case "7d":
        timeLimit = now - 7 * 24 * 60 * 60 * 1000;
        break;
    }
    filtered = filtered.filter(
      (item) => new Date(item.timestamp).getTime() > timeLimit
    );

    setFilteredData(filtered);
  }, [sensorData, searchTerm, selectedPond, statusFilter, timeRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
      setLastUpdate(new Date());
    }, 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "normal":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-green-100 text-green-700 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getParameterIcon = (parameter: string) => {
    switch (parameter) {
      case "temperature":
        return <Thermometer className="h-4 w-4" />;
      case "ph":
        return <Droplets className="h-4 w-4" />;
      case "dissolvedOxygen":
        return <Activity className="h-4 w-4" />;
      case "salinity":
        return <Waves className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("fr-FR");
  };

  const getTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}j`;
    }
  };

  // Get latest readings per pond for dashboard view
  const getLatestReadings = () => {
    const latest: { [pondId: string]: SensorReading } = {};
    filteredData.forEach((reading) => {
      if (
        !latest[reading.pondId] ||
        new Date(reading.timestamp) > new Date(latest[reading.pondId].timestamp)
      ) {
        latest[reading.pondId] = reading;
      }
    });
    return Object.values(latest);
  };

  // Calculate statistics
  const stats = {
    totalReadings: filteredData.length,
    activeSensors: new Set(filteredData.map((r) => r.pondId)).size,
    normalReadings: filteredData.filter((r) => r.status === "normal").length,
    warningReadings: filteredData.filter((r) => r.status === "warning").length,
    criticalReadings: filteredData.filter((r) => r.status === "critical")
      .length,
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-pulse mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Chargement des données capteurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-sm border border-blue-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">
              Données Capteurs
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm md:text-lg">
              Surveillance temps réel des paramètres aquacoles
            </p>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Dernière mise à jour: {formatTimestamp(lastUpdate.toISOString())}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-3 md:px-4 py-1 md:py-2 text-xs">
              <Activity className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              {user?.role === "ADMIN"
                ? "Administrateur"
                : user?.role === "CENTRE_CHIEF"
                ? "Chef de Centre"
                : user?.role === "BASE_CHIEF"
                ? "Chef de Base"
                : "Opérateur"}
            </Badge>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-xl w-full sm:w-auto"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Actualiser
            </Button>
            <Button className="bg-primary hover:bg-primary/90 rounded-xl w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
        <Card className="rounded-xl border-blue-100">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-blue-600 mb-1">
                  Total Mesures
                </p>
                <p className="text-lg md:text-2xl font-bold text-blue-800">
                  {stats.totalReadings}
                </p>
              </div>
              <Database className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-green-100">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-green-600 mb-1">
                  Capteurs Actifs
                </p>
                <p className="text-lg md:text-2xl font-bold text-green-800">
                  {stats.activeSensors}
                </p>
              </div>
              <Zap className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-green-100">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-green-600 mb-1">Normal</p>
                <p className="text-lg md:text-2xl font-bold text-green-800">
                  {stats.normalReadings}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-yellow-100">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-yellow-600 mb-1">
                  Attention
                </p>
                <p className="text-lg md:text-2xl font-bold text-yellow-800">
                  {stats.warningReadings}
                </p>
              </div>
              <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-red-100">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-red-600 mb-1">Critique</p>
                <p className="text-lg md:text-2xl font-bold text-red-800">
                  {stats.criticalReadings}
                </p>
              </div>
              <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl md:rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-base md:text-lg font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 md:h-5 md:w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher bassin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            <Select value={selectedPond} onValueChange={setSelectedPond}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Bassin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les bassins</SelectItem>
                {Array.from(new Set(sensorData.map((r) => r.pondId))).map(
                  (pondId) => {
                    const pond = sensorData.find((r) => r.pondId === pondId);
                    return (
                      <SelectItem key={pondId} value={pondId}>
                        {pond?.pondName}
                      </SelectItem>
                    );
                  }
                )}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="warning">Attention</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Dernière heure</SelectItem>
                <SelectItem value="6h">6 dernières heures</SelectItem>
                <SelectItem value="24h">24 dernières heures</SelectItem>
                <SelectItem value="7d">7 derniers jours</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedPond("all");
                setStatusFilter("all");
                setTimeRange("24h");
              }}
              className="rounded-xl w-full sm:col-span-2 md:col-span-1"
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 rounded-2xl">
          <TabsTrigger
            value="dashboard"
            className="rounded-xl text-xs sm:text-sm"
          >
            Tableau de Bord
          </TabsTrigger>
          <TabsTrigger
            value="realtime"
            className="rounded-xl text-xs sm:text-sm"
          >
            Temps Réel
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-xl text-xs sm:text-sm"
          >
            Historique
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="rounded-xl text-xs sm:text-sm"
          >
            Analyses
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {getLatestReadings().map((reading) => (
              <Card
                key={reading.id}
                className="rounded-xl md:rounded-2xl shadow-sm"
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base md:text-lg font-semibold break-words">
                        {reading.pondName}
                      </CardTitle>
                      <p className="text-xs md:text-sm text-gray-600">
                        {reading.farmName}
                      </p>
                    </div>
                    <Badge
                      className={`${getStatusColor(
                        reading.status
                      )} text-xs w-fit`}
                    >
                      {getStatusIcon(reading.status)}
                      <span className="ml-1">{reading.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="bg-orange-50 p-2 md:p-3 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <Thermometer className="h-3 w-3 text-orange-500" />
                        <span className="text-xs font-medium">Température</span>
                      </div>
                      <div className="text-sm md:text-lg font-bold">
                        {reading.temperature}°C
                      </div>
                    </div>

                    <div className="bg-blue-50 p-2 md:p-3 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <Droplets className="h-3 w-3 text-blue-500" />
                        <span className="text-xs font-medium">pH</span>
                      </div>
                      <div className="text-sm md:text-lg font-bold">
                        {reading.ph}
                      </div>
                    </div>

                    <div className="bg-green-50 p-2 md:p-3 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <Activity className="h-3 w-3 text-green-500" />
                        <span className="text-xs font-medium">Oxygène</span>
                      </div>
                      <div className="text-sm md:text-lg font-bold">
                        {reading.dissolvedOxygen} mg/L
                      </div>
                    </div>

                    <div className="bg-teal-50 p-2 md:p-3 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <Waves className="h-3 w-3 text-teal-500" />
                        <span className="text-xs font-medium">Salinité</span>
                      </div>
                      <div className="text-sm md:text-lg font-bold">
                        {reading.salinity} ppt
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-3 border-t space-y-2 sm:space-y-0">
                    <div className="text-xs text-gray-500">
                      MAJ: {getTimeAgo(reading.timestamp)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg w-full sm:w-auto"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-4 md:space-y-6">
          <Card className="rounded-2xl md:rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Activity className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                Données en Temps Réel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 md:space-y-4">
                {filteredData.slice(0, 20).map((reading) => (
                  <div
                    key={reading.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between p-3 md:p-4 bg-gray-50 rounded-xl space-y-2 md:space-y-0"
                  >
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 sm:mb-1">
                        <span className="font-medium text-sm md:text-base">
                          {reading.pondName}
                        </span>
                        <Badge
                          className={`${getStatusColor(
                            reading.status
                          )} text-xs w-fit`}
                        >
                          {reading.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4 text-xs md:text-sm">
                        <span>T: {reading.temperature}°C</span>
                        <span>pH: {reading.ph}</span>
                        <span>O₂: {reading.dissolvedOxygen} mg/L</span>
                        <span>S: {reading.salinity} ppt</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      {formatTimestamp(reading.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 md:space-y-6">
          <Card className="rounded-2xl md:rounded-3xl shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                Historique des Mesures
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mobile view - Card layout */}
              <div className="block md:hidden space-y-3">
                {filteredData.slice(0, 20).map((reading) => (
                  <div key={reading.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm">
                          {reading.pondName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {reading.farmName}
                        </div>
                      </div>
                      <Badge
                        className={`${getStatusColor(reading.status)} text-xs`}
                      >
                        {reading.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <span>T: {reading.temperature}°C</span>
                      <span>pH: {reading.ph}</span>
                      <span>O₂: {reading.dissolvedOxygen} mg/L</span>
                      <span>S: {reading.salinity} ppt</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTimestamp(reading.timestamp)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop view - Table layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-medium">
                        Bassin
                      </th>
                      <th className="text-left p-3 text-sm font-medium">
                        Température
                      </th>
                      <th className="text-left p-3 text-sm font-medium">pH</th>
                      <th className="text-left p-3 text-sm font-medium">
                        Oxygène
                      </th>
                      <th className="text-left p-3 text-sm font-medium">
                        Salinité
                      </th>
                      <th className="text-left p-3 text-sm font-medium">
                        Statut
                      </th>
                      <th className="text-left p-3 text-sm font-medium">
                        Date/Heure
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.slice(0, 50).map((reading) => (
                      <tr
                        key={reading.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-sm">
                              {reading.pondName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {reading.farmName}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm">{reading.temperature}°C</td>
                        <td className="p-3 text-sm">{reading.ph}</td>
                        <td className="p-3 text-sm">
                          {reading.dissolvedOxygen} mg/L
                        </td>
                        <td className="p-3 text-sm">{reading.salinity} ppt</td>
                        <td className="p-3">
                          <Badge
                            className={`${getStatusColor(
                              reading.status
                            )} text-xs`}
                          >
                            {getStatusIcon(reading.status)}
                            <span className="ml-1">{reading.status}</span>
                          </Badge>
                        </td>
                        <td className="p-3 text-xs">
                          {formatTimestamp(reading.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <Card className="rounded-xl md:rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
                  Tendances par Paramètre
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 md:space-y-4">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs md:text-sm font-medium">
                        Température Moyenne
                      </span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-xl md:text-2xl font-bold">23.2°C</div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs md:text-sm font-medium">
                        pH Moyen
                      </span>
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="text-xl md:text-2xl font-bold">7.6</div>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs md:text-sm font-medium">
                        Oxygène Moyen
                      </span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="text-xl md:text-2xl font-bold">
                      6.8 mg/L
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl md:rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <LineChart className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                  Performance par Bassin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 md:space-y-3">
                  {getLatestReadings().map((reading) => (
                    <div
                      key={reading.id}
                      className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-xs md:text-sm font-medium break-words flex-1 min-w-0 pr-2">
                        {reading.pondName}
                      </span>
                      <Badge
                        className={`${getStatusColor(
                          reading.status
                        )} text-xs flex-shrink-0`}
                      >
                        {reading.quality}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
