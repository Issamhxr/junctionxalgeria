"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiClient, Centre } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Building,
  MapPin,
  Users,
  Waves,
  Plus,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Loader2,
  Settings,
  BarChart3,
  Mail,
  Phone,
  User,
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  Droplets,
  Thermometer,
  RefreshCw,
  Download,
  FileText,
  Database,
  Zap,
  Filter,
  Search,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CentreDetailPage() {
  const params = useParams();
  const { user } = useAuth();

  // State management
  const [centre, setCentre] = useState<Centre | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Dialog states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddBaseDialog, setShowAddBaseDialog] = useState(false);
  const [showEditBaseDialog, setShowEditBaseDialog] = useState(false);
  const [selectedBase, setSelectedBase] = useState<any>(null);

  // Form data
  const [editForm, setEditForm] = useState({
    name: "",
    region: "",
    location: "",
    description: "",
    email: "",
    phone: "",
    manager: "",
    capacity: 0,
    status: "active",
  });

  const [baseForm, setBaseForm] = useState({
    name: "",
    location: "",
    status: "active",
  });

  // Filters
  const [baseFilter, setBaseFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");

  const centreId = params.id as string;

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, [centreId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch centre data
      const centreData = await apiClient.getCentre(centreId);
      setCentre(centreData);

      // Initialize edit form
      setEditForm({
        name: centreData.name,
        region: centreData.region,
        location: centreData.location,
        description: centreData.description,
        email: centreData.email,
        phone: centreData.phone,
        manager: centreData.manager,
        capacity: centreData.capacity,
        status: centreData.status,
      });

      // Fetch statistics
      const statsData = await apiClient.getCentreStats(centreId);
      setStats(statsData.data);

      // Fetch activity
      const activityData = await apiClient.getCentreActivity(centreId);
      setActivity(activityData.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const handleUpdateCentre = async () => {
    try {
      await apiClient.updateCentre(centreId, editForm);
      setCentre((prev) =>
        prev
          ? { ...prev, ...editForm, updatedAt: new Date().toISOString() }
          : null
      );
      setShowEditDialog(false);
      alert("Centre mis à jour avec succès!");
    } catch (error) {
      console.error("Error updating centre:", error);
      alert("Erreur lors de la mise à jour");
    }
  };

  const handleAddBase = async () => {
    try {
      const result = await apiClient.addBase(centreId, baseForm);
      setCentre((prev) =>
        prev
          ? {
              ...prev,
              bases: [
                ...prev.bases,
                {
                  id: result.data.id,
                  name: baseForm.name,
                  location: baseForm.location,
                  status: baseForm.status,
                  basins: 0,
                  operators: 0,
                  alerts: 0,
                },
              ],
            }
          : null
      );

      setBaseForm({ name: "", location: "", status: "active" });
      setShowAddBaseDialog(false);
      alert("Base ajoutée avec succès!");
    } catch (error) {
      console.error("Error adding base:", error);
      alert("Erreur lors de l'ajout de la base");
    }
  };

  const handleEditBase = (base: any) => {
    setSelectedBase(base);
    setBaseForm({
      name: base.name,
      location: base.location,
      status: base.status,
    });
    setShowEditBaseDialog(true);
  };

  const handleUpdateBase = async () => {
    if (!selectedBase) return;

    try {
      await apiClient.updateBase(centreId, selectedBase.id, baseForm);
      setCentre((prev) =>
        prev
          ? {
              ...prev,
              bases: prev.bases.map((base) =>
                base.id === selectedBase.id ? { ...base, ...baseForm } : base
              ),
            }
          : null
      );

      setShowEditBaseDialog(false);
      setSelectedBase(null);
      alert("Base mise à jour avec succès!");
    } catch (error) {
      console.error("Error updating base:", error);
      alert("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteBase = async (baseId: string) => {
    try {
      await apiClient.deleteBase(centreId, baseId);
      setCentre((prev) =>
        prev
          ? {
              ...prev,
              bases: prev.bases.filter((base) => base.id !== baseId),
            }
          : null
      );
      alert("Base supprimée avec succès!");
    } catch (error) {
      console.error("Error deleting base:", error);
      alert("Erreur lors de la suppression");
    }
  };

  const handleDeleteCentre = async () => {
    try {
      await apiClient.deleteCentre(centreId);
      window.location.href = "/centres";
    } catch (error) {
      console.error("Error deleting centre:", error);
      alert("Erreur lors de la suppression");
    }
  };

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "maintenance":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "construction":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "inactive":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "maintenance":
        return <Settings className="h-4 w-4" />;
      case "construction":
        return <Building className="h-4 w-4" />;
      case "inactive":
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "measurement":
        return <Database className="h-4 w-4 text-blue-500" />;
      case "alert_resolved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "alert_created":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "maintenance":
        return <Settings className="h-4 w-4 text-orange-500" />;
      case "user_action":
        return <User className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
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

  const filteredBases =
    centre?.bases.filter((base) => {
      if (baseFilter === "all") return true;
      return base.status === baseFilter;
    }) || [];

  const filteredActivity = activity.filter((item) => {
    if (activityFilter === "all") return true;
    return item.type === activityFilter;
  });

  const canManageCentre =
    user?.role === "ADMIN" || user?.role === "CENTRE_CHIEF";

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des données du centre...</p>
        </div>
      </div>
    );
  }

  if (error || !centre) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || "Centre non trouvé"}</p>
          <Link href="/centres">
            <Button>Retour aux Centres</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-blue-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/centres">
              <Button variant="outline" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-gray-800">
                {centre.name}
              </h1>
              <p className="text-gray-600 text-lg">{centre.location}</p>
              <p className="text-gray-500 text-sm mt-1">{centre.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              className={`${getStatusColor(
                centre.status
              )} rounded-full px-4 py-2 text-sm font-medium border`}
            >
              {getStatusIcon(centre.status)}
              <span className="ml-2 capitalize">{centre.status}</span>
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-xl"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Actualiser
            </Button>
            {canManageCentre && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditDialog(true)}
                  className="rounded-xl"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Confirmer la suppression
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer ce centre ? Cette
                        action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteCentre}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-600">Email</span>
            </div>
            <div className="text-sm font-medium text-blue-800">
              {centre.email}
            </div>
          </div>
          <div className="bg-green-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Téléphone</span>
            </div>
            <div className="text-sm font-medium text-green-800">
              {centre.phone}
            </div>
          </div>
          <div className="bg-purple-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-purple-600">Manager</span>
            </div>
            <div className="text-sm font-medium text-purple-800">
              {centre.manager}
            </div>
          </div>
          <div className="bg-orange-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-600">Créé le</span>
            </div>
            <div className="text-sm font-medium text-orange-800">
              {new Date(centre.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6 rounded-2xl">
          <TabsTrigger value="overview" className="rounded-xl">
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="bases" className="rounded-xl">
            Bases
          </TabsTrigger>
          <TabsTrigger value="statistics" className="rounded-xl">
            Statistiques
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-xl">
            Activité
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-xl">
            Rapports
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl">
            Paramètres
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="rounded-3xl border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-blue-600">Total Bassins</p>
                      <p className="text-3xl font-bold text-blue-800">
                        {stats.totalBasins}
                      </p>
                    </div>
                    <Waves className="h-12 w-12 text-blue-600" />
                  </div>
                  <div className="text-xs text-blue-600">
                    {stats.activeBasins} actifs
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-red-100 bg-gradient-to-br from-red-50 to-red-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-red-600">Alertes</p>
                      <p className="text-3xl font-bold text-red-800">
                        {stats.totalAlerts}
                      </p>
                    </div>
                    <AlertTriangle className="h-12 w-12 text-red-600" />
                  </div>
                  <div className="text-xs text-red-600">
                    {stats.criticalAlerts} critiques
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-green-100 bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-green-600">Opérateurs</p>
                      <p className="text-3xl font-bold text-green-800">
                        {stats.totalOperators}
                      </p>
                    </div>
                    <Users className="h-12 w-12 text-green-600" />
                  </div>
                  <div className="text-xs text-green-600">
                    {stats.activeOperators} actifs
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-purple-100 bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-purple-600">Capacité</p>
                      <p className="text-3xl font-bold text-purple-800">
                        {centre.capacity}
                      </p>
                    </div>
                    <Target className="h-12 w-12 text-purple-600" />
                  </div>
                  <div className="text-xs text-purple-600">
                    {Math.round((centre.currentBasins / centre.capacity) * 100)}
                    % utilisée
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="rounded-3xl border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-blue-800 mb-2">Rapports</h3>
                <p className="text-sm text-blue-600">
                  Analyser les performances
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-green-100 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-green-800 mb-2">Personnel</h3>
                <p className="text-sm text-green-600">Gérer les utilisateurs</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-purple-100 bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Settings className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-purple-800 mb-2">
                  Configuration
                </h3>
                <p className="text-sm text-purple-600">Paramètres du centre</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-orange-100 bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Activity className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="font-semibold text-orange-800 mb-2">
                  Monitoring
                </h3>
                <p className="text-sm text-orange-600">
                  Surveillance temps réel
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bases Management Tab */}
        <TabsContent value="bases">
          <Card className="rounded-3xl border-gray-100 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-blue-500" />
                  Bases ({centre.bases.length})
                </CardTitle>
                {canManageCentre && (
                  <Dialog
                    open={showAddBaseDialog}
                    onOpenChange={setShowAddBaseDialog}
                  >
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter Base
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Ajouter une nouvelle base</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="base-name">Nom de la base</Label>
                          <Input
                            id="base-name"
                            placeholder="ex: Base Nord"
                            value={baseForm.name}
                            onChange={(e) =>
                              setBaseForm({ ...baseForm, name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="base-location">Localisation</Label>
                          <Input
                            id="base-location"
                            placeholder="ex: Alger Nord"
                            value={baseForm.location}
                            onChange={(e) =>
                              setBaseForm({
                                ...baseForm,
                                location: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="base-status">Statut</Label>
                          <Select
                            value={baseForm.status}
                            onValueChange={(value) =>
                              setBaseForm({ ...baseForm, status: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Actif</SelectItem>
                              <SelectItem value="maintenance">
                                Maintenance
                              </SelectItem>
                              <SelectItem value="construction">
                                Construction
                              </SelectItem>
                              <SelectItem value="inactive">Inactif</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleAddBase}
                            disabled={!baseForm.name.trim()}
                            className="flex-1"
                          >
                            Ajouter
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowAddBaseDialog(false)}
                            className="flex-1"
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {centre.bases.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune base dans ce centre</p>
                  {canManageCentre && (
                    <Button
                      onClick={() => setShowAddBaseDialog(true)}
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter la première base
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {centre.bases.map((base) => (
                    <Card
                      key={base.id}
                      className="rounded-2xl border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-800 mb-2">
                              {base.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Active</span>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700">
                            Opérationnelle
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Bassins:</span>
                            <span className="font-medium">
                              {Math.floor(Math.random() * 10) + 1}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Opérateurs:</span>
                            <span className="font-medium">
                              {Math.floor(Math.random() * 5) + 1}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Alertes:</span>
                            <span className="font-medium text-orange-600">
                              {Math.floor(Math.random() * 3)}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 rounded-xl"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Button>
                          {canManageCentre && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteBase(base.id)}
                              className="rounded-xl text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <Card className="rounded-3xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 rounded-2xl p-4">
                    <div className="text-sm text-blue-600 mb-1">
                      Total Bassins
                    </div>
                    <div className="text-2xl font-bold text-blue-800">
                      {stats.totalBasins}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-2xl p-4">
                    <div className="text-sm text-green-600 mb-1">
                      Bassins Actifs
                    </div>
                    <div className="text-2xl font-bold text-green-800">
                      {stats.activeBasins}
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-2xl p-4">
                    <div className="text-sm text-red-600 mb-1">
                      Alertes Critiques
                    </div>
                    <div className="text-2xl font-bold text-red-800">
                      {stats.criticalAlerts}
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-2xl p-4">
                    <div className="text-sm text-purple-600 mb-1">Capacité</div>
                    <div className="text-2xl font-bold text-purple-800">
                      {centre.capacity}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">Aucune statistique disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card className="rounded-3xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">
                Activité Récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length > 0 ? (
                <div className="space-y-4">
                  {activity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl"
                    >
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {item.description}
                        </p>
                        <p className="text-xs text-gray-600">
                          {getTimeAgo(item.timestamp)}
                        </p>
                      </div>
                      {getActivityIcon(item.type)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">Aucune activité récente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card className="rounded-3xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">
                Rapports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-600">Aucun rapport disponible</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card className="rounded-3xl border-gray-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-800">
                Paramètres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-600">Aucun paramètre disponible</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Centre Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Modifier le Centre</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nom du centre</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-region">Région</Label>
                <Input
                  id="edit-region"
                  value={editForm.region}
                  onChange={(e) =>
                    setEditForm({ ...editForm, region: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-location">Localisation</Label>
              <Input
                id="edit-location"
                value={editForm.location}
                onChange={(e) =>
                  setEditForm({ ...editForm, location: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Téléphone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-manager">Manager</Label>
                <Input
                  id="edit-manager"
                  value={editForm.manager}
                  onChange={(e) =>
                    setEditForm({ ...editForm, manager: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-capacity">Capacité</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  value={editForm.capacity}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      capacity: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-status">Statut</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdateCentre} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
