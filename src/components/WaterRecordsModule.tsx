"use client";

import { useMemo, useState } from "react";

type WaterStatus = "Healthy" | "Warning" | "Critical";

interface WaterRecord {
  id: string;
  date: string;
  pond: string;
  temperature: number;
  ph: number;
  dissolvedOxygen: number;
  waterColor: string;
  weather: string;
  notes: string;
  recordedBy: string;
  status: WaterStatus;
}

interface PondSummary {
  pond: string;
  temperature: number;
  ph: number;
  dissolvedOxygen: number;
  lastTested: string;
  status: WaterStatus;
}

const PONDS = ["Pond A", "Pond B", "Pond C", "Pond D", "Pond E", "Pond F"] as const;
const WATER_COLORS = ["Clear", "Slightly cloudy", "Cloudy", "Greenish", "Brownish"] as const;
const WEATHER_OPTIONS = ["Clear", "Cloudy", "Rainy", "Overcast", "Hot"] as const;

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Ponds", href: "/ponds", icon: "pond" },
  { label: "Fish Batches", href: "/batches", icon: "batch" },
  { label: "Today's Feedings", href: "/feedings", icon: "feed" },
  { label: "Feed Inventory", href: "/inventory", icon: "inventory" },
  { label: "Water Records", href: "/water-records", icon: "water" },
  { label: "Harvest", href: "/harvest", icon: "harvest" },
  { label: "Reports", href: "#", icon: "reports" },
  { label: "Settings", href: "#", icon: "settings" },
] as const;

type NavIconType = (typeof NAV_ITEMS)[number]["icon"];

const INITIAL_RECORDS: WaterRecord[] = [
  {
    id: "WR-001",
    date: "2026-07-05",
    pond: "Pond A",
    temperature: 27.4,
    ph: 7.2,
    dissolvedOxygen: 6.8,
    waterColor: "Clear",
    weather: "Clear",
    notes: "All parameters within optimal range.",
    recordedBy: "Ayo",
    status: "Healthy",
  },
  {
    id: "WR-002",
    date: "2026-07-05",
    pond: "Pond B",
    temperature: 28.1,
    ph: 6.8,
    dissolvedOxygen: 5.2,
    waterColor: "Slightly cloudy",
    weather: "Cloudy",
    notes: "Dissolved oxygen slightly low after rain. Monitor afternoon reading.",
    recordedBy: "Ngozi",
    status: "Warning",
  },
  {
    id: "WR-003",
    date: "2026-07-05",
    pond: "Pond C",
    temperature: 27.8,
    ph: 7.0,
    dissolvedOxygen: 6.5,
    waterColor: "Clear",
    weather: "Clear",
    notes: "Stable conditions.",
    recordedBy: "Tunde",
    status: "Healthy",
  },
  {
    id: "WR-004",
    date: "2026-07-04",
    pond: "Pond D",
    temperature: 29.2,
    ph: 6.4,
    dissolvedOxygen: 4.1,
    waterColor: "Greenish",
    weather: "Hot",
    notes: "Algae bloom suspected. Partial water exchange recommended.",
    recordedBy: "Ayo",
    status: "Critical",
  },
  {
    id: "WR-005",
    date: "2026-07-04",
    pond: "Pond E",
    temperature: 27.1,
    ph: 7.1,
    dissolvedOxygen: 6.2,
    waterColor: "Clear",
    weather: "Overcast",
    notes: "Treatment batch — parameters acceptable.",
    recordedBy: "Ngozi",
    status: "Healthy",
  },
  {
    id: "WR-006",
    date: "2026-07-03",
    pond: "Pond F",
    temperature: 26.9,
    ph: 7.3,
    dissolvedOxygen: 7.0,
    waterColor: "Clear",
    weather: "Clear",
    notes: "Excellent water quality.",
    recordedBy: "Tunde",
    status: "Healthy",
  },
];

function deriveStatus(temperature: number, ph: number, dissolvedOxygen: number): WaterStatus {
  if (dissolvedOxygen < 4.5 || ph < 6.5 || ph > 8.5 || temperature > 32) return "Critical";
  if (dissolvedOxygen < 5.5 || ph < 6.8 || ph > 8.0 || temperature > 30) return "Warning";
  return "Healthy";
}

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

function StatusBadge({ status }: { status: WaterStatus }): React.JSX.Element {
  const styles = {
    Healthy: "bg-[var(--color-accent-light)] text-[var(--color-accent)]",
    Warning: "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
    Critical: "bg-[var(--color-danger-light)] text-[var(--color-danger)]",
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

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface RecordFormState {
  pond: string;
  temperature: string;
  ph: string;
  dissolvedOxygen: string;
  waterColor: string;
  weather: string;
  notes: string;
}

const EMPTY_FORM: RecordFormState = {
  pond: PONDS[0],
  temperature: "",
  ph: "",
  dissolvedOxygen: "",
  waterColor: WATER_COLORS[0],
  weather: WEATHER_OPTIONS[0],
  notes: "",
};

export default function WaterRecordsModule(): React.JSX.Element {
  const [records, setRecords] = useState<WaterRecord[]>(INITIAL_RECORDS);
  const [query, setQuery] = useState("");
  const [pondFilter, setPondFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | WaterStatus>("All");
  const [dateFilter, setDateFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RecordFormState>(EMPTY_FORM);
  const [historyPond, setHistoryPond] = useState<string | null>(null);
  const [viewRecord, setViewRecord] = useState<WaterRecord | null>(null);

  const today = todayISO();

  const filteredRecords = useMemo(() => {
    const term = query.toLowerCase();
    return records.filter((record) => {
      const matchesQuery =
        record.pond.toLowerCase().includes(term) || record.date.includes(term) || record.recordedBy.toLowerCase().includes(term);
      const matchesPond = pondFilter === "All" || record.pond === pondFilter;
      const matchesStatus = statusFilter === "All" || record.status === statusFilter;
      const matchesDate = !dateFilter || record.date === dateFilter;
      return matchesQuery && matchesPond && matchesStatus && matchesDate;
    });
  }, [records, query, pondFilter, statusFilter, dateFilter]);

  const todayRecords = useMemo(() => records.filter((r) => r.date === today), [records, today]);

  const summary = useMemo(() => {
    const pondsTestedToday = new Set(todayRecords.map((r) => r.pond)).size;
    const avgTemp =
      todayRecords.length > 0
        ? (todayRecords.reduce((sum, r) => sum + r.temperature, 0) / todayRecords.length).toFixed(1)
        : "—";
    const avgPh =
      todayRecords.length > 0
        ? (todayRecords.reduce((sum, r) => sum + r.ph, 0) / todayRecords.length).toFixed(1)
        : "—";
    const attention = records.filter((r) => r.status !== "Healthy").length;
    return { pondsTestedToday, avgTemp, avgPh, attention };
  }, [records, todayRecords]);

  const pondSummaries = useMemo((): PondSummary[] => {
    return PONDS.map((pond) => {
      const pondRecords = records.filter((r) => r.pond === pond).sort((a, b) => b.date.localeCompare(a.date));
      const latest = pondRecords[0];
      if (!latest) {
        return { pond, temperature: 0, ph: 0, dissolvedOxygen: 0, lastTested: "Not tested", status: "Warning" as WaterStatus };
      }
      return {
        pond,
        temperature: latest.temperature,
        ph: latest.ph,
        dissolvedOxygen: latest.dissolvedOxygen,
        lastTested: formatDate(latest.date),
        status: latest.status,
      };
    });
  }, [records]);

  const historyRecords = useMemo(() => {
    if (!historyPond) return [];
    return records.filter((r) => r.pond === historyPond).sort((a, b) => b.date.localeCompare(a.date));
  }, [records, historyPond]);

  const openCreateModal = (): void => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (record: WaterRecord): void => {
    setEditingId(record.id);
    setForm({
      pond: record.pond,
      temperature: String(record.temperature),
      ph: String(record.ph),
      dissolvedOxygen: String(record.dissolvedOxygen),
      waterColor: record.waterColor,
      weather: record.weather,
      notes: record.notes,
    });
    setModalOpen(true);
  };

  const saveRecord = (): void => {
    const temperature = parseFloat(form.temperature);
    const ph = parseFloat(form.ph);
    const dissolvedOxygen = parseFloat(form.dissolvedOxygen);
    if (Number.isNaN(temperature) || Number.isNaN(ph) || Number.isNaN(dissolvedOxygen)) return;

    const status = deriveStatus(temperature, ph, dissolvedOxygen);
    const payload: WaterRecord = {
      id: editingId ?? `WR-${Date.now()}`,
      date: today,
      pond: form.pond,
      temperature,
      ph,
      dissolvedOxygen,
      waterColor: form.waterColor,
      weather: form.weather,
      notes: form.notes,
      recordedBy: "Ayo",
      status,
    };

    if (editingId) {
      setRecords((current) => current.map((r) => (r.id === editingId ? payload : r)));
    } else {
      setRecords((current) => [payload, ...current]);
    }
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const deleteRecord = (id: string): void => {
    setRecords((current) => current.filter((r) => r.id !== id));
    if (viewRecord?.id === id) setViewRecord(null);
  };

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
            const active = item.label === "Water Records";
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
              <span className="text-sm font-bold">Water Records</span>
            </div>
            <a href="/dashboard" className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-medium">
              Dashboard
            </a>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Header */}
          <header className="mb-6 rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.04em]">Water Records</h1>
                <p className="mt-2 text-base leading-7 text-[var(--color-text-secondary)]">
                  Record and monitor water quality for every pond.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="min-h-11 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-emerald-900"
                >
                  + Record Water Test
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-lg border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-border-strong)]"
                >
                  Export Records
                </button>
              </div>
            </div>
          </header>

          {/* Summary cards */}
          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Ponds Tested Today", value: String(summary.pondsTestedToday), detail: `of ${PONDS.length} ponds` },
              { label: "Average Water Temperature", value: summary.avgTemp === "—" ? "—" : `${summary.avgTemp}°C`, detail: "Today's readings" },
              { label: "Average pH Level", value: summary.avgPh, detail: "Today's readings" },
              { label: "Ponds Requiring Attention", value: String(summary.attention), detail: "Warning or critical" },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-[var(--color-border)] bg-white p-5 transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">{card.label}</p>
                <p className="mt-3 text-3xl font-bold tracking-[-0.04em]">{card.value}</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{card.detail}</p>
              </div>
            ))}
          </section>

          {/* Search & filters */}
          <section className="mb-6 rounded-2xl border border-[var(--color-border)] bg-white p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input
                type="search"
                placeholder="Search by pond or date…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)]"
              />
              <select
                value={pondFilter}
                onChange={(e) => setPondFilter(e.target.value)}
                className="h-11 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:border-[var(--color-accent)]"
              >
                <option value="All">All ponds</option>
                {PONDS.map((pond) => (
                  <option key={pond} value={pond}>{pond}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "All" | WaterStatus)}
                className="h-11 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm outline-none focus:border-[var(--color-accent)]"
              >
                <option value="All">All statuses</option>
                <option value="Healthy">Healthy</option>
                <option value="Warning">Warning</option>
                <option value="Critical">Critical</option>
              </select>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-11 rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </div>
          </section>

          {/* Recent records */}
          <section className="mb-6 rounded-2xl border border-[var(--color-border)] bg-white">
            <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
              <h2 className="text-lg font-bold tracking-[-0.03em]">Recent Water Records</h2>
            </div>

            {records.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-light)] text-2xl text-[var(--color-accent)]">
                  <NavIcon type="water" />
                </div>
                <p className="mt-6 text-lg font-semibold">No water records yet.</p>
                <p className="mt-2 max-w-sm text-sm text-[var(--color-text-secondary)]">
                  Start logging water tests to monitor pond health across your farm.
                </p>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-6 min-h-12 rounded-lg bg-[var(--color-accent)] px-6 py-3 text-sm font-medium text-white"
                >
                  Record First Test
                </button>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-[var(--color-text-secondary)]">
                No records match your search or filters.
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[900px] border-collapse">
                    <thead className="bg-[var(--color-surface)]">
                      <tr className="text-left text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Pond</th>
                        <th className="px-5 py-3">Temperature (°C)</th>
                        <th className="px-5 py-3">pH</th>
                        <th className="px-5 py-3">Dissolved Oxygen (mg/L)</th>
                        <th className="px-5 py-3">Water Color</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Recorded By</th>
                        <th className="px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((record) => (
                        <tr key={record.id} className="border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface)]">
                          <td className="px-5 py-4 text-sm">{formatDate(record.date)}</td>
                          <td className="px-5 py-4 text-sm font-semibold">{record.pond}</td>
                          <td className="px-5 py-4 text-sm">{record.temperature}</td>
                          <td className="px-5 py-4 text-sm">{record.ph}</td>
                          <td className="px-5 py-4 text-sm">{record.dissolvedOxygen}</td>
                          <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">{record.waterColor}</td>
                          <td className="px-5 py-4"><StatusBadge status={record.status} /></td>
                          <td className="px-5 py-4 text-sm">{record.recordedBy}</td>
                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setViewRecord(record)} className="text-xs font-medium text-[var(--color-accent)] hover:underline">View</button>
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
                  {filteredRecords.map((record) => (
                    <div key={record.id} className="rounded-xl border border-[var(--color-border)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{record.pond}</p>
                          <p className="mt-1 text-xs text-[var(--color-text-muted)]">{formatDate(record.date)} · {record.recordedBy}</p>
                        </div>
                        <StatusBadge status={record.status} />
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-lg bg-[var(--color-surface)] p-2">
                          <p className="text-[var(--color-text-muted)]">Temp</p>
                          <p className="mt-1 font-semibold">{record.temperature}°C</p>
                        </div>
                        <div className="rounded-lg bg-[var(--color-surface)] p-2">
                          <p className="text-[var(--color-text-muted)]">pH</p>
                          <p className="mt-1 font-semibold">{record.ph}</p>
                        </div>
                        <div className="rounded-lg bg-[var(--color-surface)] p-2">
                          <p className="text-[var(--color-text-muted)]">D.O.</p>
                          <p className="mt-1 font-semibold">{record.dissolvedOxygen}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-3">
                        <button type="button" onClick={() => setViewRecord(record)} className="min-h-11 flex-1 rounded-lg border border-[var(--color-border)] text-sm font-medium">View</button>
                        <button type="button" onClick={() => openEditModal(record)} className="min-h-11 flex-1 rounded-lg border border-[var(--color-border)] text-sm font-medium">Edit</button>
                        <button type="button" onClick={() => deleteRecord(record.id)} className="min-h-11 rounded-lg border border-red-200 px-4 text-sm font-medium text-[var(--color-danger)]">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Pond water status */}
          <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 sm:p-6">
            <h2 className="text-lg font-bold tracking-[-0.03em]">Pond Water Status</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Latest reading for each pond.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pondSummaries.map((pond) => (
                <div key={pond.pond} className="rounded-xl border border-[var(--color-border)] p-5 transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold">{pond.pond}</h3>
                    <StatusBadge status={pond.status} />
                  </div>
                  {pond.lastTested === "Not tested" ? (
                    <p className="mt-4 text-sm text-[var(--color-text-muted)]">No tests recorded yet.</p>
                  ) : (
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-[var(--color-text-muted)]">Temperature</dt>
                        <dd className="font-semibold">{pond.temperature}°C</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--color-text-muted)]">pH</dt>
                        <dd className="font-semibold">{pond.ph}</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--color-text-muted)]">Oxygen</dt>
                        <dd className="font-semibold">{pond.dissolvedOxygen} mg/L</dd>
                      </div>
                      <div>
                        <dt className="text-[var(--color-text-muted)]">Last tested</dt>
                        <dd className="font-semibold">{pond.lastTested}</dd>
                      </div>
                    </dl>
                  )}
                  <button
                    type="button"
                    onClick={() => setHistoryPond(pond.pond)}
                    className="mt-5 min-h-11 w-full rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-accent)] transition-all duration-200 hover:border-[var(--color-accent-border)] hover:bg-[var(--color-accent-light)]"
                  >
                    View History
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Mobile quick actions */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2 lg:hidden">
        <button
          type="button"
          onClick={openCreateModal}
          className="min-h-12 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-white shadow-[0_4px_16px_rgba(13,122,95,0.3)]"
        >
          + Record Water Test
        </button>
      </div>

      {/* Record modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-[0_24px_64px_rgba(0,0,0,0.15)]">
            <h2 className="text-xl font-bold tracking-[-0.03em]">{editingId ? "Edit Water Test" : "Record Water Test"}</h2>
            <div className="mt-6 space-y-4">
              <label className="block text-sm">
                <span className="font-medium">Select Pond</span>
                <select
                  value={form.pond}
                  onChange={(e) => setForm((f) => ({ ...f, pond: e.target.value }))}
                  className="mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:border-[var(--color-accent)]"
                >
                  {PONDS.map((pond) => (
                    <option key={pond} value={pond}>{pond}</option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-sm">
                  <span className="font-medium">Temperature (°C)</span>
                  <input type="number" step="0.1" value={form.temperature} onChange={(e) => setForm((f) => ({ ...f, temperature: e.target.value }))} className="mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:border-[var(--color-accent)]" />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">pH</span>
                  <input type="number" step="0.1" value={form.ph} onChange={(e) => setForm((f) => ({ ...f, ph: e.target.value }))} className="mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:border-[var(--color-accent)]" />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">Dissolved Oxygen</span>
                  <input type="number" step="0.1" value={form.dissolvedOxygen} onChange={(e) => setForm((f) => ({ ...f, dissolvedOxygen: e.target.value }))} className="mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:border-[var(--color-accent)]" />
                </label>
              </div>
              <label className="block text-sm">
                <span className="font-medium">Water Color</span>
                <select value={form.waterColor} onChange={(e) => setForm((f) => ({ ...f, waterColor: e.target.value }))} className="mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:border-[var(--color-accent)]">
                  {WATER_COLORS.map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium">Weather</span>
                <select value={form.weather} onChange={(e) => setForm((f) => ({ ...f, weather: e.target.value }))} className="mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:border-[var(--color-accent)]">
                  {WEATHER_OPTIONS.map((weather) => (
                    <option key={weather} value={weather}>{weather}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium">Notes</span>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 outline-none focus:border-[var(--color-accent)]" />
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="min-h-11 flex-1 rounded-lg border border-[var(--color-border)] text-sm font-medium">Cancel</button>
              <button type="button" onClick={saveRecord} className="min-h-11 flex-1 rounded-lg bg-[var(--color-accent)] text-sm font-medium text-white">Save Record</button>
            </div>
          </div>
        </div>
      )}

      {/* History drawer */}
      {historyPond && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.1)]">
            <div className="sticky top-0 flex items-center justify-between border-b border-[var(--color-border)] bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-bold">{historyPond}</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">Water history</p>
              </div>
              <button type="button" onClick={() => setHistoryPond(null)} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm">Close</button>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {historyRecords.length === 0 ? (
                <p className="px-5 py-12 text-center text-sm text-[var(--color-text-secondary)]">No history for this pond.</p>
              ) : (
                historyRecords.map((record) => (
                  <div key={record.id} className="px-5 py-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{formatDate(record.date)}</p>
                      <StatusBadge status={record.status} />
                    </div>
                    <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div><dt className="text-[var(--color-text-muted)]">Temp</dt><dd className="font-semibold">{record.temperature}°C</dd></div>
                      <div><dt className="text-[var(--color-text-muted)]">pH</dt><dd className="font-semibold">{record.ph}</dd></div>
                      <div><dt className="text-[var(--color-text-muted)]">Oxygen</dt><dd className="font-semibold">{record.dissolvedOxygen}</dd></div>
                    </dl>
                    {record.notes && <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{record.notes}</p>}
                    <p className="mt-2 text-xs text-[var(--color-text-muted)]">Recorded by {record.recordedBy}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* View detail modal */}
      {viewRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{viewRecord.pond}</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">{formatDate(viewRecord.date)}</p>
              </div>
              <StatusBadge status={viewRecord.status} />
            </div>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-[var(--color-text-muted)]">Temperature</dt><dd className="font-semibold">{viewRecord.temperature}°C</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-text-muted)]">pH</dt><dd className="font-semibold">{viewRecord.ph}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-text-muted)]">Dissolved Oxygen</dt><dd className="font-semibold">{viewRecord.dissolvedOxygen} mg/L</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-text-muted)]">Water Color</dt><dd className="font-semibold">{viewRecord.waterColor}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-text-muted)]">Weather</dt><dd className="font-semibold">{viewRecord.weather}</dd></div>
              <div className="flex justify-between"><dt className="text-[var(--color-text-muted)]">Recorded By</dt><dd className="font-semibold">{viewRecord.recordedBy}</dd></div>
            </dl>
            {viewRecord.notes && <p className="mt-4 rounded-lg bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text-secondary)]">{viewRecord.notes}</p>}
            <button type="button" onClick={() => setViewRecord(null)} className="mt-6 min-h-11 w-full rounded-lg border border-[var(--color-border)] text-sm font-medium">Close</button>
          </div>
        </div>
      )}
    </main>
  );
}
