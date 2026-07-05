"use client";

import { useEffect, useMemo, useState } from "react";
import { AI_INSIGHTS, ALERTS, CHART_DATA, EMPTY_FORM, INITIAL_RECORDS, KPI_SPARKLINES, POND_LIVE, TIMELINE } from "./water-records/data";
import { NAV_ITEMS, PONDS, TECHNICIANS, WATER_COLORS, WEATHER_OPTIONS } from "./water-records/types";
import type { ChartMetric, ChartPeriod, PondLiveStatus, RecordFormState, WaterAlert, WaterRecord } from "./water-records/types";
import {
  HealthRing,
  inputClass,
  KpiCard,
  NavIcon,
  PeriodTabs,
  StatusBadge,
  Toast,
  TrendChart,
} from "./water-records/ui";
import { computeHealthScore, deriveStatus, formatDate, formatDateTime, nowTime, todayISO } from "./water-records/utils";

export default function WaterRecordsModule(): React.JSX.Element {
  const [records, setRecords] = useState<WaterRecord[]>(INITIAL_RECORDS);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [pondFilter, setPondFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | WaterRecord["status"]>("All");
  const [technicianFilter, setTechnicianFilter] = useState("All");
  const [paramFilter, setParamFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RecordFormState>(EMPTY_FORM);
  const [detailPond, setDetailPond] = useState<PondLiveStatus | null>(null);
  const [viewRecord, setViewRecord] = useState<WaterRecord | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [chartMetric, setChartMetric] = useState<ChartMetric>("Temperature");
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("Weekly");
  const [toast, setToast] = useState<string | null>(null);

  const today = todayISO();

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const todayRecords = useMemo(() => records.filter((r) => r.date === today), [records, today]);

  const kpis = useMemo(() => {
    const src = todayRecords.length > 0 ? todayRecords : records.slice(0, 6);
    const avg = (fn: (r: WaterRecord) => number) =>
      src.length ? (src.reduce((s, r) => s + fn(r), 0) / src.length).toFixed(2) : "—";
    const healthy = POND_LIVE.filter((p) => p.status === "Healthy").length;
    const critical = ALERTS.filter((a) => a.severity === "Critical").length;
    return {
      temp: avg((r) => r.temperature),
      ph: avg((r) => r.ph),
      oxygen: avg((r) => r.dissolvedOxygen),
      ammonia: avg((r) => r.ammonia),
      nitrite: avg((r) => r.nitrite),
      healthy,
      critical,
      testsToday: todayRecords.length,
    };
  }, [todayRecords, records]);

  const overallHealth = useMemo(() => {
    const scores = POND_LIVE.map((p) => p.healthScore);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, []);

  const filteredRecords = useMemo(() => {
    const term = query.toLowerCase();
    return records.filter((r) => {
      const matchesQuery =
        r.pond.toLowerCase().includes(term) ||
        r.date.includes(term) ||
        r.recordedBy.toLowerCase().includes(term) ||
        r.notes.toLowerCase().includes(term);
      const matchesPond = pondFilter === "All" || r.pond === pondFilter;
      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
      const matchesTech = technicianFilter === "All" || r.recordedBy === technicianFilter;
      const matchesFrom = !dateFrom || r.date >= dateFrom;
      const matchesTo = !dateTo || r.date <= dateTo;
      const matchesParam =
        paramFilter === "All" ||
        (paramFilter === "Ammonia" && r.ammonia > 0.02) ||
        (paramFilter === "Oxygen" && r.dissolvedOxygen < 5.5) ||
        (paramFilter === "pH" && (r.ph < 6.8 || r.ph > 8)) ||
        (paramFilter === "Temperature" && r.temperature > 30);
      return matchesQuery && matchesPond && matchesStatus && matchesTech && matchesFrom && matchesTo && matchesParam;
    });
  }, [records, query, pondFilter, statusFilter, technicianFilter, dateFrom, dateTo, paramFilter]);

  const chartPoints = useMemo(() => {
    const key = `${chartMetric}-${chartPeriod === "Custom" ? "Weekly" : chartPeriod}`;
    return CHART_DATA[key] ?? CHART_DATA[`${chartMetric}-Weekly`] ?? [];
  }, [chartMetric, chartPeriod]);

  const showToast = (msg: string): void => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const openCreateModal = (): void => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, testTime: nowTime() });
    setModalOpen(true);
    setFabOpen(false);
  };

  const openEditModal = (record: WaterRecord): void => {
    setEditingId(record.id);
    setForm({
      pond: record.pond,
      temperature: String(record.temperature),
      ph: String(record.ph),
      dissolvedOxygen: String(record.dissolvedOxygen),
      ammonia: String(record.ammonia),
      nitrite: String(record.nitrite),
      nitrate: String(record.nitrate),
      waterHardness: String(record.waterHardness),
      salinity: String(record.salinity),
      waterDepth: String(record.waterDepth),
      turbidity: String(record.turbidity),
      waterColor: record.waterColor,
      weather: record.weather,
      testTime: record.time,
      notes: record.notes,
    });
    setModalOpen(true);
  };

  const saveRecord = (): void => {
    const temperature = parseFloat(form.temperature);
    const ph = parseFloat(form.ph);
    const dissolvedOxygen = parseFloat(form.dissolvedOxygen);
    const ammonia = parseFloat(form.ammonia) || 0;
    const nitrite = parseFloat(form.nitrite) || 0;
    if (Number.isNaN(temperature) || Number.isNaN(ph) || Number.isNaN(dissolvedOxygen)) return;

    const status = deriveStatus(temperature, ph, dissolvedOxygen, ammonia, nitrite);
    const payload: WaterRecord = {
      id: editingId ?? `WR-${Date.now()}`,
      date: today,
      time: form.testTime || nowTime(),
      pond: form.pond,
      temperature,
      ph,
      dissolvedOxygen,
      ammonia,
      nitrite,
      nitrate: parseFloat(form.nitrate) || 0,
      waterHardness: parseFloat(form.waterHardness) || 0,
      salinity: parseFloat(form.salinity) || 0,
      waterDepth: parseFloat(form.waterDepth) || 0,
      turbidity: parseFloat(form.turbidity) || 0,
      waterLevel: 90,
      waterColor: form.waterColor,
      weather: form.weather,
      notes: form.notes,
      recordedBy: "Ayo",
      status,
    };

    if (editingId) {
      setRecords((c) => c.map((r) => (r.id === editingId ? payload : r)));
      showToast("Water test updated successfully.");
    } else {
      setRecords((c) => [payload, ...c]);
      showToast("Water test recorded successfully.");
    }
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const deleteRecord = (id: string): void => {
    setRecords((c) => c.filter((r) => r.id !== id));
    if (viewRecord?.id === id) setViewRecord(null);
    showToast("Record deleted.");
  };

  const chartMetrics: ChartMetric[] = ["Temperature", "pH", "Oxygen", "Ammonia", "Nitrite", "Water Level", "Turbidity"];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--color-surface)] text-[var(--color-text-primary)]">
      {/* Left nav */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[256px] border-r border-[var(--color-border)] bg-white/95 px-4 py-5 backdrop-blur-xl lg:block">
        <a href="/dashboard" className="flex items-center gap-2 px-2 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">A</div>
          <div><p className="text-sm font-bold tracking-[-0.02em]">AquaCore</p><p className="text-[11px] text-[var(--color-text-muted)]">Farm OS</p></div>
        </a>
        <nav className="mt-8 space-y-1">
          {NAV_ITEMS.map((item) => (
            <a key={item.label} href={item.href} className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-all hover:bg-[var(--color-surface)] ${item.label === "Water Records" ? "border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] font-medium text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"}`}>
              <NavIcon type={item.icon} /><span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 lg:pl-[256px]">
        <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-xl lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">A</div>
              <span className="text-sm font-bold">Water Records</span>
            </div>
            <a href="/dashboard" className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-medium">Dashboard</a>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Notifications strip */}
          <div className="mb-4 space-y-2">
            {ALERTS.slice(0, 2).map((alert) => (
              <AlertBanner key={alert.id} alert={alert} />
            ))}
          </div>

          {/* Page header */}
          <header className="mb-6 rounded-[18px] border border-[var(--color-border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 className="text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.04em]">Water Records</h1>
                <p className="mt-2 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
                  Monitor, analyze and maintain optimal water quality across every pond.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={openCreateModal} className="min-h-11 rounded-lg bg-[var(--color-accent)] px-4 text-sm font-medium text-white transition-all hover:bg-emerald-900 hover:shadow-[0_4px_12px_rgba(13,122,95,0.3)]">+ Record Water Test</button>
                <button type="button" onClick={() => showToast("Sensor import queued.")} className="min-h-11 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm font-medium text-[var(--color-text-secondary)] hover:shadow-sm">Import Sensor Data</button>
                <a href="/reports" className="min-h-11 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm font-medium text-[var(--color-text-secondary)] hover:shadow-sm inline-flex items-center">Generate Report</a>
                <button type="button" onClick={() => showToast("PDF export started.")} className="hidden min-h-11 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm font-medium text-[var(--color-text-secondary)] hover:shadow-sm sm:inline-flex sm:items-center">Export PDF</button>
                <button type="button" onClick={() => showToast("Excel export started.")} className="hidden min-h-11 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm font-medium text-[var(--color-text-secondary)] hover:shadow-sm md:inline-flex md:items-center">Export Excel</button>
              </div>
            </div>
          </header>

          <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
            <div className="min-w-0 space-y-6">
              {/* KPI Dashboard */}
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="skeleton h-36 rounded-[18px]" />
                  ))}
                </div>
              ) : (
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <KpiCard label="Avg Water Temperature" value={kpis.temp} unit="°C" trend="2.1%" trendUp={false} sparkline={KPI_SPARKLINES.temperature} updated="2m ago" icon={<NavIcon type="water" />} />
                  <KpiCard label="Average pH" value={kpis.ph} trend="0.8%" trendUp={false} sparkline={KPI_SPARKLINES.ph} updated="2m ago" icon={<span className="text-sm font-bold">pH</span>} />
                  <KpiCard label="Avg Dissolved Oxygen" value={kpis.oxygen} unit="mg/L" trend="3.4%" trendUp={true} sparkline={KPI_SPARKLINES.oxygen} updated="2m ago" icon={<span className="text-xs font-bold">O₂</span>} />
                  <KpiCard label="Average Ammonia" value={kpis.ammonia} unit="ppm" trend="12%" trendUp={false} sparkline={KPI_SPARKLINES.ammonia} updated="5m ago" icon={<span className="text-xs font-bold">NH₃</span>} />
                  <KpiCard label="Average Nitrite" value={kpis.nitrite} unit="ppm" trend="5.2%" trendUp={false} sparkline={KPI_SPARKLINES.nitrite} updated="5m ago" icon={<span className="text-xs font-bold">NO₂</span>} />
                  <KpiCard label="Ponds in Healthy Range" value={String(kpis.healthy)} unit={`/ ${POND_LIVE.length}`} trend="Stable" trendUp={true} sparkline={[4, 4, 5, 5, 4, 5, 5]} updated="Live" icon={<NavIcon type="pond" />} />
                  <KpiCard label="Critical Water Alerts" value={String(kpis.critical)} trend="+1 today" trendUp={false} sparkline={[1, 1, 2, 2, 3, 2, 2]} updated="Live" icon={<span className="text-sm">⚠</span>} />
                  <KpiCard label="Water Tests Today" value={String(kpis.testsToday)} trend="+2 vs avg" trendUp={true} sparkline={[2, 3, 2, 4, 3, 5, 3]} updated="Today" icon={<NavIcon type="reports" />} />
                </section>
              )}

              {/* AI Health Score */}
              <section className="rounded-[18px] border border-[var(--color-border)] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-8">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
                  <div className="flex flex-col items-center lg:items-start">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">Overall Water Health</p>
                    <div className="mt-4"><HealthRing score={overallHealth} /></div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold tracking-[-0.03em]">AI Summary</h2>
                    <ul className="mt-4 space-y-2 text-sm leading-7 text-[var(--color-text-secondary)]">
                      <li>Water conditions remain stable across most ponds.</li>
                      <li><strong className="text-[var(--color-text-primary)]">Pond D</strong> has elevated ammonia levels — action required.</li>
                      <li><strong className="text-[var(--color-text-primary)]">Pond B</strong> pH is slowly declining — monitor daily.</li>
                      <li className="text-[var(--color-accent)] font-medium">Recommend partial water replacement in Pond D within 24 hours.</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Live Water Status */}
              <section className="rounded-[18px] border border-[var(--color-border)] bg-white p-5 sm:p-6">
                <h2 className="text-lg font-bold tracking-[-0.03em]">Live Water Status</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Real-time readings from all ponds. Click for detailed history.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {POND_LIVE.map((pond) => (
                    <button key={pond.pond} type="button" onClick={() => setDetailPond(pond)} className="rounded-[18px] border border-[var(--color-border)] p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-accent-border)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{pond.pond}</p>
                          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{pond.batch} · {pond.species}</p>
                        </div>
                        <StatusBadge status={pond.status} pulse={pond.status === "Critical"} />
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                        {[
                          { l: "Temp", v: `${pond.temperature}°C` },
                          { l: "pH", v: pond.ph },
                          { l: "O₂", v: pond.dissolvedOxygen },
                          { l: "NH₃", v: pond.ammonia },
                          { l: "NO₂", v: pond.nitrite },
                          { l: "Score", v: pond.healthScore },
                        ].map((m) => (
                          <div key={m.l} className="rounded-lg bg-[var(--color-surface)] p-2">
                            <p className="text-[var(--color-text-muted)]">{m.l}</p>
                            <p className="mt-0.5 font-semibold">{m.v}</p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-[10px] text-[var(--color-text-muted)]">Last tested {pond.lastTested}</p>
                    </button>
                  ))}
                </div>
              </section>

              {/* Alert Center */}
              <section className="rounded-[18px] border border-[var(--color-border)] bg-white p-5 sm:p-6">
                <h2 className="text-lg font-bold tracking-[-0.03em]">Alert Center</h2>
                <div className="mt-4 space-y-3">
                  {ALERTS.map((alert) => (
                    <AlertBanner key={alert.id} alert={alert} compact />
                  ))}
                </div>
              </section>

              {/* AI Insights */}
              <section className="rounded-[18px] border border-[var(--color-accent-border)] bg-gradient-to-br from-[var(--color-accent-light)] to-white p-5 sm:p-6">
                <h2 className="text-lg font-bold tracking-[-0.03em]">AI Insights</h2>
                <ul className="mt-4 space-y-3">
                  {AI_INSIGHTS.map((insight) => (
                    <li key={insight} className="flex gap-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Charts */}
              <section className="rounded-[18px] border border-[var(--color-border)] bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Trend Analysis</h2>
                  <PeriodTabs period={chartPeriod} onChange={setChartPeriod} />
                </div>
                <div className="mt-4 flex flex-wrap gap-1">
                  {chartMetrics.map((m) => (
                    <button key={m} type="button" onClick={() => setChartMetric(m)} className={`min-h-9 rounded-lg px-3 text-xs font-medium transition-all ${chartMetric === m ? "bg-[var(--color-accent)] text-white" : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)]"}`}>
                      {m}
                    </button>
                  ))}
                </div>
                <div className="mt-6"><TrendChart points={chartPoints} metric={chartMetric} /></div>
              </section>

              {/* Timeline */}
              <section className="rounded-[18px] border border-[var(--color-border)] bg-white p-5 sm:p-6">
                <h2 className="text-lg font-bold tracking-[-0.03em]">Historical Timeline</h2>
                <div className="mt-6 space-y-0">
                  {TIMELINE.map((event, i) => (
                    <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                      {i < TIMELINE.length - 1 && <span className="absolute left-[11px] top-6 h-full w-px bg-[var(--color-border)]" />}
                      <span className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[10px]">
                        {event.type === "test" ? "💧" : event.type === "alert" ? "⚠" : event.type === "rain" ? "🌧" : "•"}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{event.title}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{event.pond} · {event.timestamp}</p>
                        {event.detail && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{event.detail}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Search & Filters */}
              <section className="rounded-[18px] border border-[var(--color-border)] bg-white p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  <input type="search" placeholder="Search pond, date, technician…" value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputClass} mt-0 lg:col-span-2`} />
                  <select value={pondFilter} onChange={(e) => setPondFilter(e.target.value)} className={`${inputClass} mt-0`}>
                    <option value="All">All ponds</option>
                    {PONDS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={`${inputClass} mt-0`}>
                    <option value="All">All statuses</option>
                    <option value="Healthy">Healthy</option>
                    <option value="Observation">Observation</option>
                    <option value="Critical">Critical</option>
                  </select>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`${inputClass} mt-0`} aria-label="From" />
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`${inputClass} mt-0`} aria-label="To" />
                  <select value={paramFilter} onChange={(e) => setParamFilter(e.target.value)} className={`${inputClass} mt-0`}>
                    <option value="All">All parameters</option>
                    <option value="Ammonia">Ammonia alerts</option>
                    <option value="Oxygen">Low oxygen</option>
                    <option value="pH">pH out of range</option>
                    <option value="Temperature">High temperature</option>
                  </select>
                  <select value={technicianFilter} onChange={(e) => setTechnicianFilter(e.target.value)} className={`${inputClass} mt-0`}>
                    <option value="All">All technicians</option>
                    {TECHNICIANS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </section>

              {/* Reports quick gen */}
              <section className="rounded-[18px] border border-[var(--color-border)] bg-white p-5 sm:p-6">
                <h2 className="text-lg font-bold tracking-[-0.03em]">Reports</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Daily Water Report", "Weekly Report", "Monthly Report", "Pond History", "Water Quality Summary", "Parameter Analysis"].map((r) => (
                    <button key={r} type="button" onClick={() => showToast(`${r} generating…`)} className="min-h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-xs font-medium transition-all hover:border-[var(--color-accent-border)] hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent)]">
                      {r}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  {["PDF", "Excel", "CSV"].map((fmt) => (
                    <button key={fmt} type="button" onClick={() => showToast(`Exporting ${fmt}…`)} className="min-h-9 rounded-md bg-[var(--color-surface)] px-3 text-xs font-medium text-[var(--color-text-secondary)]">{fmt}</button>
                  ))}
                </div>
              </section>

              {/* Data table */}
              <section className="rounded-[18px] border border-[var(--color-border)] bg-white">
                <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
                  <h2 className="text-lg font-bold tracking-[-0.03em]">Water Records</h2>
                </div>
                {filteredRecords.length === 0 ? (
                  <p className="px-6 py-12 text-center text-sm text-[var(--color-text-secondary)]">No records match your filters.</p>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto lg:block">
                      <table className="w-full min-w-[1200px] border-collapse">
                        <thead className="bg-[var(--color-surface)]">
                          <tr className="text-left text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                            {["Date", "Time", "Pond", "Temp", "pH", "D.O.", "NH₃", "NO₂", "Turbidity", "Level", "Weather", "By", "Status", "Actions"].map((h) => (
                              <th key={h} className="px-4 py-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecords.map((r) => (
                            <tr key={r.id} className="border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface)]">
                              <td className="px-4 py-3 text-sm">{formatDate(r.date)}</td>
                              <td className="px-4 py-3 text-sm">{r.time}</td>
                              <td className="px-4 py-3 text-sm font-semibold">{r.pond}</td>
                              <td className="px-4 py-3 text-sm">{r.temperature}</td>
                              <td className="px-4 py-3 text-sm">{r.ph}</td>
                              <td className="px-4 py-3 text-sm">{r.dissolvedOxygen}</td>
                              <td className="px-4 py-3 text-sm">{r.ammonia}</td>
                              <td className="px-4 py-3 text-sm">{r.nitrite}</td>
                              <td className="px-4 py-3 text-sm">{r.turbidity}</td>
                              <td className="px-4 py-3 text-sm">{r.waterLevel}%</td>
                              <td className="px-4 py-3 text-sm">{r.weather}</td>
                              <td className="px-4 py-3 text-sm">{r.recordedBy}</td>
                              <td className="px-4 py-3"><StatusBadge status={r.status} pulse={r.status === "Critical"} /></td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button type="button" onClick={() => setViewRecord(r)} className="text-xs font-medium text-[var(--color-accent)] hover:underline">View</button>
                                  <button type="button" onClick={() => openEditModal(r)} className="text-xs font-medium hover:underline">Edit</button>
                                  <button type="button" onClick={() => deleteRecord(r.id)} className="text-xs font-medium text-[var(--color-danger)] hover:underline">Delete</button>
                                  <button type="button" onClick={() => showToast("Record exported.")} className="text-xs font-medium hover:underline">Export</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="grid gap-3 p-4 lg:hidden">
                      {filteredRecords.map((r) => {
                        const exp = expandedMobile === r.id;
                        return (
                          <div key={r.id} className="overflow-hidden rounded-[18px] border border-[var(--color-border)]">
                            <button type="button" onClick={() => setExpandedMobile(exp ? null : r.id)} className="flex w-full items-center justify-between p-4 text-left">
                              <div>
                                <p className="font-semibold">{r.pond}</p>
                                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{formatDateTime(r.date, r.time)}</p>
                              </div>
                              <StatusBadge status={r.status} />
                            </button>
                            {exp && (
                              <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                                <dl className="grid grid-cols-3 gap-2 text-xs">
                                  <div><dt className="text-[var(--color-text-muted)]">Temp</dt><dd className="font-semibold">{r.temperature}°C</dd></div>
                                  <div><dt className="text-[var(--color-text-muted)]">pH</dt><dd className="font-semibold">{r.ph}</dd></div>
                                  <div><dt className="text-[var(--color-text-muted)]">O₂</dt><dd className="font-semibold">{r.dissolvedOxygen}</dd></div>
                                </dl>
                                <div className="mt-4 flex flex-col gap-2">
                                  <button type="button" onClick={() => setViewRecord(r)} className="min-h-12 w-full rounded-lg bg-[var(--color-accent)] text-sm font-medium text-white">View History</button>
                                  <div className="flex gap-2">
                                    <button type="button" onClick={() => openEditModal(r)} className="min-h-11 flex-1 rounded-lg border border-[var(--color-border)] bg-white text-sm font-medium">Edit</button>
                                    <button type="button" onClick={() => deleteRecord(r.id)} className="min-h-11 rounded-lg border border-red-200 px-4 text-sm font-medium text-[var(--color-danger)]">Delete</button>
                                  </div>
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
            </div>

            {/* Right sidebar */}
            <aside className="hidden space-y-4 xl:block">
              <SidebarCard title="Today's Water Tests">
                {todayRecords.length === 0 ? <p className="text-sm text-[var(--color-text-secondary)]">No tests yet today.</p> : todayRecords.map((r) => (
                  <div key={r.id} className="flex items-center justify-between border-b border-[var(--color-border)] py-2 last:border-0">
                    <span className="text-sm font-medium">{r.pond}</span>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </SidebarCard>
              <SidebarCard title="Upcoming Tests">
                {POND_LIVE.filter((p) => !todayRecords.some((r) => r.pond === p.pond)).map((p) => (
                  <p key={p.pond} className="py-1 text-sm text-[var(--color-text-secondary)]">{p.pond} — overdue</p>
                ))}
              </SidebarCard>
              <SidebarCard title="Critical Alerts">
                {ALERTS.filter((a) => a.severity === "Critical").map((a) => (
                  <p key={a.id} className="py-1 text-sm text-[var(--color-danger)]">{a.pond}: {a.title}</p>
                ))}
              </SidebarCard>
              <SidebarCard title="Weather">
                <p className="text-2xl font-bold">32°C</p>
                <p className="text-sm text-[var(--color-text-secondary)]">Partly cloudy · Humidity 78%</p>
                <p className="mt-2 text-xs text-[var(--color-warning)]">Heavy rainfall expected this evening.</p>
              </SidebarCard>
              <SidebarCard title="Recent Activity">
                {TIMELINE.slice(0, 4).map((e) => (
                  <p key={e.id} className="border-b border-[var(--color-border)] py-2 text-xs text-[var(--color-text-secondary)] last:border-0">{e.title} — {e.pond}</p>
                ))}
              </SidebarCard>
              <SidebarCard title="Water Health Score">
                <div className="flex justify-center py-2"><HealthRing score={overallHealth} /></div>
              </SidebarCard>
            </aside>
          </div>
        </div>
      </div>

      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-40 xl:hidden">
        {fabOpen && (
          <div className="mb-3 flex flex-col items-end gap-2">
            {[
              { label: "Record Test", action: openCreateModal },
              { label: "Water Change", action: () => showToast("Water change logged.") },
              { label: "Add Note", action: () => showToast("Note added.") },
              { label: "Generate Report", action: () => showToast("Report generating…") },
            ].map((item) => (
              <button key={item.label} type="button" onClick={item.action} className="min-h-11 rounded-full border border-[var(--color-border)] bg-white px-4 text-sm font-medium shadow-lg">{item.label}</button>
            ))}
          </div>
        )}
        <button type="button" onClick={() => setFabOpen(!fabOpen)} className="flex min-h-14 min-w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-2xl font-light text-white shadow-[0_4px_20px_rgba(13,122,95,0.4)]">
          {fabOpen ? "×" : "+"}
        </button>
      </div>

      {toast && <Toast message={toast} />}

      {/* Record modal — continued in part 2 via same file */}
      {modalOpen && <RecordModal form={form} setForm={setForm} editing={!!editingId} onClose={() => setModalOpen(false)} onSave={saveRecord} />}
      {detailPond && <PondPanel pond={detailPond} records={records.filter((r) => r.pond === detailPond.pond)} onClose={() => setDetailPond(null)} />}
      {viewRecord && <ViewModal record={viewRecord} onClose={() => setViewRecord(null)} />}
    </main>
  );
}

function AlertBanner({ alert, compact }: { alert: WaterAlert; compact?: boolean }): React.JSX.Element {
  const isCritical = alert.severity === "Critical";
  return (
    <div className={`flex flex-col gap-1 rounded-[18px] border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${isCritical ? "border-red-200 bg-red-50/80" : "border-amber-200 bg-amber-50/80"}`}>
      <div>
        <p className={`text-sm font-semibold ${isCritical ? "text-[var(--color-danger)]" : "text-[var(--color-warning)]"}`}>
          {isCritical ? "Critical" : "Warning"} · {alert.title}
        </p>
        <p className="text-sm text-[var(--color-text-secondary)]">{alert.pond} — {alert.action}</p>
      </div>
      {!compact && <span className="text-xs text-[var(--color-text-muted)]">{alert.timestamp}</span>}
    </div>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="rounded-[18px] border border-[var(--color-border)] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <h3 className="text-sm font-bold tracking-[-0.02em]">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function RecordModal({ form, setForm, editing, onClose, onSave }: {
  form: RecordFormState; setForm: React.Dispatch<React.SetStateAction<RecordFormState>>; editing: boolean; onClose: () => void; onSave: () => void;
}): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[18px] border border-[var(--color-border)] bg-white p-6 shadow-[0_24px_64px_rgba(0,0,0,0.15)]">
        <h2 className="text-xl font-bold tracking-[-0.03em]">{editing ? "Edit Water Test" : "Record Water Test"}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2"><span className="font-medium">Select Pond</span>
            <select value={form.pond} onChange={(e) => setForm((f) => ({ ...f, pond: e.target.value }))} className={inputClass}>
              {PONDS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          {[
            { k: "temperature" as const, l: "Temperature (°C)" },
            { k: "ph" as const, l: "pH" },
            { k: "dissolvedOxygen" as const, l: "Dissolved Oxygen (mg/L)" },
            { k: "ammonia" as const, l: "Ammonia (ppm)" },
            { k: "nitrite" as const, l: "Nitrite (ppm)" },
            { k: "nitrate" as const, l: "Nitrate (ppm)" },
            { k: "waterHardness" as const, l: "Water Hardness" },
            { k: "salinity" as const, l: "Salinity" },
            { k: "waterDepth" as const, l: "Water Depth (m)" },
            { k: "turbidity" as const, l: "Turbidity (NTU)" },
          ].map(({ k, l }) => (
            <label key={k} className="block text-sm"><span className="font-medium">{l}</span>
              <input type="number" step="0.01" value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} className={inputClass} />
            </label>
          ))}
          <label className="block text-sm"><span className="font-medium">Water Color</span>
            <select value={form.waterColor} onChange={(e) => setForm((f) => ({ ...f, waterColor: e.target.value }))} className={inputClass}>
              {WATER_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-sm"><span className="font-medium">Weather Condition</span>
            <select value={form.weather} onChange={(e) => setForm((f) => ({ ...f, weather: e.target.value }))} className={inputClass}>
              {WEATHER_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </label>
          <label className="block text-sm"><span className="font-medium">Test Time</span>
            <input type="time" value={form.testTime} onChange={(e) => setForm((f) => ({ ...f, testTime: e.target.value }))} className={inputClass} />
          </label>
          <label className="block text-sm sm:col-span-2"><span className="font-medium">Photo Upload</span>
            <input type="file" accept="image/*" className="mt-1.5 block w-full text-sm text-[var(--color-text-secondary)]" />
          </label>
          <label className="block text-sm sm:col-span-2"><span className="font-medium">Notes</span>
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]" />
          </label>
        </div>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-lg border border-[var(--color-border)] text-sm font-medium">Cancel</button>
          <button type="button" onClick={onSave} className="min-h-11 flex-1 rounded-lg bg-[var(--color-accent)] text-sm font-medium text-white">Save Record</button>
        </div>
      </div>
    </div>
  );
}

function PondPanel({ pond, records, onClose }: { pond: PondLiveStatus; records: WaterRecord[]; onClose: () => void }): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.1)]">
        <div className="sticky top-0 flex items-center justify-between border-b border-[var(--color-border)] bg-white px-5 py-4">
          <div><h2 className="text-lg font-bold">{pond.pond}</h2><p className="text-sm text-[var(--color-text-secondary)]">Pond details & history</p></div>
          <button type="button" onClick={onClose} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm">Close</button>
        </div>
        <div className="flex justify-center border-b border-[var(--color-border)] py-6"><HealthRing score={pond.healthScore} /></div>
        <div className="divide-y divide-[var(--color-border)] px-5">
          {[
            { l: "Current Batch", v: pond.batch },
            { l: "Species", v: pond.species },
            { l: "Fish Population", v: pond.population.toLocaleString() },
            { l: "Average Weight", v: `${pond.avgWeight} kg` },
            { l: "Water Source", v: pond.waterSource },
            { l: "Last Water Change", v: formatDate(pond.lastWaterChange) },
            { l: "Water Volume", v: `${pond.waterVolume} m³` },
            { l: "Water Depth", v: `${pond.waterDepth} m` },
          ].map((row) => (
            <div key={row.l} className="flex justify-between py-3 text-sm"><span className="text-[var(--color-text-muted)]">{row.l}</span><span className="font-semibold">{row.v}</span></div>
          ))}
        </div>
        <div className="border-t border-[var(--color-border)] p-5">
          <h3 className="text-sm font-bold">Latest Readings</h3>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-[var(--color-surface)] p-2"><p className="text-[var(--color-text-muted)]">Temp</p><p className="font-semibold">{pond.temperature}°C</p></div>
            <div className="rounded-lg bg-[var(--color-surface)] p-2"><p className="text-[var(--color-text-muted)]">pH</p><p className="font-semibold">{pond.ph}</p></div>
            <div className="rounded-lg bg-[var(--color-surface)] p-2"><p className="text-[var(--color-text-muted)]">O₂</p><p className="font-semibold">{pond.dissolvedOxygen}</p></div>
          </div>
          <h3 className="mt-6 text-sm font-bold">History</h3>
          <div className="mt-3 space-y-3">
            {records.slice(0, 5).map((r) => (
              <div key={r.id} className="rounded-lg border border-[var(--color-border)] p-3 text-sm">
                <div className="flex justify-between"><span className="font-medium">{formatDateTime(r.date, r.time)}</span><StatusBadge status={r.status} /></div>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">{r.temperature}°C · pH {r.ph} · O₂ {r.dissolvedOxygen}</p>
              </div>
            ))}
          </div>
          <a href="/ponds" className="mt-5 flex min-h-11 items-center justify-center rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-accent)]">View in Pond Management →</a>
        </div>
      </div>
    </div>
  );
}

function ViewModal({ record, onClose }: { record: WaterRecord; onClose: () => void }): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[18px] border border-[var(--color-border)] bg-white p-6">
        <div className="flex items-start justify-between">
          <div><h2 className="text-xl font-bold">{record.pond}</h2><p className="text-sm text-[var(--color-text-secondary)]">{formatDateTime(record.date, record.time)}</p></div>
          <StatusBadge status={record.status} pulse={record.status === "Critical"} />
        </div>
        <dl className="mt-6 space-y-2 text-sm">
          {[
            ["Temperature", `${record.temperature}°C`], ["pH", record.ph], ["Dissolved Oxygen", `${record.dissolvedOxygen} mg/L`],
            ["Ammonia", `${record.ammonia} ppm`], ["Nitrite", `${record.nitrite} ppm`], ["Nitrate", `${record.nitrate} ppm`],
            ["Turbidity", `${record.turbidity} NTU`], ["Water Level", `${record.waterLevel}%`], ["Weather", record.weather],
            ["Recorded By", record.recordedBy], ["Health Score", computeHealthScore(record)],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between border-b border-[var(--color-border)] py-2 last:border-0">
              <dt className="text-[var(--color-text-muted)]">{l}</dt><dd className="font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        {record.notes && <p className="mt-4 rounded-lg bg-[var(--color-surface)] p-3 text-sm">{record.notes}</p>}
        <button type="button" onClick={onClose} className="mt-6 min-h-11 w-full rounded-lg border border-[var(--color-border)] text-sm font-medium">Close</button>
      </div>
    </div>
  );
}
