"use client";

import { useState } from "react";
import {
  Play,
  User,
  Mail,
  Phone,
  Send,
  Trash2,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/components/language-context";

const mockVideoData = {
  V001: {
    id: "V001",
    donor: {
      name: "Ahmed Hassan",
      email: "ahmed@email.com",
      phone: "+33123456789",
      id: "D001",
    },
    status: "confirmed",
    date: "2024-01-15",
    videoUrl: "/placeholder.svg?height=300&width=500",
    message:
      "Cher Ahmed, voici la vidéo de votre sacrifice pour l'Aïd al-Adha. Que Dieu accepte votre offrande. Barakallahu fik.",
  },
  V002: {
    id: "V002",
    donor: {
      name: "Fatima Al-Zahra",
      email: "fatima@email.com",
      phone: "+33987654321",
      id: "D002",
    },
    status: "sent",
    date: "2024-01-14",
    videoUrl: "/placeholder.svg?height=300&width=500",
    message:
      "Chère Fatima, voici la vidéo de votre sacrifice pour l'Aïd al-Adha. Que Dieu accepte votre offrande. Barakallahu fiki.",
  },
};

interface VideoDetailPageProps {
  videoId: string;
}

export function VideoDetailPage({ videoId }: VideoDetailPageProps) {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");

  const video =
    mockVideoData[videoId as keyof typeof mockVideoData] ||
    mockVideoData["V001"];

  useState(() => {
    setMessage(video.message);
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      sent: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      confirmed:
        "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
      error: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    };

    return (
      <Badge
        className={`${
          colors[status as keyof typeof colors]
        } rounded-full px-4 py-2 text-sm font-medium`}
      >
        {t(`status.${status}`)}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl bg-transparent"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              {t("video.title")} - {video.id}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-gray-600 dark:text-gray-400">Statut:</span>
              {getStatusBadge(video.status)}
              <span className="text-gray-500 dark:text-gray-400">•</span>
              <span className="text-gray-600 dark:text-gray-400">
                {video.date}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Preview */}
        <Card className="rounded-2xl border-gray-100 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Aperçu de la vidéo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gray-900 dark:bg-gray-950 rounded-xl overflow-hidden">
              <img
                src={video.videoUrl || "/placeholder.svg"}
                alt="Video thumbnail"
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  size="lg"
                  className="rounded-full w-16 h-16 bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                >
                  <Play className="h-8 w-8 text-white ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Donor Information */}
        <Card className="rounded-2xl border-gray-100 dark:border-gray-700 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              {t("video.donor.info")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">
                  {video.donor.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ID: {video.donor.id}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">
                  {video.donor.email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Email
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <Phone className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100">
                  {video.donor.phone}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Téléphone
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Link href={`/donors/${video.donor.id}`}>
                <Button variant="outline" className="w-full rounded-xl">
                  Voir le profil complet
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Section */}
      <Card className="rounded-2xl border-gray-100 dark:border-gray-700 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Message personnalisé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Rédigez votre message personnalisé pour accompagner la vidéo..."
              className="min-h-[120px] rounded-xl resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setMessage(video.message)}
              >
                Réinitialiser
              </Button>
              <Button
                size="sm"
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="rounded-2xl border-gray-100 dark:border-gray-700 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {video.status === "pending" && (
              <Button className="rounded-xl bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle className="h-4 w-4 mr-2" />
                Envoyer la vidéo
              </Button>
            )}
            {video.status === "sent" && (
              <Button variant="outline" className="rounded-xl">
                <Send className="h-4 w-4 mr-2" />
                Renvoyer
              </Button>
            )}
            <Button variant="outline" className="rounded-xl">
              Télécharger
            </Button>
            <Button variant="destructive" className="rounded-xl">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
