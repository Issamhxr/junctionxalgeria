"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Play,
  Pause,
  Volume2,
  Maximize,
  Eye,
  Fish,
  Target,
  BarChart3,
  Calendar,
  Zap,
  Brain,
  Lightbulb,
  TrendingDown,
  Sparkles,
  MessageCircle,
  Send,
  LineChart,
  PieChart,
  AreaChart,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export function BasinDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [basin, setBasin] = useState<Basin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI Recommendations and Predictions State
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [aiPredictions, setAiPredictions] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(true);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Chart and Parameter Toggle State
  const [selectedChartType, setSelectedChartType] = useState("line");
  const [visibleParameters, setVisibleParameters] = useState({
    temperature: true,
    ph: true,
    oxygen: true,
    salinity: true,
    turbidity: true,
    waterLevel: true,
    fishCount: true,
    activityLevel: true,
    feedingRate: true,
  });
  const [showAllParameters, setShowAllParameters] = useState(true);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  // Video surveillance state - updated for iframe
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [currentTimestamp, setCurrentTimestamp] = useState(new Date());
  const videoRef = useRef<HTMLIFrameElement>(null);

  // Real-time sensor data that updates every second
  const [realTimeData, setRealTimeData] = useState({
    temperature: 22.5,
    ph: 7.2,
    oxygen: 6.8,
    salinity: 15.3,
    turbidity: 2.1,
    fishCount: 143,
    activityLevel: 85,
    feedingRate: 2.3,
    waterLevel: 95.2,
  });

  // Mock computer vision data
  const [cvData, setCvData] = useState({
    fishDetected: 143,
    anomaliesDetected: 3,
    motionIntensity: "High" as "High" | "Medium" | "Low",
    lastAlert: "Low Activity at 13:45",
    activityData: [
      { time: "10:00", activity: 85 },
      { time: "11:00", activity: 92 },
      { time: "12:00", activity: 78 },
      { time: "13:00", activity: 45 },
      { time: "14:00", activity: 67 },
      { time: "15:00", activity: 88 },
    ],
    anomalyLog: [
      { time: "13:45", type: "Low Activity", severity: "Warning" },
      { time: "12:30", type: "Feeding Behavior Change", severity: "Info" },
      { time: "11:15", type: "Water Surface Disturbance", severity: "Warning" },
    ],
  });

  const basinId = params.id as string;

  // Generate mock historical data for charts
  const generateHistoricalData = () => {
    const data = [];
    const now = new Date();

    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        time: timestamp.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timestamp: timestamp.toISOString(),
        temperature: 20 + Math.random() * 8,
        ph: 6.5 + Math.random() * 2,
        oxygen: 5 + Math.random() * 4,
        salinity: 10 + Math.random() * 25,
        turbidity: Math.random() * 5,
        waterLevel: 85 + Math.random() * 15,
        fishCount: 140 + Math.floor(Math.random() * 10),
        activityLevel: 60 + Math.random() * 40,
        feedingRate: 1.5 + Math.random() * 2,
      });
    }
    return data;
  };

  // Parameter configuration
  const parameterConfig = {
    temperature: { name: "Température", color: "#f97316", unit: "°C" },
    ph: { name: "pH", color: "#3b82f6", unit: "" },
    oxygen: { name: "Oxygène", color: "#10b981", unit: "mg/L" },
    salinity: { name: "Salinité", color: "#14b8a6", unit: "ppt" },
    turbidity: { name: "Turbidité", color: "#eab308", unit: "NTU" },
    waterLevel: { name: "Niveau d'eau", color: "#8b5cf6", unit: "%" },
    fishCount: { name: "Nb Poissons", color: "#22c55e", unit: "" },
    activityLevel: { name: "Activité", color: "#3b82f6", unit: "%" },
    feedingRate: { name: "Alimentation", color: "#a855f7", unit: "kg/h" },
  };

  const toggleParameter = (param: keyof typeof visibleParameters) => {
    setVisibleParameters((prev) => ({
      ...prev,
      [param]: !prev[param],
    }));
  };

  const toggleAllParameters = () => {
    const newState = !showAllParameters;
    setShowAllParameters(newState);
    setVisibleParameters({
      temperature: newState,
      ph: newState,
      oxygen: newState,
      salinity: newState,
      turbidity: newState,
      waterLevel: newState,
      fishCount: newState,
      activityLevel: newState,
      feedingRate: newState,
    });
  };

  // Simple chart component using CSS and divs (no external library needed)
  const SimpleChart = ({
    data,
    parameters,
    type = "line",
  }: {
    data: any[];
    parameters: string[];
    type?: string;
  }) => {
    if (!data || data.length === 0)
      return <div className="text-center text-gray-500">Aucune donnée</div>;

    const maxValues = parameters.reduce((acc, param) => {
      acc[param] = Math.max(...data.map((d) => d[param] || 0));
      return acc;
    }, {} as any);

    return (
      <div className="relative">
        {/* Chart Legend */}
        <div className="flex flex-wrap gap-2 mb-4">
          {parameters.map((param) => (
            <div key={param} className="flex items-center gap-1 text-xs">
              <div
                className="w-3 h-3 rounded"
                style={{
                  backgroundColor:
                    parameterConfig[param as keyof typeof parameterConfig]
                      ?.color,
                }}
              ></div>
              <span>
                {parameterConfig[param as keyof typeof parameterConfig]?.name}
              </span>
            </div>
          ))}
        </div>

        {/* Chart Container */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 h-64 relative overflow-hidden">
          <div className="absolute inset-4 flex items-end justify-between">
            {data.map((point, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center justify-end h-full group relative"
              >
                {parameters.map((param, paramIndex) => {
                  const value = point[param] || 0;
                  const percentage = (value / maxValues[param]) * 100;
                  const color =
                    parameterConfig[param as keyof typeof parameterConfig]
                      ?.color;

                  if (type === "bar") {
                    return (
                      <div
                        key={param}
                        className="w-2 mx-px opacity-80 hover:opacity-100 transition-opacity rounded-t"
                        style={{
                          height: `${Math.max(percentage, 5)}%`,
                          backgroundColor: color,
                          marginLeft: `${paramIndex * 3}px`,
                        }}
                        title={`${point.time}: ${value.toFixed(1)}${
                          parameterConfig[param as keyof typeof parameterConfig]
                            ?.unit
                        }`}
                      />
                    );
                  } else {
                    // Line chart approximation using positioned dots
                    return (
                      <div
                        key={param}
                        className="absolute w-2 h-2 rounded-full opacity-80 hover:opacity-100 transition-opacity"
                        style={{
                          bottom: `${Math.max(percentage, 2)}%`,
                          backgroundColor: color,
                          left: `${paramIndex * 2}px`,
                        }}
                        title={`${point.time}: ${value.toFixed(1)}${
                          parameterConfig[param as keyof typeof parameterConfig]
                            ?.unit
                        }`}
                      />
                    );
                  }
                })}

                {/* Time label */}
                {index % 4 === 0 && (
                  <div className="absolute -bottom-6 text-xs text-gray-500 dark:text-gray-400 transform -rotate-45 origin-top-left">
                    {point.time}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // AI Analysis Functions
  const generateAIRecommendations = (basinData: Basin, realTimeData: any) => {
    const recommendations = [];
    const currentTime = new Date();

    // Temperature Analysis
    if (realTimeData.temperature > 26) {
      recommendations.push({
        id: "temp-high",
        type: "urgent",
        priority: "high",
        category: "Température",
        title: "Température Élevée Détectée",
        message: `La température actuelle (${realTimeData.temperature.toFixed(
          1
        )}°C) dépasse les niveaux optimaux. Risque de stress thermique pour les poissons.`,
        action: "Activer le système de refroidissement ou augmenter l'aération",
        impact: "Réduction potentielle de 15% de l'appétit des poissons",
        timeline: "Action requise dans les 30 minutes",
        confidence: 92,
        timestamp: currentTime.toISOString(),
      });
    }

    // pH Analysis
    if (realTimeData.ph < 6.5 || realTimeData.ph > 8.5) {
      const isAcidic = realTimeData.ph < 6.5;
      recommendations.push({
        id: "ph-imbalance",
        type: "warning",
        priority: "medium",
        category: "Qualité de l'Eau",
        title: `pH ${isAcidic ? "Trop Acide" : "Trop Basique"}`,
        message: `Le pH actuel (${realTimeData.ph.toFixed(
          1
        )}) nécessite une correction immédiate.`,
        action: isAcidic
          ? "Ajouter du bicarbonate de sodium"
          : "Ajouter de l'acide phosphorique dilué",
        impact: "Stress respiratoire et réduction de l'immunité",
        timeline: "Correction dans les 2 heures",
        confidence: 89,
        timestamp: currentTime.toISOString(),
      });
    }

    // Oxygen Analysis
    if (realTimeData.oxygen < 6.0) {
      recommendations.push({
        id: "oxygen-low",
        type: "critical",
        priority: "critical",
        category: "Oxygénation",
        title: "Niveau d'Oxygène Critique",
        message: `Oxygène dissous (${realTimeData.oxygen.toFixed(
          1
        )} mg/L) en dessous du seuil critique.`,
        action: "Augmenter immédiatement l'aération et vérifier les diffuseurs",
        impact: "Risque de mortalité élevé dans les prochaines heures",
        timeline: "Action immédiate requise",
        confidence: 96,
        timestamp: currentTime.toISOString(),
      });
    }

    // Activity Analysis
    if (realTimeData.activityLevel < 60) {
      recommendations.push({
        id: "activity-low",
        type: "info",
        priority: "low",
        category: "Comportement",
        title: "Activité Réduite Observée",
        message: `L'activité des poissons (${realTimeData.activityLevel.toFixed(
          0
        )}%) suggère une réduction de l'appétit.`,
        action: "Réduire temporairement les rations alimentaires de 20%",
        impact: "Optimisation de la conversion alimentaire",
        timeline: "Appliquer au prochain repas",
        confidence: 78,
        timestamp: currentTime.toISOString(),
      });
    }

    // Water Level Analysis
    if (realTimeData.waterLevel < 85) {
      recommendations.push({
        id: "water-level",
        type: "warning",
        priority: "medium",
        category: "Infrastructure",
        title: "Niveau d'Eau Bas",
        message: `Le niveau d'eau (${realTimeData.waterLevel.toFixed(
          1
        )}%) nécessite un appoint.`,
        action: "Programmer un appoint d'eau et vérifier les fuites",
        impact: "Concentration des polluants et stress",
        timeline: "Dans les 6 heures",
        confidence: 85,
        timestamp: currentTime.toISOString(),
      });
    }

    return recommendations;
  };

  const generateAIPredictions = (basinData: Basin, realTimeData: any) => {
    const predictions = [];
    const currentTime = new Date();

    // Temperature Trend Prediction
    const tempTrend = Math.random() > 0.5 ? "increase" : "decrease";
    predictions.push({
      id: "temp-trend",
      type: "trend",
      category: "Température",
      title: "Prédiction Thermique - 24h",
      current: realTimeData.temperature.toFixed(1),
      predicted:
        tempTrend === "increase"
          ? (realTimeData.temperature + Math.random() * 2).toFixed(1)
          : (realTimeData.temperature - Math.random() * 2).toFixed(1),
      trend: tempTrend,
      confidence: 87,
      factors: [
        "Conditions météorologiques",
        "Cycle jour/nuit",
        "Densité de stockage",
      ],
      impact:
        tempTrend === "increase"
          ? "Augmentation du métabolisme"
          : "Ralentissement métabolique",
      timeframe: "Prochaines 24 heures",
      timestamp: currentTime.toISOString(),
    });

    // Fish Growth Prediction
    predictions.push({
      id: "growth-pred",
      type: "growth",
      category: "Production",
      title: "Croissance Estimée",
      current: `${realTimeData.fishCount} poissons`,
      predicted: `Gain de poids moyen: ${(Math.random() * 0.5 + 0.2).toFixed(
        1
      )}g/jour`,
      trend: "stable",
      confidence: 79,
      factors: ["Qualité de l'eau", "Taux d'alimentation", "Température"],
      impact: "Performance de croissance optimale",
      timeframe: "Semaine prochaine",
      timestamp: currentTime.toISOString(),
    });

    // Feed Conversion Prediction
    predictions.push({
      id: "fcr-pred",
      type: "efficiency",
      category: "Alimentation",
      title: "Efficacité Alimentaire",
      current: `${realTimeData.feedingRate.toFixed(1)} kg/h`,
      predicted: `FCR prévu: ${(1.2 + Math.random() * 0.3).toFixed(1)}`,
      trend: realTimeData.activityLevel > 80 ? "improve" : "stable",
      confidence: 82,
      factors: [
        "Activité des poissons",
        "Qualité de l'aliment",
        "Température de l'eau",
      ],
      impact: "Optimisation des coûts alimentaires",
      timeframe: "Prochains 7 jours",
      timestamp: currentTime.toISOString(),
    });

    // Water Quality Forecast
    predictions.push({
      id: "water-quality",
      type: "quality",
      category: "Qualité Eau",
      title: "Évolution Qualité Eau",
      current: "Bonne",
      predicted: realTimeData.turbidity > 3 ? "Surveillance requise" : "Stable",
      trend: realTimeData.turbidity > 3 ? "decline" : "stable",
      confidence: 84,
      factors: ["Turbidité", "Charge organique", "Renouvellement d'eau"],
      impact: "Maintien des conditions optimales",
      timeframe: "48-72 heures",
      timestamp: currentTime.toISOString(),
    });

    return predictions;
  };

  const loadAIAnalysis = async () => {
    setLoadingAI(true);

    // Simulate AI processing time with loading states
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (basin && realTimeData) {
      const recommendations = generateAIRecommendations(basin, realTimeData);
      const predictions = generateAIPredictions(basin, realTimeData);

      setAiRecommendations(recommendations);
      setAiPredictions(predictions);

      // Initialize chat with a contextual greeting
      setChatMessages([
        {
          id: "welcome",
          type: "ai",
          message: `Bonjour ! Je suis l'assistant IA pour le ${basin.name}. J'ai analysé les conditions actuelles et généré ${recommendations.length} recommandations basées sur les données en temps réel. Comment puis-je vous aider aujourd'hui ?`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    setLoadingAI(false);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: "user",
      message: chatInput,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsTyping(true);

    // Simulate AI response with realistic delay
    setTimeout(() => {
      const aiResponse = generateAIResponse(chatInput, basin, realTimeData);
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "ai",
          message: aiResponse,
          timestamp: new Date().toISOString(),
        },
      ]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (
    input: string,
    basinData: Basin | null,
    realTimeData: any
  ) => {
    const lowerInput = input.toLowerCase();
    const currentTime = new Date().toLocaleTimeString("fr-FR");

    if (lowerInput.includes("température") || lowerInput.includes("temp")) {
      return `🌡️ **Analyse Température (${currentTime})**\n\nLa température actuelle est de ${realTimeData.temperature.toFixed(
        1
      )}°C. ${
        realTimeData.temperature > 26
          ? "⚠️ C'est légèrement élevé pour ce type de bassin. Je recommande d'augmenter l'aération ou d'activer le refroidissement pour éviter le stress thermique."
          : realTimeData.temperature < 20
          ? "❄️ C'est un peu bas, ce qui peut ralentir le métabolisme des poissons. Vérifiez le système de chauffage."
          : "✅ C'est dans la plage optimale (18-25°C) pour vos poissons."
      }`;
    }

    if (lowerInput.includes("ph")) {
      return `💧 **Analyse pH (${currentTime})**\n\nLe pH actuel est de ${realTimeData.ph.toFixed(
        1
      )}. ${
        realTimeData.ph < 6.5
          ? "🔴 C'est trop acide. Ajoutez du bicarbonate de sodium pour augmenter le pH vers 7.0-7.5."
          : realTimeData.ph > 8.5
          ? "🔴 C'est trop basique. Utilisez un acidifiant approprié pour baisser le pH."
          : "✅ Le pH est dans la plage acceptable (6.5-8.5)."
      }`;
    }

    if (lowerInput.includes("oxygène") || lowerInput.includes("oxygen")) {
      return `🫁 **Analyse Oxygène (${currentTime})**\n\nLe niveau d'oxygène dissous est de ${realTimeData.oxygen.toFixed(
        1
      )} mg/L. ${
        realTimeData.oxygen < 6
          ? "🚨 CRITIQUE: Niveau d'oxygène dangereusement bas ! Augmentez immédiatement l'aération et vérifiez les diffuseurs."
          : realTimeData.oxygen < 7
          ? "⚠️ Niveau acceptable mais surveillez de près. Augmentez légèrement l'aération."
          : "✅ Excellent niveau d'oxygène pour vos poissons."
      }`;
    }

    if (lowerInput.includes("alimentation") || lowerInput.includes("feed")) {
      return `🐟 **Analyse Alimentation (${currentTime})**\n\nTaux d'alimentation: ${realTimeData.feedingRate.toFixed(
        1
      )} kg/h\nActivité des poissons: ${realTimeData.activityLevel.toFixed(
        0
      )}%\n\n${
        realTimeData.activityLevel < 60
          ? "📉 L'activité est faible, réduisez les rations de 20% temporairement pour éviter le gaspillage."
          : realTimeData.activityLevel > 85
          ? "📈 Excellente activité ! Vous pouvez maintenir ou légèrement augmenter le taux d'alimentation."
          : "✅ L'activité est bonne, maintenez le taux d'alimentation actuel."
      }`;
    }

    if (
      lowerInput.includes("prédiction") ||
      lowerInput.includes("avenir") ||
      lowerInput.includes("prévoir")
    ) {
      return `🔮 **Prédictions IA (${currentTime})**\n\nBasé sur les tendances actuelles:\n• Température: ${
        Math.random() > 0.5 ? "légère augmentation" : "stable"
      } dans les 24h\n• Activité poissons: ${
        realTimeData.activityLevel > 75 ? "optimale" : "modérée"
      }\n• Qualité eau: ${
        realTimeData.turbidity < 3 ? "stable" : "surveillance requise"
      }\n\nRecommandation: ${
        realTimeData.activityLevel > 80
          ? "Conditions idéales maintenues"
          : "Surveiller les paramètres de près"
      }`;
    }

    if (
      lowerInput.includes("recommandation") ||
      lowerInput.includes("conseil")
    ) {
      const urgent = aiRecommendations.filter(
        (r) => r.priority === "critical" || r.priority === "high"
      );
      return `💡 **Recommandations Prioritaires (${currentTime})**\n\n${
        urgent.length > 0
          ? urgent.map((r) => `🚨 ${r.title}: ${r.action}`).join("\n")
          : "✅ Aucune action urgente requise. Tous les paramètres sont dans les normes acceptables."
      }\n\nVoulez-vous plus de détails sur un paramètre spécifique ?`;
    }

    // Default contextual response
    return `🤖 **Analyse Globale (${currentTime})**\n\nJe surveille en continu le ${
      basinData?.name || "bassin"
    }:\n\n📊 **Paramètres actuels:**\n• Température: ${realTimeData.temperature.toFixed(
      1
    )}°C\n• pH: ${realTimeData.ph.toFixed(
      1
    )}\n• Oxygène: ${realTimeData.oxygen.toFixed(
      1
    )} mg/L\n• Activité: ${realTimeData.activityLevel.toFixed(
      0
    )}%\n\n💬 Posez-moi des questions sur:\n• Température, pH, oxygène\n• Alimentation et comportement\n• Prédictions et recommandations`;
  };

  useEffect(() => {
    // Update timestamp every second
    const interval = setInterval(() => {
      setCurrentTimestamp(new Date());

      // Simulate real-time data changes
      setRealTimeData((prev) => ({
        temperature: prev.temperature + (Math.random() - 0.5) * 0.2,
        ph: Math.max(6.0, Math.min(8.5, prev.ph + (Math.random() - 0.5) * 0.1)),
        oxygen: Math.max(
          4.0,
          Math.min(10.0, prev.oxygen + (Math.random() - 0.5) * 0.3)
        ),
        salinity: Math.max(
          10.0,
          Math.min(35.0, prev.salinity + (Math.random() - 0.5) * 0.2)
        ),
        turbidity: Math.max(
          0.1,
          Math.min(15.0, prev.turbidity + (Math.random() - 0.5) * 0.1)
        ),
        fishCount: Math.floor(prev.fishCount + (Math.random() - 0.5) * 3),
        activityLevel: Math.max(
          0,
          Math.min(100, prev.activityLevel + (Math.random() - 0.5) * 5)
        ),
        feedingRate: Math.max(
          0,
          prev.feedingRate + (Math.random() - 0.5) * 0.1
        ),
        waterLevel: Math.max(
          0,
          Math.min(100, prev.waterLevel + (Math.random() - 0.5) * 0.5)
        ),
      }));

      // Update CV data occasionally
      if (Math.random() < 0.1) {
        // 10% chance each second
        setCvData((prev) => ({
          ...prev,
          fishDetected: Math.floor(
            prev.fishDetected + (Math.random() - 0.5) * 5
          ),
          anomaliesDetected: Math.max(
            0,
            prev.anomaliesDetected + (Math.random() > 0.95 ? 1 : 0)
          ),
          motionIntensity: ["Low", "Medium", "High"][
            Math.floor(Math.random() * 3)
          ] as any,
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchBasin = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if basinId is valid (basin-1, basin-2, basin-3, etc.)
        if (!basinId || !basinId.startsWith("basin-")) {
          throw new Error(
            `Bassin avec l'ID "${basinId}" non trouvé. Format attendu: basin-1, basin-2, basin-3, etc.`
          );
        }

        const response = await apiClient.getPond(basinId);
        setBasin(response.data.pond);
      } catch (err) {
        console.error("Error fetching basin:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Échec de la récupération du bassin"
        );
      } finally {
        setLoading(false);
      }
    };

    if (basinId) {
      fetchBasin();
    }
  }, [basinId]);

  // Load AI Analysis when basin data is available - FIXED: Remove real-time dependency
  useEffect(() => {
    if (basin && !loading) {
      loadAIAnalysis();
      // Generate historical data for charts
      setHistoricalData(generateHistoricalData());
    }
  }, [basin?.id]); // Only trigger when basin changes, NOT on real-time data changes

  // Periodic AI updates - every 5 minutes instead of every second
  useEffect(() => {
    if (!basin || loadingAI) return;

    const aiUpdateInterval = setInterval(() => {
      // Only update AI analysis every 5 minutes
      const recommendations = generateAIRecommendations(basin, realTimeData);
      const predictions = generateAIPredictions(basin, realTimeData);

      setAiRecommendations(recommendations);
      setAiPredictions(predictions);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(aiUpdateInterval);
  }, [basin?.id]); // Only depend on basin ID, not real-time data

  // Video control handlers - simplified for YouTube iframe
  const toggleVideoPlayback = () => {
    // YouTube iframe controls are handled by YouTube's player
    setIsVideoPlaying(!isVideoPlaying);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getMotionIntensityColor = (intensity: string) => {
    switch (intensity) {
      case "High":
        return "text-red-600 bg-red-100";
      case "Medium":
        return "text-yellow-600 bg-yellow-100";
      case "Low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Warning":
        return "text-yellow-600 bg-yellow-100";
      case "Info":
        return "text-blue-600 bg-blue-100";
      case "Critical":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

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

    // Check for critical parameters using real-time data
    if (
      realTimeData.ph < 6.0 ||
      realTimeData.ph > 8.5 ||
      realTimeData.temperature < 18 ||
      realTimeData.temperature > 30 ||
      realTimeData.oxygen < 4.0 ||
      realTimeData.salinity > 35 ||
      realTimeData.turbidity > 10
    ) {
      return "critical";
    }

    // Check for warning parameters
    if (
      realTimeData.ph < 6.5 ||
      realTimeData.ph > 8.0 ||
      realTimeData.temperature < 20 ||
      realTimeData.temperature > 28 ||
      realTimeData.oxygen < 5.0 ||
      realTimeData.salinity > 30 ||
      realTimeData.turbidity > 5
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
              {formatTimestamp(currentTimestamp)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout - Maximized AI Features with Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Side - Charts and Parameter Controls (Maximized) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Parameter Charts Section */}
          <Card className="rounded-3xl border-indigo-100 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-indigo-800 dark:text-indigo-200 flex items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Analyse Paramètres Temps Réel
                </CardTitle>
                <div className="flex items-center gap-3">
                  <Select
                    value={selectedChartType}
                    onValueChange={setSelectedChartType}
                  >
                    <SelectTrigger className="w-32 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">
                        <div className="flex items-center gap-2">
                          <LineChart className="h-4 w-4" />
                          Ligne
                        </div>
                      </SelectItem>
                      <SelectItem value="bar">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Barres
                        </div>
                      </SelectItem>
                      <SelectItem value="area">
                        <div className="flex items-center gap-2">
                          <AreaChart className="h-4 w-4" />
                          Aires
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setHistoricalData(generateHistoricalData())}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Parameter Toggle Controls */}
              <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">
                    Paramètres à Afficher
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={toggleAllParameters}
                  >
                    {showAllParameters
                      ? "Tout Désélectionner"
                      : "Tout Sélectionner"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(parameterConfig).map(([key, config]) => (
                    <div
                      key={key}
                      className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-xl p-3 border border-indigo-200 dark:border-indigo-700"
                    >
                      <Checkbox
                        id={key}
                        checked={
                          visibleParameters[
                            key as keyof typeof visibleParameters
                          ]
                        }
                        onCheckedChange={() =>
                          toggleParameter(key as keyof typeof visibleParameters)
                        }
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      <label
                        htmlFor={key}
                        className="text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer flex-1"
                      >
                        {config.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Charts Display */}
              <div className="space-y-6">
                {historicalData.length > 0 ? (
                  <SimpleChart
                    data={historicalData}
                    parameters={Object.keys(visibleParameters).filter(
                      (param) =>
                        visibleParameters[
                          param as keyof typeof visibleParameters
                        ]
                    )}
                    type={selectedChartType}
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Chargement des données historiques...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Current Values Summary */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(parameterConfig)
                  .filter(
                    ([key]) =>
                      visibleParameters[key as keyof typeof visibleParameters]
                  )
                  .slice(0, 8)
                  .map(([key, config]) => {
                    const value =
                      realTimeData[key as keyof typeof realTimeData];
                    return (
                      <div
                        key={key}
                        className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-indigo-200 dark:border-indigo-700"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: config.color }}
                          />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {config.name}
                          </span>
                        </div>
                        <div
                          className="text-lg font-bold"
                          style={{ color: config.color }}
                        >
                          {typeof value === "number" ? value.toFixed(1) : value}
                          {config.unit}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Compact Current Parameters - Reduced Size */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="rounded-2xl border-orange-100 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <Thermometer className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-800 dark:text-orange-200">
                      {realTimeData.temperature.toFixed(1)}°C
                    </div>
                    <div className="text-xs text-orange-600 dark:text-orange-400">
                      Température
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-blue-100 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <Droplets className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                      {realTimeData.ph.toFixed(1)}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      pH
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-green-100 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-800 dark:text-green-200">
                      {realTimeData.oxygen.toFixed(1)}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                      Oxygène mg/L
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-purple-100 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <Fish className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-800 dark:text-purple-200">
                      {realTimeData.fishCount}
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400">
                      Poissons
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts - Compact Version */}
          {basin.alerts && basin.alerts.length > 0 && (
            <Card className="rounded-2xl border-red-100 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-red-800 dark:text-red-200 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alertes ({basin.alerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {basin.alerts.slice(0, 2).map((alert, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-red-200 dark:border-red-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-red-800 dark:text-red-200 text-sm">
                            {alert.message}
                          </div>
                        </div>
                        <Badge className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-xs">
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {basin.alerts.length > 2 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl text-red-700 border-red-300"
                    >
                      Voir {basin.alerts.length - 2} alertes supplémentaires
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side - Maximized AI Features */}
        <div className="xl:col-span-1">
          <div className="space-y-4">
            {/* AI Recommendations - Expanded */}
            <Card className="rounded-3xl border-purple-100 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-purple-800 dark:text-purple-200 flex items-center gap-2">
                  <Brain className="h-6 w-6" />
                  Recommandations IA
                  {loadingAI && <Loader2 className="h-4 w-4 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAI ? (
                  <div className="space-y-3">
                    <div className="animate-pulse bg-purple-200 dark:bg-purple-700 h-4 rounded"></div>
                    <div className="animate-pulse bg-purple-200 dark:bg-purple-700 h-4 rounded w-3/4"></div>
                    <div className="animate-pulse bg-purple-200 dark:bg-purple-700 h-4 rounded w-1/2"></div>
                    <div className="text-sm text-purple-600 dark:text-purple-400 text-center mt-2">
                      🤖 Analyse des données en cours...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {aiRecommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-purple-200 dark:border-purple-700"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                              {rec.category}
                            </span>
                          </div>
                          <Badge
                            className={`text-xs ${
                              rec.priority === "critical"
                                ? "bg-red-100 text-red-700"
                                : rec.priority === "high"
                                ? "bg-orange-100 text-orange-700"
                                : rec.priority === "medium"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {rec.confidence}% confiance
                          </Badge>
                        </div>
                        <div className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-2">
                          {rec.title}
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-400 mb-3">
                          {rec.message}
                        </div>
                        <div className="text-xs text-purple-800 dark:text-purple-200 bg-purple-100 dark:bg-purple-900/50 rounded p-2 mb-2">
                          <strong>Action:</strong> {rec.action}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          📅 {rec.timeline} | 💥 {rec.impact}
                        </div>
                      </div>
                    ))}
                    {aiRecommendations.length === 0 && !loadingAI && (
                      <div className="text-center text-sm text-purple-600 dark:text-purple-400 py-8">
                        ✅ Aucune recommandation urgente
                        <br />
                        Tous les paramètres sont optimaux
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Predictions - Expanded */}
            <Card className="rounded-3xl border-cyan-100 dark:border-cyan-800 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/20">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-cyan-800 dark:text-cyan-200 flex items-center gap-2">
                  <Sparkles className="h-6 w-6" />
                  Prédictions IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAI ? (
                  <div className="space-y-3">
                    <div className="animate-pulse bg-cyan-200 dark:bg-cyan-700 h-4 rounded"></div>
                    <div className="animate-pulse bg-cyan-200 dark:bg-cyan-700 h-4 rounded w-3/4"></div>
                    <div className="animate-pulse bg-cyan-200 dark:bg-cyan-700 h-4 rounded w-1/2"></div>
                    <div className="text-sm text-cyan-600 dark:text-cyan-400 text-center mt-2">
                      🔮 Calcul des prédictions...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {aiPredictions.map((pred) => (
                      <div
                        key={pred.id}
                        className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-cyan-200 dark:border-cyan-700"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                            <span className="text-sm font-medium text-cyan-800 dark:text-cyan-200">
                              {pred.category}
                            </span>
                          </div>
                          <Badge className="text-xs bg-cyan-100 text-cyan-700">
                            {pred.confidence}%
                          </Badge>
                        </div>
                        <div className="text-sm text-cyan-700 dark:text-cyan-300 font-medium mb-2">
                          {pred.title}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/50 rounded p-2">
                            <strong>Actuel:</strong>
                            <br />
                            {pred.current}
                          </div>
                          <div className="text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/50 rounded p-2">
                            <strong>Prévu:</strong>
                            <br />
                            {pred.predicted}
                          </div>
                        </div>
                        <div className="text-xs text-cyan-800 dark:text-cyan-200 bg-cyan-100 dark:bg-cyan-900/50 rounded p-2 mb-2">
                          <strong>Impact:</strong> {pred.impact}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ⏰ {pred.timeframe}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Chat Interface - Expanded */}
            <Card className="rounded-3xl border-emerald-100 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                  <MessageCircle className="h-6 w-6" />
                  Assistant IA
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto rounded-xl text-emerald-700 border-emerald-300"
                    onClick={() => setAiChatOpen(!aiChatOpen)}
                  >
                    {aiChatOpen ? "Fermer" : "Ouvrir"}
                  </Button>
                </CardTitle>
              </CardHeader>
              {aiChatOpen && (
                <CardContent>
                  <div className="space-y-3">
                    {/* Chat Messages - Larger */}
                    <div className="h-64 overflow-y-auto space-y-2 bg-white dark:bg-gray-800 rounded-xl p-3 border border-emerald-200 dark:border-emerald-700">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.type === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg p-3 text-sm ${
                              msg.type === "user"
                                ? "bg-emerald-500 text-white"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            }`}
                          >
                            <div className="whitespace-pre-line">
                              {msg.message}
                            </div>
                            <div className="text-xs opacity-70 mt-2">
                              {new Date(msg.timestamp).toLocaleTimeString(
                                "fr-FR"
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-sm flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-gray-600 dark:text-gray-400">
                              IA en train d'analyser...
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleChatSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Posez vos questions sur les paramètres..."
                        className="flex-1 rounded-xl border border-emerald-300 dark:border-emerald-600 px-4 py-3 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                        disabled={isTyping}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4"
                        disabled={isTyping || !chatInput.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Video Surveillance - Compact */}
            <Card className="rounded-3xl border-blue-100 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Surveillance Live
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Compact Video Player */}
                <div className="relative rounded-xl overflow-hidden aspect-video mb-3">
                  <iframe
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    src="https://www.youtube.com/embed/iKmQqT3KS30?autoplay=1&mute=1&loop=1&playlist=iKmQqT3KS30&controls=1"
                    title="Aquaculture Fish Surveillance"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 animate-pulse">
                    ● LIVE
                  </div>
                </div>

                {/* Compact CV Data */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center gap-1 mb-1">
                      <Fish className="h-3 w-3 text-green-600" />
                      <span className="text-xs font-medium text-green-700">
                        Poissons
                      </span>
                    </div>
                    <div className="text-sm font-bold text-green-800">
                      {realTimeData.fishCount}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-center gap-1 mb-1">
                      <Activity className="h-3 w-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">
                        Activité
                      </span>
                    </div>
                    <div className="text-sm font-bold text-blue-800">
                      {realTimeData.activityLevel.toFixed(0)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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
