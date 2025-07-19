"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Droplets,
  Thermometer,
  Activity,
  Waves,
  Building,
  MapPin,
  Users,
  Zap,
  Target,
  Award,
  AlertCircle,
  RefreshCw,
  Eye,
  Share2,
  Printer,
  Mail,
  ChevronDown,
  ChevronRight,
  Info,
  LineChart,
  PieChart,
  MessageCircle,
  Link,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  X,
  Send,
  Copy,
  QrCode,
  Download as DownloadIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api";

// Types for report data
interface ReportPeriod {
  id: string;
  label: string;
  value: "daily" | "weekly" | "monthly";
  days: number;
}

interface FarmReport {
  id: string;
  name: string;
  location: string;
  totalPonds: number;
  activePonds: number;
  averageParameters: {
    temperature: number;
    ph: number;
    oxygen: number;
    salinity: number;
  };
  alertsSummary: {
    total: number;
    critical: number;
    warning: number;
    resolved: number;
  };
  production: {
    current: number;
    target: number;
    efficiency: number;
  };
  waterQuality: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  trends: {
    temperature: "up" | "down" | "stable";
    ph: "up" | "down" | "stable";
    oxygen: "up" | "down" | "stable";
    production: "up" | "down" | "stable";
  };
  compliance: {
    environmental: number;
    safety: number;
    production: number;
  };
}

interface PondReport {
  id: string;
  name: string;
  farmName: string;
  type: string;
  status: "normal" | "warning" | "critical" | "offline";
  parameters: {
    temperature: { current: number; min: number; max: number; avg: number };
    ph: { current: number; min: number; max: number; avg: number };
    oxygen: { current: number; min: number; max: number; avg: number };
    salinity: { current: number; min: number; max: number; avg: number };
  };
  alerts: {
    total: number;
    resolved: number;
    pending: number;
    critical: number;
  };
  uptime: number;
  lastMaintenance: string;
  nextMaintenance: string;
  performance: {
    efficiency: number;
    productivity: number;
    qualityScore: number;
  };
}

const REPORT_PERIODS: ReportPeriod[] = [
  { id: "daily", label: "Rapport Quotidien", value: "daily", days: 1 },
  { id: "weekly", label: "Rapport Hebdomadaire", value: "weekly", days: 7 },
  { id: "monthly", label: "Rapport Mensuel", value: "monthly", days: 30 },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>(
    REPORT_PERIODS[0]
  );
  const [selectedFarm, setSelectedFarm] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [farmReports, setFarmReports] = useState<FarmReport[]>([]);
  const [pondReports, setPondReports] = useState<PondReport[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [expandedFarms, setExpandedFarms] = useState<Set<string>>(new Set());
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Generate fake report data
  const generateFarmReport = (
    id: string,
    name: string,
    location: string
  ): FarmReport => {
    const totalPonds = Math.floor(Math.random() * 15) + 5;
    const activePonds = Math.floor(totalPonds * (0.8 + Math.random() * 0.2));

    return {
      id,
      name,
      location,
      totalPonds,
      activePonds,
      averageParameters: {
        temperature: Number((22 + Math.random() * 6).toFixed(1)),
        ph: Number((7.0 + Math.random() * 1.5).toFixed(1)),
        oxygen: Number((6 + Math.random() * 4).toFixed(1)),
        salinity: Number((Math.random() * 35).toFixed(1)),
      },
      alertsSummary: {
        total: Math.floor(Math.random() * 20),
        critical: Math.floor(Math.random() * 3),
        warning: Math.floor(Math.random() * 8),
        resolved: Math.floor(Math.random() * 15),
      },
      production: {
        current: Math.floor(Math.random() * 2000) + 500,
        target: Math.floor(Math.random() * 2500) + 1500,
        efficiency: Math.floor(Math.random() * 30) + 70,
      },
      waterQuality: {
        excellent: Math.floor(Math.random() * 10) + 5,
        good: Math.floor(Math.random() * 8) + 3,
        fair: Math.floor(Math.random() * 5) + 1,
        poor: Math.floor(Math.random() * 2),
      },
      trends: {
        temperature:
          Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable",
        ph:
          Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable",
        oxygen:
          Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable",
        production:
          Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable",
      },
      compliance: {
        environmental: Math.floor(Math.random() * 20) + 80,
        safety: Math.floor(Math.random() * 15) + 85,
        production: Math.floor(Math.random() * 25) + 75,
      },
    };
  };

  const generatePondReport = (
    id: string,
    name: string,
    farmName: string
  ): PondReport => {
    const status =
      Math.random() > 0.8
        ? "critical"
        : Math.random() > 0.6
        ? "warning"
        : "normal";

    return {
      id,
      name,
      farmName,
      type: Math.random() > 0.5 ? "Marine" : "Eau douce",
      status,
      parameters: {
        temperature: {
          current: Number((22 + Math.random() * 6).toFixed(1)),
          min: Number((20 + Math.random() * 2).toFixed(1)),
          max: Number((26 + Math.random() * 4).toFixed(1)),
          avg: Number((23 + Math.random() * 3).toFixed(1)),
        },
        ph: {
          current: Number((7.0 + Math.random() * 1.5).toFixed(1)),
          min: Number((6.5 + Math.random() * 0.5).toFixed(1)),
          max: Number((8.0 + Math.random() * 0.5).toFixed(1)),
          avg: Number((7.3 + Math.random() * 0.4).toFixed(1)),
        },
        oxygen: {
          current: Number((6 + Math.random() * 4).toFixed(1)),
          min: Number((5 + Math.random() * 2).toFixed(1)),
          max: Number((9 + Math.random() * 2).toFixed(1)),
          avg: Number((7 + Math.random() * 2).toFixed(1)),
        },
        salinity: {
          current: Number((Math.random() * 35).toFixed(1)),
          min: Number((Math.random() * 30).toFixed(1)),
          max: Number((Math.random() * 40).toFixed(1)),
          avg: Number((Math.random() * 35).toFixed(1)),
        },
      },
      alerts: {
        total: Math.floor(Math.random() * 10),
        resolved: Math.floor(Math.random() * 8),
        pending: Math.floor(Math.random() * 3),
        critical: Math.floor(Math.random() * 2),
      },
      uptime: Math.floor(Math.random() * 20) + 80,
      lastMaintenance: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      nextMaintenance: new Date(
        Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      performance: {
        efficiency: Math.floor(Math.random() * 30) + 70,
        productivity: Math.floor(Math.random() * 25) + 75,
        qualityScore: Math.floor(Math.random() * 20) + 80,
      },
    };
  };

  // Load report data
  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Generate fake farm reports
        const farms: FarmReport[] = [
          generateFarmReport("farm1", "Ferme Aquacole El Djazair", "Alger"),
          generateFarmReport("farm2", "Centre Marin Mediterra", "Oran"),
          generateFarmReport("farm3", "Aquaculture Sahel", "Annaba"),
          generateFarmReport("farm4", "Ferme Bleue d'Alger", "Alger"),
          generateFarmReport("farm5", "Aqua-Tech Oran", "Oran"),
        ];

        // Generate fake pond reports
        const ponds: PondReport[] = [];
        farms.forEach((farm) => {
          for (let i = 0; i < farm.totalPonds; i++) {
            ponds.push(
              generatePondReport(
                `${farm.id}-pond-${i + 1}`,
                `Bassin ${String.fromCharCode(65 + Math.floor(i / 3))}${
                  (i % 3) + 1
                }`,
                farm.name
              )
            );
          }
        });

        setFarmReports(farms);
        setPondReports(ponds);

        // Generate summary data
        setSummaryData({
          totalFarms: farms.length,
          totalPonds: ponds.length,
          activePonds: ponds.filter((p) => p.status !== "offline").length,
          totalAlerts: farms.reduce((sum, f) => sum + f.alertsSummary.total, 0),
          criticalAlerts: farms.reduce(
            (sum, f) => sum + f.alertsSummary.critical,
            0
          ),
          averageEfficiency: Math.round(
            farms.reduce((sum, f) => sum + f.production.efficiency, 0) /
              farms.length
          ),
          totalProduction: farms.reduce(
            (sum, f) => sum + f.production.current,
            0
          ),
          complianceScore: Math.round(
            farms.reduce((sum, f) => sum + f.compliance.environmental, 0) /
              farms.length
          ),
        });
      } catch (error) {
        console.error("Error loading reports:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [selectedPeriod, selectedFarm]);

  const toggleFarmExpansion = (farmId: string) => {
    const newExpanded = new Set(expandedFarms);
    if (newExpanded.has(farmId)) {
      newExpanded.delete(farmId);
    } else {
      newExpanded.add(farmId);
    }
    setExpandedFarms(newExpanded);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return (
          <div className="h-4 w-4 border-2 border-gray-400 rounded-full" />
        );
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
        return <AlertCircle className="h-4 w-4" />;
      case "offline":
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleExportReport = (format: "pdf" | "excel" | "csv") => {
    // Simulate export functionality
    console.log(`Exporting report as ${format}`);
  };

  const handleShareReport = () => {
    // Open the share dialog
    setShareDialogOpen(true);
  };

  // Share functions
  const handleShareViaSocial = (platform: string) => {
    const url = window.location.href;
    const title = `Rapport ${selectedPeriod.label} - Aquaculture`;

    switch (platform) {
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            url
          )}`,
          "_blank"
        );
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(
            url
          )}&text=${encodeURIComponent(title)}`,
          "_blank"
        );
        break;
      case "linkedin":
        window.open(
          `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
            url
          )}&title=${encodeURIComponent(title)}`,
          "_blank"
        );
        break;
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${title}: ${url}`)}`,
          "_blank"
        );
        break;
      case "email":
        window.open(
          `mailto:?subject=${encodeURIComponent(
            title
          )}&body=${encodeURIComponent(`Consultez ce rapport: ${url}`)}`,
          "_blank"
        );
        break;
      default:
        break;
    }
    setShareDialogOpen(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert("Lien copié dans le presse-papiers!");
      setShareDialogOpen(false);
    });
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Génération des rapports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Rapports & Analyses
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Surveillance et analyse des performances des fermes aquacoles
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
            <Select
              value={selectedPeriod.id}
              onValueChange={(value) =>
                setSelectedPeriod(
                  REPORT_PERIODS.find((p) => p.id === value) ||
                    REPORT_PERIODS[0]
                )
              }
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_PERIODS.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExportReport("pdf")}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportReport("excel")}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportReport("csv")}>
                  <FileText className="h-4 w-4 mr-2" />
                  CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="rounded-xl md:rounded-2xl border-gray-100">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 mb-1">
                  Total Fermes
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-800">
                  {summaryData?.totalFarms || 0}
                </p>
              </div>
              <Building className="h-8 w-8 md:h-10 md:w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl md:rounded-2xl border-gray-100">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 mb-1">
                  Bassins Actifs
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-800">
                  {summaryData?.activePonds || 0}
                </p>
              </div>
              <Waves className="h-8 w-8 md:h-10 md:w-10 text-teal-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl md:rounded-2xl border-gray-100">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 mb-1">
                  Production
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-800">
                  {summaryData?.totalProduction || 0}kg
                </p>
              </div>
              <Target className="h-8 w-8 md:h-10 md:w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl md:rounded-2xl border-gray-100">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 mb-1">
                  Efficacité
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-800">
                  {summaryData?.averageEfficiency || 0}%
                </p>
              </div>
              <Award className="h-8 w-8 md:h-10 md:w-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="farms" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="farms">Fermes</TabsTrigger>
          <TabsTrigger value="ponds">Bassins</TabsTrigger>
          <TabsTrigger value="analytics">Analytiques</TabsTrigger>
        </TabsList>

        {/* Farms Tab */}
        <TabsContent value="farms" className="space-y-4">
          <div className="space-y-4">
            {farmReports.map((farm) => (
              <Card
                key={farm.id}
                className="rounded-xl md:rounded-2xl border-gray-100"
              >
                <CardHeader
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleFarmExpansion(farm.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedFarms.has(farm.id) ? (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <CardTitle className="text-lg md:text-xl">
                          {farm.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {farm.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-700">
                        {farm.activePonds}/{farm.totalPonds} bassins
                      </Badge>
                      <Badge
                        className={`${
                          farm.production.efficiency > 85
                            ? "bg-green-100 text-green-700"
                            : farm.production.efficiency > 70
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {farm.production.efficiency}% efficacité
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                {expandedFarms.has(farm.id) && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Parameters */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Paramètres Moyens
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-orange-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Thermometer className="h-4 w-4 text-orange-500" />
                              <span className="text-xs text-gray-600">
                                Température
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {farm.averageParameters.temperature}°C
                              </span>
                              {getTrendIcon(farm.trends.temperature)}
                            </div>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Droplets className="h-4 w-4 text-blue-500" />
                              <span className="text-xs text-gray-600">pH</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {farm.averageParameters.ph}
                              </span>
                              {getTrendIcon(farm.trends.ph)}
                            </div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Activity className="h-4 w-4 text-green-500" />
                              <span className="text-xs text-gray-600">
                                Oxygène
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {farm.averageParameters.oxygen} mg/L
                              </span>
                              {getTrendIcon(farm.trends.oxygen)}
                            </div>
                          </div>
                          <div className="bg-teal-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Waves className="h-4 w-4 text-teal-500" />
                              <span className="text-xs text-gray-600">
                                Salinité
                              </span>
                            </div>
                            <div className="text-sm font-semibold">
                              {farm.averageParameters.salinity} ppt
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Alerts */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Alertes
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Total</span>
                            <Badge className="bg-gray-100 text-gray-700">
                              {farm.alertsSummary.total}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Critiques
                            </span>
                            <Badge className="bg-red-100 text-red-700">
                              {farm.alertsSummary.critical}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Avertissements
                            </span>
                            <Badge className="bg-yellow-100 text-yellow-700">
                              {farm.alertsSummary.warning}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Résolues
                            </span>
                            <Badge className="bg-green-100 text-green-700">
                              {farm.alertsSummary.resolved}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Production */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Production & Conformité
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600">
                                Production
                              </span>
                              <span className="text-sm font-semibold">
                                {farm.production.current}/
                                {farm.production.target} kg
                              </span>
                            </div>
                            <Progress
                              value={
                                (farm.production.current /
                                  farm.production.target) *
                                100
                              }
                              className="h-2"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600">
                                Conformité Env.
                              </span>
                              <span className="text-sm font-semibold">
                                {farm.compliance.environmental}%
                              </span>
                            </div>
                            <Progress
                              value={farm.compliance.environmental}
                              className="h-2"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600">
                                Sécurité
                              </span>
                              <span className="text-sm font-semibold">
                                {farm.compliance.safety}%
                              </span>
                            </div>
                            <Progress
                              value={farm.compliance.safety}
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Ponds Tab */}
        <TabsContent value="ponds" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pondReports.slice(0, 12).map((pond) => (
              <Card
                key={pond.id}
                className="rounded-xl md:rounded-2xl border-gray-100"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{pond.name}</CardTitle>
                      <p className="text-sm text-gray-600">{pond.farmName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`${getStatusColor(pond.status)} text-xs`}
                      >
                        {getStatusIcon(pond.status)}
                        <span className="ml-1">{pond.status}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-orange-50 p-2 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <Thermometer className="h-3 w-3 text-orange-500" />
                        <span className="text-xs text-gray-600">Temp</span>
                      </div>
                      <div className="text-sm font-semibold">
                        {pond.parameters.temperature.current}°C
                      </div>
                      <div className="text-xs text-gray-500">
                        {pond.parameters.temperature.min}° -{" "}
                        {pond.parameters.temperature.max}°
                      </div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <Droplets className="h-3 w-3 text-blue-500" />
                        <span className="text-xs text-gray-600">pH</span>
                      </div>
                      <div className="text-sm font-semibold">
                        {pond.parameters.ph.current}
                      </div>
                      <div className="text-xs text-gray-500">
                        {pond.parameters.ph.min} - {pond.parameters.ph.max}
                      </div>
                    </div>
                    <div className="bg-green-50 p-2 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <Activity className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-gray-600">O2</span>
                      </div>
                      <div className="text-sm font-semibold">
                        {pond.parameters.oxygen.current} mg/L
                      </div>
                      <div className="text-xs text-gray-500">
                        {pond.parameters.oxygen.min} -{" "}
                        {pond.parameters.oxygen.max}
                      </div>
                    </div>
                    <div className="bg-teal-50 p-2 rounded-lg">
                      <div className="flex items-center gap-1 mb-1">
                        <Waves className="h-3 w-3 text-teal-500" />
                        <span className="text-xs text-gray-600">Salinité</span>
                      </div>
                      <div className="text-sm font-semibold">
                        {pond.parameters.salinity.current} ppt
                      </div>
                      <div className="text-xs text-gray-500">
                        {pond.parameters.salinity.min} -{" "}
                        {pond.parameters.salinity.max}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Disponibilité
                      </span>
                      <span className="text-sm font-semibold">
                        {pond.uptime}%
                      </span>
                    </div>
                    <Progress value={pond.uptime} className="h-2" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        Dernière maintenance
                      </span>
                      <span>{formatDate(pond.lastMaintenance)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">
                        Prochaine maintenance
                      </span>
                      <span>{formatDate(pond.nextMaintenance)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Performance Chart */}
            <Card className="rounded-xl md:rounded-2xl border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Performance Générale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {summaryData?.averageEfficiency || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Efficacité</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {summaryData?.complianceScore || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Conformité</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(
                          summaryData?.totalProduction / summaryData?.totalFarms
                        ) || 0}
                      </div>
                      <div className="text-sm text-gray-600">Kg/Ferme</div>
                    </div>
                  </div>
                  <div className="h-40 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Graphique de performance</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Distribution Chart */}
            <Card className="rounded-xl md:rounded-2xl border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribution des États
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Normal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">Attention</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm">Critique</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {
                            pondReports.filter((p) => p.status === "normal")
                              .length
                          }
                        </div>
                        <div className="text-lg font-semibold">
                          {
                            pondReports.filter((p) => p.status === "warning")
                              .length
                          }
                        </div>
                        <div className="text-lg font-semibold">
                          {
                            pondReports.filter((p) => p.status === "critical")
                              .length
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-40 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <PieChart className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Graphique de distribution</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Overview */}
          <Card className="rounded-xl md:rounded-2xl border-gray-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Aperçu de la Conformité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">
                    Environnementale
                  </h4>
                  <div className="space-y-2">
                    {farmReports.map((farm) => (
                      <div
                        key={farm.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-600">
                          {farm.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={farm.compliance.environmental}
                            className="w-16 h-2"
                          />
                          <span className="text-sm font-semibold w-10 text-right">
                            {farm.compliance.environmental}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Sécurité</h4>
                  <div className="space-y-2">
                    {farmReports.map((farm) => (
                      <div
                        key={farm.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-600">
                          {farm.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={farm.compliance.safety}
                            className="w-16 h-2"
                          />
                          <span className="text-sm font-semibold w-10 text-right">
                            {farm.compliance.safety}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Production</h4>
                  <div className="space-y-2">
                    {farmReports.map((farm) => (
                      <div
                        key={farm.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-gray-600">
                          {farm.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={farm.compliance.production}
                            className="w-16 h-2"
                          />
                          <span className="text-sm font-semibold w-10 text-right">
                            {farm.compliance.production}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Share Report Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-lg p-6 mx-auto rounded-2xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-800">
              Partager le Rapport
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="text-sm text-gray-600">
              Partager ce rapport {selectedPeriod.label.toLowerCase()} avec vos
              collègues et partenaires
            </div>

            {/* Link sharing section */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Lien du rapport
              </label>
              <div className="flex gap-2">
                <Input
                  value={window.location.href}
                  readOnly
                  className="flex-1 text-xs"
                />
                <Button size="sm" variant="outline" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Social media sharing */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Partager sur les réseaux sociaux
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-12"
                  onClick={() => handleShareViaSocial("facebook")}
                >
                  <Facebook className="w-5 h-5 text-blue-600" />
                  Facebook
                </Button>

                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-12"
                  onClick={() => handleShareViaSocial("twitter")}
                >
                  <Twitter className="w-5 h-5 text-blue-400" />
                  Twitter
                </Button>

                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-12"
                  onClick={() => handleShareViaSocial("linkedin")}
                >
                  <Linkedin className="w-5 h-5 text-blue-700" />
                  LinkedIn
                </Button>

                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2 h-12"
                  onClick={() => handleShareViaSocial("whatsapp")}
                >
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  WhatsApp
                </Button>
              </div>
            </div>

            {/* Email sharing */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Partager par email
              </label>
              <div className="space-y-3">
                <Input
                  placeholder="Adresses email (séparées par des virgules)"
                  className="w-full"
                />
                <Textarea
                  placeholder="Message personnel (optionnel)"
                  className="w-full h-20 resize-none"
                />
                <Button
                  className="w-full"
                  onClick={() => handleShareViaSocial("email")}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer par Email
                </Button>
              </div>
            </div>

            {/* Direct download options */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Téléchargement direct
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportReport("pdf")}
                  className="flex flex-col items-center gap-1 h-16"
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">PDF</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportReport("excel")}
                  className="flex flex-col items-center gap-1 h-16"
                >
                  <BarChart3 className="h-5 w-5" />
                  <span className="text-xs">Excel</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportReport("csv")}
                  className="flex flex-col items-center gap-1 h-16"
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">CSV</span>
                </Button>
              </div>
            </div>

            {/* QR Code sharing */}
            <div className="border-t pt-4">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => {
                  // Generate QR code functionality could be added here
                  alert("Génération du QR Code...");
                }}
              >
                <QrCode className="h-4 w-4" />
                Générer un QR Code
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Report Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-lg p-6 mx-auto rounded-2xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-800">
              Exporter le Rapport
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Choisissez le format dans lequel vous souhaitez exporter le
              rapport.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-4">
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={() => {
                setExportDialogOpen(false);
                handleExportReport("pdf");
              }}
            >
              <FileText className="w-5 h-5 text-gray-500" />
              PDF
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={() => {
                setExportDialogOpen(false);
                handleExportReport("excel");
              }}
            >
              <BarChart3 className="w-5 h-5 text-gray-500" />
              Excel
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2"
              onClick={() => {
                setExportDialogOpen(false);
                handleExportReport("csv");
              }}
            >
              <FileText className="w-5 h-5 text-gray-500" />
              CSV
            </Button>
          </div>

          <div className="mt-4">
            <Button
              onClick={() => setExportDialogOpen(false)}
              className="w-full"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
