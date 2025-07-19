// API Configuration - Dummy frontend-only (no backend calls)
const API_BASE_URL = "";

// API Client class - Frontend-only with dummy data
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Dummy authentication endpoints (frontend-only)
  async login(email: string, password: string) {
    // This is handled by the auth context now - just return success
    return {
      success: true,
      data: {
        user: null, // Will be set by auth context
        token: `dummy_token_${Date.now()}`,
      },
    };
  }

  async logout() {
    // This is handled by the auth context now
    return { success: true };
  }

  async getMe() {
    // This is handled by the auth context now
    return {
      success: true,
      data: {
        user: null,
      },
    };
  }

  // Dummy ponds/basins data (frontend-only)
  async getPonds() {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      data: {
        ponds: [
          {
            id: "basin-1",
            name: "Bassin A1",
            type: "freshwater",
            volume: 1000,
            depth: 2.5,
            temperature: 24.5,
            ph: 7.2,
            oxygen: 8.5,
            salinity: 0.1,
            ammonia: 0.5,
            nitrite: 0.1,
            nitrate: 5.0,
            waterLevel: 1.5,
            farm: {
              id: "farm1",
              name: "Ferme Aquacole Nord",
              location: "Alger",
            },
            sensorData: [
              {
                temperature: 24.5,
                ph: 7.2,
                oxygen: 8.5,
                salinity: 0.1,
                ammonia: 0.5,
                nitrite: 0.1,
                nitrate: 5.0,
                waterLevel: 1.5,
                timestamp: new Date().toISOString(),
              },
            ],
            alerts: [
              {
                id: "alert1",
                type: "temperature",
                severity: "warning",
                message: "Température légèrement élevée",
                createdAt: new Date().toISOString(),
              },
            ],
            _count: { alerts: 1 },
          },
          {
            id: "basin-2",
            name: "Bassin B2",
            type: "saltwater",
            volume: 1500,
            depth: 3.0,
            temperature: 22.8,
            ph: 8.1,
            oxygen: 7.8,
            salinity: 35.0,
            ammonia: 0.3,
            nitrite: 0.05,
            nitrate: 3.0,
            waterLevel: 2.0,
            farm: {
              id: "farm2",
              name: "Ferme Marine Sud",
              location: "Oran",
            },
            sensorData: [
              {
                temperature: 22.8,
                ph: 8.1,
                oxygen: 7.8,
                salinity: 35.0,
                ammonia: 0.3,
                nitrite: 0.05,
                nitrate: 3.0,
                waterLevel: 2.0,
                timestamp: new Date().toISOString(),
              },
            ],
            alerts: [],
            _count: { alerts: 0 },
          },
          {
            id: "basin-3",
            name: "Bassin C3",
            type: "brackish",
            volume: 800,
            depth: 2.0,
            temperature: 26.2,
            ph: 7.8,
            oxygen: 6.9,
            salinity: 15.5,
            ammonia: 0.7,
            nitrite: 0.2,
            nitrate: 8.0,
            waterLevel: 1.8,
            farm: {
              id: "farm3",
              name: "Ferme Mixte Est",
              location: "Constantine",
            },
            sensorData: [
              {
                temperature: 26.2,
                ph: 7.8,
                oxygen: 6.9,
                salinity: 15.5,
                ammonia: 0.7,
                nitrite: 0.2,
                nitrate: 8.0,
                waterLevel: 1.8,
                timestamp: new Date().toISOString(),
              },
            ],
            alerts: [
              {
                id: "alert3",
                type: "oxygen",
                severity: "warning",
                message: "Niveau d'oxygène à surveiller",
                createdAt: new Date().toISOString(),
              },
              {
                id: "alert4",
                type: "ammonia",
                severity: "critical",
                message: "Taux d'ammoniaque élevé",
                createdAt: new Date().toISOString(),
              },
            ],
            _count: { alerts: 2 },
          },
          {
            id: "basin-4",
            name: "Bassin D4",
            type: "freshwater",
            volume: 1200,
            depth: 2.8,
            temperature: 23.1,
            ph: 6.9,
            oxygen: 9.2,
            salinity: 0.2,
            ammonia: 0.4,
            nitrite: 0.08,
            nitrate: 4.5,
            waterLevel: 2.1,
            farm: {
              id: "farm1",
              name: "Ferme Aquacole Nord",
              location: "Alger",
            },
            sensorData: [
              {
                temperature: 23.1,
                ph: 6.9,
                oxygen: 9.2,
                salinity: 0.2,
                ammonia: 0.4,
                nitrite: 0.08,
                nitrate: 4.5,
                waterLevel: 2.1,
                timestamp: new Date().toISOString(),
              },
            ],
            alerts: [],
            _count: { alerts: 0 },
          },
          {
            id: "basin-5",
            name: "Bassin E5",
            type: "saltwater",
            volume: 2000,
            depth: 3.5,
            temperature: 21.5,
            ph: 8.3,
            oxygen: 7.1,
            salinity: 32.8,
            ammonia: 0.2,
            nitrite: 0.03,
            nitrate: 2.8,
            waterLevel: 2.9,
            farm: {
              id: "farm2",
              name: "Ferme Marine Sud",
              location: "Oran",
            },
            sensorData: [
              {
                temperature: 21.5,
                ph: 8.3,
                oxygen: 7.1,
                salinity: 32.8,
                ammonia: 0.2,
                nitrite: 0.03,
                nitrate: 2.8,
                waterLevel: 2.9,
                timestamp: new Date().toISOString(),
              },
            ],
            alerts: [
              {
                id: "alert5",
                type: "ph",
                severity: "warning",
                message: "pH légèrement élevé",
                createdAt: new Date().toISOString(),
              },
            ],
            _count: { alerts: 1 },
          },
        ],
      },
    };
  }

  // Alias for getPonds - used in frontend as getBasins
  async getBasins() {
    return this.getPonds();
  }

  async getPond(id: string) {
    const ponds = await this.getPonds();
    const pond = ponds.data.ponds.find((p) => p.id === id);

    if (!pond) {
      // Return a default basin for any missing ID to make it fully static
      return {
        success: true,
        data: {
          pond: {
            id: id,
            name: `Bassin ${id.replace("basin-", "").toUpperCase()}`,
            type: "freshwater",
            volume: 1000,
            depth: 2.5,
            temperature: 24.0,
            ph: 7.0,
            oxygen: 8.0,
            salinity: 0.1,
            ammonia: 0.5,
            nitrite: 0.1,
            nitrate: 5.0,
            waterLevel: 1.5,
            farm: {
              id: "farm1",
              name: "Ferme Aquacole",
              location: "Alger",
            },
            sensorData: [
              {
                temperature: 24.0,
                ph: 7.0,
                oxygen: 8.0,
                salinity: 0.1,
                ammonia: 0.5,
                nitrite: 0.1,
                nitrate: 5.0,
                waterLevel: 1.5,
                timestamp: new Date().toISOString(),
              },
            ],
            alerts: [],
            _count: { alerts: 0 },
          },
        },
      };
    }

    return {
      success: true,
      data: { pond },
    };
  }

  // Dummy sensor data endpoints
  async addSensorData(pondId: string, data: any) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      success: true,
      data: {
        id: Date.now().toString(),
        pondId,
        ...data,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Dummy dashboard endpoints
  async getDashboardStats() {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 400));

    return {
      success: true,
      data: {
        totalPonds: 12,
        activePonds: 10,
        totalAlerts: 3,
        criticalAlerts: 1,
        averageTemperature: 23.5,
        averagePh: 7.8,
        averageOxygen: 8.2,
      },
    };
  }

  // Dummy alerts endpoints
  async getAlerts() {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      success: true,
      data: {
        alerts: [
          {
            id: "alert1",
            pondId: "1",
            farmId: "farm1",
            type: "temperature",
            severity: "warning",
            parameter: "temperature",
            value: 26.5,
            threshold: 25.0,
            message: "Température élevée détectée",
            isRead: false,
            isResolved: false,
            createdAt: new Date(Date.now() - 60000).toISOString(),
          },
          {
            id: "alert2",
            pondId: "2",
            farmId: "farm2",
            type: "oxygen",
            severity: "critical",
            parameter: "oxygen",
            value: 5.2,
            threshold: 6.0,
            message: "Niveau d'oxygène critique",
            isRead: false,
            isResolved: false,
            createdAt: new Date(Date.now() - 120000).toISOString(),
          },
        ],
      },
    };
  }

  async markAlertAsRead(alertId: string) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      success: true,
    };
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
  turbidity?: number; // MES (Matières En Suspension) - NTU
  ammonia?: number;
  nitrite?: number;
  nitrate?: number;
  waterLevel?: number;
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
    turbidity?: number; // MES (Matières En Suspension) - NTU
    ammonia: number;
    nitrite: number;
    nitrate: number;
    waterLevel: number;
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
  turbidity?: number; // MES (Matières En Suspension) - NTU
  ammonia: number;
  nitrite: number;
  nitrate: number;
  waterLevel: number;
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
