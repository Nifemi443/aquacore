"use client";

import { useMemo, useState } from "react";

type HarvestStatus = "Ready" | "Scheduled" | "Completed";
type Species = "Catfish" | "Tilapia";

interface UpcomingHarvest {
  id: string;
  batch: string;
  pond: string;
  species: Species;
  estimatedCount: number;
  expectedDate: string;
  status: "Ready" | "Scheduled";
}

interface HarvestRecord {
  id: string;
  date: string;
  batch: string;
  pond: string;
  species: Species;
  fishHarvested: number;
  averageWeight: number;
  totalWeight: number;
  pricePerKg: number;
  buyer: string;
  notes: string;
  status: "Completed";
}

interface HarvestFormState {
  pond: string;
  batch: string;
  date: string;
  fishHarvested: string;
  averageWeight: string;
  totalWeight: string;
  pricePerKg: string;
  buyer: string;
  notes: string;
}

const PONDS = ["Pond A", "Pond B", "Pond C", "Pond D", "Pond E", "Pond F"] as const;

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Ponds", href: "/ponds", icon: "pond" },
  { label: "Fish Batches", href: "/batches", icon: "batch" },
  { label: "Today's Feedings", href: "/feedings", icon: "feed" },
  { label: "Feed Inventory", href: "/inventory", icon: "inventory" },
  { label: "Harvest", href: "/harvest", icon: "harvest" },
  { label: "Reports", href: "/reports", icon: "reports" },
  { label: "Settings", href: "/settings", icon: "settings" },
] as const;

type NavIconType = (typeof NAV_ITEMS)[number]["icon"] | "water";

const INITIAL_UPCOMING: UpcomingHarvest[] = [
  { id: "UH-001", batch: "BAT-003", pond: "Pond D", species: "Tilapia", estimatedCount: 2800, expectedDate: "2026-07-12", status: "Ready" },
  { id: "UH-002", batch: "BAT-006", pond: "Pond E", species: "Catfish", estimatedCount: 2540, expectedDate: "2026-07-28", status: "Scheduled" },
  { id: "UH-003", batch: "BAT-004", pond: "Pond A", species: "Catfish", estimatedCount: 2860, expectedDate: "2026-08-15", status: "Scheduled" },
  { id: "UH-004", batch: "BAT-007", pond: "Pond F", species: "Tilapia", estimatedCount: 3060, expectedDate: "2026-09-28", status: "Scheduled" },
];

const INITIAL_HISTORY: HarvestRecord[] = [
  {
    id: "HV-001",
    date: "2026-06-18",
    batch: "BAT-001",
    pond: "Pond B",
    species: "Catfish",
    fishHarvested: 2650,
    averageWeight: 1.1,
    totalWeight: 2915,
    pricePerKg: 1800,
    buyer: "Lagos Fish Market Co.",
    notes: "Smooth harvest. Buyer collected same day.",
    status: "Completed",
  },
  {
    id: "HV-002",
    date: "2026-05-22",
    batch: "BAT-002",
    pond: "Pond C",
    species: "Tilapia",
    fishHarvested: 3100,
    averageWeight: 0.85,
    totalWeight: 2635,
    pricePerKg: 1650,
    buyer: "Fresh Aqua Distributors",
    notes: "Good survival rate at harvest.",
    status: "Completed",
  },
  {
    id: "HV-003",
    date: "2026-07-02",
    batch: "BAT-005",
    pond: "Pond B",
    species: "Catfish",
    fishHarvested: 1200,
    averageWeight: 0.6,
    totalWeight: 720,
    pricePerKg: 1750,
    buyer: "Local buyer — Ikeja",
    notes: "Partial harvest for local market.",
    status: "Completed",
  },
];

const EMPTY_FORM: HarvestFormState = {
  pond: PONDS[0],
  batch: "",
  date: new Date().toISOString().slice(0, 10),
  fishHarvested: "",
  averageWeight: "",
  totalWeight: "",
  pricePerKg: "",
  buyer: "",
  notes: "",
};

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

function StatusBadge({ status }: { status: HarvestStatus }): React.JSX.Element {
  const styles = {
    Ready: "bg-[var(--color-accent-light)] text-[var(--color-accent)]",
    Scheduled: "bg-sky-50 text-sky-700",
    Completed: "bg-neutral-100 text-[var(--color-text-secondary)]",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
}

function formatWeight(kg: number): string {
  return `${kg.toLocaleString()} kg`;
}

export default function HarvestModule(): React.JSX.Element {
  const [upcoming, setUpcoming] = useState<UpcomingHarvest[]>(INITIAL_UPCOMING);
  const [history, setHistory] = useState<HarvestRecord[]>(INITIAL_HISTORY);
  const [query, setQuery] = useState("");
  const [pondFilter, setPondFilter] = useState("All");
  const [speciesFilter, setSpeciesFilter] = useState<"All" | Species>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | HarvestStatus>("All");
  const [dateFilter, setDateFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HarvestFormState>(EMPTY_FORM);
  const [detailRecord, setDetailRecord] = useState<HarvestRecord | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const summary = useMemo(() => ({
    upcoming: upcoming.length,
    completed: history.length,
    readyFish: upcoming.filter((u) => u.status === "Ready").reduce((sum, u) => sum + u.estimatedCount, 0),
    harvestedThisMonth: history
      .filter((h) => h.date.startsWith(currentMonth))
      .reduce((sum, h) => sum + h.fishHarvested, 0),
  }), [upcoming, history, currentMonth]);

  const filteredHistory = useMemo(() => {
    const term = query.toLowerCase();
    return history.filter((record) => {
      const matchesQuery =
        record.batch.toLowerCase().includes(term) ||
        record.pond.toLowerCase().includes(term) ||
        record.buyer.toLowerCase().includes(term);
      const matchesPond = pondFilter === "All" || record.pond === pondFilter;
      const matchesSpecies = speciesFilter === "All" || record.species === speciesFilter;
      const matchesStatus = statusFilter === "All" || record.status === statusFilter;
      const matchesDate = !dateFilter || record.date === dateFilter;
      return matchesQuery && matchesPond && matchesSpecies && matchesStatus && matchesDate;
    });
  }, [history, query, pondFilter, speciesFilter, statusFilter, dateFilter]);

  const openCreateModal = (prefill?: UpcomingHarvest): void => {
    setEditingId(null);
    if (prefill) {
      setForm({
        ...EMPTY_FORM,
        pond: prefill.pond,
        batch: prefill.batch,
        date: prefill.expectedDate,
        fishHarvested: String(prefill.estimatedCount),
      });
    } else {
      setForm({ ...EMPTY_FORM, date: new Date().toISOString().slice(0, 10) });
    }
    setModalOpen(true);
  };

  const openEditModal = (record: HarvestRecord): void => {
    setEditingId(record.id);
    setForm({
      pond: record.pond,
      batch: record.batch,
      date: record.date,
      fishHarvested: String(record.fishHarvested),
      averageWeight: String(record.averageWeight),
      totalWeight: String(record.totalWeight),
      pricePerKg: String(record.pricePerKg),
      buyer: record.buyer,
      notes: record.notes,
    });
    setModalOpen(true);
    setDetailRecord(null);
  };

  const saveHarvest = (): void => {
    const fishHarvested = parseInt(form.fishHarvested, 10);
    const averageWeight = parseFloat(form.averageWeight);
    const totalWeight = parseFloat(form.totalWeight) || fishHarvested * averageWeight;
    const pricePerKg = parseFloat(form.pricePerKg) || 0;
    if (Number.isNaN(fishHarvested) || Number.isNaN(averageWeight)) return;

    const pond = form.pond;
    const species: Species = form.batch.includes("003") || form.batch.includes("007") || form.batch.includes("002") ? "Tilapia" : "Catfish";

    const payload: HarvestRecord = {
      id: editingId ?? `HV-${Date.now()}`,
      date: form.date,
      batch: form.batch,
      pond,
      species,
      fishHarvested,
      averageWeight,
      totalWeight,
      pricePerKg,
      buyer: form.buyer,
      notes: form.notes,
      status: "Completed",
    };

    if (editingId) {
      setHistory((current) => current.map((r) => (r.id === editingId ? payload : r)));
    } else {
      setHistory((current) => [payload, ...current]);
      setUpcoming((current) => current.filter((u) => u.batch !== form.batch));
    }
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const deleteRecord = (id: string): void => {
    setHistory((current) => current.filter((r) => r.id !== id));
    if (detailRecord?.id === id) setDetailRecord(null);
  };

  const isEmpty = upcoming.length === 0 && history.length === 0;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--color-surface)] text-[var(--color-text-primary)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[256px] border-r border-[var(--color-border)] bg-white/95 px-4 py-5 backdrop-blur-xl lg:block">
        <a href="/dashboard" className="flex items-center gap-2 px-2 transition-opacity duration-200 hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">A</div>
          <div>
            <p className="text-sm font-bold tracking-[-0.02em]">AquaCore</p>
            <p className="text-[11px] text-[var(--color-text-muted)]">Farm OS</p>
          </div>
        </a>
        <nav className="mt-8 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = item.label === "Harvest";
            return (
              <a
                key={item.label}
                href={item.href}
                className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-all duration-200 hover:bg-[var(--color-surface)] ${
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

      <div className="min-w-0 overflow-x-hidden lg:pl-[256px]">
        <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-xl lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">A</div>
              <span className="text-sm font-bold">Harvest</span>
            </div>
            <a href="/dashboard" className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-medium">Dashboard</a>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Header */}
          <header className="mb-6 rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.04em]">Harvest</h1>
                <p className="mt-2 text-base leading-7 text-[var(--color-text-secondary)]">
                  Manage upcoming and completed harvests.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => openCreateModal()} className="min-h-11 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-emerald-900">
                  + Record Harvest
                </button>
                <button type="button" className="min-h-11 rounded-lg border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)]">
                  Export Report
                </button>
              </div>
            </div>
          </header>

          {isEmpty ? (
            <div className="flex flex-col items-center rounded-2xl border border-[var(--color-border)] bg-white px-6 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-light)] text-2xl text-[var(--color-accent)]">
                <NavIcon type="harvest" />
              </div>
              <p className="mt-6 text-lg font-semibold">No harvests recorded yet.</p>
              <p className="mt-2 max-w-sm text-sm text-[var(--color-text-secondary)]">
                Record your first harvest to start tracking production and buyer history.
              </p>
              <button type="button" onClick={() => openCreateModal()} className="mt-6 min-h-12 rounded-lg bg-[var(--color-accent)] px-6 py-3 text-sm font-medium text-white">
                Record First Harvest
              </button>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Upcoming Harvests", value: String(summary.upcoming), detail: "Scheduled batches" },
                  { label: "Completed Harvests", value: String(summary.completed), detail: "All time" },
                  { label: "Fish Ready for Harvest", value: summary.readyFish.toLocaleString(), detail: "Ready status" },
                  { label: "Harvested This Month", value: summary.harvestedThisMonth.toLocaleString(), detail: "Fish count" },
                ].map((card) => (
                  <div key={card.label} className="rounded-2xl border border-[var(--color-border)] bg-white p-5 transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">{card.label}</p>
                    <p className="mt-3 text-3xl font-bold tracking-[-0.04em]">{card.value}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">{card.detail}</p>
                  </div>
                ))}
              </section>

              {/* Upcoming harvests */}
              {upcoming.length > 0 && (
                <section className="mb-6 rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Upcoming Harvests</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Batches approaching harvest date.</p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {upcoming.map((item) => (
                      <div key={item.id} className="rounded-xl border border-[var(--color-border)] p-5 transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{item.batch}</p>
                            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{item.pond} · {item.species}</p>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>
                        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <dt className="text-[var(--color-text-muted)]">Est. fish count</dt>
                            <dd className="font-semibold">{item.estimatedCount.toLocaleString()}</dd>
                          </div>
                          <div>
                            <dt className="text-[var(--color-text-muted)]">Expected date</dt>
                            <dd className="font-semibold">{formatDate(item.expectedDate)}</dd>
                          </div>
                        </dl>
                        <button
                          type="button"
                          onClick={() => openCreateModal(item)}
                          className="mt-5 min-h-11 w-full rounded-lg bg-[var(--color-accent)] text-sm font-medium text-white transition-all duration-200 hover:bg-emerald-900"
                        >
                          Harvest Now
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Search & filters */}
              <section className="mb-6 rounded-2xl border border-[var(--color-border)] bg-white p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                  <input
                    type="search"
                    placeholder="Search batch, pond, buyer…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-11 rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)] lg:col-span-2"
                  />
                  <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="h-11 rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-accent)]" />
                  <select value={pondFilter} onChange={(e) => setPondFilter(e.target.value)} className="h-11 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:border-[var(--color-accent)]">
                    <option value="All">All ponds</option>
                    {PONDS.map((pond) => <option key={pond} value={pond}>{pond}</option>)}
                  </select>
                  <select value={speciesFilter} onChange={(e) => setSpeciesFilter(e.target.value as "All" | Species)} className="h-11 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:border-[var(--color-accent)]">
                    <option value="All">All species</option>
                    <option value="Catfish">Catfish</option>
                    <option value="Tilapia">Tilapia</option>
                  </select>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "All" | HarvestStatus)} className="h-11 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:border-[var(--color-accent)]">
                    <option value="All">All statuses</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </section>

              {/* Harvest history */}
              <section className="rounded-2xl border border-[var(--color-border)] bg-white">
                <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Harvest History</h2>
                </div>

                {filteredHistory.length === 0 ? (
                  <p className="px-6 py-12 text-center text-sm text-[var(--color-text-secondary)]">No harvests match your filters.</p>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full min-w-[1000px] border-collapse">
                        <thead className="bg-[var(--color-surface)]">
                          <tr className="text-left text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                            <th className="px-5 py-3">Date</th>
                            <th className="px-5 py-3">Batch</th>
                            <th className="px-5 py-3">Pond</th>
                            <th className="px-5 py-3">Species</th>
                            <th className="px-5 py-3">Fish Harvested</th>
                            <th className="px-5 py-3">Average Weight</th>
                            <th className="px-5 py-3">Total Weight</th>
                            <th className="px-5 py-3">Buyer</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredHistory.map((record) => (
                            <tr key={record.id} className="border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface)]">
                              <td className="px-5 py-4 text-sm">{formatDate(record.date)}</td>
                              <td className="px-5 py-4 text-sm font-semibold">{record.batch}</td>
                              <td className="px-5 py-4 text-sm">{record.pond}</td>
                              <td className="px-5 py-4 text-sm">{record.species}</td>
                              <td className="px-5 py-4 text-sm">{record.fishHarvested.toLocaleString()}</td>
                              <td className="px-5 py-4 text-sm">{record.averageWeight} kg</td>
                              <td className="px-5 py-4 text-sm">{formatWeight(record.totalWeight)}</td>
                              <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">{record.buyer}</td>
                              <td className="px-5 py-4"><StatusBadge status={record.status} /></td>
                              <td className="px-5 py-4">
                                <div className="flex gap-2">
                                  <button type="button" onClick={() => setDetailRecord(record)} className="text-xs font-medium text-[var(--color-accent)] hover:underline">View</button>
                                  <button type="button" onClick={() => openEditModal(record)} className="text-xs font-medium text-[var(--color-text-secondary)] hover:underline">Edit</button>
                                  <button type="button" onClick={() => deleteRecord(record.id)} className="text-xs font-medium text-[var(--color-danger)] hover:underline">Delete</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid gap-3 p-4 md:hidden">
                      {filteredHistory.map((record) => {
                        const expanded = expandedMobile === record.id;
                        return (
                          <div key={record.id} className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setExpandedMobile(expanded ? null : record.id)}
                              className="flex w-full items-center justify-between p-4 text-left"
                            >
                              <div>
                                <p className="font-semibold">{record.batch}</p>
                                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{formatDate(record.date)} · {record.pond}</p>
                              </div>
                              <span className="text-lg text-[var(--color-text-muted)]">{expanded ? "−" : "+"}</span>
                            </button>
                            {expanded && (
                              <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                                <dl className="grid grid-cols-2 gap-3 text-xs">
                                  <div><dt className="text-[var(--color-text-muted)]">Species</dt><dd className="font-semibold">{record.species}</dd></div>
                                  <div><dt className="text-[var(--color-text-muted)]">Fish</dt><dd className="font-semibold">{record.fishHarvested.toLocaleString()}</dd></div>
                                  <div><dt className="text-[var(--color-text-muted)]">Avg weight</dt><dd className="font-semibold">{record.averageWeight} kg</dd></div>
                                  <div><dt className="text-[var(--color-text-muted)]">Total</dt><dd className="font-semibold">{formatWeight(record.totalWeight)}</dd></div>
                                  <div className="col-span-2"><dt className="text-[var(--color-text-muted)]">Buyer</dt><dd className="font-semibold">{record.buyer}</dd></div>
                                </dl>
                                <div className="mt-4 flex gap-2">
                                  <button type="button" onClick={() => setDetailRecord(record)} className="min-h-11 flex-1 rounded-lg border border-[var(--color-border)] bg-white text-sm font-medium">View</button>
                                  <button type="button" onClick={() => openEditModal(record)} className="min-h-11 flex-1 rounded-lg border border-[var(--color-border)] bg-white text-sm font-medium">Edit</button>
                                  <button type="button" onClick={() => deleteRecord(record.id)} className="min-h-11 rounded-lg border border-red-200 px-4 text-sm font-medium text-[var(--color-danger)]">Delete</button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {/* Mobile quick action */}
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <button type="button" onClick={() => openCreateModal()} className="min-h-12 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-white shadow-[0_4px_16px_rgba(13,122,95,0.3)]">
          + Record Harvest
        </button>
      </div>

      {/* Record modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-[0_24px_64px_rgba(0,0,0,0.15)]">
            <h2 className="text-xl font-bold tracking-[-0.03em]">{editingId ? "Edit Harvest" : "Record Harvest"}</h2>
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium">Select Pond</span>
                  <select value={form.pond} onChange={(e) => setForm((f) => ({ ...f, pond: e.target.value }))} className="mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:border-[var(--color-accent)]">
                    {PONDS.map((pond) => <option key={pond} value={pond}>{pond}</option>)}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Select Batch</span>
                  <input type="text" value={form.batch} onChange={(e) => setForm((f) => ({ ...f, batch: e.target.value }))} placeholder="e.g. BAT-003" className="mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:border-[var(--color-accent)]" />
                </label>
              </div>
              <label className="block text-sm">
                <span className="font-medium">Harvest Date</span>
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:border-[var(--color-accent)]" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium">Number of Fish Harvested</span>
                  <input type="number" value={form.fishHarvested} onChange={(e) => setForm((f) => ({ ...f, fishHarvested: e.target.value }))} className="mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:border-[var(--color-accent)]" />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Average Weight (kg)</span>
                  <input type="number" step="0.01" value={form.averageWeight} onChange={(e) => setForm((f) => ({ ...f, averageWeight: e.target.value }))} className="mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:border-[var(--color-accent)]" />
                </label>
              </div>
              <label className="block text-sm">
                <span className="font-medium">Total Harvest Weight (kg)</span>
                <input type="number" step="0.1" value={form.totalWeight} onChange={(e) => setForm((f) => ({ ...f, totalWeight: e.target.value }))} placeholder="Auto-calculated if left blank" className="mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:border-[var(--color-accent)]" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium">Selling Price per kg (₦)</span>
                  <input type="number" value={form.pricePerKg} onChange={(e) => setForm((f) => ({ ...f, pricePerKg: e.target.value }))} className="mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:border-[var(--color-accent)]" />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Buyer Name</span>
                  <input type="text" value={form.buyer} onChange={(e) => setForm((f) => ({ ...f, buyer: e.target.value }))} className="mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:border-[var(--color-accent)]" />
                </label>
              </div>
              <label className="block text-sm">
                <span className="font-medium">Notes</span>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 outline-none focus:border-[var(--color-accent)]" />
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="min-h-11 flex-1 rounded-lg border border-[var(--color-border)] text-sm font-medium">Cancel</button>
              <button type="button" onClick={saveHarvest} className="min-h-11 flex-1 rounded-lg bg-[var(--color-accent)] text-sm font-medium text-white">Save Harvest</button>
            </div>
          </div>
        </div>
      )}

      {/* Details side panel */}
      {detailRecord && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.1)]">
            <div className="sticky top-0 flex items-center justify-between border-b border-[var(--color-border)] bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-bold">{detailRecord.batch}</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">Harvest details</p>
              </div>
              <button type="button" onClick={() => setDetailRecord(null)} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm">Close</button>
            </div>
            <div className="space-y-0 divide-y divide-[var(--color-border)] px-5">
              {[
                { label: "Pond", value: detailRecord.pond },
                { label: "Species", value: detailRecord.species },
                { label: "Harvest Date", value: formatDate(detailRecord.date) },
                { label: "Fish Harvested", value: detailRecord.fishHarvested.toLocaleString() },
                { label: "Average Weight", value: `${detailRecord.averageWeight} kg` },
                { label: "Total Weight", value: formatWeight(detailRecord.totalWeight) },
                { label: "Selling Price", value: `₦${detailRecord.pricePerKg.toLocaleString()}/kg` },
                { label: "Buyer", value: detailRecord.buyer },
              ].map((row) => (
                <div key={row.label} className="flex justify-between py-4 text-sm">
                  <span className="text-[var(--color-text-muted)]">{row.label}</span>
                  <span className="font-semibold text-right">{row.value}</span>
                </div>
              ))}
              {detailRecord.notes && (
                <div className="py-4">
                  <p className="text-sm text-[var(--color-text-muted)]">Notes</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{detailRecord.notes}</p>
                </div>
              )}
            </div>
            <div className="border-t border-[var(--color-border)] p-5">
              <a href="/batches" className="flex min-h-11 w-full items-center justify-center rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-accent)]">
                View Batch →
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
