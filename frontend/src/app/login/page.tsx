"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/components/language-context";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, Sun, Moon, Languages } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@aquadz.dz");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push("/");
      } else {
        setError("Email ou mot de passe incorrect");
      }
    } catch (err) {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-teal-50 to-green-50 dark:from-background dark:via-card dark:to-background p-4">
      {/* Top Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {/* Language Select */}
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-24 h-10 border-none bg-background/80 backdrop-blur-sm hover:bg-background/90">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fr">
              <div className="flex items-center gap-2">
                <span className="text-sm">🇫🇷</span>
              </div>
            </SelectItem>
            <SelectItem value="ar">
              <div className="flex items-center gap-2">
                <span className="text-sm">🇩🇿</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Dark Mode Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className="h-10 w-10 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90"
          title={
            theme === "light"
              ? "Activer le mode sombre"
              : "Activer le mode clair"
          }
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
            <Image
              src="/logo.svg"
              alt="AquaMonitor Logo"
              width={32}
              height={32}
              className="text-primary-foreground"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              AquaMonitor
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Connectez-vous à votre compte
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-destructive/50 bg-destructive/10">
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Mot de passe oublié ?{" "}
              <button className="text-primary hover:text-primary/80 font-medium">
                Réinitialiser
              </button>
            </p>
          </div>

          {/* Test Credentials Info */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
            <p className="text-xs text-foreground font-medium mb-2">
              Test Credentials:
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>• admin@aquadz.dz / admin123 (ADMIN)</div>
              <div>• tech.ouargla@aquadz.dz / Tech@123 (TECHNICIAN)</div>
              <div>• karim.belkacem@aquadz.dz / Chief@123 (FARMER)</div>
              <div>• nora.boukhalfa@aquadz.dz / Viewer@123 (VIEWER)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
