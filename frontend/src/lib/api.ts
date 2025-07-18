// API Configuration - Use proxy in development, direct URL in production
const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "" // Use proxy in development
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// API Client class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    // Get token from localStorage
    const token = localStorage.getItem("auth_token");

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{
      success: boolean;
      data: {
        user: any;
        token: string;
      };
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request<{ success: boolean }>("/api/auth/logout", {
      method: "POST",
    });
  }

  async getMe() {
    return this.request<{
      success: boolean;
      data: {
        user: any;
      };
    }>("/api/auth/me");
  }

  // Ponds endpoints
  async getPonds() {
    return this.request<{
      success: boolean;
      data: {
        ponds: Basin[];
      };
    }>("/api/ponds");
  }

  // Alias for getPonds - used in frontend as getBasins
  async getBasins() {
    return this.getPonds();
  }

  async getPond(id: string) {
    return this.request<{
      success: boolean;
      data: {
        pond: Basin;
      };
    }>(`/api/ponds/${id}`);
  }

  // Sensor data endpoints
  async addSensorData(pondId: string, data: any) {
    return this.request<{
      success: boolean;
      data: any;
    }>("/api/sensors/data", {
      method: "POST",
      body: JSON.stringify({ pondId, ...data }),
    });
  }

  // Dashboard endpoints
  async getDashboardStats() {
    return this.request<{
      success: boolean;
      data: any;
    }>("/api/dashboard/stats");
  }

  // Alerts endpoints
  async getAlerts() {
    return this.request<{
      success: boolean;
      data: {
        alerts: any[];
      };
    }>("/api/alerts");
  }

  async markAlertAsRead(alertId: string) {
    return this.request<{
      success: boolean;
    }>(`/api/alerts/${alertId}/read`, {
      method: "PUT",
    });
  }

  // Centres endpoints (mock data for now)
  async getCentres() {
    // Since centres don't exist in your current backend, return mock data
    return [
      {
        id: "1",
        name: "Centre Aquacole d'Alger",
        region: "Alger",
        location: "Alger, Algérie",
        description: "Centre principal d'aquaculture marine et continentale",
        email: "contact@centre-alger.dz",
        phone: "+213 21 XXX XXX",
        manager: "Ahmed Benali",
        status: "active",
        capacity: 50,
        currentBasins: 32,
        bases: [
          {
            id: "1",
            name: "Base Nord",
            location: "Alger Nord",
            status: "active",
            basins: 12,
            operators: 8,
            alerts: 2,
          },
          {
            id: "2",
            name: "Base Sud",
            location: "Alger Sud",
            status: "active",
            basins: 15,
            operators: 10,
            alerts: 1,
          },
          {
            id: "3",
            name: "Base Est",
            location: "Alger Est",
            status: "maintenance",
            basins: 5,
            operators: 3,
            alerts: 0,
          },
        ],
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-12-10T14:30:00Z",
      },
      {
        id: "2",
        name: "Centre Aquacole d'Oran",
        region: "Oran",
        location: "Oran, Algérie",
        description: "Centre spécialisé en aquaculture marine",
        email: "contact@centre-oran.dz",
        phone: "+213 41 XXX XXX",
        manager: "Fatima Zahra",
        status: "active",
        capacity: 75,
        currentBasins: 48,
        bases: [
          {
            id: "4",
            name: "Base Ouest",
            location: "Oran Ouest",
            status: "active",
            basins: 18,
            operators: 12,
            alerts: 3,
          },
          {
            id: "5",
            name: "Base Est",
            location: "Oran Est",
            status: "active",
            basins: 20,
            operators: 15,
            alerts: 1,
          },
          {
            id: "6",
            name: "Base Centre",
            location: "Oran Centre",
            status: "active",
            basins: 10,
            operators: 8,
            alerts: 0,
          },
        ],
        createdAt: "2024-02-20T14:30:00Z",
        updatedAt: "2024-12-08T09:15:00Z",
      },
      {
        id: "3",
        name: "Centre Aquacole de Constantine",
        region: "Constantine",
        location: "Constantine, Algérie",
        description: "Centre d'aquaculture continentale",
        email: "contact@centre-constantine.dz",
        phone: "+213 31 XXX XXX",
        manager: "Karim Boukhelifa",
        status: "construction",
        capacity: 40,
        currentBasins: 0,
        bases: [],
        createdAt: "2024-06-01T08:00:00Z",
        updatedAt: "2024-11-25T16:45:00Z",
      },
    ];
  }

  async getCentre(id: string) {
    const centres = await this.getCentres();
    const centre = centres.find((c) => c.id === id);
    if (!centre) {
      throw new Error("Centre not found");
    }
    return centre;
  }

  async updateCentre(id: string, data: any) {
    // Mock update operation
    return {
      success: true,
      message: "Centre updated successfully",
      data: { ...data, id, updatedAt: new Date().toISOString() },
    };
  }

  async deleteCentre(id: string) {
    // Mock delete operation
    return {
      success: true,
      message: "Centre deleted successfully",
    };
  }

  // Base operations
  async addBase(centreId: string, baseData: any) {
    // Mock add base operation
    return {
      success: true,
      message: "Base added successfully",
      data: {
        id: Date.now().toString(),
        ...baseData,
        centreId,
        createdAt: new Date().toISOString(),
      },
    };
  }

  async updateBase(centreId: string, baseId: string, data: any) {
    // Mock update base operation
    return {
      success: true,
      message: "Base updated successfully",
      data: {
        ...data,
        id: baseId,
        centreId,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  async deleteBase(centreId: string, baseId: string) {
    // Mock delete base operation
    return {
      success: true,
      message: "Base deleted successfully",
    };
  }

  // Centre statistics
  async getCentreStats(centreId: string) {
    // Mock statistics
    return {
      success: true,
      data: {
        totalBasins: Math.floor(Math.random() * 50) + 10,
        activeBasins: Math.floor(Math.random() * 40) + 8,
        totalAlerts: Math.floor(Math.random() * 10),
        criticalAlerts: Math.floor(Math.random() * 3),
        totalOperators: Math.floor(Math.random() * 25) + 5,
        activeOperators: Math.floor(Math.random() * 20) + 4,
        waterQuality: {
          excellent: Math.floor(Math.random() * 30) + 10,
          good: Math.floor(Math.random() * 15) + 5,
          fair: Math.floor(Math.random() * 8) + 2,
          poor: Math.floor(Math.random() * 3),
        },
        production: {
          monthly: Math.floor(Math.random() * 1000) + 500,
          yearly: Math.floor(Math.random() * 10000) + 5000,
          target: Math.floor(Math.random() * 12000) + 8000,
        },
      },
    };
  }

  // Centre activity logs
  async getCentreActivity(centreId: string) {
    // Mock activity data
    const activities = [
      {
        id: "1",
        type: "measurement",
        message: "Nouvelle mesure ajoutée",
        details: "Base Nord - Bassin A12",
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        severity: "info",
      },
      {
        id: "2",
        type: "alert_resolved",
        message: "Alerte résolue",
        details: "Base Sud - Température normalisée",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        severity: "success",
      },
      {
        id: "3",
        type: "maintenance",
        message: "Maintenance programmée",
        details: "Base Est - Nettoyage des filtres",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        severity: "warning",
      },
      {
        id: "4",
        type: "user_action",
        message: "Nouveau utilisateur ajouté",
        details: "Opérateur - Base Nord",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        severity: "info",
      },
      {
        id: "5",
        type: "alert_created",
        message: "Nouvelle alerte",
        details: "Base Ouest - pH élevé",
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        severity: "error",
      },
    ];

    return {
      success: true,
      data: activities,
    };
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Types
export interface Basin {
  id: string;
  name: string;
  type: string;
  volume?: number;
  depth?: number;
  temperature?: number;
  ph?: number;
  oxygen?: number;
  salinity?: number;
  farm: {
    id: string;
    name: string;
    location: string;
  };
  sensorData?: {
    temperature: number;
    ph: number;
    oxygen: number;
    salinity: number;
    timestamp: string;
  }[];
  alerts?: {
    id: string;
    type: string;
    severity: string;
    message: string;
    createdAt: string;
  }[];
  _count?: {
    alerts: number;
  };
}

export interface SensorData {
  id: string;
  pondId: string;
  temperature: number;
  ph: number;
  oxygen: number;
  salinity: number;
  turbidity?: number;
  ammonia?: number;
  nitrite?: number;
  nitrate?: number;
  timestamp: string;
}

export interface Alert {
  id: string;
  pondId: string;
  farmId: string;
  type: string;
  severity: string;
  parameter?: string;
  value?: number;
  threshold?: number;
  message: string;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
}

export interface Centre {
  id: string;
  name: string;
  region: string;
  location: string;
  description: string;
  email: string;
  phone: string;
  manager: string;
  status: string;
  capacity: number;
  currentBasins: number;
  bases: {
    id: string;
    name: string;
    location: string;
    status: string;
    basins: number;
    operators: number;
    alerts: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default apiClient;
