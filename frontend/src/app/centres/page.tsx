"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  MapPin,
  Users,
  TrendingUp,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient, Centre } from "@/lib/api";

export default function CentresPage() {
  const { user } = useAuth();
  const [centres, setCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCentres = async () => {
      try {
        const data = await apiClient.getCentres();
        setCentres(data);
      } catch (error) {
        console.error("Error fetching centres:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "ADMIN") {
      fetchCentres();
    }
  }, [user]);

  // Redirect if not admin
  if (user?.role !== "ADMIN") {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Accès non autorisé</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Gestion des Centres
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Vue d'ensemble de tous les centres aquacoles
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Centre
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <Card className="rounded-2xl md:rounded-3xl border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-2 md:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs md:text-sm font-medium text-blue-700">
                Total Centres
              </CardTitle>
              <Building className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-blue-800">
              {centres.length}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl md:rounded-3xl border-green-100 bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="pb-2 md:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs md:text-sm font-medium text-green-700">
                Total Bases
              </CardTitle>
              <MapPin className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-green-800">
              {centres.reduce((sum, centre) => sum + centre.bases.length, 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl md:rounded-3xl border-purple-100 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="pb-2 md:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs md:text-sm font-medium text-purple-700">
                Utilisateurs
              </CardTitle>
              <Users className="h-4 w-4 md:h-6 md:w-6 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-purple-800">
              24
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl md:rounded-3xl border-orange-100 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="pb-2 md:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs md:text-sm font-medium text-orange-700">
                Performance
              </CardTitle>
              <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-orange-800">
              87%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Centres Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {centres.map((centre) => (
          <Card
            key={centre.id}
            className="rounded-2xl md:rounded-3xl border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-3 md:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base md:text-lg font-semibold text-gray-800 break-words">
                    {centre.name}
                  </CardTitle>
                  <div className="text-xs md:text-sm text-gray-500 mt-1">
                    Région: {centre.region}
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs w-fit">
                  {centre.bases.length} bases
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <div className="bg-blue-50 rounded-xl md:rounded-2xl p-2 md:p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
                    <span className="text-xs font-medium text-gray-600">
                      Bases
                    </span>
                  </div>
                  <div className="text-base md:text-lg font-bold text-gray-800">
                    {centre.bases.length}
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl md:rounded-2xl p-2 md:p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-3 w-3 md:h-4 md:w-4 text-green-500" />
                    <span className="text-xs font-medium text-gray-600">
                      Staff
                    </span>
                  </div>
                  <div className="text-base md:text-lg font-bold text-gray-800">
                    {centre.bases.length * 3}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-gray-100 space-y-2 sm:space-y-0">
                <div className="text-xs text-gray-500">
                  Créé le {new Date(centre.createdAt).toLocaleDateString()}
                </div>
                <Button
                  size="sm"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                >
                  Gérer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
