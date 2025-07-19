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
  LineChart,
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

// Add pH history data generator
const generatePHHistoryData = () => {
  const now = new Date();
  const data = [];

  // Generate 24 hours of pH data (every 30 minutes)
  for (let i = 47; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 30 * 60 * 1000);
    const baseValue = 7.2 + Math.sin(i * 0.3) * 0.8; // Oscillating around 7.2
    const noise = (Math.random() - 0.5) * 0.4; // Random noise
    const value = Math.max(6.0, Math.min(8.5, baseValue + noise));

    data.push({
      time: time.toISOString(),
      value: Number(value.toFixed(2)),
      label: time.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: value < 6.5 ? "low" : value > 8.0 ? "high" : "normal",
    });
  }

  return data;
};

// Generate temperature history data for comparison
const generateTemperatureHistoryData = () => {
  const now = new Date();
  const data = [];

  for (let i = 47; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 30 * 60 * 1000);
    const baseValue = 24 + Math.sin(i * 0.2) * 3; // Temperature variation
    const noise = (Math.random() - 0.5) * 1;
    const value = Math.max(18, Math.min(30, baseValue + noise));

    data.push({
      time: time.toISOString(),
      value: Number(value.toFixed(1)),
      label: time.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: value < 20 ? "low" : value > 28 ? "high" : "normal",
    });
  }

  return data;
};

export function DashboardHome() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [basins, setBasins] = useState<Basin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isConnected, setIsConnected] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [phHistory, setPHHistory] = useState(() => generatePHHistoryData());
  const [temperatureHistory, setTemperatureHistory] = useState(() =>
    generateTemperatureHistoryData()
  );
  const [selectedParameter, setSelectedParameter] = useState<
    "ph" | "temperature"
  >("ph");

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

  // Add function to update pH history (moved before useEffect)
  const updatePHHistory = useCallback(() => {
    setPHHistory((prev) => {
      const newData = [...prev];
      // Remove oldest entry and add new one
      newData.shift();

      const now = new Date();
      const lastValue = newData[newData.length - 1]?.value || 7.2;
      const variation = (Math.random() - 0.5) * 0.3;
      const newValue = Math.max(6.0, Math.min(8.5, lastValue + variation));

      newData.push({
        time: now.toISOString(),
        value: Number(newValue.toFixed(2)),
        label: now.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: newValue < 6.5 ? "low" : newValue > 8.0 ? "high" : "normal",
      });

      return newData;
    });
  }, []);

  // Add function to update temperature history (moved before useEffect)
  const updateTemperatureHistory = useCallback(() => {
    setTemperatureHistory((prev) => {
      const newData = [...prev];
      newData.shift();

      const now = new Date();
      const lastValue = newData[newData.length - 1]?.value || 24;
      const variation = (Math.random() - 0.5) * 0.5;
      const newValue = Math.max(18, Math.min(30, lastValue + variation));

      newData.push({
        time: now.toISOString(),
        value: Number(newValue.toFixed(1)),
        label: now.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: newValue < 20 ? "low" : newValue > 28 ? "high" : "normal",
      });

      return newData;
    });
  }, []);

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
      updatePHHistory();
      updateTemperatureHistory();
      setLastUpdate(new Date());
    }, 1000); // Update every 5 seconds instead of 30

    return () => clearInterval(interval);
  }, [
    autoRefresh,
    isInitialized,
    updateSystemMetrics,
    addNewActivity,
    updateTrendData,
    updateLiveReadings,
    updatePHHistory,
    updateTemperatureHistory,
  ]);

  // Periodic sensor readings update
  useEffect(() => {
    if (!autoRefresh || !isInitialized) return;

    const sensorInterval = setInterval(() => {
      updateSensorReadings();
    }, 1000); // Update sensor readings every 15 seconds

    return () => clearInterval(sensorInterval);
  }, [autoRefresh, isInitialized, updateSensorReadings]);

  // Add chart component
  const ParameterChart = ({
    data,
    parameter,
  }: {
    data: any[];
    parameter: "ph" | "temperature";
  }) => {
    const getColor = (status: string) => {
      switch (status) {
        case "low":
          return "#ef4444";
        case "high":
          return "#f59e0b";
        default:
          return "#10b981";
      }
    };

    const getThresholds = () => {
      if (parameter === "ph") {
        return { min: 6.5, max: 8.0, unit: "" };
      } else {
        return { min: 20, max: 28, unit: "°C" };
      }
    };

    const thresholds = getThresholds();
    const maxValue = Math.max(...data.map((d) => d.value));
    const minValue = Math.min(...data.map((d) => d.value));
    const range = maxValue - minValue;
    const padding = range * 0.1;
    const chartMin = Math.max(0, minValue - padding);
    const chartMax = maxValue + padding;
    const chartRange = chartMax - chartMin;

    return (
      <div className="h-80 relative">
        {/* Chart area */}
        <div className="absolute inset-0 p-4">
          <svg width="100%" height="100%" className="overflow-visible">
            {/* Background grid */}
            <defs>
              <pattern
                id="grid"
                width="40"
                height="30"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 30"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Threshold lines */}
            <line
              x1="0"
              y1={`${100 - ((thresholds.min - chartMin) / chartRange) * 100}%`}
              x2="100%"
              y2={`${100 - ((thresholds.min - chartMin) / chartRange) * 100}%`}
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.7"
            />
            <line
              x1="0"
              y1={`${100 - ((thresholds.max - chartMin) / chartRange) * 100}%`}
              x2="100%"
              y2={`${100 - ((thresholds.max - chartMin) / chartRange) * 100}%`}
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.7"
            />

            {/* Data line */}
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={data
                .map((point, index) => {
                  const x = (index / (data.length - 1)) * 100;
                  const y = 100 - ((point.value - chartMin) / chartRange) * 100;
                  return `${x},${y}`;
                })
                .join(" ")}
            />

            {/* Data points */}
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - ((point.value - chartMin) / chartRange) * 100;
              return (
                <g key={index}>
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill={getColor(point.status)}
                    stroke="white"
                    strokeWidth="2"
                  />
                  {/* Tooltip on hover */}
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="8"
                    fill="transparent"
                    className="cursor-pointer"
                  >
                    <title>{`${point.label}: ${point.value}${thresholds.unit}`}</title>
                  </circle>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2">
          <span>
            {chartMax.toFixed(1)}
            {thresholds.unit}
          </span>
          <span>
            {((chartMax + chartMin) / 2).toFixed(1)}
            {thresholds.unit}
          </span>
          <span>
            {chartMin.toFixed(1)}
            {thresholds.unit}
          </span>
        </div>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-8 right-0 flex justify-between text-xs text-gray-500">
          <span>{data[0]?.label}</span>
          <span>{data[Math.floor(data.length / 2)]?.label}</span>
          <span>{data[data.length - 1]?.label}</span>
        </div>
      </div>
    );
  };

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
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Real-time Status */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-sm border border-blue-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2 md:mb-3">
              Tableau de Bord Temps Réel
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm md:text-lg">
              Surveillance continue de l'aquaculture
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              {isConnected ? (
                <Wifi className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
              )}
              <span
                className={`text-sm ${
                  isConnected
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {isConnected ? "Connecté" : "Déconnecté"}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`rounded-xl text-xs ${
                  autoRefresh
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700"
                    : "bg-gray-50 dark:bg-gray-800"
                }`}
              >
                <RefreshCw
                  className={`h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 ${
                    autoRefresh ? "animate-spin" : ""
                  }`}
                />
                {autoRefresh ? "Auto" : "Manuel"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={loading}
                className="rounded-xl text-xs"
              >
                <RefreshCw
                  className={`h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 ${
                    loading ? "animate-spin" : ""
                  }`}
                />
                Actualiser
              </Button>
            </div>
            <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 px-3 py-1 md:px-4 md:py-2 text-xs">
              <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              {lastUpdate.toLocaleTimeString()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Live Trend Analysis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {Object.entries(trendData).map(([param, data]) => (
          <Card
            key={param}
            className="rounded-2xl md:rounded-3xl border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800"
          >
            <CardContent className="p-3 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 md:mb-4">
                <div className="mb-2 md:mb-0">
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mb-1 capitalize">
                    {param === "ph" ? "pH" : param}
                  </p>
                  <p className="text-lg md:text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {data.current}
                  </p>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  {getTrendIcon(data.trend)}
                  <span className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                    {data.trend === "stable" ? "=" : data.change}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* pH Analytics Graph - Mobile Optimized */}
      <Card className="rounded-2xl md:rounded-3xl border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
            <CardTitle className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <LineChart className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
              Analyse Temporelle
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex gap-2">
                <Button
                  variant={selectedParameter === "ph" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedParameter("ph")}
                  className="rounded-xl text-xs flex-1 sm:flex-none"
                >
                  <Droplets className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  pH
                </Button>
                <Button
                  variant={
                    selectedParameter === "temperature" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedParameter("temperature")}
                  className="rounded-xl text-xs flex-1 sm:flex-none"
                >
                  <Thermometer className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Temp
                </Button>
              </div>
              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700 text-xs">
                <Activity className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                Temps Réel
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
          {/* Current Values Display - Mobile Optimized */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="text-center p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl md:rounded-2xl">
              <div className="text-lg md:text-2xl font-bold text-blue-700 dark:text-blue-300">
                {selectedParameter === "ph"
                  ? phHistory[phHistory.length - 1]?.value
                  : `${
                      temperatureHistory[temperatureHistory.length - 1]?.value
                    }°C`}
              </div>
              <div className="text-xs md:text-sm text-blue-600 dark:text-blue-400">
                Actuelle
              </div>
            </div>
            <div className="text-center p-3 md:p-4 bg-green-50 dark:bg-green-900/20 rounded-xl md:rounded-2xl">
              <div className="text-lg md:text-2xl font-bold text-green-700 dark:text-green-300">
                {selectedParameter === "ph"
                  ? Math.max(...phHistory.map((d) => d.value)).toFixed(2)
                  : `${Math.max(
                      ...temperatureHistory.map((d) => d.value)
                    ).toFixed(1)}°C`}
              </div>
              <div className="text-xs md:text-sm text-green-600 dark:text-green-400">
                Max 24h
              </div>
            </div>
            <div className="text-center p-3 md:p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl md:rounded-2xl">
              <div className="text-lg md:text-2xl font-bold text-orange-700 dark:text-orange-300">
                {selectedParameter === "ph"
                  ? Math.min(...phHistory.map((d) => d.value)).toFixed(2)
                  : `${Math.min(
                      ...temperatureHistory.map((d) => d.value)
                    ).toFixed(1)}°C`}
              </div>
              <div className="text-xs md:text-sm text-orange-600 dark:text-orange-400">
                Min 24h
              </div>
            </div>
            <div className="text-center p-3 md:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl md:rounded-2xl">
              <div className="text-lg md:text-2xl font-bold text-purple-700 dark:text-purple-300">
                {selectedParameter === "ph"
                  ? (
                      phHistory.reduce((sum, d) => sum + d.value, 0) /
                      phHistory.length
                    ).toFixed(2)
                  : `${(
                      temperatureHistory.reduce((sum, d) => sum + d.value, 0) /
                      temperatureHistory.length
                    ).toFixed(1)}°C`}
              </div>
              <div className="text-xs md:text-sm text-purple-600 dark:text-purple-400">
                Moyenne
              </div>
            </div>
          </div>

          {/* Chart - Mobile Optimized */}
          <div className="bg-white dark:bg-gray-800/50 rounded-xl md:rounded-2xl p-2 md:p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-4 space-y-2 md:space-y-0">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm md:text-base">
                Évolution sur 24h
              </h3>
              <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm">
                <div className="flex items-center gap-1 md:gap-2">
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    Normal
                  </span>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    Attention
                  </span>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    Critique
                  </span>
                </div>
              </div>
            </div>
            <div className="h-60 md:h-80">
              <ParameterChart
                data={
                  selectedParameter === "ph" ? phHistory : temperatureHistory
                }
                parameter={selectedParameter}
              />
            </div>
          </div>

          {/* Insights - Mobile Optimized */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl md:rounded-2xl">
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2 text-sm md:text-base">
                <TrendingUp className="h-4 w-4" />
                Tendance Récente
              </h4>
              <p className="text-xs md:text-sm text-blue-600 dark:text-blue-400">
                {selectedParameter === "ph"
                  ? phHistory[phHistory.length - 1]?.value >
                    phHistory[phHistory.length - 6]?.value
                    ? "📈 Augmentation progressive détectée"
                    : "📉 Stabilisation ou légère baisse"
                  : temperatureHistory[temperatureHistory.length - 1]?.value >
                    temperatureHistory[temperatureHistory.length - 6]?.value
                  ? "📈 Température en hausse"
                  : "📉 Température stable ou en baisse"}
              </p>
            </div>
            <div className="p-3 md:p-4 bg-green-50 dark:bg-green-900/20 rounded-xl md:rounded-2xl">
              <h4 className="font-medium text-green-700 dark:text-green-300 mb-2 flex items-center gap-2 text-sm md:text-base">
                <Shield className="h-4 w-4" />
                Prédiction IA
              </h4>
              <p className="text-xs md:text-sm text-green-600 dark:text-green-400">
                {selectedParameter === "ph"
                  ? "Maintien dans la plage optimale prévu"
                  : "Conditions thermiques stables attendues"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Production Overview - Mobile Optimized */}
      <Card className="rounded-2xl md:rounded-3xl border-gray-100 dark:border-gray-700 shadow-sm">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
            Production Temps Réel
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            <div className="text-center p-3 md:p-4 bg-green-50 dark:bg-green-900/20 rounded-xl md:rounded-2xl">
              <div className="text-lg md:text-2xl font-bold text-green-700 dark:text-green-300">
                {systemMetrics.production.daily} kg
              </div>
              <div className="text-xs md:text-sm text-green-600 dark:text-green-400">
                Aujourd'hui
              </div>
            </div>
            <div className="text-center p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl md:rounded-2xl">
              <div className="text-lg md:text-2xl font-bold text-blue-700 dark:text-blue-300">
                {systemMetrics.production.weekly} kg
              </div>
              <div className="text-xs md:text-sm text-blue-600 dark:text-blue-400">
                Semaine
              </div>
            </div>
            <div className="text-center p-3 md:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl md:rounded-2xl">
              <div className="text-lg md:text-2xl font-bold text-purple-700 dark:text-purple-300">
                {systemMetrics.production.monthly} kg
              </div>
              <div className="text-xs md:text-sm text-purple-600 dark:text-purple-400">
                Mois
              </div>
            </div>
            <div className="text-center p-3 md:p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl md:rounded-2xl">
              <div className="text-lg md:text-2xl font-bold text-orange-700 dark:text-orange-300">
                {Math.round(
                  (systemMetrics.production.monthly /
                    systemMetrics.production.target) *
                    100
                )}
                %
              </div>
              <div className="text-xs md:text-sm text-orange-600 dark:text-orange-400">
                Objectif
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Activity Feed - Mobile Optimized */}
      <Card className="rounded-2xl md:rounded-3xl border-gray-100 dark:border-gray-700 shadow-sm">
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
            <CardTitle className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Bell className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
              Activité Temps Réel
            </CardTitle>
            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700 text-xs w-fit">
              <Activity className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-2 md:space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl border ${getSeverityColor(
                  activity.severity
                )}`}
              >
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium truncate">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getTimeAgo(activity.timestamp)}
                  </p>
                </div>
                <div className="w-2 h-2 bg-current rounded-full animate-pulse flex-shrink-0"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Water Quality Distribution - Mobile Optimized */}
      <Card className="rounded-2xl md:rounded-3xl border-gray-100 dark:border-gray-700 shadow-sm">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Droplets className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
            Qualité Eau Temps Réel
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="text-center p-3 md:p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl md:rounded-2xl">
              <div className="text-lg md:text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {systemMetrics.waterQuality.excellent}
              </div>
              <div className="text-xs md:text-sm text-emerald-600 dark:text-emerald-400">
                Excellente
              </div>
            </div>
            <div className="text-center p-3 md:p-4 bg-green-50 dark:bg-green-900/20 rounded-xl md:rounded-2xl">
              <div className="text-lg md:text-2xl font-bold text-green-700 dark:text-green-300">
                {systemMetrics.waterQuality.good}
              </div>
              <div className="text-xs md:text-sm text-green-600 dark:text-green-400">
                Bonne
              </div>
            </div>
            <div className="text-center p-3 md:p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl md:rounded-2xl">
              <div className="text-lg md:text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {systemMetrics.waterQuality.fair}
              </div>
              <div className="text-xs md:text-sm text-yellow-600 dark:text-yellow-400">
                Correcte
              </div>
            </div>
            <div className="text-center p-3 md:p-4 bg-red-50 dark:bg-red-900/20 rounded-xl md:rounded-2xl">
              <div className="text-lg md:text-2xl font-bold text-red-700 dark:text-red-300">
                {systemMetrics.waterQuality.poor}
              </div>
              <div className="text-xs md:text-sm text-red-600 dark:text-red-400">
                Mauvaise
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Basins Grid - Mobile Optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {basins.slice(0, 9).map((basin) => {
          const status = getBasinStatus(basin);
          const currentReading =
            liveReadings[basin.id] || basin.sensorData?.[0];

          return (
            <Card
              key={basin.id}
              className="rounded-2xl md:rounded-3xl border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3 md:pb-4 p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">
                    {basin.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <Badge
                      className={`${getStatusColor(
                        status
                      )} rounded-full px-2 py-1 text-xs font-medium border`}
                    >
                      {status}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {basin.farm.name} - {basin.farm.location}
                </div>
              </CardHeader>

              <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0">
                {status !== "offline" && currentReading ? (
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl md:rounded-2xl p-2 md:p-3">
                      <div className="flex items-center gap-1 md:gap-2 mb-1">
                        <Thermometer className="h-3 w-3 md:h-4 md:w-4 text-orange-500" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          Temp
                        </span>
                      </div>
                      <div className="text-sm md:text-lg font-bold text-gray-800 dark:text-gray-100">
                        {currentReading.temperature.toFixed(1)}°C
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl md:rounded-2xl p-2 md:p-3">
                      <div className="flex items-center gap-1 md:gap-2 mb-1">
                        <Droplets className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          pH
                        </span>
                      </div>
                      <div className="text-sm md:text-lg font-bold text-gray-800 dark:text-gray-100">
                        {currentReading.ph.toFixed(1)}
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl md:rounded-2xl p-2 md:p-3">
                      <div className="flex items-center gap-1 md:gap-2 mb-1">
                        <Activity className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          O2
                        </span>
                      </div>
                      <div className="text-sm md:text-lg font-bold text-gray-800 dark:text-gray-100">
                        {currentReading.oxygen.toFixed(1)}
                      </div>
                    </div>

                    <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl md:rounded-2xl p-2 md:p-3">
                      <div className="flex items-center gap-1 md:gap-2 mb-1">
                        <Waves className="h-3 w-3 md:h-4 md:w-4 text-teal-500" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                          Salinité
                        </span>
                      </div>
                      <div className="text-sm md:text-lg font-bold text-gray-800 dark:text-gray-100">
                        {currentReading.salinity.toFixed(1)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 md:py-8">
                    <WifiOff className="h-6 w-6 md:h-8 md:w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs md:text-sm">
                      Données non disponibles
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    MAJ: {getTimeAgo(currentReading?.timestamp || "")}
                  </div>
                  <Link
                    href={`/basin/${basin.id}`}
                    className="text-blue-600 hover:text-blue-800 text-xs md:text-sm font-medium"
                  >
                    Détails →
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Advanced Analytics Section - Mobile Optimized */}
      <Card className="rounded-2xl md:rounded-3xl border-gray-100 dark:border-gray-700 shadow-sm">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
            Analyses Prédictives
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Predictive Insights */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 text-sm md:text-base">
                <Zap className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
                Insights Prédictifs
              </h3>
              <div className="space-y-2 md:space-y-3">
                <div className="p-3 md:p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl md:rounded-2xl border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-orange-500" />
                    <span className="text-xs md:text-sm font-medium text-orange-700">
                      Risque pH Élevé
                    </span>
                  </div>
                  <p className="text-xs text-orange-600 mb-2">
                    Bassin C3 pourrait dépasser 8.5 dans 2h
                  </p>
                  <div className="mt-2">
                    <div className="text-xs text-orange-500 mb-1">
                      Probabilité
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                </div>

                <div className="p-3 md:p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl md:rounded-2xl border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                    <span className="text-xs md:text-sm font-medium text-green-700">
                      Conditions Optimales
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mb-2">
                    Bassin A1 maintient paramètres excellents
                  </p>
                  <div className="mt-2">
                    <div className="text-xs text-green-500 mb-1">Stabilité</div>
                    <Progress value={95} className="h-2" />
                  </div>
                </div>
              </div>
            </div>

            {/* Environmental Correlations */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 text-sm md:text-base">
                <Activity className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                Corrélations
              </h3>
              <div className="space-y-2 md:space-y-3">
                <div className="p-3 md:p-4 bg-blue-50 rounded-xl md:rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs md:text-sm font-medium text-blue-700">
                      Temp ↔ O2
                    </span>
                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                      -0.85
                    </Badge>
                  </div>
                  <p className="text-xs text-blue-600">
                    Corrélation négative forte
                  </p>
                </div>

                <div className="p-3 md:p-4 bg-purple-50 rounded-xl md:rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs md:text-sm font-medium text-purple-700">
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

                <div className="p-3 md:p-4 bg-teal-50 rounded-xl md:rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs md:text-sm font-medium text-teal-700">
                      Turbidité ↔ Croissance
                    </span>
                    <Badge className="bg-teal-100 text-teal-700 text-xs">
                      -0.43
                    </Badge>
                  </div>
                  <p className="text-xs text-teal-600">
                    Impact modéré sur croissance
                  </p>
                </div>
              </div>
            </div>

            {/* Smart Recommendations */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 text-sm md:text-base">
                <Shield className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                Recommandations IA
              </h3>
              <div className="space-y-2 md:space-y-3">
                <div className="p-3 md:p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl md:rounded-2xl border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                    <span className="text-xs md:text-sm font-medium text-green-700">
                      Optimisation Temp
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mb-2">
                    Réduire 1°C bassins B2-B5
                  </p>
                  <Button
                    size="sm"
                    className="w-full text-xs bg-green-600 hover:bg-green-700"
                  >
                    Appliquer
                  </Button>
                </div>

                <div className="p-3 md:p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl md:rounded-2xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
                    <span className="text-xs md:text-sm font-medium text-blue-700">
                      Ajustement pH
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mb-2">
                    Ajouter tampon bassin C3
                  </p>
                  <Button
                    size="sm"
                    className="w-full text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    Programmer
                  </Button>
                </div>

                <div className="p-3 md:p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl md:rounded-2xl border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-3 w-3 md:h-4 md:w-4 text-orange-500" />
                    <span className="text-xs md:text-sm font-medium text-orange-700">
                      Oxygénation
                    </span>
                  </div>
                  <p className="text-xs text-orange-600 mb-2">
                    Augmenter aération nocturne
                  </p>
                  <Button
                    size="sm"
                    className="w-full text-xs bg-orange-600 hover:bg-orange-700"
                  >
                    Activer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
