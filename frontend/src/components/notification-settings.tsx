"use client";

import React, { useState, useEffect } from "react";
import { useNotifications } from "@/contexts/notification-context";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  BellOff,
  Smartphone,
  Mail,
  MessageSquare,
  Settings,
  TestTube,
  Volume2,
  VolumeX,
} from "lucide-react";

export const NotificationSettingsComponent: React.FC = () => {
  const {
    requestNotificationPermission,
    subscribeToNotifications,
    showToast,
    isNotificationSupported,
    notificationPermission,
  } = useNotifications();
  const { user } = useAuth();

  const [preferences, setPreferences] = useState({
    push_enabled: false,
    email_enabled: true,
    sms_enabled: false,
    whatsapp_enabled: false,
    min_severity: "MEDIUM",
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "07:00",
    sound_enabled: true,
    vibration_enabled: true,
  });

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load user's notification preferences
    loadNotificationPreferences();
  }, [user]);

  const loadNotificationPreferences = async () => {
    try {
      // In a real app, this would fetch from your API
      const savedPrefs = localStorage.getItem("notification_preferences");
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
    }
  };

  const saveNotificationPreferences = async (newPrefs: typeof preferences) => {
    try {
      // In a real app, this would save to your API
      localStorage.setItem(
        "notification_preferences",
        JSON.stringify(newPrefs)
      );
      setPreferences(newPrefs);
      showToast("Préférences de notification sauvegardées", "success");
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      showToast("Erreur lors de la sauvegarde des préférences", "error");
    }
  };

  const handleEnablePushNotifications = async () => {
    if (!isNotificationSupported) {
      showToast(
        "Les notifications push ne sont pas supportées sur ce navigateur",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission && user?.id) {
        await subscribeToNotifications(user.id);
        setIsSubscribed(true);
        const newPrefs = { ...preferences, push_enabled: true };
        await saveNotificationPreferences(newPrefs);
      } else {
        showToast("Permission refusée pour les notifications", "error");
      }
    } catch (error) {
      console.error("Error enabling push notifications:", error);
      showToast("Erreur lors de l'activation des notifications", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDisablePushNotifications = async () => {
    try {
      // Unsubscribe from push notifications
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      setIsSubscribed(false);
      const newPrefs = { ...preferences, push_enabled: false };
      await saveNotificationPreferences(newPrefs);
      showToast("Notifications push désactivées", "info");
    } catch (error) {
      console.error("Error disabling push notifications:", error);
      showToast("Erreur lors de la désactivation des notifications", "error");
    }
  };

  const handleTestNotification = () => {
    if (notificationPermission === "granted") {
      // Show browser notification
      new Notification("🚨 Test d'alerte critique", {
        body: "Ceci est un test de notification du système AquaCulture Algeria",
        icon: "/icons/alert-icon.png",
        badge: "/icons/badge.png",
        tag: "test-notification",
        requireInteraction: true,
        actions: [
          { action: "view", title: "Voir l'alerte" },
          { action: "dismiss", title: "Ignorer" },
        ],
      });
    }

    // Show toast notification
    showToast("Test de notification envoyé!", "info");
  };

  const getNotificationStatusColor = () => {
    switch (notificationPermission) {
      case "granted":
        return "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200";
      case "denied":
        return "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200";
      default:
        return "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200";
    }
  };

  const getNotificationStatusText = () => {
    switch (notificationPermission) {
      case "granted":
        return "Autorisées";
      case "denied":
        return "Refusées";
      default:
        return "Non configurées";
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification Status */}
      <Card className="rounded-3xl border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            État des Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notifications push:
                </span>
                <Badge className={`${getNotificationStatusColor()} text-xs`}>
                  {getNotificationStatusText()}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestNotification}
                disabled={notificationPermission !== "granted"}
                className="rounded-xl"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Test
              </Button>
              {notificationPermission === "granted" &&
              !preferences.push_enabled ? (
                <Button
                  onClick={handleEnablePushNotifications}
                  disabled={loading}
                  className="rounded-xl"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Activer
                </Button>
              ) : notificationPermission === "granted" &&
                preferences.push_enabled ? (
                <Button
                  variant="destructive"
                  onClick={handleDisablePushNotifications}
                  className="rounded-xl"
                >
                  <BellOff className="h-4 w-4 mr-2" />
                  Désactiver
                </Button>
              ) : (
                <Button
                  onClick={handleEnablePushNotifications}
                  disabled={loading}
                  className="rounded-xl"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Configurer
                </Button>
              )}
            </div>
          </div>

          {!isNotificationSupported && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Les notifications push ne sont pas supportées sur ce
                navigateur.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card className="rounded-3xl border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Canaux de Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                  <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    Push
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Notifications navigateur
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.push_enabled}
                onCheckedChange={(checked) =>
                  saveNotificationPreferences({
                    ...preferences,
                    push_enabled: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/30 rounded-2xl border dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                  <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    Email
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Notifications par email
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.email_enabled}
                onCheckedChange={(checked) =>
                  saveNotificationPreferences({
                    ...preferences,
                    email_enabled: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/30 rounded-2xl border dark:border-orange-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    SMS
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Messages texte
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.sms_enabled}
                onCheckedChange={(checked) =>
                  saveNotificationPreferences({
                    ...preferences,
                    sms_enabled: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/30 rounded-2xl border dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    WhatsApp
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Messages WhatsApp
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.whatsapp_enabled}
                onCheckedChange={(checked) =>
                  saveNotificationPreferences({
                    ...preferences,
                    whatsapp_enabled: checked,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="rounded-3xl border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Settings className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Préférences de Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                Seuil minimum de sévérité
              </label>
              <Select
                value={preferences.min_severity}
                onValueChange={(value) =>
                  saveNotificationPreferences({
                    ...preferences,
                    min_severity: value,
                  })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">
                    Faible (toutes les alertes)
                  </SelectItem>
                  <SelectItem value="MEDIUM">Moyenne</SelectItem>
                  <SelectItem value="HIGH">Élevée</SelectItem>
                  <SelectItem value="CRITICAL">Critique uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/30 rounded-2xl border dark:border-purple-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                  {preferences.sound_enabled ? (
                    <Volume2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    Sons
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Signaux sonores
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.sound_enabled}
                onCheckedChange={(checked) =>
                  saveNotificationPreferences({
                    ...preferences,
                    sound_enabled: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border dark:border-indigo-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg">
                  <Smartphone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    Vibrations
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Vibrations mobiles
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.vibration_enabled}
                onCheckedChange={(checked) =>
                  saveNotificationPreferences({
                    ...preferences,
                    vibration_enabled: checked,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
