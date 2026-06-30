"use client";

import { useMemo, useState } from "react";

interface NavItem {
  label: string;
  icon: React.JSX.Element;
}

interface KpiCard {
  label: string;
  value: string;
  detail: string;
  icon: React.JSX.Element;
}

interface FeedingTask {
  id: number;
  pond: string;
  time: string;
  feed: string;
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

const sidebarItems: NavItem[] = [
  { label: "Dashboard", icon: <GridIcon /> },
  { label: "Ponds", icon: <PondIcon /> },
  { label: "Fish Batches", icon: <LayersIcon /> },
  { label: "Today's Feedings", icon: <ClockIcon /> },
  { label: "Feed Inventory", icon: <PackageIcon /> },
  { label: "Water Records", icon: <DropletIcon /> },
  { label: "Harvest", icon: <CalendarIcon /> },
  { label: "Reports", icon: <ChartIcon /> },
  { label: "Vendor Deliveries", icon: <TruckIcon /> },
  { label: "AI Assistant", icon: <SparkIcon /> },
  { label: "Settings", icon: <SettingsIcon /> },
];

const kpiCards: KpiCard[] = [
  { label: "Total Fish", value: "400", detail: "Across 4 ponds", icon: <PondIcon /> },
  { label: "Feedings Due", value: "4", detail: "Today's schedule", icon: <ClockIcon /> },
  { label: "Feed Inventory", value: "8 Bags", detail: "11 days remaining", icon: <PackageIcon /> },
  { label: "Harvest Countdown", value: "89 Days", detail: "Estimated", icon: <CalendarIcon /> },
];

const initialTasks: FeedingTask[] = [
  { id: 1, pond: "Pond A", time: "08:00 AM", feed: "2kg Feed", status: "pending" },
  { id: 2, pond: "Pond B", time: "08:15 AM", feed: "2kg Feed", status: "pending" },
  { id: 3, pond: "Pond C", time: "08:30 AM", feed: "2kg Feed", status: "pending" },
  { id: 4, pond: "Pond D", time: "08:45 AM", feed: "2kg Feed", status: "pending" },
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
  { tone: "success", text: "Pond A fed", time: "2m ago" },
  { tone: "success", text: "Feed inventory updated", time: "3m ago" },
  { tone: "success", text: "Vendor ETA changed", time: "16m ago" },
  { tone: "warning", text: "Rain alert received", time: "24m ago" },
  { tone: "success", text: "Batch allocated", time: "1h ago" },
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

function GridIcon(): React.JSX.Element {
  return (
    <IconShell>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </IconShell>
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

function TruckIcon(): React.JSX.Element {
  return (
    <IconShell>
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
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

function SettingsIcon(): React.JSX.Element {
  return (
    <IconShell>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M19.4 15a8 8 0 0 0 .1-2l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L15 5.5h-4L10.6 8a8 8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a8 8 0 0 0 .1 2l-2.1 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1l.4 2.5h4l.4-2.5a8 8 0 0 0 1.7-1l2.4 1 2-3.5L19.4 15z" />
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

export default function DashboardApp(): React.JSX.Element {
  const [tasks, setTasks] = useState<FeedingTask[]>(initialTasks);
  const [selectedPond, setSelectedPond] = useState<string>("Pond A");
  const [selectedDay, setSelectedDay] = useState<number>(24);
  const [selectedPrompt, setSelectedPrompt] = useState<string>(aiPrompts[0]);

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
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[256px] border-r border-[var(--color-border)] bg-white/95 px-4 py-5 backdrop-blur-xl lg:block">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">
            A
          </div>
          <div>
            <p className="text-sm font-bold tracking-[-0.02em]">AquaCore</p>
            <p className="text-[11px] text-[var(--color-text-muted)]">Farm OS</p>
          </div>
        </div>

        <nav className="mt-8 space-y-1">
          {sidebarItems.map((item) => {
            const active = item.label === "Dashboard";

            return (
              <a
                key={item.label}
                href="#"
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
        <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">
                A
              </div>
              <span className="text-sm font-bold">AquaCore</span>
            </div>
            <div className="hidden min-w-0 items-center gap-2 text-sm text-[var(--color-text-secondary)] sm:flex">
              <span className="font-medium text-[var(--color-text-primary)]">Greenwater Farm</span>
              <span>·</span>
              <span>Lagos, Nigeria</span>
              <span>·</span>
              <span>29°C</span>
            </div>
            <button
              type="button"
              className="rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
            >
              New record
            </button>
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
                className="rounded-xl border border-[var(--color-border)] bg-white p-5 transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                    {card.label}
                  </p>
                  <span className="text-[var(--color-text-muted)]">{card.icon}</span>
                </div>
                <p className="mt-5 text-3xl font-bold tracking-[-0.04em]">{card.value}</p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{card.detail}</p>
              </div>
            ))}
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
                          {task.time} · {task.feed}
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
                      <td className="px-5 py-4 text-lg">{trendSymbol(row.trend)}</td>
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
                  </div>
                  <span className="rounded-full bg-[var(--color-accent-light)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                    ETA 3 Days
                  </span>
                </div>
                <div className="mt-6 h-2 rounded-full bg-neutral-100">
                  <div className="h-full w-[76%] rounded-full bg-[var(--color-accent)]" />
                </div>
                <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
                  72 hours remaining · prepare nursery pond and confirm oxygen bags by Thursday.
                </p>
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

          <section className="mb-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-xl border border-[var(--color-border)] bg-white">
              <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
                <h2 className="text-lg font-bold tracking-[-0.03em]">AquaCore AI</h2>
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
                        activity.tone === "warning" ? "bg-[var(--color-warning)]" : "bg-[var(--color-accent)]"
                      }`}
                    >
                      {activity.tone === "warning" ? "!" : <CheckIcon />}
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
        </main>
      </div>
    </div>
  );
}
