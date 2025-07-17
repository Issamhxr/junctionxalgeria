"use client";

import { useState } from "react";
import {
  Save,
  Globe,
  Thermometer,
  Droplets,
  Activity,
  User,
  Bell,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/components/language-context";

export function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const [tempMin, setTempMin] = useState("20");
  const [tempMax, setTempMax] = useState("28");
  const [phMin, setPhMin] = useState("6.5");
  const [phMax, setPhMax] = useState("8.0");
  const [oxygenMin, setOxygenMin] = useState("5.0");
  const [userName, setUserName] = useState("Ahmed Benali");
  const [userEmail, setUserEmail] = useState("ahmed.benali@email.com");
  const [userPhone, setUserPhone] = useState("+213 555 123 456");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  const handleSave = () => {
    // Save settings logic here
    alert(t("settings.saved"));
  };

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-blue-100">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          {t("settings.title")}
        </h1>
        <p className="text-gray-600 text-lg">
          Configurez vos préférences et seuils d'alerte
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Settings */}
        <Card className="rounded-3xl border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
              <Globe className="h-6 w-6 text-blue-600" />
              {t("settings.language")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">
                Langue de l'interface
              </Label>
              <Select
                value={language}
                onValueChange={(value: "fr" | "ar") => setLanguage(value)}
              >
                <SelectTrigger className="rounded-2xl border-gray-200 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  <SelectItem value="ar">🇩🇿 العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card className="rounded-3xl border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
              <User className="h-6 w-6 text-green-600" />
              {t("settings.profile")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Nom complet
              </Label>
              <Input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="rounded-2xl border-gray-200 h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="rounded-2xl border-gray-200 h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Téléphone
              </Label>
              <Input
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                className="rounded-2xl border-gray-200 h-12"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Threshold Settings */}
      <Card className="rounded-3xl border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
            <Thermometer className="h-6 w-6 text-orange-600" />
            {t("settings.thresholds")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Temperature */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Thermometer className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold text-gray-800">
                  {t("param.temperature")}
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Minimum (°C)
                  </Label>
                  <Input
                    type="number"
                    value={tempMin}
                    onChange={(e) => setTempMin(e.target.value)}
                    className="rounded-2xl border-gray-200 h-12 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Maximum (°C)
                  </Label>
                  <Input
                    type="number"
                    value={tempMax}
                    onChange={(e) => setTempMax(e.target.value)}
                    className="rounded-2xl border-gray-200 h-12 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* pH */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Droplets className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-gray-800">{t("param.ph")}</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Minimum
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={phMin}
                    onChange={(e) => setPhMin(e.target.value)}
                    className="rounded-2xl border-gray-200 h-12 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Maximum
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={phMax}
                    onChange={(e) => setPhMax(e.target.value)}
                    className="rounded-2xl border-gray-200 h-12 mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Oxygen */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold text-gray-800">
                  {t("param.oxygen")}
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Minimum (mg/L)
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={oxygenMin}
                    onChange={(e) => setOxygenMin(e.target.value)}
                    className="rounded-2xl border-gray-200 h-12 mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="rounded-3xl border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
            <Bell className="h-6 w-6 text-purple-600" />
            {t("settings.notifications")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">
                Notifications par email
              </h3>
              <p className="text-sm text-gray-600">
                Recevoir les alertes par email
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">Notifications SMS</h3>
              <p className="text-sm text-gray-600">
                Recevoir les alertes critiques par SMS
              </p>
            </div>
            <Switch
              checked={smsNotifications}
              onCheckedChange={setSmsNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-800">Notifications push</h3>
              <p className="text-sm text-gray-600">
                Notifications dans le navigateur
              </p>
            </div>
            <Switch
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleSave}
          className="rounded-3xl px-12 py-4 bg-blue-600 hover:bg-blue-700 text-lg font-medium shadow-lg"
        >
          <Save className="mr-3 h-6 w-6" />
          {t("settings.save")}
        </Button>
      </div>
    </div>
  );
}
