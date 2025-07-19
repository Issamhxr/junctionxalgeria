"use client";

import React, { useState, useEffect } from "react";
import { useNotifications } from "@/contexts/notification-context";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  TestTube,
  Zap,
  Settings,
} from "lucide-react";

const NotificationTestComponent: React.FC = () => {
  const {
    requestNotificationPermission,
    subscribeToNotifications,
    showToast,
    isNotificationSupported,
    notificationPermission,
  } = useNotifications();

  const [testUserId] = useState("test-user-123");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<string>("Non abonné");

  useEffect(() => {
    // Check subscription status on mount
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        setSubscriptionStatus(subscription ? "Abonné" : "Non abonné");
      });
    }
  }, []);

  const handleTestToast = (type: "success" | "error" | "warning" | "info") => {
    const messages = {
      success: "✅ Notification de succès - Tout fonctionne parfaitement!",
      error: "❌ Notification d'erreur - Quelque chose s'est mal passé!",
      warning: "⚠️ Notification d'avertissement - Attention requise!",
      info: "ℹ️ Notification d'information - Voici une info utile!",
    };

    showToast(messages[type], type);
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      showToast(
        "🎉 Permission accordée! Vous pouvez maintenant recevoir des notifications push.",
        "success"
      );
    } else {
      showToast(
        "❌ Permission refusée. Vous ne recevrez pas de notifications push.",
        "error"
      );
    }
  };

  const handleSubscribeToNotifications = async () => {
    if (notificationPermission !== "granted") {
      showToast(
        "⚠️ Veuillez d'abord accorder la permission de notification.",
        "warning"
      );
      return;
    }

    setIsSubscribing(true);
    try {
      await subscribeToNotifications(testUserId);
      setSubscriptionStatus("Abonné");
      showToast("🔔 Abonnement aux notifications push réussi!", "success");
    } catch (error) {
      showToast("❌ Erreur lors de l'abonnement aux notifications.", "error");
      console.error("Subscription error:", error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleTestBrowserNotification = () => {
    if (notificationPermission === "granted") {
      new Notification("🧪 Test de Notification", {
        body: "Ceci est un test de notification du navigateur!",
        icon: "/logo.svg",
        badge: "/logo-compact.svg",
        tag: "test-notification",
        requireInteraction: true,
      });
      showToast("Notification du navigateur envoyée!", "info");
    } else {
      showToast(
        "Permission de notification requise pour les notifications du navigateur.",
        "warning"
      );
    }
  };

  const handleTestAlertNotification = () => {
    // Simulate a real-time alert
    const mockAlert = {
      id: "test-alert-" + Date.now(),
      title: "🚨 Alerte Critique - Test",
      message: "Niveau d'oxygène critique détecté dans le bassin principal",
      severity: "CRITICAL" as const,
      farmName: "Ferme de Test",
      pondName: "Bassin Principal",
      timestamp: new Date().toISOString(),
    };

    // This would typically come from your real-time system
    showToast(
      `🚨 ${mockAlert.title}: ${mockAlert.message} (${mockAlert.farmName} - ${mockAlert.pondName})`,
      "error"
    );
  };

  const getPermissionStatusColor = (permission: NotificationPermission) => {
    switch (permission) {
      case "granted":
        return "text-green-600 bg-green-50 border-green-200";
      case "denied":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
    }
  };

  const getPermissionStatusText = (permission: NotificationPermission) => {
    switch (permission) {
      case "granted":
        return "✅ Accordée";
      case "denied":
        return "❌ Refusée";
      default:
        return "⏳ En attente";
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Section */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          État des Notifications
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Support du navigateur:
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isNotificationSupported
                    ? "text-green-600 bg-green-50 border border-green-200"
                    : "text-red-600 bg-red-50 border border-red-200"
                }`}
              >
                {isNotificationSupported ? "✅ Supporté" : "❌ Non supporté"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Permission:</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium border ${getPermissionStatusColor(
                  notificationPermission
                )}`}
              >
                {getPermissionStatusText(notificationPermission)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Abonnement Push:</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  subscriptionStatus === "Abonné"
                    ? "text-green-600 bg-green-50 border border-green-200"
                    : "text-gray-600 bg-gray-50 border border-gray-200"
                }`}
              >
                {subscriptionStatus}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                ID Utilisateur Test:
              </span>
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                {testUserId}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Permission & Subscription Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Configuration des Notifications
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleRequestPermission}
            disabled={
              notificationPermission === "granted" || !isNotificationSupported
            }
            className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Bell className="h-5 w-5" />
            {notificationPermission === "granted"
              ? "Permission Accordée"
              : "Demander Permission"}
          </button>

          <button
            onClick={handleSubscribeToNotifications}
            disabled={
              notificationPermission !== "granted" ||
              isSubscribing ||
              subscriptionStatus === "Abonné"
            }
            className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="h-5 w-5" />
            {isSubscribing
              ? "Abonnement..."
              : subscriptionStatus === "Abonné"
              ? "Déjà Abonné"
              : "S'abonner aux Push"}
          </button>
        </div>
      </div>

      {/* Toast Notifications Test Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Test des Notifications Toast
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleTestToast("success")}
            className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Succès
          </button>
          <button
            onClick={() => handleTestToast("error")}
            className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <X className="h-4 w-4" />
            Erreur
          </button>
          <button
            onClick={() => handleTestToast("warning")}
            className="p-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Alerte
          </button>
          <button
            onClick={() => handleTestToast("info")}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Info className="h-4 w-4" />
            Info
          </button>
        </div>
      </div>

      {/* Advanced Tests Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Tests Avancés</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleTestBrowserNotification}
            disabled={notificationPermission !== "granted"}
            className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Bell className="h-5 w-5" />
            Test Notification Navigateur
          </button>
          <button
            onClick={handleTestAlertNotification}
            className="p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <AlertTriangle className="h-5 w-5" />
            Test Alerte Critique
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">
          Instructions d'utilisation:
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            1. Cliquez sur "Demander Permission" pour autoriser les
            notifications
          </li>
          <li>
            2. Utilisez "S'abonner aux Push" pour recevoir les notifications
            push
          </li>
          <li>3. Testez les différents types de notifications toast</li>
          <li>
            4. Essayez les notifications du navigateur et les alertes critiques
          </li>
          <li>5. Vérifiez l'état dans la section "État des Notifications"</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationTestComponent;
