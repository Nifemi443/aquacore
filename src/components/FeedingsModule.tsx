"use client";

import { useMemo, useState } from "react";

type FeedingStatus = "Completed" | "In Progress" | "Scheduled" | "Missed" | "Delayed";
type SlotName = "Morning" | "Afternoon" | "Evening" | "Night";

interface FeedingRecord {
  id: string;
  time: string;
  slot: SlotName;
  pond: string;
  batch: string;
  species: "Catfish" | "Tilapia";
  population: number;
  avgWeight: string;
  biomass: string;
  feedBrand: string;
  feedType: string;
  feedSize: string;
  quantity: string;
  expected: string;
  variance: string;
  varianceTone: "good" | "warn" | "neutral";
  staff: string;
  duration: string;
  completion: number;
  status: FeedingStatus;
  notes: string;
  cost: string;
  startTime: string;
  endTime: string;
  weather: string;
  waterTemp: string;
}

interface KpiCard {
  label: string;
  value: string;
  detail: string;
  trend: string;
  trendTone: "up" | "down" | "flat";
  spark: "up" | "down" | "flat";
  icon: IconType;
}

interface TimelineEvent {
  time: string;
  title: string;
  detail: string;
  tone: "success" | "warning" | "danger" | "neutral";
}

interface StaffRow {
  name: string;
  completed: number;
  avgTime: string;
  compliance: string;
  late: number;
  missed: number;
  score: number;
}

interface NotificationItem {
  tone: "danger" | "warning" | "info" | "success";
  text: string;
  time: string;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Ponds", href: "/ponds", icon: "pond" },
  { label: "Fish Batches", href: "/batches", icon: "batch" },
  { label: "Today's Feedings", href: "/feedings", icon: "feed" },
  { label: "Feed Inventory", href: "/inventory", icon: "inventory" },
  { label: "Water Records", href: "/water-records", icon: "water" },
  { label: "Harvest", href: "/harvest", icon: "harvest" },
  { label: "Reports", href: "#", icon: "reports" },
  { label: "Vendor Deliveries", href: "#", icon: "delivery" },
  { label: "AI Assistant", href: "#", icon: "ai" },
  { label: "Settings", href: "#", icon: "settings" },
] as const;

type NavIconType = (typeof NAV_ITEMS)[number]["icon"];
type IconType = NavIconType | "clock" | "check" | "cost" | "score" | "timer";

const KPI_CARDS: KpiCard[] = [
  { label: "Today's Feedings", value: "36", detail: "Scheduled across 6 ponds", trend: "+4", trendTone: "up", spark: "up", icon: "feed" },
  { label: "Completed", value: "28", detail: "78% of schedule", trend: "+6%", trendTone: "up", spark: "up", icon: "check" },
  { label: "Pending", value: "8", detail: "Next at 4:00 PM", trend: "-2", trendTone: "up", spark: "down", icon: "clock" },
  { label: "Missed", value: "2", detail: "Pond C · Pond E", trend: "+1", trendTone: "down", spark: "flat", icon: "timer" },
  { label: "Feed Used Today", value: "245 kg", detail: "Of 260 kg planned", trend: "+3.1%", trendTone: "up", spark: "up", icon: "inventory" },
  { label: "Est. Feed Cost", value: "₦192,000", detail: "Today's consumption", trend: "+₦8k", trendTone: "flat", spark: "up", icon: "cost" },
  { label: "Compliance Rate", value: "97%", detail: "Rolling 7 days", trend: "+1.2%", trendTone: "up", spark: "up", icon: "reports" },
  { label: "Avg Feeding Time", value: "8 min", detail: "Per pond session", trend: "-40s", trendTone: "up", spark: "down", icon: "clock" },
  { label: "AI Feeding Score", value: "95/100", detail: "Excellent execution", trend: "+2", trendTone: "up", spark: "up", icon: "score" },
];

const SPARK_POINTS: Record<"up" | "down" | "flat", string> = {
  up: "0,18 10,15 20,16 30,11 40,9 50,6 60,2",
  down: "0,4 10,6 20,5 30,9 40,12 50,14 60,18",
  flat: "0,10 10,9 20,11 30,10 40,10 50,9 60,10",
};

const FEEDINGS: FeedingRecord[] = [
  {
    id: "FD-1041", time: "06:00 AM", slot: "Morning", pond: "Pond A", batch: "BAT-004", species: "Catfish",
    population: 2860, avgWeight: "680g", biomass: "1,944 kg", feedBrand: "Coppens", feedType: "Floating pellet",
    feedSize: "4mm", quantity: "38 kg", expected: "38 kg", variance: "0%", varianceTone: "neutral", staff: "Ayo",
    duration: "12 min", completion: 100, status: "Completed", notes: "Strong appetite, no leftover feed.",
    cost: "₦29,800", startTime: "06:00 AM", endTime: "06:12 AM", weather: "Clear · 26°C", waterTemp: "27.4°C",
  },
  {
    id: "FD-1042", time: "06:15 AM", slot: "Morning", pond: "Pond B", batch: "BAT-005", species: "Catfish",
    population: 2915, avgWeight: "640g", biomass: "1,866 kg", feedBrand: "Coppens", feedType: "Floating pellet",
    feedSize: "4mm", quantity: "34 kg", expected: "36 kg", variance: "-5.6%", varianceTone: "warn", staff: "Ngozi",
    duration: "9 min", completion: 100, status: "Completed", notes: "Slightly reduced ration per AI advice.",
    cost: "₦26,700", startTime: "06:15 AM", endTime: "06:24 AM", weather: "Clear · 26°C", waterTemp: "27.1°C",
  },
  {
    id: "FD-1043", time: "06:30 AM", slot: "Morning", pond: "Pond D", batch: "BAT-003", species: "Tilapia",
    population: 3120, avgWeight: "920g", biomass: "2,870 kg", feedBrand: "Skretting", feedType: "Floating pellet",
    feedSize: "5mm", quantity: "46 kg", expected: "46 kg", variance: "0%", varianceTone: "neutral", staff: "Ayo",
    duration: "11 min", completion: 100, status: "Completed", notes: "Pre-harvest ration maintained.",
    cost: "₦38,200", startTime: "06:30 AM", endTime: "06:41 AM", weather: "Clear · 26°C", waterTemp: "27.8°C",
  },
  {
    id: "FD-1044", time: "07:05 AM", slot: "Morning", pond: "Pond C", batch: "BAT-008", species: "Catfish",
    population: 2780, avgWeight: "590g", biomass: "1,640 kg", feedBrand: "Coppens", feedType: "Floating pellet",
    feedSize: "3mm", quantity: "30 kg", expected: "32 kg", variance: "-6.3%", varianceTone: "warn", staff: "Tunde",
    duration: "14 min", completion: 100, status: "Delayed", notes: "Started 35 minutes late — generator issue.",
    cost: "₦23,500", startTime: "07:05 AM", endTime: "07:19 AM", weather: "Clear · 27°C", waterTemp: "27.5°C",
  },
  {
    id: "FD-1045", time: "08:10 AM", slot: "Morning", pond: "Pond E", batch: "BAT-006", species: "Catfish",
    population: 2540, avgWeight: "510g", biomass: "1,295 kg", feedBrand: "Coppens", feedType: "Sinking pellet",
    feedSize: "3mm", quantity: "—", expected: "26 kg", variance: "-100%", varianceTone: "warn", staff: "Tunde",
    duration: "—", completion: 0, status: "Missed", notes: "Treatment batch — feeding skipped without record.",
    cost: "—", startTime: "—", endTime: "—", weather: "Cloudy · 28°C", waterTemp: "27.9°C",
  },
  {
    id: "FD-1046", time: "12:30 PM", slot: "Afternoon", pond: "Pond F", batch: "BAT-007", species: "Tilapia",
    population: 3060, avgWeight: "430g", biomass: "1,316 kg", feedBrand: "Skretting", feedType: "Floating pellet",
    feedSize: "3mm", quantity: "21 kg", expected: "24 kg", variance: "-12.5%", varianceTone: "warn", staff: "Ngozi",
    duration: "7 min", completion: 88, status: "In Progress", notes: "Feeding underway — fish responding well.",
    cost: "₦17,400", startTime: "12:30 PM", endTime: "—", weather: "Cloudy · 29°C", waterTemp: "28.3°C",
  },
  {
    id: "FD-1047", time: "04:00 PM", slot: "Evening", pond: "Pond A", batch: "BAT-004", species: "Catfish",
    population: 2860, avgWeight: "680g", biomass: "1,944 kg", feedBrand: "Coppens", feedType: "Floating pellet",
    feedSize: "4mm", quantity: "—", expected: "36 kg", variance: "—", varianceTone: "neutral", staff: "Ayo",
    duration: "—", completion: 0, status: "Scheduled", notes: "Reduce ration if rain starts before 4 PM.",
    cost: "—", startTime: "—", endTime: "—", weather: "Rain forecast", waterTemp: "—",
  },
  {
    id: "FD-1048", time: "04:15 PM", slot: "Evening", pond: "Pond D", batch: "BAT-003", species: "Tilapia",
    population: 3120, avgWeight: "920g", biomass: "2,870 kg", feedBrand: "Skretting", feedType: "Floating pellet",
    feedSize: "5mm", quantity: "—", expected: "44 kg", variance: "—", varianceTone: "neutral", staff: "Ngozi",
    duration: "—", completion: 0, status: "Scheduled", notes: "Final full ration before harvest week.",
    cost: "—", startTime: "—", endTime: "—", weather: "Rain forecast", waterTemp: "—",
  },
  {
    id: "FD-1049", time: "08:30 PM", slot: "Night", pond: "Pond B", batch: "BAT-005", species: "Catfish",
    population: 2915, avgWeight: "640g", biomass: "1,866 kg", feedBrand: "Coppens", feedType: "Floating pellet",
    feedSize: "4mm", quantity: "—", expected: "18 kg", variance: "—", varianceTone: "neutral", staff: "Tunde",
    duration: "—", completion: 0, status: "Scheduled", notes: "Light night ration.",
    cost: "—", startTime: "—", endTime: "—", weather: "—", waterTemp: "—",
  },
];

const TABLE_HEADERS = [
  "Time", "Pond", "Batch", "Species", "Population", "Avg Weight", "Feed Brand", "Feed Type", "Size",
  "Quantity", "Expected", "Variance", "Staff", "Duration", "Completion", "Notes", "Actions",
] as const;

const ROW_ACTIONS = ["View", "Edit", "Duplicate", "Delete", "Print"] as const;

const TIMELINE: TimelineEvent[] = [
  { time: "6:00 AM", title: "Morning Feeding Started", detail: "Ayo · Pond A · 38 kg Coppens 4mm", tone: "neutral" },
  { time: "6:12 AM", title: "Pond A Completed", detail: "Ayo · 12 min · 38 kg · strong appetite", tone: "success" },
  { time: "6:24 AM", title: "Pond B Completed", detail: "Ngozi · 9 min · 34 kg · reduced ration per AI advice", tone: "success" },
  { time: "6:41 AM", title: "Pond D Completed", detail: "Ayo · 11 min · 46 kg · pre-harvest ration", tone: "success" },
  { time: "7:05 AM", title: "Pond C Delayed", detail: "Tunde · started 35 min late · generator issue", tone: "warning" },
  { time: "8:10 AM", title: "Missed Feeding Alert", detail: "Pond E · 26 kg expected · no record submitted", tone: "danger" },
  { time: "12:30 PM", title: "Afternoon Feeding In Progress", detail: "Ngozi · Pond F · 21 of 24 kg dispensed", tone: "neutral" },
  { time: "4:00 PM", title: "Evening Feeding Scheduled", detail: "Ayo · Pond A & Pond D · watch rain forecast", tone: "neutral" },
];

const CALENDAR_SLOTS: { slot: SlotName; window: string }[] = [
  { slot: "Morning", window: "6:00 – 9:00 AM" },
  { slot: "Afternoon", window: "12:00 – 2:00 PM" },
  { slot: "Evening", window: "4:00 – 6:00 PM" },
  { slot: "Night", window: "8:00 – 10:00 PM" },
];

const AI_RECOMMENDATIONS = [
  "Increase Pond 2 feed by 5% — growth indicates mild underfeeding.",
  "Reduce feed for Batch C — leftover pellets observed two sessions in a row.",
  "Current feed conversion is excellent at 1.42 farm-wide.",
  "Fish activity in Pond D suggests optimal appetite before harvest.",
  "Heavy rain forecast at 4 PM — delay evening feeding if it arrives early.",
  "Expected monthly feed savings from current adjustments: ₦120,000.",
] as const;

const STAFF_ROWS: StaffRow[] = [
  { name: "Ayo Adeyemi", completed: 12, avgTime: "7.4 min", compliance: "99%", late: 0, missed: 0, score: 98 },
  { name: "Ngozi Okafor", completed: 10, avgTime: "8.1 min", compliance: "97%", late: 1, missed: 0, score: 94 },
  { name: "Tunde Bello", completed: 6, avgTime: "9.6 min", compliance: "88%", late: 2, missed: 1, score: 81 },
];

const NOTIFICATIONS: NotificationItem[] = [
  { tone: "danger", text: "Staff missed Pond E morning feeding", time: "8:10 AM" },
  { tone: "warning", text: "Morning feeding at Pond C ran 35 minutes late", time: "7:05 AM" },
  { tone: "warning", text: "Feed inventory below 10-bag threshold", time: "7:40 AM" },
  { tone: "info", text: "Rain may delay evening feeding — monitor forecast", time: "9:15 AM" },
  { tone: "success", text: "Feed delivery from Fresh Aqua arriving today", time: "10:02 AM" },
];

const FAB_ACTIONS = [
  "Record Feeding", "Bulk Feeding", "Schedule Feeding", "Generate Report", "Notify Staff", "Inventory Purchase",
] as const;

const DISTRIBUTION_TABS = ["By Pond", "By Species", "By Batch", "By Time"] as const;
type DistributionTab = (typeof DISTRIBUTION_TABS)[number];

const DISTRIBUTION_DATA: Record<DistributionTab, { label: string; kg: number; cost: string }[]> = {
  "By Pond": [
    { label: "Pond D", kg: 46, cost: "₦38,200" },
    { label: "Pond A", kg: 38, cost: "₦29,800" },
    { label: "Pond B", kg: 34, cost: "₦26,700" },
    { label: "Pond C", kg: 30, cost: "₦23,500" },
    { label: "Pond F", kg: 21, cost: "₦17,400" },
    { label: "Pond E", kg: 0, cost: "—" },
  ],
  "By Species": [
    { label: "Catfish", kg: 102, cost: "₦80,000" },
    { label: "Tilapia", kg: 67, cost: "₦55,600" },
  ],
  "By Batch": [
    { label: "BAT-003", kg: 46, cost: "₦38,200" },
    { label: "BAT-004", kg: 38, cost: "₦29,800" },
    { label: "BAT-005", kg: 34, cost: "₦26,700" },
    { label: "BAT-008", kg: 30, cost: "₦23,500" },
    { label: "BAT-007", kg: 21, cost: "₦17,400" },
  ],
  "By Time": [
    { label: "Morning", kg: 148, cost: "₦118,200" },
    { label: "Afternoon", kg: 21, cost: "₦17,400" },
    { label: "Evening", kg: 0, cost: "Scheduled" },
    { label: "Night", kg: 0, cost: "Scheduled" },
  ],
};

function NavIcon({ type }: { type: IconType }): React.JSX.Element {
  const paths: Record<IconType, React.ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    pond: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M7 14c2-2 4-2 6 0s4 2 6 0" />
      </>
    ),
    batch: (
      <>
        <path d="M12 3l9 5-9 5-9-5 9-5z" />
        <path d="M3 13l9 5 9-5" />
      </>
    ),
    feed: <path d="M5 12h14M7 8h10M8 16h8" />,
    inventory: (
      <>
        <path d="M21 8l-9-5-9 5 9 5 9-5z" />
        <path d="M3 8v8l9 5 9-5V8" />
      </>
    ),
    water: <path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z" />,
    harvest: <path d="M4 14c5-8 11-8 16 0M6 14v5h12v-5" />,
    reports: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M7 15l4-4 3 3 5-7" />
      </>
    ),
    delivery: (
      <>
        <path d="M3 7h11v9H3z" />
        <path d="M14 10h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </>
    ),
    ai: <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />,
    settings: (
      <>
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M19.4 15a8 8 0 0 0 .1-2l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L15 5.5h-4L10.6 8a8 8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a8 8 0 0 0 .1 2l-2.1 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1l.4 2.5h4l.4-2.5a8 8 0 0 0 1.7-1l2.4 1 2-3.5L19.4 15z" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </>
    ),
    check: <path d="M5 12l5 5L19 7" />,
    cost: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10M9 9.5c0-1 1.3-1.8 3-1.8s3 .8 3 1.8-1.3 1.7-3 2-3 1-3 2 1.3 1.8 3 1.8 3-.8 3-1.8" />
      </>
    ),
    score: <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />,
    timer: (
      <>
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 2.5M9 2h6" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[type]}
    </svg>
  );
}

function Sparkline({ variant }: { variant: "up" | "down" | "flat" }): React.JSX.Element {
  const stroke = variant === "down" ? "#B45309" : variant === "flat" ? "#A3A3A3" : "#0D7A5F";

  return (
    <svg width="60" height="20" viewBox="0 0 60 20" aria-hidden="true">
      <polyline points={SPARK_POINTS[variant]} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function statusBadge(status: FeedingStatus): string {
  if (status === "Completed") return "bg-[var(--color-accent-light)] text-[var(--color-accent)]";
  if (status === "In Progress") return "bg-sky-50 text-sky-700";
  if (status === "Scheduled") return "bg-neutral-100 text-[var(--color-text-secondary)]";
  if (status === "Delayed") return "bg-[var(--color-warning-light)] text-[var(--color-warning)]";
  return "bg-[var(--color-danger-light)] text-[var(--color-danger)]";
}

function StatusBadge({ status }: { status: FeedingStatus }): React.JSX.Element {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(status)}`}>
      {status === "In Progress" && (
        <span className="h-1.5 w-1.5 rounded-full bg-sky-600 [animation:livePulse_1.6s_ease-in-out_infinite]" />
      )}
      {status}
    </span>
  );
}

function varianceClass(tone: FeedingRecord["varianceTone"]): string {
  if (tone === "good") return "text-[var(--color-accent)]";
  if (tone === "warn") return "text-[var(--color-warning)]";
  return "text-[var(--color-text-secondary)]";
}

function timelineDot(tone: TimelineEvent["tone"]): string {
  if (tone === "success") return "border-[var(--color-accent-border)] bg-[var(--color-accent)]";
  if (tone === "warning") return "border-amber-200 bg-[var(--color-warning)]";
  if (tone === "danger") return "border-red-200 bg-[var(--color-danger)]";
  return "border-[var(--color-border)] bg-[var(--color-text-muted)]";
}

function notificationDot(tone: NotificationItem["tone"]): string {
  if (tone === "danger") return "bg-[var(--color-danger)]";
  if (tone === "warning") return "bg-[var(--color-warning)]";
  if (tone === "success") return "bg-[var(--color-accent)]";
  return "bg-sky-500";
}

function calendarCell(status: FeedingStatus): string {
  if (status === "Completed") return "border-[var(--color-accent-border)] bg-[var(--color-accent-light)] text-[var(--color-accent)]";
  if (status === "Missed") return "border-red-200 bg-[var(--color-danger-light)] text-[var(--color-danger)]";
  if (status === "In Progress" || status === "Delayed") return "border-amber-200 bg-[var(--color-warning-light)] text-[var(--color-warning)]";
  return "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]";
}

function CircularScore({ score }: { score: number }): React.JSX.Element {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg width="128" height="128" viewBox="0 0 128 128" aria-hidden="true">
      <defs>
        <linearGradient id="feedingScoreGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0D7A5F" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r={radius} fill="none" stroke="#F2F2F2" strokeWidth="10" />
      <circle
        cx="64"
        cy="64"
        r={radius}
        fill="none"
        stroke="url(#feedingScoreGradient)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - score / 100)}
        transform="rotate(-90 64 64)"
      />
      <text x="64" y="60" textAnchor="middle" fontSize="28" fontWeight="700" fill="#0A0A0A">
        {score}%
      </text>
      <text x="64" y="80" textAnchor="middle" fontSize="11" fill="#A3A3A3">
        on schedule
      </text>
    </svg>
  );
}

function Info({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

function FeedingDrawer({ record, onClose }: { record: FeedingRecord; onClose: () => void }): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close feeding details" onClick={onClose} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <aside className="absolute inset-x-0 bottom-0 top-0 overflow-y-auto bg-[var(--color-surface)] shadow-[0_24px_80px_rgba(0,0,0,0.16)] md:inset-x-auto md:right-0 md:w-[560px]">
        <div className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-white/90 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold tracking-[-0.03em]">{record.id}</h2>
                <StatusBadge status={record.status} />
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {record.pond} · {record.batch} · {record.species} · {record.slot} feeding
              </p>
            </div>
            <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-border)] bg-white transition-all duration-200 hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
              ×
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Edit Record", "Duplicate", "Print", "Export PDF"].map((action) => (
              <button key={action} type="button" className="min-h-9 rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
                {action}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5 p-5">
          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold">Pond & Batch</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Info label="Feeding ID" value={record.id} />
              <Info label="Pond" value={record.pond} />
              <Info label="Fish Batch" value={record.batch} />
              <Info label="Species" value={record.species} />
              <Info label="Population" value={record.population.toLocaleString()} />
              <Info label="Average Weight" value={record.avgWeight} />
              <Info label="Biomass" value={record.biomass} />
              <Info label="Assigned Staff" value={record.staff} />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold">Feed Details</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Info label="Feed Brand" value={record.feedBrand} />
              <Info label="Feed Type" value={record.feedType} />
              <Info label="Pellet Size" value={record.feedSize} />
              <Info label="Expected Quantity" value={record.expected} />
              <Info label="Actual Quantity" value={record.quantity} />
              <Info label="Difference" value={record.variance} />
              <Info label="Feed Cost" value={record.cost} />
              <Info label="Completion" value={`${record.completion}%`} />
            </div>
            <div className="mt-4 h-2 rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                style={{ width: `${record.completion}%` }}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold">Session & Conditions</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Info label="Start Time" value={record.startTime} />
              <Info label="End Time" value={record.endTime} />
              <Info label="Duration" value={record.duration} />
              <Info label="Weather" value={record.weather} />
              <Info label="Water Temperature" value={record.waterTemp} />
              <Info label="GPS Location" value="6.5244° N, 3.3792° E" />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold">Notes</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{record.notes}</p>
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold">Images & Attachments</h3>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {["Pond surface", "Feed bag", "Feeding log"].map((label) => (
                <div key={label} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 text-center">
                  <span className="text-lg" aria-hidden="true">🖼️</span>
                  <span className="text-[11px] text-[var(--color-text-muted)]">{label}</span>
                </div>
              ))}
            </div>
            <button type="button" className="mt-4 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]">
              + Add attachment
            </button>
          </section>
        </div>
      </aside>
    </div>
  );
}

export default function FeedingsModule(): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | FeedingStatus>("All");
  const [pondFilter, setPondFilter] = useState("All");
  const [slotFilter, setSlotFilter] = useState<"All" | SlotName>("All");
  const [selectedRecord, setSelectedRecord] = useState<FeedingRecord | null>(null);
  const [openActions, setOpenActions] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [distributionTab, setDistributionTab] = useState<DistributionTab>("By Pond");
  const [fabOpen, setFabOpen] = useState(false);

  const ponds = useMemo(() => ["All", ...Array.from(new Set(FEEDINGS.map((record) => record.pond))).sort()], []);

  const filteredRecords = useMemo(() => {
    const term = query.toLowerCase();
    return FEEDINGS.filter(
      (record) =>
        (record.pond.toLowerCase().includes(term) ||
          record.batch.toLowerCase().includes(term) ||
          record.species.toLowerCase().includes(term) ||
          record.staff.toLowerCase().includes(term) ||
          record.feedBrand.toLowerCase().includes(term) ||
          record.feedType.toLowerCase().includes(term)) &&
        (statusFilter === "All" || record.status === statusFilter) &&
        (pondFilter === "All" || record.pond === pondFilter) &&
        (slotFilter === "All" || record.slot === slotFilter),
    );
  }, [pondFilter, query, slotFilter, statusFilter]);

  const maxDistribution = Math.max(...DISTRIBUTION_DATA[distributionTab].map((item) => item.kg), 1);

  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[256px] border-r border-[var(--color-border)] bg-white/95 px-4 py-5 backdrop-blur-xl lg:block">
        <a href="/dashboard" className="flex items-center gap-2 px-2 transition-all duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">A</div>
          <div>
            <p className="text-sm font-bold tracking-[-0.02em]">AquaCore</p>
            <p className="text-[11px] text-[var(--color-text-muted)]">Farm OS</p>
          </div>
        </a>
        <nav className="mt-8 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = item.label === "Today's Feedings";
            return (
              <a
                key={item.label}
                href={item.href}
                className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-all duration-200 hover:-translate-y-px hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 ${
                  active
                    ? "border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] font-medium text-[var(--color-accent)]"
                    : "text-[var(--color-text-secondary)]"
                }`}
              >
                <NavIcon type={item.icon} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-[256px]">
        <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-xl lg:hidden">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <a href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">A</div>
              <div>
                <p className="text-sm font-bold tracking-[-0.02em]">AquaCore</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">Today&apos;s Feedings</p>
              </div>
            </a>
            <a href="/dashboard" className="rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-[var(--color-surface)]">
              Dashboard
            </a>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Page header */}
          <header className="mb-6 rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 className="text-[clamp(30px,4vw,48px)] font-bold tracking-[-0.05em]">Today&apos;s Feedings</h1>
                <p className="mt-2 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
                  Monitor, schedule and record every feeding activity across all ponds in real time.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="min-h-11 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px hover:bg-emerald-900 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
                  + Record Feeding
                </button>
                {["+ Schedule Feeding", "Generate Daily Report", "Export PDF", "Export Excel"].map((action) => (
                  <button key={action} type="button" className="min-h-11 rounded-md border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* KPI cards */}
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {KPI_CARDS.map((card) => (
              <div
                key={card.label}
                title={`${card.label}: ${card.detail}`}
                className="rounded-2xl border border-[var(--color-border)] bg-white p-5 transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">{card.label}</p>
                  <span className="text-[var(--color-text-muted)]"><NavIcon type={card.icon} /></span>
                </div>
                <div className="mt-4 flex items-end justify-between gap-2">
                  <p className="text-3xl font-bold tracking-[-0.04em]">{card.value}</p>
                  <Sparkline variant={card.spark} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      card.trendTone === "up"
                        ? "bg-emerald-100 text-[var(--color-accent)]"
                        : card.trendTone === "down"
                          ? "bg-[var(--color-warning-light)] text-[var(--color-warning)]"
                          : "bg-neutral-100 text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {card.trend}
                  </span>
                  <span className="truncate text-xs text-[var(--color-text-muted)]">{card.detail}</span>
                </div>
              </div>
            ))}
          </section>

          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-6">
              {/* AI daily summary + recommendations */}
              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold tracking-[-0.03em]">Today&apos;s Farm Feeding Status</h2>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">AI Summary</span>
                  </div>
                  <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
                    <CircularScore score={95} />
                    <ul className="space-y-1.5 text-sm leading-6 text-[var(--color-text-primary)]">
                      <li>Morning feeding completed successfully.</li>
                      <li>Pond 4 received 8% less feed than planned.</li>
                      <li>Feed inventory is sufficient for another 11 days.</li>
                      <li>No unusual feeding behaviour detected.</li>
                      <li>Expected growth remains on target.</li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold tracking-[-0.03em]">AI Feed Recommendations</h2>
                    <span className="rounded-full bg-[var(--color-accent-light)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">Live</span>
                  </div>
                  <div className="mt-4 divide-y divide-neutral-100">
                    {AI_RECOMMENDATIONS.map((item) => (
                      <p key={item} className="py-2.5 text-sm leading-6 text-[var(--color-text-secondary)]">{item}</p>
                    ))}
                  </div>
                </div>
              </section>

              {/* Live feeding status board */}
              <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold tracking-[-0.03em]">Live Feeding Status Board</h2>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Every pond&apos;s current feeding state at a glance.</p>
                  </div>
                  <span className="flex items-center gap-2 rounded-full bg-[var(--color-accent-light)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] [animation:livePulse_1.6s_ease-in-out_infinite]" />
                    Live
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {FEEDINGS.filter((record) => record.slot === "Morning" || record.status === "In Progress").map((record) => (
                    <button
                      key={record.id}
                      type="button"
                      onClick={() => setSelectedRecord(record)}
                      className="rounded-2xl border border-[var(--color-border)] bg-white p-4 text-left transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{record.pond}</p>
                          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                            {record.batch} · {record.species}
                          </p>
                        </div>
                        <StatusBadge status={record.status} />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                        <span className="text-[var(--color-text-muted)]">Fish count</span>
                        <span className="text-right font-medium">{record.population.toLocaleString()}</span>
                        <span className="text-[var(--color-text-muted)]">Avg weight</span>
                        <span className="text-right font-medium">{record.avgWeight}</span>
                        <span className="text-[var(--color-text-muted)]">Scheduled</span>
                        <span className="text-right font-medium">{record.time}</span>
                        <span className="text-[var(--color-text-muted)]">Feed</span>
                        <span className="text-right font-medium">{record.feedBrand} {record.feedSize}</span>
                        <span className="text-[var(--color-text-muted)]">Quantity</span>
                        <span className="text-right font-medium">{record.quantity === "—" ? record.expected : record.quantity}</span>
                        <span className="text-[var(--color-text-muted)]">Staff</span>
                        <span className="text-right font-medium">{record.staff}</span>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                          <span>Completed</span>
                          <span>{record.completion}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-neutral-100">
                          <div
                            className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                            style={{ width: `${record.completion}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Search & filters */}
              <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 sm:p-5">
                <div className="grid gap-3 lg:grid-cols-[1fr_150px_150px_150px]">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    type="search"
                    placeholder="Search pond, batch, species, staff, feed brand…"
                    className="h-11 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)]"
                  />
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as "All" | FeedingStatus)}
                    className="h-11 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)]"
                    aria-label="Filter by status"
                  >
                    {["All", "Completed", "In Progress", "Scheduled", "Delayed", "Missed"].map((option) => (
                      <option key={option} value={option}>{option === "All" ? "All statuses" : option}</option>
                    ))}
                  </select>
                  <select
                    value={pondFilter}
                    onChange={(event) => setPondFilter(event.target.value)}
                    className="h-11 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)]"
                    aria-label="Filter by pond"
                  >
                    {ponds.map((pond) => (
                      <option key={pond} value={pond}>{pond === "All" ? "All ponds" : pond}</option>
                    ))}
                  </select>
                  <select
                    value={slotFilter}
                    onChange={(event) => setSlotFilter(event.target.value as "All" | SlotName)}
                    className="h-11 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)]"
                    aria-label="Filter by time slot"
                  >
                    {["All", "Morning", "Afternoon", "Evening", "Night"].map((option) => (
                      <option key={option} value={option}>{option === "All" ? "All time slots" : option}</option>
                    ))}
                  </select>
                </div>
              </section>

              {/* Daily feeding table */}
              <section className="rounded-2xl border border-[var(--color-border)] bg-white">
                <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Daily Feeding Table</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {filteredRecords.length} of {FEEDINGS.length} feeding records · click a row for full details.
                  </p>
                </div>

                <div className="hidden overflow-x-auto [-webkit-overflow-scrolling:touch] md:block">
                  <table className="w-full min-w-[1680px] border-collapse">
                    <thead className="bg-[var(--color-surface)]">
                      <tr className="text-left text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                        {TABLE_HEADERS.map((header) => (
                          <th key={header} className="whitespace-nowrap px-4 py-3">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record) => (
                        <tr
                          key={record.id}
                          onClick={() => setSelectedRecord(record)}
                          className="cursor-pointer border-t border-[var(--color-border)] transition-colors duration-150 hover:bg-[var(--color-surface)]"
                        >
                          <td className="whitespace-nowrap px-4 py-4 font-mono text-xs">{record.time}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold">{record.pond}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--color-accent)]">{record.batch}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--color-text-secondary)]">{record.species}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm">{record.population.toLocaleString()}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm">{record.avgWeight}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm">{record.feedBrand}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--color-text-secondary)]">{record.feedType}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm">{record.feedSize}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm font-medium">{record.quantity}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--color-text-secondary)]">{record.expected}</td>
                          <td className={`whitespace-nowrap px-4 py-4 text-sm font-medium ${varianceClass(record.varianceTone)}`}>{record.variance}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm">{record.staff}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm">{record.duration}</td>
                          <td className="whitespace-nowrap px-4 py-4"><StatusBadge status={record.status} /></td>
                          <td className="max-w-[220px] truncate px-4 py-4 text-sm text-[var(--color-text-secondary)]" title={record.notes}>{record.notes}</td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenActions((current) => (current === record.id ? null : record.id));
                                }}
                                aria-label={`Actions for ${record.id}`}
                                className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
                              >
                                ⋯
                              </button>
                              {openActions === record.id && (
                                <div className="absolute right-0 top-9 z-20 w-36 rounded-xl border border-[var(--color-border)] bg-white p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
                                  {ROW_ACTIONS.map((action) => (
                                    <button
                                      key={action}
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setOpenActions(null);
                                        if (action === "View") setSelectedRecord(record);
                                      }}
                                      className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-[var(--color-surface)] ${
                                        action === "Delete" ? "text-[var(--color-danger)]" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                      }`}
                                    >
                                      {action}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile expandable cards */}
                <div className="grid gap-3 p-4 md:hidden">
                  {filteredRecords.map((record) => {
                    const expanded = expandedCard === record.id;
                    return (
                      <div key={record.id} className="rounded-xl border border-[var(--color-border)] bg-white">
                        <button
                          type="button"
                          onClick={() => setExpandedCard(expanded ? null : record.id)}
                          className="flex min-h-16 w-full items-center justify-between gap-3 p-4 text-left"
                          aria-expanded={expanded}
                        >
                          <div>
                            <p className="font-semibold">{record.pond} · {record.time}</p>
                            <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                              {record.batch} · {record.quantity === "—" ? record.expected : record.quantity} · {record.staff}
                            </p>
                          </div>
                          <StatusBadge status={record.status} />
                        </button>
                        {expanded && (
                          <div className="border-t border-[var(--color-border)] p-4">
                            <div className="grid grid-cols-2 gap-3">
                              <Info label="Species" value={record.species} />
                              <Info label="Population" value={record.population.toLocaleString()} />
                              <Info label="Feed" value={`${record.feedBrand} ${record.feedSize}`} />
                              <Info label="Expected" value={record.expected} />
                              <Info label="Variance" value={record.variance} />
                              <Info label="Duration" value={record.duration} />
                            </div>
                            <div className="mt-4 flex gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedRecord(record)}
                                className="min-h-11 flex-1 rounded-md bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-emerald-900"
                              >
                                View details
                              </button>
                              <button type="button" className="min-h-11 flex-1 rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-border-strong)]">
                                Mark complete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Timeline + calendar */}
              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Feeding Timeline</h2>
                  <div className="mt-5 space-y-0">
                    {TIMELINE.map((event, index) => (
                      <div key={`${event.time}-${event.title}`} className="relative flex gap-4 pb-6 last:pb-0">
                        {index < TIMELINE.length - 1 && (
                          <span className="absolute left-[7px] top-5 h-full w-px bg-[var(--color-border)]" />
                        )}
                        <span className={`relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-4 ${timelineDot(event.tone)}`} />
                        <div className="min-w-0">
                          <p className="font-mono text-[11px] text-[var(--color-text-muted)]">{event.time}</p>
                          <p className="mt-0.5 text-sm font-semibold">{event.title}</p>
                          <p className="mt-0.5 text-xs leading-5 text-[var(--color-text-secondary)]">{event.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Daily Calendar</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Feeding sessions grouped by time window.</p>
                  <div className="mt-5 space-y-4">
                    {CALENDAR_SLOTS.map(({ slot, window }) => {
                      const slotRecords = FEEDINGS.filter((record) => record.slot === slot);
                      return (
                        <div key={slot} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                          <div className="flex items-baseline justify-between">
                            <p className="text-sm font-semibold">{slot}</p>
                            <p className="font-mono text-[11px] text-[var(--color-text-muted)]">{window}</p>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {slotRecords.length === 0 ? (
                              <span className="text-xs text-[var(--color-text-muted)]">No feedings scheduled</span>
                            ) : (
                              slotRecords.map((record) => (
                                <button
                                  key={record.id}
                                  type="button"
                                  onClick={() => setSelectedRecord(record)}
                                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:-translate-y-px ${calendarCell(record.status)}`}
                                >
                                  {record.pond} · {record.time}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-4 text-xs text-[var(--color-text-secondary)]">
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-accent)]" /> Completed</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-warning)]" /> Pending / Delayed</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[var(--color-danger)]" /> Missed</span>
                    <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-neutral-300" /> Upcoming</span>
                  </div>
                </div>
              </section>

              {/* Feed distribution + FCR */}
              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-bold tracking-[-0.03em]">Feed Distribution</h2>
                    <div className="flex flex-wrap gap-1.5">
                      {DISTRIBUTION_TABS.map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setDistributionTab(tab)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                            distributionTab === tab
                              ? "border-[var(--color-accent-border)] bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                              : "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 space-y-4">
                    {DISTRIBUTION_DATA[distributionTab].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-baseline justify-between text-sm">
                          <span className="font-medium">{item.label}</span>
                          <span className="text-xs text-[var(--color-text-secondary)]">
                            {item.kg > 0 ? `${item.kg} kg · ${item.cost}` : item.cost}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2.5 rounded-full bg-neutral-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-emerald-400 transition-all duration-500"
                            style={{ width: `${(item.kg / maxDistribution) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">FCR Analytics</h2>
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                      <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Current FCR</p>
                      <p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[var(--color-accent)]">1.42</p>
                    </div>
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                      <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Target FCR</p>
                      <p className="mt-2 text-3xl font-bold tracking-[-0.04em]">1.50</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2.5 text-sm">
                    <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                      <span className="text-[var(--color-text-secondary)]">Weekly trend</span>
                      <span className="font-medium text-[var(--color-accent)]">↓ 0.04 improving</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                      <span className="text-[var(--color-text-secondary)]">Monthly trend</span>
                      <span className="font-medium text-[var(--color-accent)]">↓ 0.09 improving</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                      <span className="text-[var(--color-text-secondary)]">Feed efficiency</span>
                      <span className="font-medium">94%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">Growth efficiency</span>
                      <span className="font-medium">Ahead of plan</span>
                    </div>
                  </div>
                  <p className="mt-4 rounded-xl bg-[var(--color-accent-light)] p-3 text-xs leading-5 text-[var(--color-text-primary)]">
                    Recommendation: maintain current rations for Ponds A and D; reduce Batch C by 5% to keep FCR below target.
                  </p>
                </div>
              </section>

              {/* Staff performance */}
              <section className="rounded-2xl border border-[var(--color-border)] bg-white">
                <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Staff Performance</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Feeding execution by team member this week.</p>
                </div>
                <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
                  <table className="w-full min-w-[720px] border-collapse">
                    <thead className="bg-[var(--color-surface)]">
                      <tr className="text-left text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                        <th className="px-5 py-3">Employee</th>
                        <th className="px-5 py-3">Completed</th>
                        <th className="px-5 py-3">Avg Time</th>
                        <th className="px-5 py-3">Compliance</th>
                        <th className="px-5 py-3">Late</th>
                        <th className="px-5 py-3">Missed</th>
                        <th className="px-5 py-3">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {STAFF_ROWS.map((row) => (
                        <tr key={row.name} className="border-t border-[var(--color-border)] transition-colors duration-150 hover:bg-[var(--color-surface)]">
                          <td className="px-5 py-4 text-sm font-semibold">{row.name}</td>
                          <td className="px-5 py-4 text-sm">{row.completed}</td>
                          <td className="px-5 py-4 text-sm">{row.avgTime}</td>
                          <td className="px-5 py-4 text-sm font-medium">{row.compliance}</td>
                          <td className="px-5 py-4 text-sm">{row.late}</td>
                          <td className={`px-5 py-4 text-sm ${row.missed > 0 ? "font-medium text-[var(--color-danger)]" : ""}`}>{row.missed}</td>
                          <td className="px-5 py-4">
                            <span className="flex items-center gap-2">
                              <span className="h-1.5 w-16 rounded-full bg-neutral-100">
                                <span
                                  className={`block h-full rounded-full ${row.score >= 90 ? "bg-[var(--color-accent)]" : "bg-[var(--color-warning)]"}`}
                                  style={{ width: `${row.score}%` }}
                                />
                              </span>
                              <span className="text-sm font-semibold">{row.score}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Cost analytics + weather + inventory */}
              <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-6">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Feed Cost Analytics</h2>
                  <div className="mt-5 grid gap-2.5 text-sm">
                    {[
                      ["Today's cost", "₦192,000"],
                      ["Weekly cost", "₦1.28M"],
                      ["Monthly cost", "₦5.4M"],
                      ["Avg cost per pond", "₦32,000"],
                      ["Avg cost per fish", "₦11.20"],
                      ["Projected monthly", "₦5.6M"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between border-b border-neutral-100 pb-2.5 last:border-0 last:pb-0">
                        <span className="text-[var(--color-text-secondary)]">{label}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-[var(--color-accent)]">Cost trend ↓ 4% vs last month</p>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-6">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Weather Impact</h2>
                  <div className="mt-5 flex items-center gap-4">
                    <span className="text-4xl" aria-hidden="true">🌧️</span>
                    <div>
                      <p className="text-2xl font-bold tracking-[-0.03em]">29°C</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">Humidity 78% · Wind 14 km/h · Rain 80%</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-[var(--color-warning)]">Feeding recommendation</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
                      Heavy rain expected at 4 PM. Move evening feeding earlier or reduce ration by 20% if rain starts during the session.
                    </p>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[var(--color-text-secondary)]">
                    AI insight: appetite typically drops 12% during heavy rainfall on this farm.
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-6 md:col-span-2 xl:col-span-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold tracking-[-0.03em]">Feed Inventory</h2>
                    <span className="rounded-full bg-[var(--color-warning-light)] px-3 py-1 text-xs font-semibold text-[var(--color-warning)]">Low stock</span>
                  </div>
                  <p className="mt-5 text-4xl font-bold tracking-[-0.05em]">8 Bags</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">≈ 11 days remaining at current usage</p>
                  <div className="mt-4 h-2.5 rounded-full bg-neutral-100">
                    <div className="h-full w-[32%] rounded-full bg-[var(--color-warning)]" />
                  </div>
                  <div className="mt-4 grid gap-2.5 text-sm">
                    <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                      <span className="text-[var(--color-text-secondary)]">Today&apos;s usage</span>
                      <span className="font-medium">245 kg (1.6 bags)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">Reorder threshold</span>
                      <span className="font-medium">6 bags</span>
                    </div>
                  </div>
                  <button type="button" className="mt-5 w-full rounded-md bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
                    Quick reorder
                  </button>
                </div>
              </section>

              {/* Health monitoring + notifications */}
              <section className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Health Monitoring</h2>
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                      <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Appetite Score</p>
                      <p className="mt-2 text-2xl font-bold text-[var(--color-accent)]">9.2/10</p>
                    </div>
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                      <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Mortality Today</p>
                      <p className="mt-2 text-2xl font-bold">2 fish</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2.5 text-sm">
                    <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                      <span className="text-[var(--color-text-secondary)]">Feeding behaviour</span>
                      <span className="font-medium text-[var(--color-accent)]">Normal · aggressive surface feeding</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-100 pb-2.5">
                      <span className="text-[var(--color-text-secondary)]">Abnormal activity</span>
                      <span className="font-medium">None detected</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">Growth status</span>
                      <span className="font-medium text-[var(--color-accent)]">On target</span>
                    </div>
                  </div>
                  <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-[var(--color-text-secondary)]">
                    Health alert: Pond E is under treatment — appetite is expected to remain reduced until Friday.
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold tracking-[-0.03em]">Notifications</h2>
                    <span className="rounded-full bg-[var(--color-danger-light)] px-3 py-1 text-xs font-semibold text-[var(--color-danger)]">1 critical</span>
                  </div>
                  <div className="mt-5 space-y-4">
                    {NOTIFICATIONS.map((item) => (
                      <div key={item.text} className="flex gap-3">
                        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notificationDot(item.tone)}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-5">{item.text}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-[var(--color-text-muted)]">{item.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            {/* Right sidebar */}
            <aside className="min-w-0 space-y-5">
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <h3 className="text-sm font-bold">Today&apos;s Tasks</h3>
                <div className="mt-4 space-y-3 text-sm">
                  {[
                    ["Evening feeding · Pond A & D", "4:00 PM"],
                    ["Record Pond E skipped feeding", "Overdue"],
                    ["Receive feed delivery", "2:30 PM"],
                    ["Night feeding · Pond B", "8:30 PM"],
                  ].map(([task, time]) => (
                    <div key={task} className="flex items-start justify-between gap-3">
                      <span className="leading-5">{task}</span>
                      <span className={`shrink-0 font-mono text-[11px] ${time === "Overdue" ? "text-[var(--color-danger)]" : "text-[var(--color-text-muted)]"}`}>{time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <h3 className="text-sm font-bold">Upcoming Feedings</h3>
                <div className="mt-4 space-y-3">
                  {FEEDINGS.filter((record) => record.status === "Scheduled").map((record) => (
                    <button
                      key={record.id}
                      type="button"
                      onClick={() => setSelectedRecord(record)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-left text-sm transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)]"
                    >
                      <span className="font-medium">{record.pond}</span>
                      <span className="font-mono text-[11px] text-[var(--color-text-muted)]">{record.time}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] p-5">
                <h3 className="text-sm font-bold">Farm Health</h3>
                <div className="mt-3 flex items-center gap-4">
                  <p className="text-4xl font-bold tracking-[-0.04em] text-[var(--color-accent)]">96</p>
                  <p className="text-xs leading-5 text-[var(--color-text-secondary)]">Excellent condition · no disease risks · feed efficiency above average.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <h3 className="text-sm font-bold">Weather</h3>
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">🌧️</span>
                  <div>
                    <p className="text-xl font-bold tracking-[-0.03em]">29°C</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">Rain 80% at 4 PM · plan evening feeds early</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <h3 className="text-sm font-bold">Quick Stats</h3>
                <div className="mt-4 grid gap-2.5 text-sm">
                  {[
                    ["Feed used", "245 kg"],
                    ["Sessions done", "4 of 9"],
                    ["Active staff", "3"],
                    ["Avg session", "8 min"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between border-b border-neutral-100 pb-2.5 last:border-0 last:pb-0">
                      <span className="text-[var(--color-text-secondary)]">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <h3 className="text-sm font-bold">AI Suggestions</h3>
                <div className="mt-4 space-y-3 text-xs leading-5 text-[var(--color-text-secondary)]">
                  {AI_RECOMMENDATIONS.slice(0, 3).map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Floating action button — mobile only */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 lg:hidden">
        {fabOpen &&
          FAB_ACTIONS.map((action) => (
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
          onClick={() => setFabOpen((value) => !value)}
          aria-expanded={fabOpen}
          aria-label="Quick actions"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-2xl font-light text-white shadow-[0_4px_12px_rgba(0,0,0,0.12),0_16px_40px_rgba(0,0,0,0.12)] transition-all duration-200 hover:-translate-y-px hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
        >
          <span className={`transition-transform duration-200 ${fabOpen ? "rotate-45" : ""}`}>+</span>
        </button>
      </div>

      {selectedRecord && <FeedingDrawer record={selectedRecord} onClose={() => setSelectedRecord(null)} />}
    </main>
  );
}
