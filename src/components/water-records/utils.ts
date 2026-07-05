import type { WaterRecord, WaterStatus } from "./types";

export function deriveStatus(
  temperature: number,
  ph: number,
  dissolvedOxygen: number,
  ammonia: number,
  nitrite: number,
): WaterStatus {
  if (dissolvedOxygen < 4.5 || ph < 6.5 || ph > 8.5 || temperature > 32 || ammonia > 0.05 || nitrite > 0.1) {
    return "Critical";
  }
  if (dissolvedOxygen < 5.5 || ph < 6.8 || ph > 8.0 || temperature > 30 || ammonia > 0.02 || nitrite > 0.05) {
    return "Observation";
  }
  return "Healthy";
}

export function computeHealthScore(record: Pick<WaterRecord, "temperature" | "ph" | "dissolvedOxygen" | "ammonia" | "nitrite">): number {
  let score = 100;
  if (record.dissolvedOxygen < 5) score -= 15;
  else if (record.dissolvedOxygen < 6) score -= 8;
  if (record.ph < 6.8 || record.ph > 8) score -= 12;
  else if (record.ph < 7 || record.ph > 7.8) score -= 5;
  if (record.ammonia > 0.05) score -= 20;
  else if (record.ammonia > 0.02) score -= 10;
  if (record.nitrite > 0.1) score -= 15;
  else if (record.nitrite > 0.05) score -= 8;
  if (record.temperature > 30) score -= 10;
  return Math.max(0, Math.min(100, score));
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
}

export function formatDateTime(date: string, time: string): string {
  return `${formatDate(date)} · ${time}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowTime(): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

export function sparklinePath(points: number[], width = 72, height = 28): string {
  if (points.length < 2) return "";
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  return points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
}

export function areaChartPath(points: number[], width: number, height: number): { line: string; area: string } {
  if (points.length < 2) return { line: "", area: "" };
  const min = Math.min(...points) * 0.95;
  const max = Math.max(...points) * 1.05;
  const range = max - min || 1;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * (height - 8) - 4;
    return { x, y };
  });
  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const area = `M${coords[0].x},${height} L${coords.map((c) => `${c.x},${c.y}`).join(" L")} L${coords[coords.length - 1].x},${height} Z`;
  return { line, area };
}
