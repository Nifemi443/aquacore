export type WaterStatus = "Healthy" | "Observation" | "Critical";
export type ChartPeriod = "Daily" | "Weekly" | "Monthly" | "Custom";
export type ChartMetric =
  | "Temperature"
  | "pH"
  | "Oxygen"
  | "Ammonia"
  | "Nitrite"
  | "Water Level"
  | "Turbidity";

export interface WaterRecord {
  id: string;
  date: string;
  time: string;
  pond: string;
  temperature: number;
  ph: number;
  dissolvedOxygen: number;
  ammonia: number;
  nitrite: number;
  nitrate: number;
  waterHardness: number;
  salinity: number;
  waterDepth: number;
  turbidity: number;
  waterLevel: number;
  waterColor: string;
  weather: string;
  notes: string;
  recordedBy: string;
  status: WaterStatus;
}

export interface PondLiveStatus {
  pond: string;
  batch: string;
  species: string;
  temperature: number;
  ph: number;
  dissolvedOxygen: number;
  ammonia: number;
  nitrite: number;
  waterDepth: number;
  turbidity: number;
  waterColor: string;
  healthScore: number;
  lastTested: string;
  status: WaterStatus;
  population: number;
  avgWeight: number;
  waterSource: string;
  lastWaterChange: string;
  waterVolume: number;
}

export interface WaterAlert {
  id: string;
  severity: "Critical" | "Warning";
  title: string;
  pond: string;
  action: string;
  timestamp: string;
}

export interface TimelineEvent {
  id: string;
  type: "test" | "change" | "treatment" | "aerator" | "rain" | "alert" | "note";
  title: string;
  pond: string;
  timestamp: string;
  detail?: string;
}

export interface RecordFormState {
  pond: string;
  temperature: string;
  ph: string;
  dissolvedOxygen: string;
  ammonia: string;
  nitrite: string;
  nitrate: string;
  waterHardness: string;
  salinity: string;
  waterDepth: string;
  turbidity: string;
  waterColor: string;
  weather: string;
  testTime: string;
  notes: string;
}

export const PONDS = ["Pond A", "Pond B", "Pond C", "Pond D", "Pond E", "Pond F"] as const;
export const WATER_COLORS = ["Clear", "Slightly cloudy", "Cloudy", "Greenish", "Brownish"] as const;
export const WEATHER_OPTIONS = ["Clear", "Cloudy", "Rainy", "Overcast", "Hot"] as const;
export const TECHNICIANS = ["Ayo", "Ngozi", "Tunde"] as const;

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Ponds", href: "/ponds", icon: "pond" },
  { label: "Fish Batches", href: "/batches", icon: "batch" },
  { label: "Today's Feedings", href: "/feedings", icon: "feed" },
  { label: "Feed Inventory", href: "/inventory", icon: "inventory" },
  { label: "Harvest", href: "/harvest", icon: "harvest" },
  { label: "Reports", href: "/reports", icon: "reports" },
  { label: "Settings", href: "/settings", icon: "settings" },
] as const;

export type NavIconType = (typeof NAV_ITEMS)[number]["icon"] | "water";
