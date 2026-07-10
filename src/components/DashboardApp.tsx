"use client";

import { useMemo, useState } from "react";
import { AppMobileNav } from "./app/AppMobileNav";
import { AppSidebar } from "./app/AppSidebar";

interface KpiCard {
  label: string;
  value: string;
  detail: string;
  icon: React.JSX.Element;
  trend: string;
  trendTone: "up" | "down" | "flat";
  spark: "up" | "down" | "flat";
  comparison: string;
}

interface FeedingTask {
  id: number;
  pond: string;
  time: string;
  feed: string;
  feedType: string;
  staff: string;
  status: "pending" | "completing" | "done";
  completedAt?: string;
}

interface PondRow {
  pond: string;
  species: string;
  fish: number;
  feed: string;
  status: "Fed" | "Due 12PM" | "Missed";
  day: number;
  health: "Optimal" | "Monitor" | "Alert";
  trend: "up" | "flat" | "down";
}

interface FeedDay {
  day: number;
  state: "complete" | "partial" | "missed" | "future";
  detail: string;
}

interface ActivityItem {
  tone: "success" | "warning" | "neutral";
  text: string;
  time: string;
}

const kpiCards: KpiCard[] = [
  { label: "Total Fish", value: "400", detail: "Across 4 ponds", icon: <PondIcon />, trend: "+2.4%", trendTone: "up", spark: "up", comparison: "vs 391 last week" },
  { label: "Feedings Due", value: "4", detail: "Today's schedule", icon: <ClockIcon />, trend: "0%", trendTone: "flat", spark: "flat", comparison: "same as last week" },
  { label: "Feed Inventory", value: "8 Bags", detail: "11 days remaining", icon: <PackageIcon />, trend: "-18%", trendTone: "down", spark: "down", comparison: "vs 9.8 bags last week" },
  { label: "Harvest Countdown", value: "89 Days", detail: "Estimated", icon: <CalendarIcon />, trend: "-7d", trendTone: "up", spark: "up", comparison: "ahead of schedule" },
  { label: "Active Batches", value: "4", detail: "2 nearing harvest", icon: <LayersIcon />, trend: "+1", trendTone: "up", spark: "up", comparison: "vs 3 last week" },
  { label: "Survival Rate", value: "96.4%", detail: "Farm average", icon: <ChartIcon />, trend: "+0.3%", trendTone: "up", spark: "up", comparison: "vs 96.1% last week" },
  { label: "Current Biomass", value: "7,391 kg", detail: "All active ponds", icon: <DropletIcon />, trend: "+4.1%", trendTone: "up", spark: "up", comparison: "vs 7,100 kg last week" },
  { label: "Est. Revenue", value: "₦14.8M", detail: "Projected at harvest", icon: <SparkIcon />, trend: "+₦430k", trendTone: "up", spark: "up", comparison: "vs last projection" },
];

const SPARK_POINTS: Record<KpiCard["spark"], string> = {
  up: "0,18 10,15 20,16 30,11 40,9 50,6 60,2",
  down: "0,4 10,6 20,5 30,9 40,12 50,14 60,18",
  flat: "0,10 10,9 20,11 30,10 40,10 50,9 60,10",
};

interface AlertItem {
  level: "Critical" | "Warning" | "Info" | "Success";
  text: string;
}

const alertItems: AlertItem[] = [
  { level: "Warning", text: "Low feed stock — 8 bags left, reorder before Friday" },
  { level: "Critical", text: "Pond C missed morning feeding — 5h overdue" },
  { level: "Info", text: "Vendor delivery arriving in 3 days — prepare nursery pond" },
  { level: "Success", text: "Water quality improved 18% this week across all ponds" },
];

interface BatchOverviewRow {
  batch: string;
  pond: string;
  species: string;
  population: string;
  weight: string;
  survival: string;
  health: "Healthy" | "Observation" | "Treatment";
  harvest: string;
  status: string;
}

const batchOverviewRows: BatchOverviewRow[] = [
  { batch: "BAT-003", pond: "Pond D", species: "Tilapia", population: "3,120", weight: "920g", survival: "97.5%", health: "Healthy", harvest: "7 days", status: "Growing" },
  { batch: "BAT-004", pond: "Pond A", species: "Catfish", population: "2,860", weight: "680g", survival: "95.3%", health: "Healthy", harvest: "89 days", status: "Growing" },
  { batch: "BAT-005", pond: "Pond B", species: "Catfish", population: "2,915", weight: "640g", survival: "97.2%", health: "Observation", harvest: "89 days", status: "Growing" },
  { batch: "BAT-006", pond: "Pond E", species: "Catfish", population: "2,540", weight: "510g", survival: "90.7%", health: "Treatment", harvest: "95 days", status: "Growing" },
];

const financialRows: [string, string][] = [
  ["Revenue (YTD)", "₦9.2M"],
  ["Feed Costs", "₦3.1M"],
  ["Medication", "₦210k"],
  ["Electricity", "₦340k"],
  ["Labour", "₦860k"],
  ["Net Profit", "₦4.7M"],
];

const inventoryRows: [string, string, boolean][] = [
  ["Feed Bags (2mm)", "8 bags", true],
  ["Feed Bags (4mm)", "22 bags", false],
  ["Medication", "6 units", false],
  ["Chemicals", "3 units", true],
  ["Equipment", "All operational", false],
];

const smartInsights = [
  "Pond 3 will require feed replenishment tomorrow.",
  "Batch B-104 is growing 14% faster than expected.",
  "Harvest Batch E in 9 days for best market weight.",
  "Water quality has improved by 18% this week.",
  "Inventory predicts feed shortage within 6 days.",
  "Reduce feed allocation for Batch C by 5%.",
] as const;

const fabActions = [
  "New Batch", "New Pond", "Record Feed", "Transfer Batch", "Mortality", "Harvest", "Add Vendor", "Inventory Purchase", "Generate Report",
] as const;

const exportOptions = ["PDF", "Excel", "CSV", "Weekly Report", "Monthly Report", "Profit Report"] as const;

const initialTasks: FeedingTask[] = [
  { id: 1, pond: "Pond A", time: "08:00 AM", feed: "2kg Feed", feedType: "Coppens 2mm", staff: "Ayo", status: "pending" },
  { id: 2, pond: "Pond B", time: "08:15 AM", feed: "2kg Feed", feedType: "Coppens 2mm", staff: "Ngozi", status: "pending" },
  { id: 3, pond: "Pond C", time: "08:30 AM", feed: "2kg Feed", feedType: "Coppens 2mm", staff: "Ayo", status: "pending" },
  { id: 4, pond: "Pond D", time: "08:45 AM", feed: "2kg Feed", feedType: "Skretting 3mm", staff: "Ngozi", status: "pending" },
];

const pondRows: PondRow[] = [
  { pond: "Pond A", species: "Catfish", fish: 100, feed: "2kg", status: "Fed", day: 34, health: "Optimal", trend: "up" },
  { pond: "Pond B", species: "Catfish", fish: 100, feed: "2kg", status: "Due 12PM", day: 34, health: "Monitor", trend: "flat" },
  { pond: "Pond C", species: "Catfish", fish: 100, feed: "2kg", status: "Missed", day: 34, health: "Alert", trend: "down" },
  { pond: "Pond D", species: "Tilapia", fish: 100, feed: "2kg", status: "Fed", day: 34, health: "Optimal", trend: "up" },
];

const feedDays: FeedDay[] = [
  { day: 1, state: "complete", detail: "All 4 feedings completed" },
  { day: 2, state: "complete", detail: "All 4 feedings completed" },
  { day: 3, state: "complete", detail: "All 4 feedings completed" },
  { day: 4, state: "complete", detail: "All 4 feedings completed" },
  { day: 5, state: "partial", detail: "3 of 4 feedings completed" },
  { day: 6, state: "complete", detail: "All 4 feedings completed" },
  { day: 7, state: "complete", detail: "All 4 feedings completed" },
  { day: 8, state: "complete", detail: "All 4 feedings completed" },
  { day: 9, state: "complete", detail: "All 4 feedings completed" },
  { day: 10, state: "complete", detail: "All 4 feedings completed" },
  { day: 11, state: "missed", detail: "No feeding recorded" },
  { day: 12, state: "complete", detail: "All 4 feedings completed" },
  { day: 13, state: "complete", detail: "All 4 feedings completed" },
  { day: 14, state: "complete", detail: "All 4 feedings completed" },
  { day: 15, state: "complete", detail: "All 4 feedings completed" },
  { day: 16, state: "complete", detail: "All 4 feedings completed" },
  { day: 17, state: "complete", detail: "All 4 feedings completed" },
  { day: 18, state: "complete", detail: "All 4 feedings completed" },
  { day: 19, state: "complete", detail: "All 4 feedings completed" },
  { day: 20, state: "complete", detail: "All 4 feedings completed" },
  { day: 21, state: "complete", detail: "All 4 feedings completed" },
  { day: 22, state: "complete", detail: "All 4 feedings completed" },
  { day: 23, state: "complete", detail: "All 4 feedings completed" },
  { day: 24, state: "partial", detail: "2 of 4 feedings completed" },
  { day: 25, state: "complete", detail: "All 4 feedings completed" },
  { day: 26, state: "complete", detail: "All 4 feedings completed" },
  { day: 27, state: "complete", detail: "All 4 feedings completed" },
  { day: 28, state: "future", detail: "Upcoming day" },
];

const aiPrompts = [
  "How many days of feed do I have left?",
  "Which pond missed feeding today?",
  "When are my fingerlings arriving?",
  "Prepare me for tomorrow's delivery.",
  "Summarize today's activities.",
  "Predict my harvest.",
] as const;

const activities: ActivityItem[] = [
  { tone: "success", text: "Pond A fed — 2kg Coppens recorded by Ayo", time: "2m ago" },
  { tone: "success", text: "Feed inventory updated — 8 bags remaining", time: "3m ago" },
  { tone: "neutral", text: "AI recommendation generated for Batch C", time: "9m ago" },
  { tone: "success", text: "Vendor ETA changed — Fresh Aqua now 3 days", time: "16m ago" },
  { tone: "warning", text: "Rain alert received — heavy rainfall at 4 PM", time: "24m ago" },
  { tone: "warning", text: "Mortality recorded — 2 fish in Pond E", time: "48m ago" },
  { tone: "success", text: "Treatment applied — salt bath, Pond E", time: "1h ago" },
  { tone: "success", text: "Batch allocated — BAT-007 to Pond F", time: "1h ago" },
];

function IconShell({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function PondIcon(): React.JSX.Element {
  return (
    <IconShell>
      <circle cx="12" cy="12" r="9" />
      <path d="M7 14c2-2 4-2 6 0s4 2 6 0" />
    </IconShell>
  );
}

function LayersIcon(): React.JSX.Element {
  return (
    <IconShell>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </IconShell>
  );
}

function ClockIcon(): React.JSX.Element {
  return (
    <IconShell>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </IconShell>
  );
}

function PackageIcon(): React.JSX.Element {
  return (
    <IconShell>
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </IconShell>
  );
}

function DropletIcon(): React.JSX.Element {
  return (
    <IconShell>
      <path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z" />
    </IconShell>
  );
}

function CalendarIcon(): React.JSX.Element {
  return (
    <IconShell>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </IconShell>
  );
}

function ChartIcon(): React.JSX.Element {
  return (
    <IconShell>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M7 15l4-4 3 3 5-7" />
    </IconShell>
  );
}

function SparkIcon(): React.JSX.Element {
  return (
    <IconShell>
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
    </IconShell>
  );
}

function CheckIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l5 5L19 7" />
    </svg>
  );
}

function GrowthChart(): React.JSX.Element {
  return (
    <svg width="100%" height="240" viewBox="0 0 720 240" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="dashboardGrowthFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D7A5F" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#0D7A5F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1="48" x2="720" y2="48" stroke="#F2F2F2" />
      <line x1="0" y1="96" x2="720" y2="96" stroke="#F2F2F2" />
      <line x1="0" y1="144" x2="720" y2="144" stroke="#F2F2F2" />
      <line x1="0" y1="192" x2="720" y2="192" stroke="#F2F2F2" />
      <path
        d="M28 212 C96 202 156 184 224 164 C292 144 360 116 438 92 C528 64 612 42 694 30 L694 240 L28 240 Z"
        fill="url(#dashboardGrowthFill)"
      />
      <path
        d="M28 212 C96 202 156 184 224 164 C292 144 360 116 438 92 C528 64 612 42 694 30"
        fill="none"
        stroke="#0D7A5F"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="[stroke-dasharray:900] [stroke-dashoffset:900] [animation:chartDraw_1.1s_ease-out_forwards]"
      />
      <path
        d="M28 220 C142 198 260 156 382 110 C504 68 600 44 694 38"
        fill="none"
        stroke="#D4D4D4"
        strokeWidth="1.5"
        strokeDasharray="7 6"
      />
      <circle cx="694" cy="30" r="9" fill="#0D7A5F" opacity="0.16" />
      <circle cx="694" cy="30" r="4" fill="#0D7A5F" />
      <text x="28" y="232" fill="#A3A3A3" fontSize="10">
        Week 1
      </text>
      <text x="250" y="232" fill="#A3A3A3" fontSize="10">
        Week 4
      </text>
      <text x="476" y="232" fill="#A3A3A3" fontSize="10">
        Week 8
      </text>
      <text x="662" y="232" fill="#0D7A5F" fontSize="10" fontWeight="600">
        Now
      </text>
    </svg>
  );
}

function formatCompletionTime(): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
}

function dayClass(state: FeedDay["state"], selected: boolean): string {
  const selectedRing = selected ? "ring-2 ring-[var(--color-text-primary)] ring-offset-2" : "";

  if (state === "complete") {
    return `bg-[var(--color-accent)] hover:bg-emerald-900 ${selectedRing}`;
  }

  if (state === "partial") {
    return `bg-[var(--color-warning-light)] hover:bg-amber-200 ${selectedRing}`;
  }

  if (state === "missed") {
    return `bg-[var(--color-danger-light)] hover:bg-red-200 ${selectedRing}`;
  }

  return `bg-neutral-100 hover:bg-neutral-200 ${selectedRing}`;
}

function statusClass(status: PondRow["status"]): string {
  if (status === "Fed") {
    return "bg-emerald-100 text-[var(--color-accent)]";
  }

  if (status === "Missed") {
    return "bg-[var(--color-danger-light)] text-[var(--color-danger)]";
  }

  return "bg-[var(--color-warning-light)] text-[var(--color-warning)]";
}

function healthClass(health: PondRow["health"]): string {
  if (health === "Optimal") {
    return "text-[var(--color-accent)]";
  }

  if (health === "Alert") {
    return "text-[var(--color-danger)]";
  }

  return "text-[var(--color-warning)]";
}

function trendSymbol(trend: PondRow["trend"]): string {
  if (trend === "up") {
    return "↗";
  }

  if (trend === "down") {
    return "↘";
  }

  return "→";
}

function Sparkline({ variant, color }: { variant: KpiCard["spark"]; color?: string }): React.JSX.Element {
  const stroke = color ?? (variant === "down" ? "#B45309" : variant === "flat" ? "#A3A3A3" : "#0D7A5F");

  return (
    <svg width="60" height="20" viewBox="0 0 60 20" aria-hidden="true">
      <polyline points={SPARK_POINTS[variant]} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function trendPill(tone: KpiCard["trendTone"]): string {
  if (tone === "up") {
    return "bg-emerald-100 text-[var(--color-accent)]";
  }

  if (tone === "down") {
    return "bg-[var(--color-warning-light)] text-[var(--color-warning)]";
  }

  return "bg-neutral-100 text-[var(--color-text-secondary)]";
}

function alertStyle(level: AlertItem["level"]): { row: string; dot: string } {
  if (level === "Critical") {
    return { row: "border-red-200 bg-[var(--color-danger-light)]", dot: "bg-[var(--color-danger)]" };
  }

  if (level === "Warning") {
    return { row: "border-amber-200 bg-[var(--color-warning-light)]", dot: "bg-[var(--color-warning)]" };
  }

  if (level === "Success") {
    return { row: "border-[var(--color-accent-border)] bg-[var(--color-accent-light)]", dot: "bg-[var(--color-accent)]" };
  }

  return { row: "border-sky-200 bg-sky-50", dot: "bg-sky-500" };
}

function batchHealthPill(health: BatchOverviewRow["health"]): string {
  if (health === "Healthy") {
    return "bg-emerald-100 text-[var(--color-accent)]";
  }

  if (health === "Observation") {
    return "bg-[var(--color-warning-light)] text-[var(--color-warning)]";
  }

  return "bg-orange-50 text-orange-700";
}

function CircularScore({ score, size = 128 }: { score: number; size?: number }): React.JSX.Element {
  const radius = size * 0.4;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <defs>
        <linearGradient id="healthScoreGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0D7A5F" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#F2F2F2" strokeWidth={size * 0.08} />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="url(#healthScoreGradient)"
        strokeWidth={size * 0.08}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - score / 100)}
        transform={`rotate(-90 ${center} ${center})`}
      />
      <text x={center} y={center - 4} textAnchor="middle" fontSize={size * 0.22} fontWeight="700" fill="#0A0A0A">
        {score}
      </text>
      <text x={center} y={center + size * 0.14} textAnchor="middle" fontSize={size * 0.09} fill="#A3A3A3">
        /100
      </text>
    </svg>
  );
}

export default function DashboardApp(): React.JSX.Element {
  const [tasks, setTasks] = useState<FeedingTask[]>(initialTasks);
  const [selectedPond, setSelectedPond] = useState<string>("Pond A");
  const [selectedDay, setSelectedDay] = useState<number>(24);
  const [selectedPrompt, setSelectedPrompt] = useState<string>(aiPrompts[0]);
  const [fabOpen, setFabOpen] = useState<boolean>(false);

  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const progress = (completedTasks / tasks.length) * 100;
  const selectedFeedDay = useMemo(() => feedDays.find((day) => day.day === selectedDay), [selectedDay]);

  const completeTask = (id: number): void => {
    const target = tasks.find((task) => task.id === id);

    if (!target || target.status !== "pending") {
      return;
    }

    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, status: "completing" } : task)),
    );

    window.setTimeout(() => {
      setTasks((current) =>
        current.map((task) =>
          task.id === id ? { ...task, status: "done", completedAt: formatCompletionTime() } : task,
        ),
      );
    }, 150);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-surface)] pb-24 text-[var(--color-text-primary)] lg:pb-0">
      <AppSidebar activeKey="dashboard" />

      <div className="min-w-0 overflow-x-hidden lg:pl-[256px]">
        <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">
                A
              </div>
              <span className="text-sm font-bold">PondDesk</span>
            </div>
            <div className="hidden min-w-0 shrink-0 items-center gap-2 text-sm text-[var(--color-text-secondary)] xl:flex">
              <span className="font-medium text-[var(--color-text-primary)]">Greenwater Farm</span>
              <span>·</span>
              <span>Lagos, Nigeria</span>
              <span>·</span>
              <span>29°C</span>
            </div>
            <div className="mx-4 hidden max-w-[420px] flex-1 sm:block">
              <input
                type="search"
                placeholder="Search batches, ponds, vendors, inventory, notes…"
                className="h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-danger)]" />
              </button>
              <button
                type="button"
                className="rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
              >
                New record
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <section className="mb-6 rounded-xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Tuesday, July 8</p>
                <h1 className="mt-2 text-[clamp(30px,4vw,48px)] font-bold tracking-[-0.04em]">
                  Good Morning, John
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
                  Greenwater Farm · Lagos, Nigeria · Heavy rain expected at 4 PM. Reduce afternoon feeding and inspect
                  pond overflow before staff leave the field.
                </p>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">
                    🌤️
                  </span>
                  <div>
                    <p className="text-2xl font-bold tracking-[-0.03em]">29°C</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">Humidity 78% · Rain alert active</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => (
              <div
                key={card.label}
                title={`${card.label}: ${card.detail} · ${card.comparison}`}
                className="rounded-xl border border-[var(--color-border)] bg-white p-5 transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                    {card.label}
                  </p>
                  <span className="text-[var(--color-text-muted)]">{card.icon}</span>
                </div>
                <div className="mt-5 flex items-end justify-between gap-2">
                  <p className="text-3xl font-bold tracking-[-0.04em]">{card.value}</p>
                  <Sparkline variant={card.spark} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${trendPill(card.trendTone)}`}>
                    {card.trend}
                  </span>
                  <span className="truncate text-xs text-[var(--color-text-muted)]">{card.comparison}</span>
                </div>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{card.detail}</p>
              </div>
            ))}
          </section>

          <section className="mb-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr_1fr]">
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold tracking-[-0.03em]">Farm Health</h2>
              <div className="mt-4 flex justify-center"><CircularScore score={96} /></div>
              <ul className="mt-4 space-y-1.5 text-sm leading-6 text-[var(--color-text-secondary)]">
                <li>Excellent farm condition.</li>
                <li>No major disease risks.</li>
                <li>Feed efficiency is above average.</li>
                <li>Expected monthly profit has increased.</li>
              </ul>
            </div>

            <div className="rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-[-0.03em]">Smart AI Insights</h2>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">Live</span>
              </div>
              <div className="mt-4 divide-y divide-[var(--color-accent-border)]">
                {smartInsights.map((insight) => (
                  <p key={insight} className="py-2.5 text-sm leading-6 text-[var(--color-text-primary)]">{insight}</p>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-[-0.03em]">Alert Center</h2>
                <span className="rounded-full bg-[var(--color-danger-light)] px-3 py-1 text-xs font-semibold text-[var(--color-danger)]">
                  1 critical
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {alertItems.map((alert) => {
                  const style = alertStyle(alert.level);
                  return (
                    <div key={alert.text} className={`flex items-start gap-3 rounded-lg border p-3 transition-all duration-200 hover:-translate-y-px ${style.row}`}>
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">{alert.level}</p>
                        <p className="mt-0.5 text-sm leading-5">{alert.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="mb-6 grid gap-6 xl:grid-cols-[1fr_1.1fr_0.8fr]">
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Today&apos;s Feedings</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {completedTasks} of {tasks.length} completed
                  </p>
                </div>
                <span className="rounded-full bg-[var(--color-accent-light)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="mb-5 h-1.5 rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-[400ms]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="space-y-3">
                {tasks.map((task) => {
                  const done = task.status === "done";
                  const active = task.status === "done" || task.status === "completing";

                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => completeTask(task.id)}
                      disabled={done}
                      className={`grid min-h-16 w-full grid-cols-[28px_1fr_auto] items-center gap-4 rounded-lg border px-4 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 ${
                        active
                          ? "border-[var(--color-accent-border)] bg-[var(--color-accent-light)]"
                          : "border-[var(--color-border)] bg-white hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 ${
                          active
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white [animation:checkPop_300ms_ease_forwards]"
                            : "border-[var(--color-border-strong)] bg-white text-transparent"
                        }`}
                      >
                        <CheckIcon />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">{task.pond}</span>
                        <span className="mt-1 block text-xs text-[var(--color-text-secondary)]">
                          {task.time} · {task.feed} · {task.feedType}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-[var(--color-text-muted)]">
                          Assigned to {task.staff}
                        </span>
                      </span>
                      <span className="text-right">
                        {done ? (
                          <>
                            <span className="block rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-[var(--color-accent)]">
                              Completed
                            </span>
                            <span className="mt-1 block font-mono text-[11px] text-[var(--color-text-muted)]">
                              {task.completedAt}
                            </span>
                          </>
                        ) : (
                          <span className="font-mono text-xs text-[var(--color-text-muted)]">{task.time}</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-neutral-100 pt-4 text-center">
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Compliance</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-accent)]">94%</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Missed (7d)</p>
                  <p className="mt-1 text-sm font-semibold">2</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Feed Today</p>
                  <p className="mt-1 text-sm font-semibold">8 kg</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Fish Growth</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Batch C · Catfish · Pond B</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-right">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Avg Weight</p>
                    <p className="font-semibold">680g</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Growth Rate</p>
                    <p className="font-semibold text-[var(--color-accent)]">+8%</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Harvest</p>
                    <p className="font-semibold">89d</p>
                  </div>
                </div>
              </div>
              <GrowthChart />
              <div className="mt-4 rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] p-4">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  Batch C is above target and projected for harvest on October 5.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Feed Inventory</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Coppens · 2mm pellet</p>
                </div>
                <span className="rounded-full bg-[var(--color-warning-light)] px-3 py-1 text-xs font-semibold text-[var(--color-warning)]">
                  Low stock
                </span>
              </div>
              <p className="text-4xl font-bold tracking-[-0.05em]">8 Bags</p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">11 days left at current consumption</p>
              <div className="mt-6 h-3 rounded-full bg-neutral-100">
                <div className="h-full w-[64%] rounded-full bg-[var(--color-accent)] [animation:progressFill_700ms_ease-out_forwards]" />
              </div>
              <div className="mt-6 grid gap-3 text-sm">
                <div className="flex justify-between border-b border-neutral-100 pb-3">
                  <span className="text-[var(--color-text-secondary)]">Daily consumption</span>
                  <span className="font-medium">0.72 bags</span>
                </div>
                <div className="flex justify-between border-b border-neutral-100 pb-3">
                  <span className="text-[var(--color-text-secondary)]">Reorder threshold</span>
                  <span className="font-medium">6 bags</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Next purchase</span>
                  <span className="font-medium">Friday</span>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-6 rounded-xl border border-[var(--color-border)] bg-white">
            <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
              <h2 className="text-lg font-bold tracking-[-0.03em]">Pond Operations</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Click a row to focus on full pond details.
              </p>
            </div>

            <div className="hidden overflow-hidden md:block">
              <table className="w-full table-fixed border-collapse">
                <thead className="bg-[var(--color-surface)]">
                  <tr className="text-left text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                    <th className="px-5 py-3">Pond</th>
                    <th className="px-5 py-3">Species</th>
                    <th className="px-5 py-3">Fish</th>
                    <th className="px-5 py-3">Feed</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Day</th>
                    <th className="px-5 py-3">Health</th>
                    <th className="px-5 py-3">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {pondRows.map((row) => (
                    <tr
                      key={row.pond}
                      onClick={() => setSelectedPond(row.pond)}
                      className={`cursor-pointer border-t border-[var(--color-border)] transition-all duration-200 hover:bg-[var(--color-surface)] ${
                        selectedPond === row.pond ? "bg-[var(--color-accent-light)]" : ""
                      }`}
                    >
                      <td className="px-5 py-4 text-sm font-semibold">{row.pond}</td>
                      <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">{row.species}</td>
                      <td className="px-5 py-4 text-sm">{row.fish}</td>
                      <td className="px-5 py-4 text-sm">{row.feed}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(row.status)}`}>
                          {row.status === "Fed" ? "✓ Fed" : row.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm">{row.day}</td>
                      <td className={`px-5 py-4 text-sm font-medium ${healthClass(row.health)}`}>{row.health}</td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2">
                          <Sparkline variant={row.trend} />
                          <span className="text-base">{trendSymbol(row.trend)}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 md:hidden">
              {pondRows.map((row) => (
                <button
                  key={row.pond}
                  type="button"
                  onClick={() => setSelectedPond(row.pond)}
                  className={`min-h-16 rounded-lg border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 ${
                    selectedPond === row.pond
                      ? "border-[var(--color-accent-border)] bg-[var(--color-accent-light)]"
                      : "border-[var(--color-border)] bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{row.pond}</p>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        {row.species} · {row.fish} fish · Day {row.day}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(row.status)}`}>
                      {row.status === "Fed" ? "✓ Fed" : row.status}
                    </span>
                  </div>
                  <div className="mt-4 flex justify-between text-sm">
                    <span>{row.feed} today</span>
                    <span className={healthClass(row.health)}>{row.health}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="mb-6 rounded-xl border border-[var(--color-border)] bg-white">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-border)] p-5 sm:p-6">
              <div>
                <h2 className="text-lg font-bold tracking-[-0.03em]">Fish Batch Overview</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Recent batches across all ponds.</p>
              </div>
              <a
                href="/batches"
                className="text-sm font-medium text-[var(--color-accent)] underline-offset-4 transition-colors duration-150 hover:underline"
              >
                View all batches →
              </a>
            </div>
            <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[860px] border-collapse">
                <thead className="bg-[var(--color-surface)]">
                  <tr className="text-left text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                    <th className="px-5 py-3">Batch</th>
                    <th className="px-5 py-3">Pond</th>
                    <th className="px-5 py-3">Species</th>
                    <th className="px-5 py-3">Population</th>
                    <th className="px-5 py-3">Weight</th>
                    <th className="px-5 py-3">Survival</th>
                    <th className="px-5 py-3">Health</th>
                    <th className="px-5 py-3">Harvest</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {batchOverviewRows.map((row) => (
                    <tr key={row.batch} className="border-t border-[var(--color-border)] transition-colors duration-150 hover:bg-[var(--color-surface)]">
                      <td className="px-5 py-4">
                        <a href="/batches" className="text-sm font-semibold text-[var(--color-accent)] underline-offset-4 hover:underline">
                          {row.batch}
                        </a>
                      </td>
                      <td className="px-5 py-4 text-sm">{row.pond}</td>
                      <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">{row.species}</td>
                      <td className="px-5 py-4 text-sm">{row.population}</td>
                      <td className="px-5 py-4 text-sm">{row.weight}</td>
                      <td className="px-5 py-4 text-sm font-medium">{row.survival}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${batchHealthPill(row.health)}`}>{row.health}</span>
                      </td>
                      <td className="px-5 py-4 text-sm">{row.harvest}</td>
                      <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-6 rounded-xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-[-0.03em]">Monthly Feeding Consistency</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  July feeding compliance across all ponds.
                </p>
              </div>
              <div className="text-sm">
                <p className="font-medium">Selected: July {selectedDay}</p>
                <p className="text-[var(--color-text-secondary)]">{selectedFeedDay?.detail}</p>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {feedDays.map((day) => (
                <button
                  key={day.day}
                  type="button"
                  onClick={() => setSelectedDay(day.day)}
                  className={`flex aspect-square min-h-11 items-center justify-center rounded-md text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 ${dayClass(
                    day.state,
                    selectedDay === day.day,
                  )} ${day.state === "future" ? "text-[var(--color-text-muted)]" : ""} ${
                    day.state === "partial" || day.state === "missed" ? "text-[var(--color-text-primary)]" : ""
                  }`}
                  aria-label={`July ${day.day}: ${day.detail}`}
                >
                  {day.day}
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-5 text-xs text-[var(--color-text-secondary)]">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-[var(--color-accent)]" />
                Green: all completed
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-[var(--color-warning-light)] ring-1 ring-amber-200" />
                Yellow: some missed
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-[var(--color-danger-light)] ring-1 ring-red-200" />
                Red: none recorded
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-neutral-100" />
                Gray: future day
              </span>
            </div>
          </section>

          <section className="mb-6 grid gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold tracking-[-0.03em]">Vendor Deliveries</h2>
              <div className="mt-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">Fresh Aqua Hatchery</p>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">400 Fingerlings · Batch E</p>
                    <p className="mt-0.5 font-mono text-[11px] text-[var(--color-text-muted)]">PO-2024-118</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="rounded-full bg-[var(--color-accent-light)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                      ETA 3 Days
                    </span>
                    <span className="rounded-full bg-[var(--color-warning-light)] px-3 py-1 text-xs font-semibold text-[var(--color-warning)]">
                      High priority
                    </span>
                  </div>
                </div>
                <div className="mt-6 h-2 rounded-full bg-neutral-100">
                  <div className="h-full w-[76%] rounded-full bg-[var(--color-accent)]" />
                </div>
                <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
                  72 hours remaining · prepare nursery pond and confirm oxygen bags by Thursday.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
                  <div className="text-sm">
                    <span className="text-[var(--color-text-secondary)]">Supplier rating </span>
                    <span className="font-semibold">4.8</span>
                    <span className="text-[var(--color-warning)]"> ★★★★★</span>
                  </div>
                  <button
                    type="button"
                    className="rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                  >
                    Contact vendor
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold tracking-[-0.03em]">Weather Intelligence</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-[120px_1fr]">
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
                  <p className="text-3xl" aria-hidden="true">
                    🌧️
                  </p>
                  <p className="mt-2 text-2xl font-bold">29°C</p>
                  <p className="text-xs text-[var(--color-text-muted)]">78% humidity</p>
                </div>
                <div className="rounded-lg border border-[var(--color-warning-light)] bg-amber-50 p-4">
                  <p className="font-semibold text-[var(--color-warning)]">Heavy rainfall expected today.</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                    <li>Reduce afternoon feeding if rain starts before 4 PM.</li>
                    <li>Inspect pond overflow channels before staff leave.</li>
                    <li>Delay water exchange until visibility improves.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-[-0.03em]">Financial Summary</h2>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                  51% margin
                </span>
              </div>
              <div className="mt-5 grid gap-2.5 text-sm">
                {financialRows.map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-neutral-100 pb-2.5 last:border-0 last:pb-0">
                    <span className="text-[var(--color-text-secondary)]">{label}</span>
                    <span className={`font-medium ${label === "Net Profit" ? "text-[var(--color-accent)]" : ""}`}>{value}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-lg bg-[var(--color-accent-light)] p-3 text-xs leading-5 text-[var(--color-text-primary)]">
                ROI 38% · Projected income next quarter ₦6.1M based on current growth rates.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-[-0.03em]">Inventory Summary</h2>
                <span className="rounded-full bg-[var(--color-warning-light)] px-3 py-1 text-xs font-semibold text-[var(--color-warning)]">
                  2 low stock
                </span>
              </div>
              <div className="mt-5 grid gap-2.5 text-sm">
                {inventoryRows.map(([label, value, low]) => (
                  <div key={label} className="flex items-center justify-between border-b border-neutral-100 pb-2.5 last:border-0 last:pb-0">
                    <span className="text-[var(--color-text-secondary)]">{label}</span>
                    <span className="flex items-center gap-2 font-medium">
                      {value}
                      {low ? <span className="h-2 w-2 rounded-full bg-[var(--color-warning)]" /> : null}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-lg bg-[var(--color-warning-light)] p-3 text-xs leading-5 text-[var(--color-text-primary)]">
                Upcoming purchase: 15 bags Coppens 2mm scheduled for Friday.
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-6 md:col-span-2 xl:col-span-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-[-0.03em]">Harvest Countdown</h2>
                <span className="rounded-full bg-[var(--color-accent-light)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                  92% ready
                </span>
              </div>
              <p className="mt-5 text-4xl font-bold tracking-[-0.05em]">7 Days</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">BAT-003 · Tilapia · Pond D</p>
              <div className="mt-4 h-2 rounded-full bg-neutral-100">
                <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-[var(--color-accent)] to-emerald-400" />
              </div>
              <div className="mt-5 grid gap-2.5 text-sm">
                <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                  <span className="text-[var(--color-text-secondary)]">Projected weight</span>
                  <span className="font-medium">2,870 kg</span>
                </div>
                <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                  <span className="text-[var(--color-text-secondary)]">Estimated revenue</span>
                  <span className="font-medium text-[var(--color-accent)]">₦5.2M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Assigned buyer</span>
                  <span className="font-medium">Lagos Fish Market Co.</span>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-xl border border-[var(--color-border)] bg-white">
              <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
                <h2 className="text-lg font-bold tracking-[-0.03em]">PondDesk AI</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Ask operational questions using the farm&apos;s live records.
                </p>
              </div>
              <div className="p-5 sm:p-6">
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{selectedPrompt}</p>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                    You have 8 bags of Coppens 2mm remaining, which covers about 11 days at the current 0.72 bag daily
                    consumption rate. Reorder before Friday to avoid dropping below the 6-bag threshold.
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {aiPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setSelectedPrompt(prompt)}
                      className={`min-h-11 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 ${
                        selectedPrompt === prompt
                          ? "border-[var(--color-accent-border)] bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                          : "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
                      }`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold tracking-[-0.03em]">Recent Activity</h2>
              <div className="mt-6 space-y-4">
                {activities.map((activity) => (
                  <div key={`${activity.text}-${activity.time}`} className="flex gap-3">
                    <span
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${
                        activity.tone === "warning"
                          ? "bg-[var(--color-warning)]"
                          : activity.tone === "neutral"
                            ? "bg-neutral-400"
                            : "bg-[var(--color-accent)]"
                      }`}
                    >
                      {activity.tone === "warning" ? "!" : activity.tone === "neutral" ? "✦" : <CheckIcon />}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{activity.text}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-6 rounded-xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold tracking-[-0.03em]">Reports & Exports</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Generate a snapshot of farm performance for stakeholders.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {exportOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>

      <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-2 lg:bottom-6 lg:hidden">
        {fabOpen &&
          fabActions.map((action) => (
            <button
              key={action}
              type="button"
              onClick={() => setFabOpen(false)}
              className="min-h-11 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] shadow-[0_4px_12px_rgba(0,0,0,0.08),0_16px_40px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-accent-border)] hover:text-[var(--color-accent)]"
              style={{ animation: "fadeSlideUp 200ms ease-out both" }}
            >
              + {action}
            </button>
          ))}
        <button
          type="button"
          onClick={() => setFabOpen((open) => !open)}
          aria-expanded={fabOpen}
          aria-label="Quick actions"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-2xl font-light text-white shadow-[0_4px_12px_rgba(0,0,0,0.12),0_16px_40px_rgba(0,0,0,0.12)] transition-all duration-200 hover:-translate-y-px hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
        >
          <span className={`transition-transform duration-200 ${fabOpen ? "rotate-45" : ""}`}>+</span>
        </button>
      </div>

      <AppMobileNav activeKey="dashboard" />
    </div>
  );
}
