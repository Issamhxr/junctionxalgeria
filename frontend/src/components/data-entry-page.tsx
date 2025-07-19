"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, Basin } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Thermometer,
  Droplets,
  Activity,
  Waves,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Database,
  Calendar,
  Clock,
  Loader2,
} from "lucide-react";

export function DataEntryPage() {
  const { user } = useAuth();
  const [basins, setBasins] = useState<Basin[]>([]);
  const [selectedBasin, setSelectedBasin] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    temperature: "",
    ph: "",
    oxygen: "",
    salinity: "",
    turbidity: "",
    ammonia: "",
    nitrite: "",
    nitrate: "",
    waterLevel: "",
    notes: "",
  });

  useEffect(() => {
    const fetchBasins = async () => {
      try {
        setLoading(true);
        // Try to fetch basins from API
        const response = await apiClient.getBasins();
        const ponds = response.data?.ponds || [];
        setBasins(ponds);
      } catch (error) {
        console.warn("Failed to fetch basins:", error);
        // Set mock basins data as fallback
        setBasins([
          {
            id: "pond1",
            name: "Bassin Principal",
            type: "FRESHWATER",
            volume: 1000,
            depth: 3.5,
            farm: {
              id: "farm1",
              name: "Ferme Aquacole Nord",
              location: "Alger"
            }
          },
          {
            id: "pond2",
            name: "Bassin Secondaire",
            type: "SALTWATER",
            volume: 750,
            depth: 2.8,
            farm: {
              id: "farm1",
              name: "Ferme Aquacole Nord",
              location: "Alger"
            }
          },
          {
            id: "pond3",
            name: "Bassin Expérimental",
            type: "BRACKISH",
            volume: 500,
            depth: 2.0,
            farm: {
              id: "farm2",
              name: "Ferme Aquacole Sud",
              location: "Oran"
            }
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchBasins();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBasin) {
      alert("Veuillez sélectionner un bassin");
      return;
    }

    if (!formData.temperature || !formData.ph || !formData.oxygen || !formData.salinity) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setSaving(true);
      
      const sensorData = {
        temperature: parseFloat(formData.temperature),
        ph: parseFloat(formData.ph),
        oxygen: parseFloat(formData.oxygen),
        salinity: parseFloat(formData.salinity),
        turbidity: formData.turbidity ? parseFloat(formData.turbidity) : undefined,
        ammonia: formData.ammonia ? parseFloat(formData.ammonia) : undefined,
        nitrite: formData.nitrite ? parseFloat(formData.nitrite) : undefined,
        nitrate: formData.nitrate ? parseFloat(formData.nitrate) : undefined,
        waterLevel: formData.waterLevel ? parseFloat(formData.waterLevel) : undefined,
        notes: formData.notes || undefined,
      };

      await apiClient.addSensorData(selectedBasin, sensorData);
      
      // Reset form
      setFormData({
        temperature: "",
        ph: "",
        oxygen: "",
        salinity: "",
        turbidity: "",
        ammonia: "",
        nitrite: "",
        nitrate: "",
        waterLevel: "",
        notes: "",
      });
      
      setLastSaved(new Date().toLocaleTimeString());
      alert("Données sauvegardées avec succès!");
      
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const getParameterStatus = (value: string, parameter: string) => {
    if (!value) return "neutral";
    
    const numValue = parseFloat(value);
    
    switch (parameter) {
      case "temperature":
        if (numValue < 18 || numValue > 30) return "critical";
        if (numValue < 20 || numValue > 28) return "warning";
        return "normal";
      case "ph":
        if (numValue < 6.0 || numValue > 8.5) return "critical";
        if (numValue < 6.5 || numValue > 8.0) return "warning";
        return "normal";
      case "oxygen":
        if (numValue < 4.0) return "critical";
        if (numValue < 5.0) return "warning";
        return "normal";
      case "salinity":
        if (numValue > 35) return "critical";
        if (numValue > 30) return "warning";
        return "normal";
      default:
        return "neutral";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30";
      case "warning":
        return "border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/30";
      case "critical":
        return "border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30";
      default:
        return "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800";
    }
  };

  const selectedBasinData = basins.find(b => b.id === selectedBasin);

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-gray-600 dark:text-gray-300" />
          <p className="text-gray-600 dark:text-gray-300">Chargement des bassins...</p>
        </div>
      </div>
    );
  }

  // Check if user has permission to enter data
  if (user?.role !== "OPERATOR" && user?.role !== "FARMER" && user?.role !== "ADMIN") {
    return (
      <div className="p-6 text-center bg-gray-50 dark:bg-gray-900 min-h-screen">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400">Accès non autorisé</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-blue-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Saisie des Données</h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Enregistrement des mesures de qualité d'eau
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 px-4 py-2">
              <Database className="h-4 w-4 mr-2" />
              Opérateur
            </Badge>
            {lastSaved && (
              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700 px-4 py-2">
                <CheckCircle className="h-4 w-4 mr-2" />
                Sauvé à {lastSaved}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Basin Selection */}
      <Card className="rounded-3xl border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Sélection du Bassin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="basin-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Bassin
              </Label>
              <Select value={selectedBasin} onValueChange={setSelectedBasin}>
                <SelectTrigger className="mt-2 rounded-xl">
                  <SelectValue placeholder="Sélectionnez un bassin" />
                </SelectTrigger>
                <SelectContent>
                  {basins.map((basin) => (
                    <SelectItem key={basin.id} value={basin.id}>
                      {basin.name} - {basin.farm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedBasinData && (
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-2xl p-4">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  {selectedBasinData.name}
                </h3>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  <p>Ferme: {selectedBasinData.farm.name}</p>
                  <p>Type: {selectedBasinData.type}</p>
                  <p>Volume: {selectedBasinData.volume || 'N/A'} m³</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Entry Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Primary Parameters */}
        <Card className="rounded-3xl border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Thermometer className="h-6 w-6 text-orange-500" />
              Paramètres Principaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="temperature" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Température (°C) *
                </Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => handleInputChange("temperature", e.target.value)}
                  className={`mt-2 rounded-xl ${getStatusColor(getParameterStatus(formData.temperature, "temperature"))}`}
                  placeholder="ex: 22.5"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optimal: 18-30°C</p>
              </div>

              <div>
                <Label htmlFor="ph" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  pH *
                </Label>
                <Input
                  id="ph"
                  type="number"
                  step="0.1"
                  value={formData.ph}
                  onChange={(e) => handleInputChange("ph", e.target.value)}
                  className={`mt-2 rounded-xl ${getStatusColor(getParameterStatus(formData.ph, "ph"))}`}
                  placeholder="ex: 7.2"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optimal: 6.5-8.5</p>
              </div>

              <div>
                <Label htmlFor="oxygen" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Oxygène Dissous (mg/L) *
                </Label>
                <Input
                  id="oxygen"
                  type="number"
                  step="0.1"
                  value={formData.oxygen}
                  onChange={(e) => handleInputChange("oxygen", e.target.value)}
                  className={`mt-2 rounded-xl ${getStatusColor(getParameterStatus(formData.oxygen, "oxygen"))}`}
                  placeholder="ex: 6.8"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optimal: >5.0 mg/L</p>
              </div>

              <div>
                <Label htmlFor="salinity" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Salinité (ppt) *
                </Label>
                <Input
                  id="salinity"
                  type="number"
                  step="0.1"
                  value={formData.salinity}
                  onChange={(e) => handleInputChange("salinity", e.target.value)}
                  className={`mt-2 rounded-xl ${getStatusColor(getParameterStatus(formData.salinity, "salinity"))}`}
                  placeholder="ex: 34.5"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Selon le type de bassin</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Secondary Parameters */}
        <Card className="rounded-3xl border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Activity className="h-6 w-6 text-green-500" />
              Paramètres Secondaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="turbidity" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  MES/Turbidité (NTU)
                </Label>
                <Input
                  id="turbidity"
                  type="number"
                  step="0.1"
                  value={formData.turbidity}
                  onChange={(e) => handleInputChange("turbidity", e.target.value)}
                  className="mt-2 rounded-xl"
                  placeholder="ex: 2.5"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optimal: &lt;5.0 NTU</p>
              </div>

              <div>
                <Label htmlFor="ammonia" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ammoniac (mg/L)
                </Label>
                <Input
                  id="ammonia"
                  type="number"
                  step="0.01"
                  value={formData.ammonia}
                  onChange={(e) => handleInputChange("ammonia", e.target.value)}
                  className="mt-2 rounded-xl"
                  placeholder="ex: 0.15"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optimal: &lt;0.2 mg/L</p>
              </div>

              <div>
                <Label htmlFor="nitrite" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nitrite (mg/L)
                </Label>
                <Input
                  id="nitrite"
                  type="number"
                  step="0.01"
                  value={formData.nitrite}
                  onChange={(e) => handleInputChange("nitrite", e.target.value)}
                  className="mt-2 rounded-xl"
                  placeholder="ex: 0.05"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optimal: &lt;0.1 mg/L</p>
              </div>

              <div>
                <Label htmlFor="nitrate" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nitrate (mg/L)
                </Label>
                <Input
                  id="nitrate"
                  type="number"
                  step="0.1"
                  value={formData.nitrate}
                  onChange={(e) => handleInputChange("nitrate", e.target.value)}
                  className="mt-2 rounded-xl"
                  placeholder="ex: 1.2"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Optimal: &lt;40 mg/L</p>
              </div>

              <div>
                <Label htmlFor="waterLevel" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Niveau d'eau (m)
                </Label>
                <Input
                  id="waterLevel"
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  value={formData.waterLevel}
                  onChange={(e) => handleInputChange("waterLevel", e.target.value)}
                  className="mt-2 rounded-xl"
                  placeholder="ex: 2.5"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Range: 1.0 - 5.0 m</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="rounded-3xl border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Notes et Observations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="mt-2 rounded-xl"
                placeholder="Observations, anomalies, interventions..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={saving || !selectedBasin}
            className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8 py-3 text-lg"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            {saving ? "Sauvegarde..." : "Sauvegarder les Données"}
          </Button>
        </div>
      </form>
    </div>
  );
}