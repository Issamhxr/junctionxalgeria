"use client";

import type React from "react";
import { createContext, useContext, useState } from "react";

type Language = "fr" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  fr: {
    // Navigation
    "nav.dashboard": "Tableau de bord",
    "nav.basins": "Bassins",
    "nav.alerts": "Alertes",
    "nav.settings": "Paramètres",

    // Dashboard
    "dashboard.title": "Gestion des Bassins Piscicoles",
    "dashboard.subtitle": "Surveillance intelligente de vos bassins",
    "dashboard.total.basins": "Bassins totaux",
    "dashboard.active.alerts": "Alertes actives",
    "dashboard.normal.status": "État normal",
    "dashboard.last.update": "Dernière mise à jour",

    // Basin status
    "status.normal": "Normal",
    "status.warning": "Alerte",
    "status.critical": "Critique",
    "status.offline": "Hors ligne",

    // Parameters
    "param.temperature": "Température",
    "param.ph": "pH",
    "param.oxygen": "Oxygène",
    "param.salinity": "Salinité",
    "param.turbidity": "Turbidité",

    // Units
    "unit.celsius": "°C",
    "unit.ph": "",
    "unit.oxygen": "mg/L",
    "unit.salinity": "ppt",
    "unit.turbidity": "NTU",

    // Basin details
    "basin.details": "Détails du bassin",
    "basin.overview": "Vue d'ensemble",
    "basin.history": "Historique",
    "basin.alerts": "Alertes",
    "basin.export": "Exporter",
    "basin.last.reading": "Dernière lecture",

    // Alerts
    "alerts.title": "Alertes du système",
    "alerts.active": "Alertes actives",
    "alerts.resolved": "Alertes résolues",
    "alerts.all": "Toutes",
    "alerts.temperature": "Température",
    "alerts.ph": "pH",
    "alerts.oxygen": "Oxygène",
    "alerts.resolve": "Résoudre",
    "alerts.resolved.success": "Alerte résolue",
    "alerts.high": "Élevé",
    "alerts.low": "Bas",
    "alerts.critical": "Critique",

    // Settings
    "settings.title": "Paramètres",
    "settings.language": "Langue",
    "settings.thresholds": "Seuils d'alerte",
    "settings.profile": "Profil utilisateur",
    "settings.notifications": "Notifications",
    "settings.save": "Sauvegarder",
    "settings.saved": "Paramètres sauvegardés",

    // Common
    "common.loading": "Chargement...",
    "common.error": "Erreur",
    "common.retry": "Réessayer",
    "common.close": "Fermer",
    "common.view": "Voir",
    "common.filter": "Filtrer",
    "common.today": "Aujourd'hui",
    "common.yesterday": "Hier",
    "common.week": "Cette semaine",
    "common.month": "Ce mois",

    // Time
    "time.now": "maintenant",
    "time.minutes": "min",
    "time.hours": "h",
    "time.days": "j",
  },
  ar: {
    // Navigation
    "nav.dashboard": "لوحة التحكم",
    "nav.basins": "الأحواض",
    "nav.alerts": "التنبيهات",
    "nav.settings": "الإعدادات",

    // Dashboard
    "dashboard.title": "إدارة أحواض تربية الأسماك",
    "dashboard.subtitle": "مراقبة ذكية لأحواضك",
    "dashboard.total.basins": "إجمالي الأحواض",
    "dashboard.active.alerts": "التنبيهات النشطة",
    "dashboard.normal.status": "الحالة الطبيعية",
    "dashboard.last.update": "آخر تحديث",

    // Basin status
    "status.normal": "طبيعي",
    "status.warning": "تحذير",
    "status.critical": "حرج",
    "status.offline": "غير متصل",

    // Parameters
    "param.temperature": "درجة الحرارة",
    "param.ph": "الحموضة",
    "param.oxygen": "الأكسجين",
    "param.salinity": "الملوحة",
    "param.turbidity": "العكارة",

    // Units
    "unit.celsius": "°م",
    "unit.ph": "",
    "unit.oxygen": "مغ/ل",
    "unit.salinity": "جزء في الألف",
    "unit.turbidity": "وحدة عكارة",

    // Basin details
    "basin.details": "تفاصيل الحوض",
    "basin.overview": "نظرة عامة",
    "basin.history": "التاريخ",
    "basin.alerts": "التنبيهات",
    "basin.export": "تصدير",
    "basin.last.reading": "آخر قراءة",

    // Alerts
    "alerts.title": "تنبيهات النظام",
    "alerts.active": "التنبيهات النشطة",
    "alerts.resolved": "التنبيهات المحلولة",
    "alerts.all": "الكل",
    "alerts.temperature": "درجة الحرارة",
    "alerts.ph": "الحموضة",
    "alerts.oxygen": "الأكسجين",
    "alerts.resolve": "حل",
    "alerts.resolved.success": "تم حل التنبيه",
    "alerts.high": "مرتفع",
    "alerts.low": "منخفض",
    "alerts.critical": "حرج",

    // Settings
    "settings.title": "الإعدادات",
    "settings.language": "اللغة",
    "settings.thresholds": "عتبات التنبيه",
    "settings.profile": "الملف الشخصي",
    "settings.notifications": "الإشعارات",
    "settings.save": "حفظ",
    "settings.saved": "تم حفظ الإعدادات",

    // Common
    "common.loading": "جاري التحميل...",
    "common.error": "خطأ",
    "common.retry": "إعادة المحاولة",
    "common.close": "إغلاق",
    "common.view": "عرض",
    "common.filter": "تصفية",
    "common.today": "اليوم",
    "common.yesterday": "أمس",
    "common.week": "هذا الأسبوع",
    "common.month": "هذا الشهر",

    // Time
    "time.now": "الآن",
    "time.minutes": "د",
    "time.hours": "س",
    "time.days": "ي",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("fr");

  const t = (key: string): string => {
    return (
      translations[language][key as keyof (typeof translations)["fr"]] || key
    );
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div
        className={language === "ar" ? "rtl" : "ltr"}
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
