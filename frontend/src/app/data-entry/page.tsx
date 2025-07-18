"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Database,
  Thermometer,
  Droplets,
  Activity,
  Waves,
  Save,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient, Basin } from "@/lib/api";

export default function DataEntryPage() {
  const { user } = useAuth();
  const [basins, setBasins] = useState<Basin[]>([]);
  const [selectedBasin, setSelectedBasin] = useState("");
  const [formData, setFormData] = useState({
    ph: "",
    temperature: "",
    oxygen: "",
    salinity: "",
    turbidity: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBasins = async () => {
      try {
        const data = await apiClient.getBasins();
        // Filter basins based on user's base
        const filteredBasins =
          user?.role === "OPERATOR"
            ? data.filter((basin) => basin.base.id === user.baseId)
            : data;
        setBasins(filteredBasins);
      } catch (error) {
        console.error("Error fetching basins:", error);
      }
    };

    if (user) {
      fetchBasins();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBasin) {
      setError("Veuillez sélectionner un bassin");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const data = {
        ph: parseFloat(formData.ph),
        temperature: parseFloat(formData.temperature),
        oxygen: parseFloat(formData.oxygen),
        salinity: parseFloat(formData.salinity),
        ...(formData.turbidity && {
          turbidity: parseFloat(formData.turbidity),
        }),
        timestamp: new Date().toISOString(),
      };

      const result = await apiClient.addReading(selectedBasin, data);

      setSuccess(true);
      setFormData({
        ph: "",
        temperature: "",
        oxygen: "",
        salinity: "",
        turbidity: "",
        notes: "",
      });
      setSelectedBasin("");

      if (result.alertsGenerated > 0) {
        setError(
          `Mesure enregistrée avec succès. ${result.alertsGenerated} alerte(s) générée(s).`
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement"
      );
    } finally {
      setLoading(false);
    }
  };

  const getParameterValidation = (param: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;

    switch (param) {
      case "ph":
        if (numValue < 6.0 || numValue > 8.5) return "critical";
        if (numValue < 6.5 || numValue > 8.0) return "warning";
        return "normal";
      case "temperature":
        if (numValue < 18 || numValue > 30) return "critical";
        if (numValue < 20 || numValue > 28) return "warning";
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
        return "normal";
    }
  };

  const getValidationColor = (status: string) => {
    switch (status) {
      case "normal":
        return "border-green-300 bg-green-50";
      case "warning":
        return "border-amber-300 bg-amber-50";
      case "critical":
        return "border-red-300 bg-red-50";
      default:
        return "";
    }
  };

  const getValidationIcon = (status: string) => {
    switch (status) {
      case "normal":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Redirect if not operator
  if (user?.role !== "OPERATOR") {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Cette page est réservée aux opérateurs</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Saisie des Mesures
        </h1>
        <p className="text-gray-600">
          Enregistrez les paramètres de qualité de l'eau
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-3xl border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4 text-center">
            <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-blue-800">8</div>
            <div className="text-sm text-blue-600">Mesures aujourd'hui</div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-green-100 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-green-800">
              {basins.length}
            </div>
            <div className="text-sm text-green-600">Bassins assignés</div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-orange-100 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-xl font-bold text-orange-800">14:30</div>
            <div className="text-sm text-orange-600">Prochaine mesure</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Entry Form */}
      <Card className="rounded-3xl border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Database className="h-6 w-6" />
            Nouvelle Mesure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basin Selection */}
            <div className="space-y-2">
              <Label htmlFor="basin">Bassin *</Label>
              <Select value={selectedBasin} onValueChange={setSelectedBasin}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Sélectionnez un bassin" />
                </SelectTrigger>
                <SelectContent>
                  {basins.map((basin) => (
                    <SelectItem key={basin.id} value={basin.id}>
                      {basin.name} - {basin.base.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Parameters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* pH */}
              <div className="space-y-2">
                <Label htmlFor="ph" className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  pH *
                </Label>
                <div className="relative">
                  <Input
                    id="ph"
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    value={formData.ph}
                    onChange={(e) =>
                      setFormData({ ...formData, ph: e.target.value })
                    }
                    className={`rounded-xl ${getValidationColor(
                      getParameterValidation("ph", formData.ph) || ""
                    )}`}
                    placeholder="ex: 7.2"
                    required
                  />
                  {formData.ph && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getValidationIcon(
                        getParameterValidation("ph", formData.ph) || ""
                      )}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">Normal: 6.5 - 8.0</div>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <Label
                  htmlFor="temperature"
                  className="flex items-center gap-2"
                >
                  <Thermometer className="h-4 w-4 text-orange-500" />
                  Température (°C) *
                </Label>
                <div className="relative">
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) =>
                      setFormData({ ...formData, temperature: e.target.value })
                    }
                    className={`rounded-xl ${getValidationColor(
                      getParameterValidation(
                        "temperature",
                        formData.temperature
                      ) || ""
                    )}`}
                    placeholder="ex: 24.5"
                    required
                  />
                  {formData.temperature && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getValidationIcon(
                        getParameterValidation(
                          "temperature",
                          formData.temperature
                        ) || ""
                      )}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">Normal: 20 - 28°C</div>
              </div>

              {/* Oxygen */}
              <div className="space-y-2">
                <Label htmlFor="oxygen" className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  Oxygène (mg/L) *
                </Label>
                <div className="relative">
                  <Input
                    id="oxygen"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.oxygen}
                    onChange={(e) =>
                      setFormData({ ...formData, oxygen: e.target.value })
                    }
                    className={`rounded-xl ${getValidationColor(
                      getParameterValidation("oxygen", formData.oxygen) || ""
                    )}`}
                    placeholder="ex: 8.5"
                    required
                  />
                  {formData.oxygen && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getValidationIcon(
                        getParameterValidation("oxygen", formData.oxygen) || ""
                      )}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">Minimum: 5.0 mg/L</div>
              </div>

              {/* Salinity */}
              <div className="space-y-2">
                <Label htmlFor="salinity" className="flex items-center gap-2">
                  <Waves className="h-4 w-4 text-teal-500" />
                  Salinité (ppt) *
                </Label>
                <div className="relative">
                  <Input
                    id="salinity"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.salinity}
                    onChange={(e) =>
                      setFormData({ ...formData, salinity: e.target.value })
                    }
                    className={`rounded-xl ${getValidationColor(
                      getParameterValidation("salinity", formData.salinity) ||
                        ""
                    )}`}
                    placeholder="ex: 0.5"
                    required
                  />
                  {formData.salinity && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getValidationIcon(
                        getParameterValidation("salinity", formData.salinity) ||
                          ""
                      )}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">Maximum: 30 ppt</div>
              </div>

              {/* Turbidity */}
              <div className="space-y-2">
                <Label htmlFor="turbidity">Turbidité (NTU)</Label>
                <Input
                  id="turbidity"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.turbidity}
                  onChange={(e) =>
                    setFormData({ ...formData, turbidity: e.target.value })
                  }
                  className="rounded-xl"
                  placeholder="ex: 2.5 (optionnel)"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="rounded-xl"
                  placeholder="Observations particulières..."
                  rows={3}
                />
              </div>
            </div>

            {/* Alerts */}
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Mesure enregistrée avec succès!
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8"
              >
                {loading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer la mesure
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Parameter Guidelines */}
      <Card className="rounded-3xl border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-800">
            Valeurs de Référence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span className="font-medium">pH</span>
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Optimal:</span>
                  <span className="text-green-600">6.5 - 8.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Acceptable:</span>
                  <span className="text-amber-600">6.0 - 8.5</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Température</span>
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Optimal:</span>
                  <span className="text-green-600">20 - 28°C</span>
                </div>
                <div className="flex justify-between">
                  <span>Acceptable:</span>
                  <span className="text-amber-600">18 - 30°C</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="font-medium">Oxygène Dissous</span>
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Optimal:</span>
                  <span className="text-green-600">&gt; 5.0 mg/L</span>
                </div>
                <div className="flex justify-between">
                  <span>Minimum:</span>
                  <span className="text-red-600">&gt; 4.0 mg/L</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Waves className="h-4 w-4 text-teal-500" />
                <span className="font-medium">Salinité</span>
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Optimal:</span>
                  <span className="text-green-600">&lt; 30 ppt</span>
                </div>
                <div className="flex justify-between">
                  <span>Maximum:</span>
                  <span className="text-red-600">&lt; 35 ppt</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
