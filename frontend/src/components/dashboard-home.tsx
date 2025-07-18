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
  RefreshCw,
  Wifi,
  WifiOff,
  Zap,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  Bell,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/components/language-context";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, Basin, Alert } from "@/lib/api";

// Fake data generator functions
const generateRandomValue = (
  min: number,
  max: number,
  precision: number = 1
) => {
  return Number((Math.random() * (max - min) + min).toFixed(precision));
};

const generateSensorReading = () => ({
  temperature: generateRandomValue(18, 30, 1),
  ph: generateRandomValue(6.0, 8.5, 1),
  oxygen: generateRandomValue(3.0, 12.0, 1),
  salinity: generateRandomValue(0, 35, 1),
  turbidity: generateRandomValue(0, 50, 1),
  ammonia: generateRandomValue(0, 5, 2),
  nitrite: generateRandomValue(0, 3, 2),
  nitrate: generateRandomValue(0, 40, 1),
  timestamp: new Date().toISOString(),
});

const generateSystemMetrics = () => ({
  totalBasins: generateRandomValue(45, 65, 0),
  activeBasins: generateRandomValue(38, 55, 0),
  totalAlerts: generateRandomValue(0, 15, 0),
  criticalAlerts: generateRandomValue(0, 5, 0),
  systemUptime: generateRandomValue(85, 99, 1),
  dataTransmission: generateRandomValue(90, 100, 1),
  powerConsumption: generateRandomValue(65, 85, 1),
  networkLatency: generateRandomValue(10, 150, 0),
  activeOperators: generateRandomValue(8, 25, 0),
  maintenanceScheduled: generateRandomValue(0, 8, 0),
  waterQuality: {
    excellent: generateRandomValue(20, 35, 0),
    good: generateRandomValue(10, 20, 0),
    fair: generateRandomValue(5, 15, 0),
    poor: generateRandomValue(0, 5, 0),
  },
  production: {
    daily: generateRandomValue(50, 150, 0),
    weekly: generateRandomValue(300, 800, 0),
    monthly: generateRandomValue(1200, 3000, 0),
    target: 2500,
  },
});

const generateRecentActivity = () => {
  const activities = [
    {
      type: "measurement",
      message: "Nouvelle mesure - Bassin A12",
      severity: "info",
    },
    {
      type: "alert",
      message: "Alerte pH élevé - Bassin C3",
      severity: "warning",
    },
    {
      type: "maintenance",
      message: "Maintenance programmée - Base Nord",
      severity: "info",
    },
    {
      type: "system",
      message: "Mise à jour système complétée",
      severity: "success",
    },
    { type: "user", message: "Nouvel opérateur connecté", severity: "info" },
    {
      type: "alert",
      message: "Alerte température - Bassin B7",
      severity: "critical",
    },
    { type: "data", message: "Rapport quotidien généré", severity: "info" },
    {
      type: "network",
      message: "Connexion rétablie - Capteur 15",
      severity: "success",
    },
  ];

  return activities
    .sort(() => Math.random() - 0.5)
    .slice(0, 5)
    .map((activity, index) => ({
      id: `activity-${Date.now()}-${index}`,
      ...activity,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    }));
};

const generateTrendData = () => ({
  temperature: {
    current: generateRandomValue(18, 30, 1),
    trend: Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable",
    change: generateRandomValue(0, 2, 1),
  },
  ph: {
    current: generateRandomValue(6.0, 8.5, 1),
    trend: Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable",
    change: generateRandomValue(0, 0.5, 1),
  },
  oxygen: {
    current: generateRandomValue(3.0, 12.0, 1),
    trend: Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable",
    change: generateRandomValue(0, 2, 1),
  },
  salinity: {
    current: generateRandomValue(0, 35, 1),
    trend: Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable",
    change: generateRandomValue(0, 3, 1),
  },
});

export function DashboardHome() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [basins, setBasins] = useState<Basin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isConnected, setIsConnected] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Real-time data states with stable references
  const [systemMetrics, setSystemMetrics] = useState(() =>
    generateSystemMetrics()
  );
  const [recentActivity, setRecentActivity] = useState(() =>
    generateRecentActivity()
  );
  const [trendData, setTrendData] = useState(() => generateTrendData());
  const [liveReadings, setLiveReadings] = useState<{ [key: string]: any }>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Generate fake basin data with stable IDs
  const generateFakeBasin = useCallback(
    (id: string, name: string, farmName: string, location: string) => {
      const sensorData = generateSensorReading();
      const alertCount =
        Math.random() > 0.8 ? Math.floor(Math.random() * 3) + 1 : 0;

      return {
        id,
        name,
        type: Math.random() > 0.5 ? "marine" : "freshwater",
        volume: generateRandomValue(100, 1000, 0),
        depth: generateRandomValue(1.5, 5.0, 1),
        farm: {
          id: `farm-${Math.floor(Math.random() * 10) + 1}`,
          name: farmName,
          location: location,
        },
        sensorData: [sensorData],
        alerts:
          alertCount > 0
            ? Array.from({ length: alertCount }, (_, i) => ({
                id: `alert-${id}-${i}`,
                type: Math.random() > 0.5 ? "parameter" : "system",
                severity: Math.random() > 0.7 ? "critical" : "warning",
                message: `Alerte ${
                  Math.random() > 0.5 ? "pH" : "température"
                } ${Math.random() > 0.5 ? "élevé" : "bas"}`,
                createdAt: new Date(
                  Date.now() - Math.random() * 86400000
                ).toISOString(),
              }))
            : [],
        _count: { alerts: alertCount },
      };
    },
    []
  );

  // Generate initial fake data - only called once
  const generateInitialData = useCallback(() => {
    if (isInitialized) return basins;

    const farmNames = [
      "Ferme Aquacole El Djazair",
      "Centre Marin Mediterra",
      "Aquaculture Sahel",
      "Ferme Bleue d'Alger",
      "Aqua-Tech Oran",
      "Centre Aquacole Annaba",
      "Ferme Marine Tipaza",
      "Aquaculture Mostaganem",
    ];

    const locations = [
      "Alger",
      "Oran",
      "Annaba",
      "Tipaza",
      "Mostaganem",
      "Bejaia",
      "Skikda",
      "Jijel",
    ];

    return Array.from({ length: 24 }, (_, i) => {
      const farmIndex = Math.floor(Math.random() * farmNames.length);
      return generateFakeBasin(
        `basin-${i + 1}`,
        `Bassin ${String.fromCharCode(65 + Math.floor(i / 3))}${(i % 3) + 1}`,
        farmNames[farmIndex],
        locations[Math.floor(Math.random() * locations.length)]
      );
    });
  }, [generateFakeBasin, isInitialized, basins]);

  // Update only sensor readings for existing basins
  const updateSensorReadings = useCallback(() => {
    setBasins((prevBasins) =>
      prevBasins.map((basin) => ({
        ...basin,
        sensorData: [generateSensorReading()],
      }))
    );
  }, []);

  // Update live readings for specific basins - gradual updates
  const updateLiveReadings = useCallback(() => {
    if (basins.length === 0) return;

    setLiveReadings((prev) => {
      const newReadings = { ...prev };
      // Only update 30% of basins at a time for smoother updates
      const basinsToUpdate = basins.slice(0, Math.ceil(basins.length * 0.3));

      basinsToUpdate.forEach((basin) => {
        if (Math.random() > 0.5) {
          // 50% chance to update each selected basin
          newReadings[basin.id] = generateSensorReading();
        }
      });

      return newReadings;
    });
  }, [basins]);

  // Gradual system metrics update
  const updateSystemMetrics = useCallback(() => {
    setSystemMetrics((prev) => ({
      ...prev,
      // Only update some metrics at a time
      systemUptime: Math.max(
        85,
        Math.min(99, prev.systemUptime + (Math.random() - 0.5) * 2)
      ),
      dataTransmission: Math.max(
        90,
        Math.min(100, prev.dataTransmission + (Math.random() - 0.5) * 3)
      ),
      networkLatency: Math.max(
        10,
        Math.min(150, prev.networkLatency + (Math.random() - 0.5) * 10)
      ),
      activeOperators: Math.max(
        8,
        Math.min(
          25,
          prev.activeOperators + Math.floor((Math.random() - 0.5) * 3)
        )
      ),
    }));
  }, []);

  // Add new activity item instead of regenerating all
  const addNewActivity = useCallback(() => {
    const newActivities = [
      {
        type: "measurement",
        message: "Nouvelle mesure - Bassin A12",
        severity: "info",
      },
      {
        type: "alert",
        message: "Alerte pH élevé - Bassin C3",
        severity: "warning",
      },
      {
        type: "maintenance",
        message: "Maintenance programmée - Base Nord",
        severity: "info",
      },
      {
        type: "system",
        message: "Mise à jour système complétée",
        severity: "success",
      },
      { type: "user", message: "Nouvel opérateur connecté", severity: "info" },
      {
        type: "alert",
        message: "Alerte température - Bassin B7",
        severity: "critical",
      },
      { type: "data", message: "Rapport quotidien généré", severity: "info" },
      {
        type: "network",
        message: "Connexion rétablie - Capteur 15",
        severity: "success",
      },
    ];

    if (Math.random() > 0.7) {
      // 30% chance to add new activity
      const randomActivity =
        newActivities[Math.floor(Math.random() * newActivities.length)];
      setRecentActivity((prev) => [
        {
          id: `activity-${Date.now()}-${Math.random()}`,
          ...randomActivity,
          timestamp: new Date().toISOString(),
        },
        ...prev.slice(0, 4), // Keep only 5 most recent
      ]);
    }
  }, []);

  // Gradual trend updates
  const updateTrendData = useCallback(() => {
    setTrendData((prev) => {
      const params = Object.keys(prev);
      const paramToUpdate = params[Math.floor(Math.random() * params.length)];

      return {
        ...prev,
        [paramToUpdate]: {
          ...prev[paramToUpdate as keyof typeof prev],
          current: generateRandomValue(
            paramToUpdate === "temperature"
              ? 18
              : paramToUpdate === "ph"
              ? 6.0
              : paramToUpdate === "oxygen"
              ? 3.0
              : 0,
            paramToUpdate === "temperature"
              ? 30
              : paramToUpdate === "ph"
              ? 8.5
              : paramToUpdate === "oxygen"
              ? 12.0
              : 35,
            1
          ),
        },
      };
    });
  }, []);

  // Fetch initial data - only called once
  const fetchInitialData = useCallback(async () => {
    if (isInitialized) return;

    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const initialData = generateInitialData();
      setBasins(initialData);
      setIsConnected(true);
      setLastUpdate(new Date());
      setIsInitialized(true);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur de récupération des données"
      );
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, [generateInitialData, isInitialized]);

  // Manual refresh function
  const handleManualRefresh = useCallback(async () => {
    setLoading(true);
    try {
      // Update all data
      updateSystemMetrics();
      setRecentActivity(generateRecentActivity());
      setTrendData(generateTrendData());
      updateSensorReadings();
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Error refreshing data:", err);
    } finally {
      setLoading(false);
    }
  }, [updateSystemMetrics, updateSensorReadings]);

  // Initial data fetch
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Auto-refresh with gradual updates
  useEffect(() => {
    if (!autoRefresh || !isInitialized) return;

    const interval = setInterval(() => {
      // Gradual updates instead of full refresh
      updateSystemMetrics();
      addNewActivity();
      updateTrendData();
      updateLiveReadings();
      setLastUpdate(new Date());
    }, 5000); // Update every 5 seconds instead of 30

    return () => clearInterval(interval);
  }, [
    autoRefresh,
    isInitialized,
    updateSystemMetrics,
    addNewActivity,
    updateTrendData,
    updateLiveReadings,
  ]);

  // Periodic sensor readings update
  useEffect(() => {
    if (!autoRefresh || !isInitialized) return;

    const sensorInterval = setInterval(() => {
      updateSensorReadings();
    }, 15000); // Update sensor readings every 15 seconds

    return () => clearInterval(sensorInterval);
  }, [autoRefresh, isInitialized, updateSensorReadings]);

  const getBasinStatus = (basin: Basin) => {
    const currentReading = liveReadings[basin.id] || basin.sensorData?.[0];
    if (!currentReading) return "offline";

    const now = new Date();
    const lastUpdate = new Date(currentReading.timestamp);
    const hoursSinceUpdate =
      (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceUpdate > 2) return "offline";

    // Check for critical parameters
    if (
      currentReading.ph < 6.0 ||
      currentReading.ph > 8.5 ||
      currentReading.temperature < 18 ||
      currentReading.temperature > 30 ||
      currentReading.oxygen < 4.0 ||
      currentReading.salinity > 35
    ) {
      return "critical";
    }

    // Check for warning parameters
    if (
      currentReading.ph < 6.5 ||
      currentReading.ph > 8.0 ||
      currentReading.temperature < 20 ||
      currentReading.temperature > 28 ||
      currentReading.oxygen < 5.0 ||
      currentReading.salinity > 30
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

    if (diffInMinutes < 1) return "maintenant";
    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}j`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "measurement":
        return <Database className="h-4 w-4 text-blue-500" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "maintenance":
        return <Settings className="h-4 w-4 text-orange-500" />;
      case "system":
        return <Zap className="h-4 w-4 text-purple-500" />;
      case "user":
        return <Users className="h-4 w-4 text-green-500" />;
      case "network":
        return <Wifi className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 border-red-200 text-red-700";
      case "warning":
        return "bg-orange-50 border-orange-200 text-orange-700";
      case "success":
        return "bg-green-50 border-green-200 text-green-700";
      default:
        return "bg-blue-50 border-blue-200 text-blue-700";
    }
  };

  // Calculate stats from current data
  const stats = {
    totalBasins: basins.length,
    activeAlerts: basins.reduce(
      (sum, basin) => sum + (basin.alerts?.length || 0),
      0
    ),
    normalStatus: basins.filter((basin) => getBasinStatus(basin) === "normal")
      .length,
    criticalStatus: basins.filter(
      (basin) => getBasinStatus(basin) === "critical"
    ).length,
    warningStatus: basins.filter((basin) => getBasinStatus(basin) === "warning")
      .length,
    offlineStatus: basins.filter((basin) => getBasinStatus(basin) === "offline")
      .length,
  };

  // Role-specific stats
  const getRoleSpecificStats = () => {
    switch (user?.role) {
      case "ADMIN":
        return [
          {
            title: "Total Fermes",
            value: new Set(basins.map((b) => b.farm.id)).size,
            icon: Building,
            color: "from-purple-50 to-purple-100",
            textColor: "text-purple-700",
            iconColor: "text-purple-600",
          },
          {
            title: "Total Bassins",
            value: basins.length,
            icon: Waves,
            color: "from-indigo-50 to-indigo-100",
            textColor: "text-indigo-700",
            iconColor: "text-indigo-600",
          },
          {
            title: "Taux Normal",
            value:
              stats.totalBasins > 0
                ? `${Math.round(
                    (stats.normalStatus / stats.totalBasins) * 100
                  )}%`
                : "0%",
            icon: TrendingUp,
            color: "from-green-50 to-green-100",
            textColor: "text-green-700",
            iconColor: "text-green-600",
          },
        ];
      case "FARMER":
        return [
          {
            title: "Mes Fermes",
            value: new Set(basins.map((b) => b.farm.id)).size,
            icon: Building,
            color: "from-blue-50 to-blue-100",
            textColor: "text-blue-700",
            iconColor: "text-blue-600",
          },
          {
            title: "Mes Bassins",
            value: basins.length,
            icon: Waves,
            color: "from-cyan-50 to-cyan-100",
            textColor: "text-cyan-700",
            iconColor: "text-cyan-600",
          },
          {
            title: "Performance",
            value:
              stats.totalBasins > 0
                ? `${Math.round(
                    (stats.normalStatus / stats.totalBasins) * 100
                  )}%`
                : "0%",
            icon: TrendingUp,
            color: "from-green-50 to-green-100",
            textColor: "text-green-700",
            iconColor: "text-green-600",
          },
        ];
      case "TECHNICIAN":
        return [
          {
            title: "Bassins Gérés",
            value: basins.length,
            icon: Waves,
            color: "from-teal-50 to-teal-100",
            textColor: "text-teal-700",
            iconColor: "text-teal-600",
          },
          {
            title: "Opérateurs",
            value: systemMetrics.activeOperators,
            icon: Users,
            color: "from-orange-50 to-orange-100",
            textColor: "text-orange-700",
            iconColor: "text-orange-600",
          },
          {
            title: "Maintenance",
            value: systemMetrics.maintenanceScheduled,
            icon: Settings,
            color: "from-violet-50 to-violet-100",
            textColor: "text-violet-700",
            iconColor: "text-violet-600",
          },
        ];
      case "VIEWER":
        return [
          {
            title: "Bassins Surveillés",
            value: basins.length,
            icon: Eye,
            color: "from-emerald-50 to-emerald-100",
            textColor: "text-emerald-700",
            iconColor: "text-emerald-600",
          },
          {
            title: "Mesures Consultées",
            value: Math.floor(Math.random() * 20) + 5,
            icon: Database,
            color: "from-yellow-50 to-yellow-100",
            textColor: "text-yellow-700",
            iconColor: "text-yellow-600",
          },
          {
            title: "Alertes Vues",
            value: Math.floor(Math.random() * 10) + 2,
            icon: CheckCircle,
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
      case "FARMER":
        return "Tableau de Bord Fermier";
      case "TECHNICIAN":
        return "Tableau de Bord Technicien";
      case "VIEWER":
        return "Tableau de Bord Visualiseur";
      default:
        return "Tableau de Bord";
    }
  };

  if (loading && !isInitialized) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            Chargement des données en temps réel...
          </p>
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
          <Button onClick={handleManualRefresh}>Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header with Real-time Status */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-3">
              Tableau de Bord Temps Réel
            </h1>
            <p className="text-gray-600 text-lg">
              Surveillance continue de l'aquaculture
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <span
                className={`text-sm ${
                  isConnected ? "text-green-600" : "text-red-600"
                }`}
              >
                {isConnected ? "Connecté" : "Déconnecté"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`rounded-xl ${
                autoRefresh ? "bg-green-50 border-green-200" : "bg-gray-50"
              }`}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`}
              />
              {autoRefresh ? "Auto" : "Manuel"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={loading}
              className="rounded-xl"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Actualiser
            </Button>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-4 py-2">
              <Clock className="h-4 w-4 mr-2" />
              {lastUpdate.toLocaleTimeString()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Live System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-3xl border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-blue-600 mb-1">
                  Disponibilité Système
                </p>
                <p className="text-3xl font-bold text-blue-800">
                  {systemMetrics.systemUptime}%
                </p>
              </div>
              <Zap className="h-12 w-12 text-blue-600" />
            </div>
            <Progress value={systemMetrics.systemUptime} className="h-2" />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-green-100 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-green-600 mb-1">
                  Transmission Données
                </p>
                <p className="text-3xl font-bold text-green-800">
                  {systemMetrics.dataTransmission}%
                </p>
              </div>
              <Database className="h-12 w-12 text-green-600" />
            </div>
            <Progress value={systemMetrics.dataTransmission} className="h-2" />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-purple-100 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-purple-600 mb-1">
                  Opérateurs Actifs
                </p>
                <p className="text-3xl font-bold text-purple-800">
                  {systemMetrics.activeOperators}
                </p>
              </div>
              <Users className="h-12 w-12 text-purple-600" />
            </div>
            <div className="text-xs text-purple-600">
              {systemMetrics.maintenanceScheduled} maintenance programmée
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-orange-100 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-orange-600 mb-1">Latence Réseau</p>
                <p className="text-3xl font-bold text-orange-800">
                  {systemMetrics.networkLatency}ms
                </p>
              </div>
              <Activity className="h-12 w-12 text-orange-600" />
            </div>
            <div className="text-xs text-orange-600">
              Temps de réponse moyen
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Trend Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(trendData).map(([param, data]) => (
          <Card key={param} className="rounded-3xl border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1 capitalize">
                    {param}
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {data.current}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(data.trend)}
                  <span className="text-sm text-gray-600">
                    {data.trend === "stable" ? "=" : data.change}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Production Overview */}
      <Card className="rounded-3xl border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-green-500" />
            Production en Temps Réel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-2xl">
              <div className="text-2xl font-bold text-green-700">
                {systemMetrics.production.daily} kg
              </div>
              <div className="text-sm text-green-600">Aujourd'hui</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-2xl">
              <div className="text-2xl font-bold text-blue-700">
                {systemMetrics.production.weekly} kg
              </div>
              <div className="text-sm text-blue-600">Cette semaine</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-2xl">
              <div className="text-2xl font-bold text-purple-700">
                {systemMetrics.production.monthly} kg
              </div>
              <div className="text-sm text-purple-600">Ce mois</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-2xl">
              <div className="text-2xl font-bold text-orange-700">
                {Math.round(
                  (systemMetrics.production.monthly /
                    systemMetrics.production.target) *
                    100
                )}
                %
              </div>
              <div className="text-sm text-orange-600">Objectif atteint</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Activity Feed */}
      <Card className="rounded-3xl border-gray-100 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Bell className="h-6 w-6 text-blue-500" />
              Activité en Temps Réel
            </CardTitle>
            <Badge className="bg-green-100 text-green-700 border-green-200">
              <Activity className="h-4 w-4 mr-1" />
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border ${getSeverityColor(
                  activity.severity
                )}`}
              >
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-gray-500">
                    {getTimeAgo(activity.timestamp)}
                  </p>
                </div>
                <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Water Quality Distribution */}
      <Card className="rounded-3xl border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Droplets className="h-6 w-6 text-blue-500" />
            Qualité de l'Eau en Temps Réel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-emerald-50 rounded-2xl">
              <div className="text-2xl font-bold text-emerald-700">
                {systemMetrics.waterQuality.excellent}
              </div>
              <div className="text-sm text-emerald-600">Excellente</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-2xl">
              <div className="text-2xl font-bold text-green-700">
                {systemMetrics.waterQuality.good}
              </div>
              <div className="text-sm text-green-600">Bonne</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-2xl">
              <div className="text-2xl font-bold text-yellow-700">
                {systemMetrics.waterQuality.fair}
              </div>
              <div className="text-sm text-yellow-600">Correcte</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-2xl">
              <div className="text-2xl font-bold text-red-700">
                {systemMetrics.waterQuality.poor}
              </div>
              <div className="text-sm text-red-600">Mauvaise</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Basins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {basins.slice(0, 9).map((basin) => {
          const status = getBasinStatus(basin);
          const currentReading =
            liveReadings[basin.id] || basin.sensorData?.[0];

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
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <Badge
                      className={`${getStatusColor(
                        status
                      )} rounded-full px-3 py-1 text-xs font-medium border`}
                    >
                      {status}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {basin.farm.name} - {basin.farm.location}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {status !== "offline" && currentReading ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-orange-50 rounded-2xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Thermometer className="h-4 w-4 text-orange-500" />
                        <span className="text-xs font-medium text-gray-600">
                          Temp
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-800">
                        {currentReading.temperature.toFixed(1)}°C
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
                        {currentReading.ph.toFixed(1)}
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-2xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-4 w-4 text-green-500" />
                        <span className="text-xs font-medium text-gray-600">
                          O2
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-800">
                        {currentReading.oxygen.toFixed(1)} mg/L
                      </div>
                    </div>

                    <div className="bg-teal-50 rounded-2xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Waves className="h-4 w-4 text-teal-500" />
                        <span className="text-xs font-medium text-gray-600">
                          Salinité
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-800">
                        {currentReading.salinity.toFixed(1)} ppt
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <WifiOff className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      Données non disponibles
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-gray-500">
                    Dernière MAJ: {getTimeAgo(currentReading?.timestamp || "")}
                  </div>
                  <Link
                    href={`/basin/${basin.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Détails →
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Advanced Analytics Section */}
      <Card className="rounded-3xl border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-purple-500" />
            Analyses Prédictives & Corrélations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Predictive Insights */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Insights Prédictifs
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-orange-700">
                      Risque pH Élevé
                    </span>
                  </div>
                  <p className="text-xs text-orange-600">
                    Bassin C3 pourrait dépasser 8.5 dans 2h
                  </p>
                  <div className="mt-2">
                    <div className="text-xs text-orange-500 mb-1">Probabilité</div>
                    <Progress value={78} className="h-2" />
                  </div>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-700">
                      Conditions Optimales
                    </span>
                  </div>
                  <p className="text-xs text-green-600">
                    Bassin A1 maintient des paramètres excellents
                  </p>
                  <div className="mt-2">
                    <div className="text-xs text-green-500 mb-1">Stabilité</div>
                    <Progress value={95} className="h-2" />
                  </div>
                </div>
              </div>
            </div>

            {/* Environmental Correlations */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Corrélations Environnementales
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">
                      Température ↔ O2
                    </span>
                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                      -0.85
                    </Badge>
                  </div>
                  <p className="text-xs text-blue-600">
                    Corrélation négative forte détectée
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700">
                      pH ↔ Salinité
                    </span>
                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                      +0.62
                    </Badge>
                  </div>
                  <p className="text-xs text-purple-600">
                    Corrélation positive modérée
                  </p>
                </div>
                
                <div className="p-4 bg-teal-50 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-teal-700">
                      Turbidité ↔ Croissance
                    </span>
                    <Badge className="bg-teal-100 text-teal-700 text-xs">
                      -0.43
                    </Badge>
                  </div>
                  <p className="text-xs text-teal-600">
                    Impact modéré sur la croissance
                  </p>
                </div>
              </div>
            </div>

            {/* Smart Recommendations */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Recommandations IA
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-700">
                      Optimisation Température
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mb-2">
                    Réduire de 1°C dans bassins B2-B5
                  </p>
                  <Button size="sm" className="w-full text-xs bg-green-600 hover:bg-green-700">
                    Appliquer
                  </Button>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700">
                      Ajustement pH
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mb-2">
                    Ajouter tampon dans bassin C3
                  </p>
                  <Button size="sm" className="w-full text-xs bg-blue-600 hover:bg-blue-700">
                    Programmer
                  </Button>
                </div>
                
                <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-orange-700">
                      Oxygénation
                    </span>
                  </div>
                  <p className="text-xs text-orange-600 mb-2">
                    Augmenter aération nocturne
                  </p>
                  <Button size="sm" className="w-full text-xs bg-orange-600 hover:bg-orange-700">
                    Activer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Alert Management */}
      <Card className="rounded-3xl border-gray-100 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              Gestion Intelligente des Alertes
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-700 border-red-200">
                {stats.criticalStatus} Critiques
              </Badge>
              <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                {stats.warningStatus} Attention
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alert Priorities */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Priorités & Actions
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-red-50 rounded-2xl border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-red-700">
                        Urgent - pH Critique
                      </span>
                    </div>
                    <Badge className="bg-red-100 text-red-700 text-xs">
                      2 min
                    </Badge>
                  </div>
                  <p className="text-xs text-red-600 mb-3">
                    Bassin C3: pH 9.2 - Intervention immédiate requise
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 text-xs bg-red-600 hover:bg-red-700">
                      Intervenir
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      Déléguer
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium text-orange-700">
                        Attention - Température
                      </span>
                    </div>
                    <Badge className="bg-orange-100 text-orange-700 text-xs">
                      15 min
                    </Badge>
                  </div>
                  <p className="text-xs text-orange-600 mb-3">
                    Bassin A7: 31°C - Surveillance renforcée
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 text-xs bg-orange-600 hover:bg-orange-700">
                      Surveiller
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      Programmer
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Alert Patterns */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                Patterns & Tendances
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-purple-50 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium text-purple-700">
                      Pattern Détecté
                    </span>
                  </div>
                  <p className="text-xs text-purple-600 mb-2">
                    Pics de température récurrents 14h-16h
                  </p>
                  <div className="flex items-center gap-2">
                    <Progress value={85} className="flex-1 h-2" />
                    <span className="text-xs text-purple-600">85%</span>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700">
                      Évolution Hebdomadaire
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mb-2">
                    Réduction de 23% des alertes pH
                  </p>
                  <div className="flex items-center gap-2">
                    <Progress value={77} className="flex-1 h-2" />
                    <span className="text-xs text-blue-600">↓ 23%</span>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-700">
                      Prédiction Positive
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mb-2">
                    Stabilité attendue prochaines 48h
                  </p>
                  <div className="flex items-center gap-2">
                    <Progress value={92} className="flex-1 h-2" />
                    <span className="text-xs text-green-600">92%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
