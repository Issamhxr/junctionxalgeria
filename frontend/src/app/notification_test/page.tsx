"use client";

import React from "react";
import NotificationTestComponent from "../../components/notification-test";

export default function NotificationTestPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Test de Notifications
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-gray-600 mb-6">
            Utilisez cette page pour tester toutes les fonctionnalités de
            notification de l'application.
          </p>
          <NotificationTestComponent />
        </div>
      </div>
    </div>
  );
}
