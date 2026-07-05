import type { PondLiveStatus, TimelineEvent, WaterAlert, WaterRecord } from "./types";

export const INITIAL_RECORDS: WaterRecord[] = [
  {
    id: "WR-001", date: "2026-07-05", time: "08:30", pond: "Pond A",
    temperature: 27.4, ph: 7.2, dissolvedOxygen: 6.8, ammonia: 0.01, nitrite: 0.02, nitrate: 5.2,
    waterHardness: 120, salinity: 0.2, waterDepth: 1.8, turbidity: 12, waterLevel: 92,
    waterColor: "Clear", weather: "Clear", notes: "All parameters within optimal range.", recordedBy: "Ayo", status: "Healthy",
  },
  {
    id: "WR-002", date: "2026-07-05", time: "09:15", pond: "Pond B",
    temperature: 28.1, ph: 6.8, dissolvedOxygen: 5.2, ammonia: 0.015, nitrite: 0.04, nitrate: 6.1,
    waterHardness: 115, salinity: 0.2, waterDepth: 1.7, turbidity: 18, waterLevel: 88,
    waterColor: "Slightly cloudy", weather: "Cloudy", notes: "Dissolved oxygen slightly low after rain.", recordedBy: "Ngozi", status: "Observation",
  },
  {
    id: "WR-003", date: "2026-07-05", time: "07:45", pond: "Pond C",
    temperature: 27.8, ph: 7.0, dissolvedOxygen: 6.5, ammonia: 0.008, nitrite: 0.01, nitrate: 4.8,
    waterHardness: 118, salinity: 0.2, waterDepth: 1.9, turbidity: 10, waterLevel: 94,
    waterColor: "Clear", weather: "Clear", notes: "Stable conditions.", recordedBy: "Tunde", status: "Healthy",
  },
  {
    id: "WR-004", date: "2026-07-04", time: "16:20", pond: "Pond D",
    temperature: 29.2, ph: 6.4, dissolvedOxygen: 4.1, ammonia: 0.06, nitrite: 0.12, nitrate: 8.4,
    waterHardness: 110, salinity: 0.3, waterDepth: 1.6, turbidity: 35, waterLevel: 78,
    waterColor: "Greenish", weather: "Hot", notes: "Algae bloom suspected. Partial water exchange recommended.", recordedBy: "Ayo", status: "Critical",
  },
  {
    id: "WR-005", date: "2026-07-04", time: "10:00", pond: "Pond E",
    temperature: 27.1, ph: 7.1, dissolvedOxygen: 6.2, ammonia: 0.012, nitrite: 0.025, nitrate: 5.0,
    waterHardness: 122, salinity: 0.2, waterDepth: 1.85, turbidity: 14, waterLevel: 91,
    waterColor: "Clear", weather: "Overcast", notes: "Treatment batch — parameters acceptable.", recordedBy: "Ngozi", status: "Healthy",
  },
  {
    id: "WR-006", date: "2026-07-03", time: "08:00", pond: "Pond F",
    temperature: 26.9, ph: 7.3, dissolvedOxygen: 7.0, ammonia: 0.005, nitrite: 0.008, nitrate: 4.2,
    waterHardness: 125, salinity: 0.2, waterDepth: 2.0, turbidity: 8, waterLevel: 96,
    waterColor: "Clear", weather: "Clear", notes: "Excellent water quality.", recordedBy: "Tunde", status: "Healthy",
  },
  {
    id: "WR-007", date: "2026-07-03", time: "14:30", pond: "Pond B",
    temperature: 28.5, ph: 6.9, dissolvedOxygen: 5.8, ammonia: 0.018, nitrite: 0.035, nitrate: 5.8,
    waterHardness: 116, salinity: 0.2, waterDepth: 1.7, turbidity: 16, waterLevel: 87,
    waterColor: "Slightly cloudy", weather: "Cloudy", notes: "Afternoon oxygen dip observed.", recordedBy: "Ayo", status: "Observation",
  },
  {
    id: "WR-008", date: "2026-07-02", time: "09:00", pond: "Pond D",
    temperature: 28.8, ph: 6.6, dissolvedOxygen: 4.8, ammonia: 0.04, nitrite: 0.08, nitrate: 7.2,
    waterHardness: 112, salinity: 0.25, waterDepth: 1.65, turbidity: 28, waterLevel: 82,
    waterColor: "Greenish", weather: "Hot", notes: "Elevated ammonia trending upward.", recordedBy: "Ngozi", status: "Critical",
  },
];

export const POND_LIVE: PondLiveStatus[] = [
  { pond: "Pond A", batch: "BAT-004", species: "Catfish", temperature: 27.4, ph: 7.2, dissolvedOxygen: 6.8, ammonia: 0.01, nitrite: 0.02, waterDepth: 1.8, turbidity: 12, waterColor: "Clear", healthScore: 96, lastTested: "2026-07-05 08:30", status: "Healthy", population: 3200, avgWeight: 0.45, waterSource: "Borehole", lastWaterChange: "2026-06-28", waterVolume: 540 },
  { pond: "Pond B", batch: "BAT-001", species: "Catfish", temperature: 28.1, ph: 6.8, dissolvedOxygen: 5.2, ammonia: 0.015, nitrite: 0.04, waterDepth: 1.7, turbidity: 18, waterColor: "Slightly cloudy", healthScore: 78, lastTested: "2026-07-05 09:15", status: "Observation", population: 2800, avgWeight: 0.52, waterSource: "River intake", lastWaterChange: "2026-07-01", waterVolume: 480 },
  { pond: "Pond C", batch: "BAT-003", species: "Tilapia", temperature: 27.8, ph: 7.0, dissolvedOxygen: 6.5, ammonia: 0.008, nitrite: 0.01, waterDepth: 1.9, turbidity: 10, waterColor: "Clear", healthScore: 94, lastTested: "2026-07-05 07:45", status: "Healthy", population: 3500, avgWeight: 0.38, waterSource: "Borehole", lastWaterChange: "2026-06-25", waterVolume: 620 },
  { pond: "Pond D", batch: "BAT-002", species: "Tilapia", temperature: 29.2, ph: 6.4, dissolvedOxygen: 4.1, ammonia: 0.06, nitrite: 0.12, waterDepth: 1.6, turbidity: 35, waterColor: "Greenish", healthScore: 52, lastTested: "2026-07-04 16:20", status: "Critical", population: 2900, avgWeight: 0.41, waterSource: "Rain-fed", lastWaterChange: "2026-07-03", waterVolume: 450 },
  { pond: "Pond E", batch: "BAT-005", species: "Catfish", temperature: 27.1, ph: 7.1, dissolvedOxygen: 6.2, ammonia: 0.012, nitrite: 0.025, waterDepth: 1.85, turbidity: 14, waterColor: "Clear", healthScore: 91, lastTested: "2026-07-04 10:00", status: "Healthy", population: 2600, avgWeight: 0.48, waterSource: "Borehole", lastWaterChange: "2026-06-30", waterVolume: 510 },
  { pond: "Pond F", batch: "BAT-007", species: "Tilapia", temperature: 26.9, ph: 7.3, dissolvedOxygen: 7.0, ammonia: 0.005, nitrite: 0.008, waterDepth: 2.0, turbidity: 8, waterColor: "Clear", healthScore: 98, lastTested: "2026-07-03 08:00", status: "Healthy", population: 3800, avgWeight: 0.35, waterSource: "Borehole", lastWaterChange: "2026-06-20", waterVolume: 680 },
];

export const ALERTS: WaterAlert[] = [
  { id: "AL-1", severity: "Critical", title: "High Ammonia", pond: "Pond D", action: "Perform 30% water exchange and reduce feeding by 20%.", timestamp: "2026-07-05 07:00" },
  { id: "AL-2", severity: "Critical", title: "Low Oxygen", pond: "Pond D", action: "Activate aerators immediately. Monitor every 2 hours.", timestamp: "2026-07-05 06:45" },
  { id: "AL-3", severity: "Warning", title: "Low pH", pond: "Pond B", action: "Test alkalinity. Consider lime application if pH drops below 6.5.", timestamp: "2026-07-05 09:20" },
  { id: "AL-4", severity: "Warning", title: "Poor Water Clarity", pond: "Pond D", action: "Inspect for algae bloom. Increase aeration and partial exchange.", timestamp: "2026-07-04 16:30" },
  { id: "AL-5", severity: "Warning", title: "Water Level Drop", pond: "Pond D", action: "Check inlet valves. Top up from borehole within 12 hours.", timestamp: "2026-07-04 14:00" },
];

export const TIMELINE: TimelineEvent[] = [
  { id: "TL-1", type: "test", title: "Water Test Recorded", pond: "Pond A", timestamp: "2026-07-05 08:30", detail: "All parameters healthy." },
  { id: "TL-2", type: "test", title: "Water Test Recorded", pond: "Pond B", timestamp: "2026-07-05 09:15", detail: "Low oxygen flagged." },
  { id: "TL-3", type: "aerator", title: "Aerator Activated", pond: "Pond D", timestamp: "2026-07-04 17:00", detail: "Manual activation due to low D.O." },
  { id: "TL-4", type: "change", title: "Water Changed", pond: "Pond D", timestamp: "2026-07-03 11:00", detail: "25% partial exchange completed." },
  { id: "TL-5", type: "treatment", title: "Treatment Applied", pond: "Pond E", timestamp: "2026-07-02 14:00", detail: "Probiotic dose — 500g." },
  { id: "TL-6", type: "rain", title: "Heavy Rain", pond: "All ponds", timestamp: "2026-07-01 18:30", detail: "45mm rainfall recorded." },
  { id: "TL-7", type: "alert", title: "Water Alert", pond: "Pond D", timestamp: "2026-07-04 16:25", detail: "Critical status triggered." },
  { id: "TL-8", type: "note", title: "Notes", pond: "Pond B", timestamp: "2026-07-03 14:30", detail: "Schedule afternoon re-test." },
];

export const AI_INSIGHTS = [
  "Pond B has experienced a gradual pH decline over the last week.",
  "Ammonia levels are increasing after heavy feeding in Pond D.",
  "Dissolved oxygen drops every afternoon in Pond B — consider timed aeration.",
  "Recommend increasing aeration in Pond C during peak heat hours.",
  "Historical data suggests water replacement is due for Pond D within 24 hours.",
];

export const KPI_SPARKLINES = {
  temperature: [26.8, 27.1, 27.4, 27.8, 28.1, 27.6, 27.4],
  ph: [7.3, 7.2, 7.1, 7.0, 6.9, 7.0, 7.1],
  oxygen: [6.9, 6.8, 6.5, 6.2, 5.8, 6.0, 6.4],
  ammonia: [0.008, 0.01, 0.012, 0.015, 0.018, 0.02, 0.016],
  nitrite: [0.01, 0.015, 0.02, 0.025, 0.03, 0.035, 0.028],
};

export const CHART_DATA: Record<string, number[]> = {
  "Temperature-Daily": [27.2, 27.5, 27.8, 28.0, 27.6, 27.4, 27.8],
  "Temperature-Weekly": [26.5, 26.8, 27.1, 27.4, 27.6, 27.8, 27.5],
  "Temperature-Monthly": [25.8, 26.2, 26.8, 27.2, 27.6, 28.0, 28.2],
  "pH-Daily": [7.1, 7.0, 6.9, 7.0, 6.8, 7.1, 7.0],
  "pH-Weekly": [7.3, 7.2, 7.1, 7.0, 6.9, 6.8, 7.0],
  "pH-Monthly": [7.4, 7.3, 7.2, 7.1, 7.0, 6.9, 6.8],
  "Oxygen-Daily": [6.8, 6.5, 6.2, 5.8, 6.0, 6.4, 6.5],
  "Oxygen-Weekly": [7.0, 6.8, 6.5, 6.2, 6.0, 5.8, 6.2],
  "Oxygen-Monthly": [7.2, 7.0, 6.8, 6.5, 6.2, 6.0, 5.8],
  "Ammonia-Daily": [0.01, 0.012, 0.015, 0.018, 0.02, 0.016, 0.014],
  "Ammonia-Weekly": [0.008, 0.01, 0.012, 0.015, 0.018, 0.022, 0.02],
  "Ammonia-Monthly": [0.005, 0.008, 0.01, 0.012, 0.015, 0.018, 0.02],
  "Nitrite-Daily": [0.02, 0.025, 0.03, 0.035, 0.03, 0.028, 0.025],
  "Nitrite-Weekly": [0.01, 0.015, 0.02, 0.025, 0.03, 0.035, 0.03],
  "Nitrite-Monthly": [0.008, 0.01, 0.012, 0.015, 0.02, 0.025, 0.03],
  "Water Level-Daily": [92, 91, 90, 88, 87, 89, 90],
  "Water Level-Weekly": [94, 93, 92, 90, 88, 87, 89],
  "Water Level-Monthly": [96, 95, 94, 92, 90, 88, 87],
  "Turbidity-Daily": [12, 14, 16, 18, 20, 16, 14],
  "Turbidity-Weekly": [10, 12, 14, 16, 18, 22, 18],
  "Turbidity-Monthly": [8, 10, 12, 15, 18, 22, 25],
};

export const EMPTY_FORM = {
  pond: "Pond A" as const,
  temperature: "",
  ph: "",
  dissolvedOxygen: "",
  ammonia: "",
  nitrite: "",
  nitrate: "",
  waterHardness: "",
  salinity: "",
  waterDepth: "",
  turbidity: "",
  waterColor: "Clear" as const,
  weather: "Clear" as const,
  testTime: "08:00",
  notes: "",
};
