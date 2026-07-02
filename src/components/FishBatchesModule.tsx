"use client";

import { useMemo, useState } from "react";

type HealthStatus = "Healthy" | "Observation" | "Treatment" | "Critical";
type GrowthStatus = "Ahead" | "On Track" | "Behind";
type BatchStatus = "Growing" | "Transferred" | "Harvested" | "Archived";

interface Batch {
  id: string;
  species: "Catfish" | "Tilapia";
  breed: string;
  pond: string;
  population: number;
  stocked: number;
  mortality: number;
  avgWeight: string;
  biomass: string;
  ageDays: number;
  feedConsumed: string;
  fcr: string;
  health: HealthStatus;
  growth: GrowthStatus;
  stockingDate: string;
  expectedHarvest: string;
  revenue: string;
  status: BatchStatus;
  vendor: string;
  fingerlingSize: string;
  purchaseCost: string;
  healthScore: number;
  harvestReadiness: number;
}

interface KpiCard {
  label: string;
  value: string;
  trend: string;
  trendTone: "up" | "down" | "flat";
}

interface FeedingRecord {
  slot: string;
  quantity: string;
  type: string;
  staff: string;
  status: "Done" | "Missed";
}

interface MortalityRecord {
  date: string;
  quantity: number;
  cause: string;
  loss: string;
}

interface TimelineEvent {
  label: string;
  detail: string;
  date: string;
}

interface ExpenseRow {
  label: string;
  amount: string;
}

const BATCHES: Batch[] = [
  {
    id: "BAT-004", species: "Catfish", breed: "Dutch Clarias", pond: "Pond A", population: 2860, stocked: 3000,
    mortality: 140, avgWeight: "680g", biomass: "1,944 kg", ageDays: 94, feedConsumed: "2,780 kg", fcr: "1.42",
    health: "Healthy", growth: "Ahead", stockingDate: "Mar 30", expectedHarvest: "Oct 18", revenue: "₦4.2M",
    status: "Growing", vendor: "Fresh Aqua Hatchery", fingerlingSize: "8g", purchaseCost: "₦360,000",
    healthScore: 94, harvestReadiness: 72,
  },
  {
    id: "BAT-005", species: "Catfish", breed: "Local Clarias", pond: "Pond B", population: 2915, stocked: 3000,
    mortality: 85, avgWeight: "640g", biomass: "1,866 kg", ageDays: 94, feedConsumed: "2,910 kg", fcr: "1.56",
    health: "Observation", growth: "On Track", stockingDate: "Mar 30", expectedHarvest: "Oct 18", revenue: "₦3.9M",
    status: "Growing", vendor: "Fresh Aqua Hatchery", fingerlingSize: "8g", purchaseCost: "₦345,000",
    healthScore: 86, harvestReadiness: 64,
  },
  {
    id: "BAT-003", species: "Tilapia", breed: "GIFT", pond: "Pond D", population: 3120, stocked: 3200,
    mortality: 80, avgWeight: "920g", biomass: "2,870 kg", ageDays: 156, feedConsumed: "4,020 kg", fcr: "1.31",
    health: "Healthy", growth: "Ahead", stockingDate: "Jan 27", expectedHarvest: "Jul 15", revenue: "₦5.6M",
    status: "Growing", vendor: "Blue Nile Hatchery", fingerlingSize: "12g", purchaseCost: "₦410,000",
    healthScore: 96, harvestReadiness: 94,
  },
  {
    id: "BAT-006", species: "Catfish", breed: "Dutch Clarias", pond: "Pond E", population: 2540, stocked: 2800,
    mortality: 260, avgWeight: "510g", biomass: "1,295 kg", ageDays: 88, feedConsumed: "2,430 kg", fcr: "1.88",
    health: "Treatment", growth: "Behind", stockingDate: "Apr 5", expectedHarvest: "Oct 24", revenue: "₦2.8M",
    status: "Growing", vendor: "Fresh Aqua Hatchery", fingerlingSize: "6g", purchaseCost: "₦308,000",
    healthScore: 68, harvestReadiness: 41,
  },
  {
    id: "BAT-007", species: "Tilapia", breed: "GIFT", pond: "Pond F", population: 3060, stocked: 3100,
    mortality: 40, avgWeight: "430g", biomass: "1,316 kg", ageDays: 104, feedConsumed: "1,890 kg", fcr: "1.49",
    health: "Healthy", growth: "On Track", stockingDate: "Mar 20", expectedHarvest: "Sep 28", revenue: "₦3.1M",
    status: "Growing", vendor: "Blue Nile Hatchery", fingerlingSize: "10g", purchaseCost: "₦372,000",
    healthScore: 91, harvestReadiness: 55,
  },
  {
    id: "BAT-002", species: "Catfish", breed: "Local Clarias", pond: "—", population: 0, stocked: 2900,
    mortality: 122, avgWeight: "1.02kg", biomass: "—", ageDays: 189, feedConsumed: "4,480 kg", fcr: "1.47",
    health: "Healthy", growth: "On Track", stockingDate: "Dec 26", expectedHarvest: "Harvested Jul 2", revenue: "₦5.1M",
    status: "Harvested", vendor: "Fresh Aqua Hatchery", fingerlingSize: "8g", purchaseCost: "₦334,000",
    healthScore: 92, harvestReadiness: 100,
  },
];

const KPI_CARDS: KpiCard[] = [
  { label: "Active Batches", value: "12", trend: "↑ 2 this month", trendTone: "up" },
  { label: "Total Fish", value: "18,420", trend: "↑ 1.2% this week", trendTone: "up" },
  { label: "Survival Rate", value: "96.4%", trend: "↑ 0.3%", trendTone: "up" },
  { label: "Average Weight", value: "620g", trend: "↑ 42g in 7 days", trendTone: "up" },
  { label: "Harvests Due", value: "4", trend: "Next in 7 days", trendTone: "flat" },
  { label: "Est. Farm Value", value: "₦14.8M", trend: "↑ ₦430k", trendTone: "up" },
];

const TABLE_HEADERS = [
  "Batch ID", "Species", "Pond", "Population", "Stocked", "Mortality", "Survival %", "Avg Weight", "Biomass",
  "Age", "Feed Consumed", "FCR", "Health", "Growth", "Stocked On", "Harvest", "Est. Revenue", "Status", "Actions",
] as const;

const ROW_ACTIONS = [
  "View", "Edit", "Transfer", "Record Feed", "Record Weight", "Record Mortality", "Treat", "Harvest", "Duplicate", "Delete",
] as const;

const FAB_ACTIONS = [
  "Record Feed", "Record Weight", "Record Mortality", "Treatment", "Transfer", "Harvest", "Water Test",
] as const;

const FEEDING_HISTORY: FeedingRecord[] = [
  { slot: "Morning Feed", quantity: "38 kg", type: "Coppens 4mm", staff: "Ayo", status: "Done" },
  { slot: "Afternoon Feed", quantity: "34 kg", type: "Coppens 4mm", staff: "Ngozi", status: "Done" },
  { slot: "Evening Feed", quantity: "36 kg", type: "Coppens 4mm", staff: "Ayo", status: "Done" },
  { slot: "Night Feed", quantity: "—", type: "Not scheduled", staff: "—", status: "Missed" },
];

const MORTALITY_RECORDS: MortalityRecord[] = [
  { date: "Jun 28", quantity: 4, cause: "Low Oxygen", loss: "₦6,800" },
  { date: "Jun 14", quantity: 2, cause: "Handling", loss: "₦3,200" },
  { date: "May 30", quantity: 7, cause: "Disease", loss: "₦9,100" },
];

const TIMELINE: TimelineEvent[] = [
  { label: "Weight Recorded", detail: "Sample of 30 fish · avg 680g", date: "Today · 09:12" },
  { label: "Fed", detail: "Morning feed · 38kg Coppens 4mm", date: "Today · 07:04" },
  { label: "Water Alert", detail: "D.O. dipped to 5.6 mg/L, recovered", date: "Yesterday · 15:40" },
  { label: "Treatment Applied", detail: "Salt bath · preventive", date: "Jun 24" },
  { label: "Transferred", detail: "Nursery Pond 2 → Pond A · 2,940 fish", date: "May 12" },
  { label: "Stocked", detail: "3,000 fingerlings · 8g avg", date: "Mar 30" },
  { label: "Batch Created", detail: "Fresh Aqua Hatchery · ₦360,000", date: "Mar 28" },
];

const EXPENSES: ExpenseRow[] = [
  { label: "Fingerling Purchase", amount: "₦360,000" },
  { label: "Feed Cost", amount: "₦1,240,000" },
  { label: "Medication", amount: "₦48,000" },
  { label: "Transportation", amount: "₦36,000" },
  { label: "Electricity Allocation", amount: "₦62,000" },
  { label: "Labour Allocation", amount: "₦180,000" },
  { label: "Maintenance", amount: "₦28,000" },
  { label: "Miscellaneous", amount: "₦19,000" },
];

const AI_INSIGHTS = [
  "Growth is 12% ahead of schedule based on the last three weight samples.",
  "Feed usage is above expected levels — reduce daily ration by 5%.",
  "Mortality is below farm average; no losses recorded in the last 4 days.",
  "Current biomass is approaching the pond's recommended maximum.",
  "Harvest can begin 8 days earlier than planned at current growth rate.",
  "Estimated profit increased by ₦430,000 since last projection.",
  "This batch has the highest survival rate on the farm.",
] as const;

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Ponds", href: "/ponds", icon: "pond" },
  { label: "Fish Batches", href: "/batches", icon: "batch" },
  { label: "Today's Feedings", href: "#", icon: "feed" },
  { label: "Feed Inventory", href: "#", icon: "inventory" },
  { label: "Water Records", href: "#", icon: "water" },
  { label: "Harvest", href: "#", icon: "harvest" },
  { label: "Reports", href: "#", icon: "reports" },
  { label: "Vendor Deliveries", href: "#", icon: "delivery" },
  { label: "AI Assistant", href: "#", icon: "ai" },
  { label: "Settings", href: "#", icon: "settings" },
] as const;

type NavIconType = (typeof NAV_ITEMS)[number]["icon"];

function NavIcon({ type }: { type: NavIconType }): React.JSX.Element {
  const paths: Record<NavIconType, React.ReactNode> = {
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
  };

  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[type]}
    </svg>
  );
}

function healthBadge(health: HealthStatus): string {
  if (health === "Healthy") return "bg-[var(--color-accent-light)] text-[var(--color-accent)] border-[var(--color-accent-border)]";
  if (health === "Observation") return "bg-[var(--color-warning-light)] text-[var(--color-warning)] border-amber-200";
  if (health === "Treatment") return "bg-orange-50 text-orange-700 border-orange-200";
  return "bg-[var(--color-danger-light)] text-[var(--color-danger)] border-red-200";
}

function growthBadge(growth: GrowthStatus): string {
  if (growth === "Ahead") return "bg-[var(--color-accent-light)] text-[var(--color-accent)]";
  if (growth === "On Track") return "bg-neutral-100 text-[var(--color-text-secondary)]";
  return "bg-[var(--color-warning-light)] text-[var(--color-warning)]";
}

function statusBadge(status: BatchStatus): string {
  if (status === "Growing") return "bg-[var(--color-accent-light)] text-[var(--color-accent)]";
  if (status === "Transferred") return "bg-sky-50 text-sky-700";
  if (status === "Harvested") return "bg-neutral-100 text-[var(--color-text-secondary)]";
  return "bg-neutral-100 text-[var(--color-text-muted)]";
}

function survivalRate(batch: Batch): string {
  return `${(((batch.stocked - batch.mortality) / batch.stocked) * 100).toFixed(1)}%`;
}

function TrendChart({ id }: { id: string }): React.JSX.Element {
  return (
    <svg width="100%" height="150" viewBox="0 0 560 150" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D7A5F" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#0D7A5F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1="38" x2="560" y2="38" stroke="#F2F2F2" />
      <line x1="0" y1="76" x2="560" y2="76" stroke="#F2F2F2" />
      <line x1="0" y1="114" x2="560" y2="114" stroke="#F2F2F2" />
      <path d="M20 136 C90 124 148 114 208 94 C280 70 340 60 404 40 C464 22 516 22 540 16 L540 150 L20 150 Z" fill={`url(#${id})`} />
      <path d="M20 136 C90 124 148 114 208 94 C280 70 340 60 404 40 C464 22 516 22 540 16" fill="none" stroke="#0D7A5F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 140 L540 26" fill="none" stroke="#D4D4D4" strokeWidth="1.5" strokeDasharray="6 5" />
      <circle cx="540" cy="16" r="5" fill="#0D7A5F" />
    </svg>
  );
}

function CircularScore({ score }: { score: number }): React.JSX.Element {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <svg width="128" height="128" viewBox="0 0 128 128" aria-hidden="true">
      <circle cx="64" cy="64" r={radius} fill="none" stroke="#F2F2F2" strokeWidth="10" />
      <circle
        cx="64"
        cy="64"
        r={radius}
        fill="none"
        stroke="#0D7A5F"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 64 64)"
      />
      <text x="64" y="60" textAnchor="middle" fontSize="28" fontWeight="700" fill="#0A0A0A">
        {score}
      </text>
      <text x="64" y="80" textAnchor="middle" fontSize="12" fill="#A3A3A3">
        /100
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

function SectionCard({ title, children, tone = "default" }: { title: string; children: React.ReactNode; tone?: "default" | "accent" }): React.JSX.Element {
  return (
    <section
      className={`rounded-2xl border p-5 ${
        tone === "accent"
          ? "border-[var(--color-accent-border)] bg-[var(--color-accent-light)]"
          : "border-[var(--color-border)] bg-white"
      }`}
    >
      <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function BatchDrawer({ batch, onClose }: { batch: Batch; onClose: () => void }): React.JSX.Element {
  const totalExpenses = "₦1,973,000";

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close batch details" onClick={onClose} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <aside className="absolute inset-x-0 bottom-0 top-0 overflow-y-auto bg-[var(--color-surface)] shadow-[0_24px_80px_rgba(0,0,0,0.16)] md:inset-x-auto md:right-0 md:w-[620px]">
        <div className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-white/90 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold tracking-[-0.03em]">{batch.id}</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(batch.status)}`}>{batch.status}</span>
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {batch.species} · {batch.breed} · {batch.pond}
              </p>
            </div>
            <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-border)] bg-white transition-all duration-200 hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
              ×
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Generate QR", "Print Label", "Export PDF"].map((action) => (
              <button key={action} type="button" className="min-h-9 rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
                {action}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5 p-5">
          {batch.health === "Treatment" && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm font-semibold text-orange-700">Treatment in progress · Growth delayed</p>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                Mortality increased this month and FCR is above target. Follow the treatment schedule and re-sample weight on Friday.
              </p>
            </div>
          )}

          <SectionCard title="Overview">
            <div className="mb-5 flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="grid h-20 w-20 shrink-0 grid-cols-4 gap-0.5 rounded-md border border-[var(--color-border)] bg-white p-1.5" aria-label={`QR code for ${batch.id}`}>
                {[1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1].map((cell, index) => (
                  <span key={index} className={`rounded-[1px] ${cell ? "bg-[var(--color-text-primary)]" : "bg-transparent"}`} />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold">{batch.id}</p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Scan to open this batch on mobile or print a pond-side label.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Info label="Assigned Pond" value={batch.pond} />
              <Info label="Species / Breed" value={`${batch.species} · ${batch.breed}`} />
              <Info label="Supplier" value={batch.vendor} />
              <Info label="Purchase Cost" value={batch.purchaseCost} />
              <Info label="Fingerling Size" value={batch.fingerlingSize} />
              <Info label="Source Hatchery" value={batch.vendor} />
              <Info label="Stocking Date" value={batch.stockingDate} />
              <Info label="Expected Harvest" value={batch.expectedHarvest} />
              <Info label="Current Population" value={batch.population.toLocaleString()} />
              <Info label="Original Population" value={batch.stocked.toLocaleString()} />
              <Info label="Mortality Count" value={`${batch.mortality}`} />
              <Info label="Survival Rate" value={survivalRate(batch)} />
              <Info label="Average Weight" value={batch.avgWeight} />
              <Info label="Current Biomass" value={batch.biomass} />
            </div>
          </SectionCard>

          <SectionCard title="AI Health Score">
            <div className="flex flex-col items-center gap-5 sm:flex-row">
              <CircularScore score={batch.healthScore} />
              <ul className="space-y-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                <li>Growth is ahead of schedule.</li>
                <li>Feed conversion remains efficient at {batch.fcr}.</li>
                <li>Mortality is below farm average.</li>
                <li>Expected harvest in 27 days.</li>
              </ul>
            </div>
          </SectionCard>

          <SectionCard title="Growth Analytics">
            <div className="mb-3 flex flex-wrap gap-2">
              {["Weekly Growth", "Avg Weight", "Biomass", "Mortality", "Feed", "FCR", "Harvest Curve", "Population"].map((tab, index) => (
                <span key={tab} className={`rounded-full px-3 py-1 text-xs font-medium ${index === 0 ? "bg-[var(--color-text-primary)] text-white" : "bg-neutral-100 text-[var(--color-text-secondary)]"}`}>
                  {tab}
                </span>
              ))}
            </div>
            <TrendChart id="batchGrowthFill" />
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Info label="Avg Weight" value={batch.avgWeight} />
              <Info label="Biomass" value={batch.biomass} />
              <Info label="FCR" value={batch.fcr} />
              <Info label="Age" value={`${batch.ageDays} days`} />
            </div>
          </SectionCard>

          <SectionCard title="Feeding History">
            <div className="mb-4 flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
              <span className="text-sm font-medium">Today · Compliance</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-[var(--color-accent)]">75%</span>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {FEEDING_HISTORY.map((record) => (
                <div key={record.slot} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3">
                  <div>
                    <p className="text-sm font-semibold">{record.slot}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                      {record.quantity} · {record.type} · {record.staff}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${record.status === "Done" ? "bg-emerald-100 text-[var(--color-accent)]" : "bg-neutral-100 text-[var(--color-text-muted)]"}`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Weight Sampling">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Info label="Sample Size" value="30 fish" />
              <Info label="Average Weight" value={batch.avgWeight} />
              <Info label="Largest Fish" value="840g" />
              <Info label="Smallest Fish" value="490g" />
              <Info label="Growth" value="+6.4% vs last" />
              <Info label="Sampled" value="Today · Ayo" />
            </div>
            <div className="mt-4"><TrendChart id="batchWeightFill" /></div>
          </SectionCard>

          <SectionCard title="Mortality Management">
            <div className="divide-y divide-[var(--color-border)]">
              {MORTALITY_RECORDS.map((record) => (
                <div key={record.date} className="grid grid-cols-[64px_1fr_auto] items-center gap-3 py-3 text-sm">
                  <span className="text-xs font-medium text-[var(--color-text-muted)]">{record.date}</span>
                  <span>
                    <span className="font-semibold">{record.quantity} lost</span>
                    <span className="text-[var(--color-text-secondary)]"> · {record.cause}</span>
                  </span>
                  <span className="text-xs font-medium text-[var(--color-danger)]">{record.loss}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] px-4 py-3 text-sm text-[var(--color-text-primary)]">
              Mortality trend is declining — {batch.mortality} total losses ({survivalRate(batch)} survival).
            </p>
          </SectionCard>

          <SectionCard title="Health Records">
            <div className="divide-y divide-[var(--color-border)] text-sm">
              {[
                { label: "Salt bath treatment", detail: "Preventive · Completed · Jun 24", tone: "done" },
                { label: "Vitamin C supplement", detail: "In feed · Ongoing daily", tone: "active" },
                { label: "Vaccination", detail: "Not required for this species", tone: "muted" },
                { label: "Vet review", detail: "Scheduled · Friday · Dr. Bello", tone: "active" },
              ].map((record) => (
                <div key={record.label} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold">{record.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{record.detail}</p>
                  </div>
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${record.tone === "done" ? "bg-[var(--color-accent)]" : record.tone === "active" ? "bg-amber-400" : "bg-neutral-300"}`} />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Water Quality (synced from Pond)">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Info label="Temperature" value="28°C" />
              <Info label="pH" value="7.1" />
              <Info label="D.O." value="6.2 mg/L" />
              <Info label="Ammonia" value="0.02 ppm" />
              <Info label="Nitrite" value="0.01 ppm" />
              <Info label="Salinity" value="0.4 ppt" />
              <Info label="Water Level" value="Normal" />
              <Info label="Measured" value="07:45 AM" />
            </div>
            <p className="mt-4 text-xs text-[var(--color-text-muted)]">All readings within safe range · synced automatically from {batch.pond}.</p>
          </SectionCard>

          <SectionCard title="Transfer History">
            <div className="divide-y divide-[var(--color-border)] text-sm">
              <div className="grid gap-1 py-3">
                <p className="font-semibold">Nursery Pond 2 → {batch.pond}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">2,940 fish · Size grading · May 12 · Supervisor: John</p>
              </div>
              <div className="grid gap-1 py-3">
                <p className="font-semibold">Hatchery → Nursery Pond 2</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{batch.stocked.toLocaleString()} fingerlings · Initial stocking · {batch.stockingDate} · Supervisor: John</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Expense Tracking">
            <div className="divide-y divide-[var(--color-border)] text-sm">
              {EXPENSES.map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2.5">
                  <span className="text-[var(--color-text-secondary)]">{row.label}</span>
                  <span className="font-medium">{row.amount}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <Info label="Running Total" value={totalExpenses} />
              <Info label="Cost per Fish" value="₦690" />
              <Info label="Cost per Kg" value="₦1,015" />
            </div>
          </SectionCard>

          <SectionCard title="Revenue & Profit Forecast">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Info label="Expected Harvest Weight" value="2,860 kg" />
              <Info label="Market Price" value="₦1,470/kg" />
              <Info label="Est. Revenue" value={batch.revenue} />
              <Info label="Est. Profit" value="₦2.23M" />
              <Info label="ROI" value="113%" />
              <Info label="Profit Margin" value="53%" />
              <Info label="Break-even" value="1,342 kg" />
              <Info label="Projected Net" value="₦2.05M" />
            </div>
          </SectionCard>

          <SectionCard title="Harvest Planner">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium">Harvest Readiness</span>
              <span className="text-sm font-bold text-[var(--color-accent)]">{batch.harvestReadiness}%</span>
            </div>
            <div className="h-2 rounded-full bg-neutral-100">
              <div className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500" style={{ width: `${batch.harvestReadiness}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Info label="Harvest Window" value="Oct 10 – Oct 24" />
              <Info label="Target Weight" value="1kg avg" />
              <Info label="Expected Quantity" value="2,860 kg" />
              <Info label="Buyer" value="Lagos Fish Market Co." />
              <Info label="Transport" value="Confirmed" />
              <Info label="Packaging" value="Pending" />
            </div>
            <button type="button" className="mt-4 min-h-11 w-full rounded-md bg-[var(--color-text-primary)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
              Generate Harvest Report
            </button>
          </SectionCard>

          <SectionCard title="Documents">
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              {["Purchase Invoice.pdf", "Health Certificate.pdf", "Lab Report Jun.pdf", "Stocking Photos", "Feed Receipts", "Transport Docs"].map((doc) => (
                <div key={doc} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]">
                  {doc}
                </div>
              ))}
            </div>
            <button type="button" className="mt-3 min-h-11 w-full rounded-md border border-dashed border-[var(--color-border-strong)] px-4 py-2 text-sm text-[var(--color-text-secondary)] transition-all duration-200 hover:bg-[var(--color-surface)]">
              + Upload document
            </button>
          </SectionCard>

          <SectionCard title="Notes">
            <div className="mb-3 rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] p-3 text-sm">
              <p className="text-xs font-semibold text-[var(--color-accent)]">📌 Pinned · @John · Jun 30</p>
              <p className="mt-1 leading-6">Buyer wants confirmation one week before harvest. Tag the harvest record when scheduled.</p>
            </div>
            <textarea
              className="min-h-24 w-full rounded-md border border-[var(--color-border)] bg-white p-3 text-sm leading-6 outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)]"
              placeholder="Add a note… use @ to mention staff"
            />
          </SectionCard>

          <SectionCard title="Timeline">
            <div className="space-y-0">
              {TIMELINE.map((event, index) => (
                <div key={event.label + event.date} className="relative flex gap-4 pb-5 last:pb-0">
                  {index < TIMELINE.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-[var(--color-border)]" />}
                  <span className="relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                  <div>
                    <p className="text-sm font-semibold">{event.label}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{event.detail}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="AI Insights" tone="accent">
            <div className="divide-y divide-[var(--color-accent-border)]">
              {AI_INSIGHTS.map((insight) => (
                <p key={insight} className="py-3 text-sm leading-6">{insight}</p>
              ))}
            </div>
          </SectionCard>
        </div>
      </aside>
    </div>
  );
}

export default function FishBatchesModule(): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | BatchStatus>("All");
  const [healthFilter, setHealthFilter] = useState<"All" | HealthStatus>("All");
  const [speciesFilter, setSpeciesFilter] = useState<"All" | "Catfish" | "Tilapia">("All");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [openActions, setOpenActions] = useState<string | null>(null);
  const [fabOpen, setFabOpen] = useState(false);

  const filteredBatches = useMemo(() => {
    const term = query.toLowerCase();
    return BATCHES.filter(
      (batch) =>
        (batch.id.toLowerCase().includes(term) ||
          batch.pond.toLowerCase().includes(term) ||
          batch.species.toLowerCase().includes(term) ||
          batch.vendor.toLowerCase().includes(term)) &&
        (statusFilter === "All" || batch.status === statusFilter) &&
        (healthFilter === "All" || batch.health === healthFilter) &&
        (speciesFilter === "All" || batch.species === speciesFilter),
    );
  }, [healthFilter, query, speciesFilter, statusFilter]);

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
            const active = item.label === "Fish Batches";
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
                <p className="text-[11px] text-[var(--color-text-muted)]">Fish Batches</p>
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
                <h1 className="text-[clamp(30px,4vw,48px)] font-bold tracking-[-0.05em]">Fish Batches</h1>
                <p className="mt-2 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
                  Track every batch from stocking to harvest across all ponds.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="min-h-11 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px hover:bg-emerald-900 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
                  + New Batch
                </button>
                {["Transfer Batch", "Record Mortality", "Harvest Batch", "Export Report"].map((action) => (
                  <button key={action} type="button" className="min-h-11 rounded-md border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* Alerts */}
          <div className="mb-6 grid gap-3 lg:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-warning)] text-xs font-bold text-white">!</span>
              <p className="text-sm leading-6 text-[var(--color-text-primary)]">
                <span className="font-semibold">Poor FCR on BAT-006.</span> Feed conversion is 1.88 against a 1.5 target — review ration and water quality in Pond E.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">→</span>
              <p className="text-sm leading-6 text-[var(--color-text-primary)]">
                <span className="font-semibold">Harvest approaching for BAT-003.</span> Readiness is at 94% — confirm buyer, transport, and packaging this week.
              </p>
            </div>
          </div>

          {/* KPI cards */}
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {KPI_CARDS.map((card) => (
              <div key={card.label} className="rounded-2xl border border-[var(--color-border)] bg-white p-5 transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">{card.label}</p>
                <p className="mt-4 text-3xl font-bold tracking-[-0.04em]">{card.value}</p>
                <p className={`mt-2 text-xs font-medium ${card.trendTone === "up" ? "text-[var(--color-accent)]" : card.trendTone === "down" ? "text-[var(--color-warning)]" : "text-[var(--color-text-muted)]"}`}>
                  {card.trend}
                </p>
              </div>
            ))}
          </section>

          {/* Search & filters */}
          <section className="mb-6 rounded-2xl border border-[var(--color-border)] bg-white p-4 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[1fr_150px_150px_150px_auto]">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by batch ID, pond, species, vendor, notes…"
                className="h-11 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)]"
              />
              <select value={speciesFilter} onChange={(event) => setSpeciesFilter(event.target.value as typeof speciesFilter)} className="h-11 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-accent)]">
                {["All", "Catfish", "Tilapia"].map((item) => <option key={item}>{item}</option>)}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-11 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-accent)]">
                {["All", "Growing", "Transferred", "Harvested", "Archived"].map((item) => <option key={item}>{item}</option>)}
              </select>
              <select value={healthFilter} onChange={(event) => setHealthFilter(event.target.value as typeof healthFilter)} className="h-11 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-accent)]">
                {["All", "Healthy", "Observation", "Treatment", "Critical"].map((item) => <option key={item}>{item}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setShowAdvanced((value) => !value)}
                className="min-h-11 rounded-md border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
              >
                {showAdvanced ? "Hide filters" : "Advanced filters"}
              </button>
            </div>

            {showAdvanced && (
              <div className="mt-4 border-t border-[var(--color-border)] pt-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {["Pond", "Vendor", "Stocking Date", "Harvest Date", "Fingerling Size", "Feed Type", "Age Range", "Weight Range"].map((filter) => (
                    <label key={filter} className="block">
                      <span className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">{filter}</span>
                      <input className="mt-1.5 h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)]" placeholder="Any" />
                    </label>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" className="min-h-11 rounded-md bg-[var(--color-text-primary)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-[var(--color-accent)]">Apply Filters</button>
                  <button type="button" className="min-h-11 rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:bg-[var(--color-surface)]">Reset Filters</button>
                </div>
              </div>
            )}
          </section>

          <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
            <div className="min-w-0">
              {/* Desktop table */}
              <section className="hidden rounded-2xl border border-[var(--color-border)] bg-white md:block">
                <p className="border-b border-[var(--color-border)] px-5 py-3 text-xs text-[var(--color-text-muted)]">
                  {filteredBatches.length} batches · scroll horizontally for all columns →
                </p>
                <div className="overflow-x-auto rounded-b-2xl [-webkit-overflow-scrolling:touch]">
                  <table className="w-full min-w-[1760px] border-collapse text-left">
                    <thead className="bg-[var(--color-surface)]">
                      <tr>
                        {TABLE_HEADERS.map((header) => (
                          <th key={header} className="whitespace-nowrap px-4 py-3 text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBatches.map((batch) => (
                        <tr
                          key={batch.id}
                          onClick={() => setSelectedBatch(batch)}
                          className="cursor-pointer border-t border-[var(--color-border)] transition-colors duration-200 hover:bg-[var(--color-surface)]"
                        >
                          <td className="whitespace-nowrap px-4 py-4 font-mono text-sm font-semibold">{batch.id}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--color-text-secondary)]">{batch.species}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm">{batch.pond}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm font-medium">{batch.population.toLocaleString()}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--color-text-secondary)]">{batch.stocked.toLocaleString()}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--color-text-secondary)]">{batch.mortality}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-[var(--color-accent)]">{survivalRate(batch)}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm">{batch.avgWeight}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm">{batch.biomass}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--color-text-secondary)]">{batch.ageDays}d</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--color-text-secondary)]">{batch.feedConsumed}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm">{batch.fcr}</td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${healthBadge(batch.health)}`}>{batch.health}</span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${growthBadge(batch.growth)}`}>{batch.growth}</span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--color-text-secondary)]">{batch.stockingDate}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--color-text-secondary)]">{batch.expectedHarvest}</td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm font-medium">{batch.revenue}</td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(batch.status)}`}>{batch.status}</span>
                          </td>
                          <td className="relative whitespace-nowrap px-4 py-4">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setOpenActions((current) => (current === batch.id ? null : batch.id));
                              }}
                              className="rounded-md border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
                            >
                              Actions ▾
                            </button>
                            {openActions === batch.id && (
                              <div className="absolute right-4 top-12 z-20 w-44 rounded-lg border border-[var(--color-border)] bg-white py-1 shadow-[0_4px_12px_rgba(0,0,0,0.08),0_16px_40px_rgba(0,0,0,0.08)]">
                                {ROW_ACTIONS.map((action) => (
                                  <button
                                    key={action}
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setOpenActions(null);
                                      if (action === "View") setSelectedBatch(batch);
                                    }}
                                    className={`block w-full px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-[var(--color-surface)] ${action === "Delete" ? "text-[var(--color-danger)]" : "text-[var(--color-text-primary)]"}`}
                                  >
                                    {action}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Mobile cards */}
              <section className="grid gap-3 md:hidden">
                {filteredBatches.map((batch) => (
                  <button
                    key={batch.id}
                    type="button"
                    onClick={() => setSelectedBatch(batch)}
                    className="rounded-2xl border border-[var(--color-border)] bg-white p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm font-bold">{batch.id}</p>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                          {batch.species} · {batch.pond} · Day {batch.ageDays}
                        </p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${healthBadge(batch.health)}`}>{batch.health}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[var(--color-border)] pt-4 text-sm">
                      <Info label="Fish" value={batch.population.toLocaleString()} />
                      <Info label="Avg Weight" value={batch.avgWeight} />
                      <Info label="Survival" value={survivalRate(batch)} />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${growthBadge(batch.growth)}`}>{batch.growth}</span>
                      <span className="text-sm font-semibold text-[var(--color-accent)]">View details →</span>
                    </div>
                  </button>
                ))}
              </section>
            </div>

            {/* Right sidebar widgets */}
            <aside className="hidden space-y-4 xl:block">
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <p className="text-sm font-bold">Today&apos;s Feeding</p>
                <p className="mt-2 text-3xl font-bold tracking-[-0.04em]">3<span className="text-lg text-[var(--color-text-muted)]">/4</span></p>
                <div className="mt-3 h-1.5 rounded-full bg-neutral-100">
                  <div className="h-full w-3/4 rounded-full bg-[var(--color-accent)]" />
                </div>
                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Night feed not scheduled</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <p className="text-sm font-bold">Farm Health Score</p>
                <div className="mt-2 flex justify-center"><CircularScore score={91} /></div>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <p className="text-sm font-bold">Water Quality</p>
                <div className="mt-3 space-y-2 text-sm">
                  {[["D.O.", "6.2 mg/L"], ["pH", "7.1"], ["Temp", "28°C"], ["Ammonia", "0.02 ppm"]].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">{label}</span>
                      <span className="font-medium text-[var(--color-accent)]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <p className="text-sm font-bold">Upcoming Harvest</p>
                <p className="mt-2 text-sm font-semibold">BAT-003 · Pond D</p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">July 15 · 2,870 kg estimated · buyer confirmed</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <p className="text-sm font-bold">Weather</p>
                <p className="mt-2 text-2xl font-bold">🌧️ 29°C</p>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Heavy rain at 4 PM · reduce afternoon feeding</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5">
                <p className="text-sm font-bold">Recent Activity</p>
                <div className="mt-3 space-y-3 text-sm">
                  {[["BAT-004 weight recorded", "9m ago"], ["BAT-005 fed — 34kg", "1h ago"], ["Rain alert received", "2h ago"]].map(([text, time]) => (
                    <div key={text} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                      <div>
                        <p>{text}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">{time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Floating action button */}
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
          aria-label="Quick actions"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-2xl font-light text-white shadow-[0_4px_12px_rgba(0,0,0,0.12),0_16px_40px_rgba(0,0,0,0.12)] transition-all duration-200 hover:-translate-y-px hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
        >
          <span className={`transition-transform duration-200 ${fabOpen ? "rotate-45" : ""}`}>+</span>
        </button>
      </div>

      {selectedBatch && <BatchDrawer batch={selectedBatch} onClose={() => setSelectedBatch(null)} />}
    </main>
  );
}
