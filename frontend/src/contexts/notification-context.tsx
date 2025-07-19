"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { Bell, AlertTriangle, CheckCircle, Info, X } from "lucide-react";

interface NotificationContextType {
  requestNotificationPermission: () => Promise<boolean>;
  registerServiceWorker: () => Promise<void>;
  subscribeToNotifications: (userId: string) => Promise<void>;
  showToast: (
    message: string,
    type?: "success" | "error" | "warning" | "info"
  ) => void;
  isNotificationSupported: boolean;
  notificationPermission: NotificationPermission;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isNotificationSupported, setIsNotificationSupported] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [serviceWorkerRegistration, setServiceWorkerRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if notifications are supported
    if ("Notification" in window && "serviceWorker" in navigator) {
      setIsNotificationSupported(true);
      setNotificationPermission(Notification.permission);
    }

    // Register service worker on mount
    registerServiceWorker();
  }, []);

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!isNotificationSupported) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  const registerServiceWorker = async (): Promise<void> => {
    if (!("serviceWorker" in navigator)) {
      console.log("Service Worker not supported");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      setServiceWorkerRegistration(registration);
      console.log("Service Worker registered successfully");

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "NOTIFICATION_CLICKED") {
          // Handle notification click
          const { alertId, url } = event.data;
          if (url) {
            window.open(url, "_blank");
          }
        }
      });
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  };

  const subscribeToNotifications = async (userId: string): Promise<void> => {
    if (!serviceWorkerRegistration || notificationPermission !== "granted") {
      console.log(
        "Cannot subscribe: service worker not registered or permission not granted"
      );
      return;
    }

    try {
      // Get push subscription
      const subscription =
        await serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
          ),
        });

      // Send subscription to server
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          subscription: subscription.toJSON(),
        }),
      });

      if (response.ok) {
        console.log("Push subscription successful");
        showToast("Notifications activées avec succès!", "success");
      } else {
        throw new Error("Failed to subscribe to push notifications");
      }
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      showToast("Erreur lors de l'activation des notifications", "error");
    }
  };

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info" = "info"
  ) => {
    const icons = {
      success: CheckCircle,
      error: X,
      warning: AlertTriangle,
      info: Info,
    };

    const Icon = icons[type];

    toast(message, {
      icon: <Icon className="h-4 w-4" />,
      duration: type === "error" ? 5000 : 3000,
      className: `
        ${
          type === "success"
            ? "bg-green-50 border-green-200 text-green-800"
            : ""
        }
        ${type === "error" ? "bg-red-50 border-red-200 text-red-800" : ""}
        ${
          type === "warning"
            ? "bg-yellow-50 border-yellow-200 text-yellow-800"
            : ""
        }
        ${type === "info" ? "bg-blue-50 border-blue-200 text-blue-800" : ""}
      `,
      style: {
        border: "1px solid",
        borderRadius: "12px",
        padding: "12px 16px",
        fontSize: "14px",
        fontWeight: "500",
      },
    });
  };

  const contextValue: NotificationContextType = {
    requestNotificationPermission,
    registerServiceWorker,
    subscribeToNotifications,
    showToast,
    isNotificationSupported,
    notificationPermission,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        expand={false}
        offset={16}
        toastOptions={{
          className: "rounded-xl shadow-lg border",
          style: {
            padding: "12px",
            fontSize: "14px",
          },
        }}
      />
    </NotificationContext.Provider>
  );
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Alert notification component for real-time alerts
export const AlertNotification: React.FC<{
  alert: {
    id: string;
    title: string;
    message: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    farmName: string;
    pondName: string;
    timestamp: string;
  };
  onDismiss: () => void;
  onView: () => void;
}> = ({ alert, onDismiss, onView }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 border-red-300 text-red-800";
      case "HIGH":
        return "bg-orange-100 border-orange-300 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "LOW":
        return "bg-blue-100 border-blue-300 text-blue-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "🚨";
      case "HIGH":
        return "🔥";
      case "MEDIUM":
        return "⚠️";
      case "LOW":
        return "ℹ️";
      default:
        return "📢";
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border-2 shadow-lg ${getSeverityColor(
        alert.severity
      )} mb-4`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{alert.title}</h3>
            <p className="text-sm mt-1">{alert.message}</p>
            <div className="flex items-center gap-4 mt-2 text-xs opacity-75">
              <span>🏢 {alert.farmName}</span>
              <span>🌊 {alert.pondName}</span>
              <span>⏰ {new Date(alert.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onView}
            className="px-3 py-1 bg-white bg-opacity-50 hover:bg-opacity-75 rounded-lg text-xs font-medium transition-colors"
          >
            Voir
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-1 bg-white bg-opacity-50 hover:bg-opacity-75 rounded-lg text-xs font-medium transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
