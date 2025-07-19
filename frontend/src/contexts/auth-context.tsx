"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

// Define user types
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role:
    | "ADMIN"
    | "CENTRE_CHIEF"
    | "BASE_CHIEF"
    | "OPERATOR"
    | "FARMER"
    | "TECHNICIAN"
    | "VIEWER";
  isActive: boolean;
  createdAt: string;
}

const DUMMY_USERS: User[] = [
  {
    id: "a1e2f3b4-c5d6-7890-abcd-1234567890ef",
    username: "admin_central",
    email: "admin@aquadz.dz",
    firstName: "Central",
    lastName: "Administrator",
    role: "ADMIN",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "b2f3a4c5-d6e7-8901-bcde-2345678901fa",
    username: "admin_regional",
    email: "regional.admin@aquadz.dz",
    firstName: "Rachid",
    lastName: "Bendebka",
    role: "ADMIN",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-3456789012ab",
    username: "tech_ouargla",
    email: "tech.ouargla@aquadz.dz",
    firstName: "Ali",
    lastName: "Meziane",
    role: "TECHNICIAN",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "d4e5f6a7-b8c9-0123-def0-4567890123bc",
    username: "chief_eloued",
    email: "karim.belkacem@aquadz.dz",
    firstName: "Karim",
    lastName: "Belkacem",
    role: "FARMER",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "e5f6a7b8-c9d0-1234-ef01-5678901234cd",
    username: "observer_north",
    email: "nora.boukhalfa@aquadz.dz",
    firstName: "Nora",
    lastName: "Boukhalfa",
    role: "VIEWER",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
  },
];
const DUMMY_CREDENTIALS = {
  "admin@aquadz.dz": "admin123",
  "regional.admin@aquadz.dz": "Admin@123",
  "tech.ouargla@aquadz.dz": "Tech@123",
  "karim.belkacem@aquadz.dz": "Chief@123",
  "nora.boukhalfa@aquadz.dz": "Viewer@123",
};

// Define auth context interface
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing saved user data:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
      }
    }

    setIsLoading(false);
  }, []);

  // Dummy login function (frontend-only)
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check credentials using simple if/else statements - NO API CALLS
      const expectedPassword =
        DUMMY_CREDENTIALS[email as keyof typeof DUMMY_CREDENTIALS];

      if (expectedPassword && password === expectedPassword) {
        // Find user by email
        const userData = DUMMY_USERS.find((u) => u.email === email);

        if (userData) {
          // Generate dummy token
          const token = `dummy_token_${userData.id}_${Date.now()}`;

          // Save to localStorage
          localStorage.setItem("auth_token", token);
          localStorage.setItem("user", JSON.stringify(userData));

          setUser(userData);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      setUser(null);
      router.push("/login");
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
