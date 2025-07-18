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
      pending: "bg-gray-100 text-gray-700",
      sent: "bg-blue-100 text-blue-700",
      confirmed: "bg-green-100 text-green-700",
      error: "bg-red-100 text-red-700",
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
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
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
            <h1 className="text-3xl font-bold text-gray-800">
              {t("video.title")} - {video.id}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-gray-600">Statut:</span>
              {getStatusBadge(video.status)}
              <span className="text-gray-500">•</span>
              <span className="text-gray-600">{video.date}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Preview */}
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">
              Aperçu de la vidéo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gray-900 rounded-xl overflow-hidden">
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
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">
              {t("video.donor.info")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  {video.donor.name}
                </p>
                <p className="text-sm text-gray-500">ID: {video.donor.id}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Mail className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">{video.donor.email}</span>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">{video.donor.phone}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Preview */}
      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">
            {t("video.message.preview")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-32 rounded-xl border-gray-200 resize-none"
            placeholder="Message personnalisé..."
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        {video.status !== "confirmed" && (
          <>
            <Button
              size="lg"
              className="rounded-2xl px-8 py-4 bg-blue-600 hover:bg-blue-700"
            >
              <Send className="mr-3 h-5 w-5" />
              {t("action.resend")}
            </Button>

            <Button
              size="lg"
              className="rounded-2xl px-8 py-4 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-3 h-5 w-5" />
              {t("video.confirm")}
            </Button>
          </>
        )}

        <Button
          size="lg"
          variant="outline"
          className="rounded-2xl px-8 py-4 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 bg-transparent"
        >
          <Trash2 className="mr-3 h-5 w-5" />
          {t("action.delete")}
        </Button>
      </div>
    </div>
  );
}
