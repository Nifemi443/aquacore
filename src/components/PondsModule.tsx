"use client";

import { useMemo, useState } from "react";

type PondStatus = "Healthy" | "Monitor" | "Alert" | "Harvest Ready" | "Empty";
type SpeciesFilter = "All Species" | "Catfish" | "Tilapia";
type StatusFilter = "All Status" | PondStatus;
type SortOption = "Name" | "Health" | "Harvest";
type FeedingStatus = "Completed" | "Due" | "Missed" | "Not scheduled";

interface Pond {
  id: string;
  name: string;
  status: PondStatus;
  species: "Catfish" | "Tilapia" | "None";
  fishCount: number;
  batch: string;
  growthDay: number | null;
  todayFeed: string;
  feedTime: string;
  feedingStatus: FeedingStatus;
  harvestDays: number | null;
  stage: string;
  expectedHarvest: string;
  vendor: string;
  hasSensors: boolean;
  avgWeight: string;
  growthRate: string;
  feedConversion: string;
  mortalityTrend: string;
  notes: string;
}

interface SummaryCard {
  label: string;
  value: string;
  detail: string;
}

interface DrawerFeeding {
  id: string;
  label: string;
  amount: string;
  completed: boolean;
  completedAt?: string;
}

interface FeedingHistoryItem {
  day: string;
  label: string;
  time: string;
}

interface Insight {
  text: string;
}

interface AppNavItem {
  label: string;
  href: string;
  icon: React.JSX.Element;
}

const ponds: Pond[] = [
  {
    id: "pond-a",
    name: "Pond A",
    status: "Healthy",
    species: "Catfish",
    fishCount: 100,
    batch: "Batch #004",
    growthDay: 34,
    todayFeed: "2kg",
    feedTime: "08:00 AM",
    feedingStatus: "Completed",
    harvestDays: 89,
    stage: "Grow-out",
    expectedHarvest: "October 18",
    vendor: "Fresh Aqua Hatchery",
    hasSensors: true,
    avgWeight: "680g",
    growthRate: "+8%",
    feedConversion: "1.42",
    mortalityTrend: "0 losses in 31 days",
    notes: "Water slightly cloudy. Fish feeding aggressively. Need partial water replacement tomorrow.",
  },
  {
    id: "pond-b",
    name: "Pond B",
    status: "Monitor",
    species: "Catfish",
    fishCount: 100,
    batch: "Batch #005",
    growthDay: 34,
    todayFeed: "2kg",
    feedTime: "12:00 PM",
    feedingStatus: "Due",
    harvestDays: 89,
    stage: "Grow-out",
    expectedHarvest: "October 18",
    vendor: "Fresh Aqua Hatchery",
    hasSensors: true,
    avgWeight: "640g",
    growthRate: "+4%",
    feedConversion: "1.56",
    mortalityTrend: "1 loss this week",
    notes: "Watch afternoon feeding response. Water clarity dropped after yesterday's rain.",
  },
  {
    id: "pond-c",
    name: "Pond C",
    status: "Empty",
    species: "None",
    fishCount: 0,
    batch: "No active batch",
    growthDay: null,
    todayFeed: "—",
    feedTime: "—",
    feedingStatus: "Not scheduled",
    harvestDays: null,
    stage: "Empty",
    expectedHarvest: "Not scheduled",
    vendor: "—",
    hasSensors: false,
    avgWeight: "—",
    growthRate: "—",
    feedConversion: "—",
    mortalityTrend: "—",
    notes: "No active fish batch. Assign a batch to begin tracking.",
  },
  {
    id: "pond-d",
    name: "Pond D",
    status: "Harvest Ready",
    species: "Tilapia",
    fishCount: 100,
    batch: "Batch #003",
    growthDay: 96,
    todayFeed: "1.8kg",
    feedTime: "08:45 AM",
    feedingStatus: "Completed",
    harvestDays: 7,
    stage: "Pre-harvest",
    expectedHarvest: "July 15",
    vendor: "Blue Nile Hatchery",
    hasSensors: false,
    avgWeight: "920g",
    growthRate: "+11%",
    feedConversion: "1.31",
    mortalityTrend: "0 losses in 24 days",
    notes: "Schedule buyer confirmation. Fish are responding well and close to harvest weight.",
  },
  {
    id: "pond-e",
    name: "Pond E",
    status: "Alert",
    species: "Catfish",
    fishCount: 100,
    batch: "Batch #006",
    growthDay: 28,
    todayFeed: "2kg",
    feedTime: "08:30 AM",
    feedingStatus: "Missed",
    harvestDays: 95,
    stage: "Grow-out",
    expectedHarvest: "October 24",
    vendor: "Fresh Aqua Hatchery",
    hasSensors: true,
    avgWeight: "510g",
    growthRate: "-3%",
    feedConversion: "1.88",
    mortalityTrend: "3 losses this week",
    notes: "Investigate low dissolved oxygen before evening feeding. Fish surfaced twice this morning.",
  },
  {
    id: "pond-f",
    name: "Pond F",
    status: "Healthy",
    species: "Tilapia",
    fishCount: 100,
    batch: "Batch #007",
    growthDay: 44,
    todayFeed: "1.5kg",
    feedTime: "09:00 AM",
    feedingStatus: "Completed",
    harvestDays: 78,
    stage: "Grow-out",
    expectedHarvest: "September 28",
    vendor: "Blue Nile Hatchery",
    hasSensors: false,
    avgWeight: "430g",
    growthRate: "+7%",
    feedConversion: "1.49",
    mortalityTrend: "0 losses in 18 days",
    notes: "Healthy appetite. Maintain current ration through the week.",
  },
];

const quickChips = ["All", "Active", "Healthy", "Feeding Due", "Harvest Ready", "Empty", "Monitor"] as const;
const appNavItems: AppNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <MiniIcon type="dashboard" /> },
  { label: "Ponds", href: "/ponds", icon: <MiniIcon type="pond" /> },
  { label: "Fish Batches", href: "/batches", icon: <MiniIcon type="batch" /> },
  { label: "Today's Feedings", href: "/feedings", icon: <MiniIcon type="feed" /> },
  { label: "Feed Inventory", href: "/inventory", icon: <MiniIcon type="inventory" /> },
  { label: "Water Records", href: "/water-records", icon: <MiniIcon type="water" /> },
  { label: "Harvest", href: "#", icon: <MiniIcon type="harvest" /> },
  { label: "Reports", href: "#", icon: <MiniIcon type="reports" /> },
  { label: "Vendor Deliveries", href: "#", icon: <MiniIcon type="delivery" /> },
  { label: "AI Assistant", href: "#", icon: <MiniIcon type="ai" /> },
  { label: "Settings", href: "#", icon: <MiniIcon type="settings" /> },
] as const;
const quickActions = [
  { label: "Feed Fish", type: "feed" },
  { label: "Water Record", type: "water" },
  { label: "Record Mortality", type: "loss" },
  { label: "Move Fish", type: "move" },
  { label: "Harvest", type: "harvest" },
  { label: "More", type: "more" },
] as const;
const insights: Insight[] = [
  { text: "Growth is 6% below expected for Pond B compared with the recorded Batch #005 curve." },
  { text: "Feed inventory allocated to Pond A will last 9 more days at the current ration." },
  { text: "Harvest is projected in 84 days for active catfish batches if feed conversion remains stable." },
  { text: "No mortality has been recorded for Pond A for 31 consecutive days." },
  { text: "Heavy rainfall is expected tomorrow. Delay feeding until rainfall subsides." },
];

function formatTime(): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
}

function CheckIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12l5 5L19 7" />
    </svg>
  );
}

function IconButton({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <button
      type="button"
      className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
      aria-label={label}
    >
      {children}
    </button>
  );
}

function MiniIcon({
  type,
}: {
  type:
    | "feed"
    | "water"
    | "loss"
    | "move"
    | "harvest"
    | "more"
    | "dashboard"
    | "pond"
    | "batch"
    | "inventory"
    | "reports"
    | "delivery"
    | "ai"
    | "settings";
}): React.JSX.Element {
  const paths = {
    feed: <path d="M5 12h14M7 8h10M8 16h8" />,
    water: <path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z" />,
    loss: <path d="M12 5v14M5 12h14" />,
    move: <path d="M7 7h10M17 7l-3-3M17 7l-3 3M17 17H7M7 17l3-3M7 17l3 3" />,
    harvest: <path d="M4 14c5-8 11-8 16 0M6 14v5h12v-5" />,
    more: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
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
    inventory: (
      <>
        <path d="M21 8l-9-5-9 5 9 5 9-5z" />
        <path d="M3 8v8l9 5 9-5V8" />
      </>
    ),
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
  };

  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[type]}
    </svg>
  );
}

function statusStyles(status: PondStatus): string {
  if (status === "Healthy") {
    return "border-[var(--color-accent-border)] bg-[var(--color-accent-light)] text-[var(--color-accent)]";
  }

  if (status === "Monitor") {
    return "border-amber-200 bg-[var(--color-warning-light)] text-[var(--color-warning)]";
  }

  if (status === "Alert") {
    return "border-red-200 bg-[var(--color-danger-light)] text-[var(--color-danger)]";
  }

  if (status === "Harvest Ready") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-neutral-200 bg-neutral-100 text-[var(--color-text-secondary)]";
}

function statusDot(status: PondStatus): string {
  if (status === "Healthy") return "bg-[var(--color-accent)]";
  if (status === "Monitor") return "bg-[var(--color-warning)]";
  if (status === "Alert") return "bg-red-500";
  if (status === "Harvest Ready") return "bg-sky-500";
  return "bg-neutral-400";
}

function ProgressChart(): React.JSX.Element {
  return (
    <svg width="100%" height="160" viewBox="0 0 560 160" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="pondGrowthFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D7A5F" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#0D7A5F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1="40" x2="560" y2="40" stroke="#F2F2F2" />
      <line x1="0" y1="80" x2="560" y2="80" stroke="#F2F2F2" />
      <line x1="0" y1="120" x2="560" y2="120" stroke="#F2F2F2" />
      <path d="M20 146 C90 132 142 124 202 102 C274 76 336 66 398 42 C460 20 512 24 540 18 L540 160 L20 160 Z" fill="url(#pondGrowthFill)" />
      <path d="M20 146 C90 132 142 124 202 102 C274 76 336 66 398 42 C460 20 512 24 540 18" fill="none" stroke="#0D7A5F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 148 L540 28" fill="none" stroke="#D4D4D4" strokeWidth="1.5" strokeDasharray="6 5" />
      <circle cx="540" cy="18" r="5" fill="#0D7A5F" />
    </svg>
  );
}

function PondCard({ pond, onOpen }: { pond: Pond; onOpen: (pond: Pond) => void }): React.JSX.Element {
  const empty = pond.status === "Empty";

  return (
    <article className="group rounded-xl border border-[var(--color-border)] bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--color-border-strong)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_16px_40px_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold tracking-[-0.03em] text-[var(--color-text-primary)]">{pond.name}</h3>
          <span className={`mt-2 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles(pond.status)}`}>
            <span className={`h-2 w-2 rounded-full ${statusDot(pond.status)}`} />
            {pond.status}
          </span>
        </div>
        <div className="hidden gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100 lg:flex">
          {quickActions.map((action) => (
            <IconButton key={action.label} label={`${action.label} for ${pond.name}`}>
              <MiniIcon type={action.type} />
            </IconButton>
          ))}
        </div>
      </div>

      <details className="mt-4 lg:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-border-strong)]">
          Quick actions
          <MiniIcon type="more" />
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="flex min-h-11 items-center gap-2 rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text-secondary)] transition-all duration-200 hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
            >
              <MiniIcon type={action.type} />
              {action.label}
            </button>
          ))}
        </div>
      </details>

      {empty ? (
        <div className="mt-8 rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-4">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Currently Empty</p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">No active fish batch. Assign a batch to begin tracking.</p>
          <button type="button" className="mt-4 min-h-11 rounded-md bg-[var(--color-text-primary)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px hover:bg-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
            Assign Fish Batch
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4 border-y border-[var(--color-border)] py-4">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Species</p>
              <p className="mt-1 text-sm font-semibold">{pond.species}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Fish</p>
              <p className="mt-1 text-sm font-semibold">{pond.fishCount}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Current Batch</p>
              <p className="mt-1 text-sm font-semibold">{pond.batch}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Growth</p>
              <p className="mt-1 text-sm font-semibold">Day {pond.growthDay}</p>
            </div>
          </div>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Today&apos;s Feed</p>
                <p className="mt-1 text-sm font-semibold">{pond.todayFeed} · {pond.feedTime}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${pond.feedingStatus === "Completed" ? "bg-emerald-100 text-[var(--color-accent)]" : pond.feedingStatus === "Missed" ? "bg-[var(--color-danger-light)] text-[var(--color-danger)]" : "bg-[var(--color-warning-light)] text-[var(--color-warning)]"}`}>
                {pond.feedingStatus === "Completed" ? "✓ Completed" : pond.feedingStatus}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Expected Harvest</p>
              <p className="mt-1 text-sm font-semibold">{pond.harvestDays} Days</p>
            </div>
            <button type="button" onClick={() => onOpen(pond)} className="min-h-11 rounded-md px-3 py-2 text-sm font-semibold text-[var(--color-accent)] transition-all duration-200 hover:-translate-y-px hover:bg-[var(--color-accent-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
              View Details →
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function PondDrawer({ pond, onClose }: { pond: Pond; onClose: () => void }): React.JSX.Element {
  const [feedings, setFeedings] = useState<DrawerFeeding[]>([
    { id: "morning", label: "Morning Feed", amount: pond.status === "Empty" ? "—" : "2kg", completed: pond.feedingStatus === "Completed", completedAt: pond.feedingStatus === "Completed" ? "08:04 AM" : undefined },
    { id: "evening", label: "Evening Feed", amount: pond.status === "Empty" ? "—" : "2kg", completed: false },
  ]);
  const [losses, setLosses] = useState<number>(0);
  const feedingHistory: FeedingHistoryItem[] = [
    { day: "Today", label: "Morning Feed", time: pond.feedingStatus === "Completed" ? "08:04" : "Pending" },
    { day: "Yesterday", label: "Morning Feed", time: "08:00" },
    { day: "Monday", label: "Morning Feed", time: "08:01" },
  ];

  const completeFeeding = (id: string): void => {
    setFeedings((current) => current.map((feeding) => (feeding.id === id ? { ...feeding, completed: true, completedAt: formatTime() } : feeding)));
  };

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close pond details" onClick={onClose} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <aside className="absolute inset-x-0 bottom-0 top-0 overflow-y-auto bg-white shadow-[0_24px_80px_rgba(0,0,0,0.16)] md:inset-x-auto md:right-0 md:w-[560px]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-white/90 px-5 py-4 backdrop-blur-xl">
          <div>
            <h2 className="text-xl font-bold tracking-[-0.03em]">{pond.name}</h2>
            <span className={`mt-2 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles(pond.status)}`}>
              <span className={`h-2 w-2 rounded-full ${statusDot(pond.status)}`} />
              {pond.status}
            </span>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-border)] transition-all duration-200 hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
            ×
          </button>
        </div>

        <div className="space-y-6 p-5">
          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold">Overview</h3>
            {pond.status === "Empty" ? (
              <div className="mt-4 rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-4">
                <p className="font-semibold">Currently Empty</p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">No active fish batch. Assign a batch to begin tracking.</p>
                <button type="button" className="mt-4 min-h-11 rounded-md bg-[var(--color-text-primary)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-[var(--color-accent)]">
                  Assign Fish Batch
                </button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <Info label="Population" value={`${pond.fishCount} ${pond.species}`} />
                <Info label="Batch" value={pond.batch} />
                <Info label="Current Stage" value={pond.stage} />
                <Info label="Day" value={`${pond.growthDay}`} />
                <Info label="Expected Harvest" value={pond.expectedHarvest} />
                <Info label="Vendor" value={pond.vendor} />
              </div>
            )}
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold">Today&apos;s Feeding</h3>
            <div className="mt-4 grid gap-3">
              {feedings.map((feeding) => (
                <button
                  key={feeding.id}
                  type="button"
                  onClick={() => completeFeeding(feeding.id)}
                  disabled={feeding.completed || pond.status === "Empty"}
                  className={`grid min-h-16 grid-cols-[1fr_auto] items-center gap-4 rounded-lg border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 ${feeding.completed ? "border-[var(--color-accent-border)] bg-[var(--color-accent-light)]" : "border-[var(--color-border)] bg-white hover:-translate-y-px hover:border-[var(--color-border-strong)]"}`}
                >
                  <span>
                    <span className="block font-semibold">{feeding.label}</span>
                    <span className="mt-1 block text-sm text-[var(--color-text-secondary)]">{feeding.amount}</span>
                  </span>
                  <span className="text-right">
                    {feeding.completed ? (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-[var(--color-accent)]"><CheckIcon /> Completed</span>
                        <span className="mt-1 block font-mono text-xs text-[var(--color-text-muted)]">{feeding.completedAt}</span>
                      </>
                    ) : (
                      <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">Mark Complete</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold">Feeding History</h3>
            <div className="mt-4 divide-y divide-[var(--color-border)]">
              {feedingHistory.map((item) => (
                <div key={`${item.day}-${item.label}`} className="grid grid-cols-[88px_24px_1fr_auto] items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <p className="text-xs font-medium text-[var(--color-text-muted)]">{item.day}</p>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      item.time === "Pending"
                        ? "bg-[var(--color-warning-light)] text-[var(--color-warning)]"
                        : "bg-[var(--color-accent)] text-white"
                    }`}
                  >
                    {item.time === "Pending" ? "!" : <CheckIcon />}
                  </span>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{item.label}</p>
                  <p className="font-mono text-xs text-[var(--color-text-muted)]">{item.time}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold">Growth Analytics</h3>
            <div className="mt-4"><ProgressChart /></div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info label="Average Weight" value={pond.avgWeight} />
              <Info label="Growth Rate" value={pond.growthRate} />
              <Info label="Feed Conversion" value={pond.feedConversion} />
              <Info label="Mortality Trend" value={pond.mortalityTrend} />
            </div>
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold">Water Records</h3>
            <div className="mt-4 grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <InputLabel label="Temperature" value="28°C" />
                <InputLabel label="pH" value="7.1" />
                <InputLabel label="Water Color" value="Light green" />
                <InputLabel label="Clarity" value="82%" />
              </div>
              {pond.hasSensors ? (
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] p-3">
                  <Info label="Dissolved Oxygen" value="6.2 mg/L" />
                  <Info label="Ammonia" value="0.02 ppm" />
                  <Info label="Water Level" value="Normal" />
                  <Info label="Sensor Status" value="Online" />
                </div>
              ) : (
                <textarea className="min-h-24 rounded-md border border-[var(--color-border)] bg-white p-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)]" defaultValue="Manual record: water surface calm, clarity acceptable." />
              )}
            </div>
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold">Feed Consumption</h3>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <Info label="Current Feed" value="Coppens · 2mm" />
              <Info label="Bags Remaining" value="8" />
              <Info label="Average Daily Usage" value="0.7 Bags" />
              <Info label="Projected Stock Out" value="11 Days" />
            </div>
            <div className="mt-4 h-2 rounded-full bg-neutral-100"><div className="h-full w-[64%] rounded-full bg-[var(--color-accent)]" /></div>
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold">Mortality Log</h3>
            <div className="mt-4 flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3">
              <span className="text-sm font-medium">Today&apos;s Losses</span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setLosses((value) => Math.max(0, value - 1))} className="h-9 w-9 rounded-md border border-[var(--color-border)]">−</button>
                <span className="w-8 text-center font-semibold">{losses}</span>
                <button type="button" onClick={() => setLosses((value) => value + 1)} className="h-9 w-9 rounded-md border border-[var(--color-border)]">+</button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {["Disease", "Water Quality", "Transport", "Other"].map((reason) => (
                <button key={reason} type="button" className="min-h-11 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm transition-all duration-200 hover:bg-[var(--color-surface)]">{reason}</button>
              ))}
            </div>
            <button type="button" className="mt-3 min-h-11 w-full rounded-md bg-[var(--color-text-primary)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-[var(--color-accent)]">Save Mortality Record</button>
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold">Pond Notes</h3>
            <textarea className="mt-4 min-h-28 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm leading-6 outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)]" defaultValue={pond.notes} />
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold">Reports</h3>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {["Feed History", "Growth History", "Mortality", "Expenses", "Water Records", "Harvest Estimate"].map((report) => (
                <div key={report} className="rounded-md border border-[var(--color-border)] p-3">{report}</div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              {["PDF", "Excel", "Print"].map((exportType) => (
                <button key={exportType} type="button" className="min-h-11 rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-[var(--color-surface)]">{exportType}</button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] p-5">
            <h3 className="text-sm font-bold">AI Insights</h3>
            <div className="mt-4 divide-y divide-[var(--color-accent-border)]">
              {insights.map((insight) => (
                <p key={insight.text} className="py-3 text-sm leading-6 text-[var(--color-text-primary)]">{insight.text}</p>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 font-semibold text-[var(--color-text-primary)]">{value}</p>
    </div>
  );
}

function InputLabel({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">{label}</span>
      <input className="mt-2 h-11 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)]" defaultValue={value} />
    </label>
  );
}

export default function PondsModule(): React.JSX.Element {
  const [query, setQuery] = useState<string>("");
  const [speciesFilter, setSpeciesFilter] = useState<SpeciesFilter>("All Species");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All Status");
  const [sort, setSort] = useState<SortOption>("Name");
  const [chip, setChip] = useState<(typeof quickChips)[number]>("All");
  const [selectedPond, setSelectedPond] = useState<Pond | null>(null);

  const summaryCards: SummaryCard[] = [
    { label: "Total Ponds", value: "12", detail: "Across Greenwater Farm" },
    { label: "Fish Population", value: "1,200", detail: "Tracked across active ponds" },
    { label: "Feedings Due", value: "5", detail: "Remaining today" },
    { label: "Healthy Ponds", value: "10", detail: "No active alerts" },
    { label: "Needs Attention", value: "2", detail: "Monitor or alert status" },
    { label: "Harvest Ready", value: "1", detail: "Ready within 7 days" },
  ];

  const filteredPonds = useMemo(() => {
    return ponds
      .filter((pond) => pond.name.toLowerCase().includes(query.toLowerCase()))
      .filter((pond) => speciesFilter === "All Species" || pond.species === speciesFilter)
      .filter((pond) => statusFilter === "All Status" || pond.status === statusFilter)
      .filter((pond) => {
        if (chip === "All") return true;
        if (chip === "Active") return pond.status !== "Empty";
        if (chip === "Feeding Due") return pond.feedingStatus === "Due" || pond.feedingStatus === "Missed";
        return pond.status === chip;
      })
      .sort((a, b) => {
        if (sort === "Harvest") return (a.harvestDays ?? 999) - (b.harvestDays ?? 999);
        if (sort === "Health") return a.status.localeCompare(b.status);
        return a.name.localeCompare(b.name);
      });
  }, [chip, query, sort, speciesFilter, statusFilter]);

  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[256px] border-r border-[var(--color-border)] bg-white/95 px-4 py-5 backdrop-blur-xl lg:block">
        <a
          href="/dashboard"
          className="flex items-center gap-2 px-2 transition-all duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">
            A
          </div>
          <div>
            <p className="text-sm font-bold tracking-[-0.02em]">AquaCore</p>
            <p className="text-[11px] text-[var(--color-text-muted)]">Farm OS</p>
          </div>
        </a>

        <nav className="mt-8 space-y-1">
          {appNavItems.map((item) => {
            const active = item.label === "Ponds";

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
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-[256px]">
        <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-xl lg:hidden">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <a
              href="/dashboard"
              className="flex items-center gap-2 transition-all duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">
                A
              </div>
              <div>
                <p className="text-sm font-bold tracking-[-0.02em]">AquaCore</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">Ponds</p>
              </div>
            </a>
            <a
              href="/dashboard"
              className="rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-all duration-200 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
            >
              Dashboard
            </a>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="mb-6 rounded-xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">Greenwater Farm</p>
              <h1 className="mt-2 text-[clamp(32px,4vw,52px)] font-bold tracking-[-0.05em]">Ponds</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">Manage every pond across your farm.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["12 Active Ponds", "2 Empty", "1 Harvest Ready"].map((item) => (
                  <span key={item} className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">{item}</span>
                ))}
              </div>
            </div>
            <button type="button" className="min-h-11 rounded-md bg-[var(--color-text-primary)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px hover:bg-[var(--color-accent)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
              + Add Pond
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-[var(--color-border)] bg-white p-5 transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
              <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">{card.label}</p>
              <p className="mt-4 text-3xl font-bold tracking-[-0.04em]">{card.value}</p>
              <p className="mt-2 text-xs leading-5 text-[var(--color-text-secondary)]">{card.detail}</p>
            </div>
          ))}
        </section>

        <section className="mb-6 rounded-xl border border-[var(--color-border)] bg-white p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px_140px]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ponds..." className="h-11 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)]" />
            <select value={speciesFilter} onChange={(event) => setSpeciesFilter(event.target.value as SpeciesFilter)} className="h-11 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-accent)]">
              {["All Species", "Catfish", "Tilapia"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="h-11 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-accent)]">
              {["All Status", "Healthy", "Monitor", "Alert", "Harvest Ready", "Empty"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="h-11 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-accent)]">
              {["Name", "Health", "Harvest"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {quickChips.map((item) => (
              <button key={item} type="button" onClick={() => setChip(item)} className={`min-h-10 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 ${chip === item ? "border-[var(--color-accent-border)] bg-[var(--color-accent-light)] text-[var(--color-accent)]" : "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"}`}>
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPonds.map((pond) => <PondCard key={pond.id} pond={pond} onOpen={setSelectedPond} />)}
        </section>
        </div>
      </div>

      {selectedPond && <PondDrawer pond={selectedPond} onClose={() => setSelectedPond(null)} />}
    </main>
  );
}
