"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Bell,
  Shield,
  Globe,
  Palette,
  Save,
  RefreshCw,
  Mail,
  Phone,
  Lock,
  Settings as SettingsIcon,
  Monitor,
  Moon,
  Sun,
  Volume2,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Database,
  Wifi,
  Thermometer,
  Droplets,
  Activity,
  Clock,
  Zap,
  BarChart3,
  Users,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";

export function SettingsPage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // User Profile Settings
  const [profile, setProfile] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    language: "fr",
    timezone: "Africa/Algiers",
  });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    criticalAlerts: true,
    weeklyReports: true,
    maintenanceAlerts: true,
    alertSeverity: "medium",
  });

  // Security Settings
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: "30",
    passwordExpiry: "90",
    loginAttempts: "3",
  });

  // Thresholds Settings
  const [thresholds, setThresholds] = useState({
    temperature: { min: 22, max: 28, critical: 32 },
    ph: { min: 7.0, max: 8.5, critical: 9.0 },
    oxygen: { min: 6.0, max: 12.0, critical: 4.0 },
    salinity: { min: 30, max: 35, critical: 40 },
    turbidity: { min: 0, max: 5, critical: 10 },
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    dataRetention: 365,
    backupFrequency: "daily",
    autoCalibration: true,
    predictiveAlerts: true,
    energySaving: false,
    nightMode: true,
  });

  // Display Settings
  const [display, setDisplay] = useState({
    theme: "light",
    compactMode: false,
    showParameterTrends: true,
    defaultView: "dashboard",
    refreshInterval: "30",
  });

  // User Preferences
  const [userPreferences, setUserPreferences] = useState({
    language: "fr",
    timezone: "Africa/Algiers",
    dateFormat: "DD/MM/YYYY",
    theme: "light",
    dashboardLayout: "compact",
    refreshInterval: 30,
  });

  const handleSave = async () => {
    try {
      setLoading(true);
      // Here you would normally make API calls to save the settings
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
      await logout();
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
            <Shield className="h-3 w-3 mr-1" />
            Administrateur
          </Badge>
        );
      case "FARMER":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <User className="h-3 w-3 mr-1" />
            Fermier
          </Badge>
        );
      case "TECHNICIAN":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <SettingsIcon className="h-3 w-3 mr-1" />
            Technicien
          </Badge>
        );
      case "VIEWER":
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            <Monitor className="h-3 w-3 mr-1" />
            Visualiseur
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            {role}
          </Badge>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Paramètres</h1>
            <p className="text-gray-600 text-lg">
              Configuration de votre compte et préférences
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <Badge className="bg-green-100 text-green-700 border-green-200 px-4 py-2">
                <CheckCircle className="h-4 w-4 mr-2" />
                Sauvegardé
              </Badge>
            )}
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Sauvegarder
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile & Account */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="rounded-3xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <User className="h-6 w-6 text-blue-500" />
                Profil Utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {user?.firstName?.charAt(0) || user?.email.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                  {getRoleBadge(user?.role || "")}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Prénom
                    </Label>
                    <Input
                      value={profile.firstName}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                      className="mt-2 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Nom
                    </Label>
                    <Input
                      value={profile.lastName}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                      className="mt-2 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="mt-2 rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Téléphone
                  </Label>
                  <Input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="mt-2 rounded-xl"
                    placeholder="+213 xxx xxx xxx"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="rounded-3xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">
                Actions du Compte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full rounded-xl justify-start"
              >
                <Lock className="h-4 w-4 mr-2" />
                Changer le mot de passe
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full rounded-xl justify-start text-red-600 hover:bg-red-50"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Se déconnecter
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Notifications & Security */}
        <div className="space-y-6">
          {/* Notifications */}
          <Card className="rounded-3xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Bell className="h-6 w-6 text-orange-500" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Alertes par email</span>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, email: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Alertes par SMS</span>
                </div>
                <Switch
                  checked={notifications.sms}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, sms: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Notifications push</span>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, push: checked })
                  }
                />
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Seuil d'alerte
                </Label>
                <Select
                  value={notifications.alertSeverity}
                  onValueChange={(value) =>
                    setNotifications((prev) => ({
                      ...prev,
                      alertSeverity: value,
                    }))
                  }
                >
                  <SelectTrigger className="mt-2 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Toutes les alertes</SelectItem>
                    <SelectItem value="medium">
                      Moyennes et critiques
                    </SelectItem>
                    <SelectItem value="high">Critiques seulement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="rounded-3xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Shield className="h-6 w-6 text-red-500" />
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">
                    Authentification 2FA
                  </span>
                  <p className="text-xs text-gray-500">
                    Protection supplémentaire
                  </p>
                </div>
                <Switch
                  checked={security.twoFactorAuth}
                  onCheckedChange={(checked) =>
                    setSecurity((prev) => ({
                      ...prev,
                      twoFactorAuth: checked,
                    }))
                  }
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Expiration de session (min)
                </Label>
                <Select
                  value={security.sessionTimeout}
                  onValueChange={(value) =>
                    setSecurity((prev) => ({
                      ...prev,
                      sessionTimeout: value,
                    }))
                  }
                >
                  <SelectTrigger className="mt-2 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 heure</SelectItem>
                    <SelectItem value="240">4 heures</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Display & Preferences */}
        <div className="space-y-6">
          {/* Display */}
          <Card className="rounded-3xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Monitor className="h-6 w-6 text-green-500" />
                Affichage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Thème
                </Label>
                <Select
                  value={display.theme}
                  onValueChange={(value) =>
                    setDisplay((prev) => ({ ...prev, theme: value }))
                  }
                >
                  <SelectTrigger className="mt-2 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Clair
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Sombre
                      </div>
                    </SelectItem>
                    <SelectItem value="auto">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Automatique
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Langue
                </Label>
                <Select
                  value={profile.language}
                  onValueChange={(value) =>
                    setProfile((prev) => ({ ...prev, language: value }))
                  }
                >
                  <SelectTrigger className="mt-2 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Intervalle de rafraîchissement
                </Label>
                <Select
                  value={display.refreshInterval}
                  onValueChange={(value) =>
                    setDisplay((prev) => ({ ...prev, refreshInterval: value }))
                  }
                >
                  <SelectTrigger className="mt-2 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 secondes</SelectItem>
                    <SelectItem value="30">30 secondes</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Mode compact</span>
                  <p className="text-xs text-gray-500">Interface condensée</p>
                </div>
                <Switch
                  checked={display.compactMode}
                  onCheckedChange={(checked) =>
                    setDisplay((prev) => ({ ...prev, compactMode: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* App Preferences */}
          <Card className="rounded-3xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <SettingsIcon className="h-6 w-6 text-purple-500" />
                Préférences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Vue par défaut
                </Label>
                <Select
                  value={display.defaultView}
                  onValueChange={(value) =>
                    setDisplay((prev) => ({ ...prev, defaultView: value }))
                  }
                >
                  <SelectTrigger className="mt-2 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">Tableau de bord</SelectItem>
                    <SelectItem value="basins">Bassins</SelectItem>
                    <SelectItem value="alerts">Alertes</SelectItem>
                    <SelectItem value="data-entry">Saisie données</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">
                    Tendances des paramètres
                  </span>
                  <p className="text-xs text-gray-500">
                    Graphiques dans les cartes
                  </p>
                </div>
                <Switch
                  checked={display.showParameterTrends}
                  onCheckedChange={(checked) =>
                    setDisplay((prev) => ({
                      ...prev,
                      showParameterTrends: checked,
                    }))
                  }
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Fuseau horaire
                </Label>
                <Select
                  value={profile.timezone}
                  onValueChange={(value) =>
                    setProfile((prev) => ({ ...prev, timezone: value }))
                  }
                >
                  <SelectTrigger className="mt-2 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Africa/Algiers">
                      Alger (GMT+1)
                    </SelectItem>
                    <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                    <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-10">
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="thresholds">Seuils</TabsTrigger>
            <TabsTrigger value="system">Système</TabsTrigger>
            <TabsTrigger value="user">Utilisateur</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
            <TabsTrigger value="advanced">Avancé</TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-3xl border-gray-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Bell className="h-6 w-6 text-blue-500" />
                    Types de Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Globe className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Email</p>
                          <p className="text-sm text-gray-600">
                            Notifications par email
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.email}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, email: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Smartphone className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">SMS</p>
                          <p className="text-sm text-gray-600">
                            Alertes par SMS
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.sms}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, sms: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Monitor className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Push</p>
                          <p className="text-sm text-gray-600">
                            Notifications push
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.push}
                        onCheckedChange={(checked) =>
                          setNotifications({ ...notifications, push: checked })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-gray-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-orange-500" />
                    Préférences d'Alerte
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl">
                      <div>
                        <p className="font-medium text-gray-800">
                          Alertes Critiques
                        </p>
                        <p className="text-sm text-gray-600">
                          Situations d'urgence immédiate
                        </p>
                      </div>
                      <Switch
                        checked={notifications.criticalAlerts}
                        onCheckedChange={(checked) =>
                          setNotifications({
                            ...notifications,
                            criticalAlerts: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                      <div>
                        <p className="font-medium text-gray-800">
                          Rapports Hebdomadaires
                        </p>
                        <p className="text-sm text-gray-600">
                          Synthèse des performances
                        </p>
                      </div>
                      <Switch
                        checked={notifications.weeklyReports}
                        onCheckedChange={(checked) =>
                          setNotifications({
                            ...notifications,
                            weeklyReports: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl">
                      <div>
                        <p className="font-medium text-gray-800">Maintenance</p>
                        <p className="text-sm text-gray-600">
                          Rappels de maintenance
                        </p>
                      </div>
                      <Switch
                        checked={notifications.maintenanceAlerts}
                        onCheckedChange={(checked) =>
                          setNotifications({
                            ...notifications,
                            maintenanceAlerts: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Thresholds Tab */}
          <TabsContent value="thresholds">
            <Card className="rounded-3xl border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-green-500" />
                  Configuration des Seuils
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(thresholds).map(([param, values]) => (
                    <div key={param} className="p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-2 mb-4">
                        {param === "temperature" && (
                          <Thermometer className="h-5 w-5 text-red-500" />
                        )}
                        {param === "ph" && (
                          <Droplets className="h-5 w-5 text-blue-500" />
                        )}
                        {param === "oxygen" && (
                          <Activity className="h-5 w-5 text-green-500" />
                        )}
                        {param === "salinity" && (
                          <Droplets className="h-5 w-5 text-teal-500" />
                        )}
                        {param === "turbidity" && (
                          <Eye className="h-5 w-5 text-purple-500" />
                        )}
                        <h3 className="font-semibold text-gray-800 capitalize">
                          {param === "ph" ? "pH" : param}
                        </h3>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Label className="w-16 text-xs">Min</Label>
                          <Input
                            type="number"
                            value={values.min}
                            onChange={(e) =>
                              setThresholds({
                                ...thresholds,
                                [param]: {
                                  ...values,
                                  min: parseFloat(e.target.value),
                                },
                              })
                            }
                            className="flex-1"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <Label className="w-16 text-xs">Max</Label>
                          <Input
                            type="number"
                            value={values.max}
                            onChange={(e) =>
                              setThresholds({
                                ...thresholds,
                                [param]: {
                                  ...values,
                                  max: parseFloat(e.target.value),
                                },
                              })
                            }
                            className="flex-1"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <Label className="w-16 text-xs">Critique</Label>
                          <Input
                            type="number"
                            value={values.critical}
                            onChange={(e) =>
                              setThresholds({
                                ...thresholds,
                                [param]: {
                                  ...values,
                                  critical: parseFloat(e.target.value),
                                },
                              })
                            }
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-3xl border-gray-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Database className="h-6 w-6 text-purple-500" />
                    Gestion des Données
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl">
                      <div>
                        <p className="font-medium text-gray-800">
                          Conservation
                        </p>
                        <p className="text-sm text-gray-600">
                          Durée de conservation des données
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={systemSettings.dataRetention}
                          onChange={(e) =>
                            setSystemSettings({
                              ...systemSettings,
                              dataRetention: parseInt(e.target.value),
                            })
                          }
                          className="w-20"
                        />
                        <span className="text-sm text-gray-600">jours</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                      <div>
                        <p className="font-medium text-gray-800">
                          Sauvegarde Auto
                        </p>
                        <p className="text-sm text-gray-600">
                          Fréquence des sauvegardes
                        </p>
                      </div>
                      <select
                        value={systemSettings.backupFrequency}
                        onChange={(e) =>
                          setSystemSettings({
                            ...systemSettings,
                            backupFrequency: e.target.value,
                          })
                        }
                        className="px-3 py-2 border rounded-lg"
                      >
                        <option value="hourly">Toutes les heures</option>
                        <option value="daily">Quotidienne</option>
                        <option value="weekly">Hebdomadaire</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl">
                      <div>
                        <p className="font-medium text-gray-800">
                          Calibration Auto
                        </p>
                        <p className="text-sm text-gray-600">
                          Calibration automatique des capteurs
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.autoCalibration}
                        onCheckedChange={(checked) =>
                          setSystemSettings({
                            ...systemSettings,
                            autoCalibration: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-gray-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Zap className="h-6 w-6 text-yellow-500" />
                    Intelligence Artificielle
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-2xl">
                      <div>
                        <p className="font-medium text-gray-800">
                          Alertes Prédictives
                        </p>
                        <p className="text-sm text-gray-600">
                          Prévision des problèmes
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.predictiveAlerts}
                        onCheckedChange={(checked) =>
                          setSystemSettings({
                            ...systemSettings,
                            predictiveAlerts: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl">
                      <div>
                        <p className="font-medium text-gray-800">
                          Économie d'Énergie
                        </p>
                        <p className="text-sm text-gray-600">
                          Optimisation énergétique
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.energySaving}
                        onCheckedChange={(checked) =>
                          setSystemSettings({
                            ...systemSettings,
                            energySaving: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl">
                      <div>
                        <p className="font-medium text-gray-800">Mode Nuit</p>
                        <p className="text-sm text-gray-600">
                          Réduction automatique des activités
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.nightMode}
                        onCheckedChange={(checked) =>
                          setSystemSettings({
                            ...systemSettings,
                            nightMode: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Preferences Tab */}
          <TabsContent value="user">
            <Card className="rounded-3xl border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <User className="h-6 w-6 text-blue-500" />
                  Préférences Utilisateur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-2xl">
                      <Label className="text-sm font-medium text-gray-700">
                        Langue
                      </Label>
                      <select
                        value={userPreferences.language}
                        onChange={(e) =>
                          setUserPreferences({
                            ...userPreferences,
                            language: e.target.value,
                          })
                        }
                        className="w-full mt-2 px-3 py-2 border rounded-lg"
                      >
                        <option value="fr">Français</option>
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div className="p-4 bg-green-50 rounded-2xl">
                      <Label className="text-sm font-medium text-gray-700">
                        Fuseau Horaire
                      </Label>
                      <select
                        value={userPreferences.timezone}
                        onChange={(e) =>
                          setUserPreferences({
                            ...userPreferences,
                            timezone: e.target.value,
                          })
                        }
                        className="w-full mt-2 px-3 py-2 border rounded-lg"
                      >
                        <option value="Africa/Algiers">Africa/Algiers</option>
                        <option value="Europe/Paris">Europe/Paris</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-2xl">
                      <Label className="text-sm font-medium text-gray-700">
                        Format de Date
                      </Label>
                      <select
                        value={userPreferences.dateFormat}
                        onChange={(e) =>
                          setUserPreferences({
                            ...userPreferences,
                            dateFormat: e.target.value,
                          })
                        }
                        className="w-full mt-2 px-3 py-2 border rounded-lg"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-orange-50 rounded-2xl">
                      <Label className="text-sm font-medium text-gray-700">
                        Thème
                      </Label>
                      <select
                        value={userPreferences.theme}
                        onChange={(e) =>
                          setUserPreferences({
                            ...userPreferences,
                            theme: e.target.value,
                          })
                        }
                        className="w-full mt-2 px-3 py-2 border rounded-lg"
                      >
                        <option value="light">Clair</option>
                        <option value="dark">Sombre</option>
                        <option value="auto">Automatique</option>
                      </select>
                    </div>

                    <div className="p-4 bg-teal-50 rounded-2xl">
                      <Label className="text-sm font-medium text-gray-700">
                        Mise à Jour (secondes)
                      </Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setUserPreferences({
                              ...userPreferences,
                              refreshInterval: Math.max(
                                10,
                                userPreferences.refreshInterval - 10
                              ),
                            })
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={userPreferences.refreshInterval}
                          onChange={(e) =>
                            setUserPreferences({
                              ...userPreferences,
                              refreshInterval: parseInt(e.target.value),
                            })
                          }
                          className="text-center"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setUserPreferences({
                              ...userPreferences,
                              refreshInterval:
                                userPreferences.refreshInterval + 10,
                            })
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-50 rounded-2xl">
                      <Label className="text-sm font-medium text-gray-700">
                        Disposition Dashboard
                      </Label>
                      <select
                        value={userPreferences.dashboardLayout}
                        onChange={(e) =>
                          setUserPreferences({
                            ...userPreferences,
                            dashboardLayout: e.target.value,
                          })
                        }
                        className="w-full mt-2 px-3 py-2 border rounded-lg"
                      >
                        <option value="compact">Compact</option>
                        <option value="detailed">Détaillé</option>
                        <option value="cards">Cartes</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-3xl border-gray-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Shield className="h-6 w-6 text-green-500" />
                    Sécurité & Accès
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-gray-800">
                          Authentification à 2 Facteurs
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Sécurité renforcée de votre compte
                      </p>
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        Activer 2FA
                      </Button>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-800">
                          Gestion des Rôles
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Contrôle d'accès granulaire
                      </p>
                      <Button variant="outline" className="w-full">
                        Configurer
                      </Button>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-gray-800">
                          Audit des Accès
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Journalisation des connexions
                      </p>
                      <Button variant="outline" className="w-full">
                        Voir les Logs
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-gray-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Database className="h-6 w-6 text-purple-500" />
                    Sauvegarde & Récupération
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">
                          Dernière Sauvegarde
                        </span>
                        <Badge className="bg-green-100 text-green-700">
                          Il y a 2h
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Toutes les données sont sécurisées
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1">
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Upload className="h-4 w-4 mr-2" />
                          Restaurer
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-red-50 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Trash2 className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-gray-800">
                          Zone Dangereuse
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Réinitialisation complète du système
                      </p>
                      <Button variant="destructive" className="w-full">
                        Réinitialiser
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced">
            <Card className="rounded-3xl border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Zap className="h-6 w-6 text-yellow-500" />
                  Paramètres Avancés
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 rounded-2xl">
                      <h3 className="font-semibold text-gray-800 mb-3">
                        Algorithmes IA
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Prédiction Température
                          </span>
                          <Badge className="bg-green-100 text-green-700">
                            Activé
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Détection Anomalies
                          </span>
                          <Badge className="bg-green-100 text-green-700">
                            Activé
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Optimisation Énergétique
                          </span>
                          <Badge className="bg-orange-100 text-orange-700">
                            Bêta
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-2xl">
                      <h3 className="font-semibold text-gray-800 mb-3">
                        Connectivité
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Protocole IoT
                          </span>
                          <Badge className="bg-blue-100 text-blue-700">
                            MQTT
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Chiffrement
                          </span>
                          <Badge className="bg-green-100 text-green-700">
                            AES-256
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Redondance
                          </span>
                          <Badge className="bg-green-100 text-green-700">
                            Active
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-2xl">
                      <h3 className="font-semibold text-gray-800 mb-3">
                        Performance
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">CPU</span>
                            <span className="text-xs text-gray-500">23%</span>
                          </div>
                          <Progress value={23} className="h-2" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">RAM</span>
                            <span className="text-xs text-gray-500">45%</span>
                          </div>
                          <Progress value={45} className="h-2" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">
                              Stockage
                            </span>
                            <span className="text-xs text-gray-500">67%</span>
                          </div>
                          <Progress value={67} className="h-2" />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-teal-50 rounded-2xl">
                      <h3 className="font-semibold text-gray-800 mb-3">
                        Maintenance
                      </h3>
                      <div className="space-y-2">
                        <Button size="sm" className="w-full" variant="outline">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Calibrer Capteurs
                        </Button>
                        <Button size="sm" className="w-full" variant="outline">
                          <Database className="h-4 w-4 mr-2" />
                          Nettoyer Base
                        </Button>
                        <Button size="sm" className="w-full" variant="outline">
                          <Zap className="h-4 w-4 mr-2" />
                          Optimiser IA
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
