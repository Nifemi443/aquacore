interface StatCard {
  label: string;
  value: string;
  sub: string;
  trend: string;
  trendTone: "up" | "neutral" | "warning" | "good";
  accentValue?: boolean;
}

interface NavItem {
  label: string;
  active?: boolean;
  icon: React.JSX.Element;
}

interface MetricRow {
  label: string;
  value: string;
  fill: string;
}

interface ScheduleRow {
  pond: string;
  species: string;
  kg: number;
  time: string;
  done: boolean;
}

interface ActivityItem {
  text: string;
  time: string;
  tone: "accent" | "warning" | "muted";
}

const statCards: StatCard[] = [
  { label: "PONDS", value: "12", sub: "4 active batches", trend: "↑ 2 today", trendTone: "up" },
  { label: "BATCHES", value: "8", sub: "2 nearing harvest", trend: "—", trendTone: "neutral" },
  { label: "FEEDING DUE", value: "5", sub: "Next: 12:00 PM", trend: "5 due", trendTone: "warning" },
  {
    label: "HEALTH",
    value: "96%",
    sub: "2 ponds on watch",
    trend: "● Healthy",
    trendTone: "good",
    accentValue: true,
  },
];

const waterMetrics: MetricRow[] = [
  { label: "D.O.", value: "6.2 mg/L", fill: "78%" },
  { label: "pH", value: "7.1", fill: "71%" },
  { label: "Temp", value: "28°C", fill: "62%" },
  { label: "Ammonia", value: "0.02 ppm", fill: "20%" },
];

const scheduleRows: ScheduleRow[] = [
  { pond: "Pond 1", species: "Tilapia", kg: 85, time: "07:00", done: true },
  { pond: "Pond 4", species: "Catfish", kg: 120, time: "08:00", done: true },
  { pond: "Pond 7", species: "Catfish", kg: 95, time: "09:30", done: true },
  { pond: "Pond 2", species: "Tilapia", kg: 70, time: "12:00", done: false },
  { pond: "Pond 9", species: "Catfish", kg: 110, time: "14:30", done: false },
];

const activityItems: ActivityItem[] = [
  { text: "Pond 7 fed — 95kg recorded", time: "2m ago", tone: "accent" },
  { text: "Batch #6 weight updated — avg 480g", time: "14m ago", tone: "accent" },
  { text: "Pond 3 DO alert flagged", time: "1h ago", tone: "warning" },
  { text: "Water quality check: Pond 4", time: "2h ago", tone: "muted" },
  { text: "Pond 1 feeding completed", time: "3h ago", tone: "accent" },
];

function IconSvg({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
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

function CheckIcon({ size = 9 }: { size?: number }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l5 5L19 7" />
    </svg>
  );
}

const navItems: NavItem[] = [
  {
    label: "Overview",
    active: true,
    icon: (
      <IconSvg>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </IconSvg>
    ),
  },
  {
    label: "Ponds",
    icon: (
      <IconSvg>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 21c0-9 9-9 9-9" />
      </IconSvg>
    ),
  },
  {
    label: "Feeding",
    icon: (
      <IconSvg>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </IconSvg>
    ),
  },
  {
    label: "Water Quality",
    icon: (
      <IconSvg>
        <path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z" />
      </IconSvg>
    ),
  },
  {
    label: "Treatments",
    icon: (
      <IconSvg>
        <path d="M12 2l8 4v6c0 5-4 9-8 10-4-1-8-5-8-10V6l8-4z" />
        <path d="M9 12l2 2 4-4" />
      </IconSvg>
    ),
  },
  {
    label: "Harvests",
    icon: (
      <IconSvg>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </IconSvg>
    ),
  },
  {
    label: "Reports",
    icon: (
      <IconSvg>
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </IconSvg>
    ),
  },
];

function trendClass(tone: StatCard["trendTone"]): string {
  if (tone === "warning") {
    return "bg-amber-100 text-amber-800";
  }

  if (tone === "neutral") {
    return "bg-neutral-100 text-[var(--color-text-secondary)]";
  }

  return "bg-emerald-100 text-emerald-800";
}

function activityToneClass(tone: ActivityItem["tone"]): string {
  if (tone === "warning") {
    return "bg-amber-500";
  }

  if (tone === "muted") {
    return "bg-neutral-300";
  }

  return "bg-[var(--color-accent)]";
}

function LockIcon(): React.JSX.Element {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function GrowthChart(): React.JSX.Element {
  return (
    <svg width="100%" height="120" viewBox="0 0 560 120" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D7A5F" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0D7A5F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1="30" x2="560" y2="30" stroke="#F2F2F2" strokeWidth="1" />
      <line x1="0" y1="60" x2="560" y2="60" stroke="#F2F2F2" strokeWidth="1" />
      <line x1="0" y1="90" x2="560" y2="90" stroke="#F2F2F2" strokeWidth="1" />
      <text x="4" y="28" fontSize="9" fill="#A3A3A3">
        1kg
      </text>
      <text x="4" y="58" fontSize="9" fill="#A3A3A3">
        600g
      </text>
      <text x="4" y="88" fontSize="9" fill="#A3A3A3">
        200g
      </text>
      <path
        d="M0 115 C56 110 112 100 168 88 C224 76 280 62 336 50 C392 38 448 26 504 18 L560 14 L560 120 L0 120 Z"
        fill="url(#growthFill)"
      />
      <path
        d="M0 115 C56 110 112 100 168 88 C224 76 280 62 336 50 C392 38 448 26 504 18 L560 14"
        stroke="#0D7A5F"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M0 108 L560 8" stroke="#E5E5E5" strokeWidth="1.5" strokeDasharray="6 4" fill="none" />
      <circle cx="504" cy="18" r="4" fill="#0D7A5F" />
      <circle cx="504" cy="18" r="7" fill="#0D7A5F" opacity="0.2" />
      <text x="0" y="118" fontSize="9" fill="#A3A3A3">
        Day 1
      </text>
      <text x="130" y="118" fontSize="9" fill="#A3A3A3">
        Day 30
      </text>
      <text x="260" y="118" fontSize="9" fill="#A3A3A3">
        Day 60
      </text>
      <text x="390" y="118" fontSize="9" fill="#A3A3A3">
        Day 90
      </text>
      <text x="500" y="118" fontSize="9" fill="#A3A3A3">
        Now
      </text>
    </svg>
  );
}

function StatGrid({ compact = false }: { compact?: boolean }): React.JSX.Element {
  return (
    <div className={compact ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-3 lg:grid-cols-4"}>
      {statCards.map((card) => (
        <div key={card.label} className="rounded-md border border-[var(--color-border)] bg-white px-4 py-[14px]">
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
              {card.label}
            </p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${trendClass(card.trendTone)}`}>
              {card.trend}
            </span>
          </div>
          <p
            className={`text-[26px] font-bold leading-none text-[var(--color-text-primary)] ${
              card.accentValue ? "text-[var(--color-accent)]" : ""
            }`}
          >
            {card.value}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPreview(): React.JSX.Element {
  return (
    <section
      id="product"
      className="scroll-mt-20 overflow-hidden border-y border-[var(--color-border)] bg-white py-16 sm:py-24"
    >
      <div className="mx-auto mb-12 max-w-[560px] px-6 text-center sm:mb-16">
        <p className="text-label mb-3 text-[var(--color-accent)]">THE PRODUCT</p>
        <h2 className="mb-4 text-[clamp(26px,4vw,48px)] font-bold tracking-[-0.03em] text-[var(--color-text-primary)]">
          One screen. Every pond.
        </h2>
        <p className="text-[17px] leading-[1.7] text-[var(--color-text-secondary)]">
          Everything your farm produces in one place — feeding schedules, water quality, growth curves, and AI
          insights.
        </p>
      </div>

      <div className="mx-auto px-6 lg:max-w-[1040px] lg:px-20">
        <div className="sm:hidden">
          <div className="rounded-lg border border-[var(--color-border)] bg-white p-6">
            <StatGrid compact />
            <p className="mt-6 text-center text-[13px] text-[var(--color-text-secondary)]">
              Full dashboard on desktop →
            </p>
          </div>
        </div>

        <div
          className="hidden overflow-hidden rounded-xl border border-[var(--color-border-strong)] bg-white sm:block"
          style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08), 0 24px 64px rgba(0,0,0,0.10)" }}
        >
          <div className="flex h-11 items-center gap-3 border-b border-[var(--color-border)] bg-neutral-100 px-4">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>
            <div className="hidden items-end gap-1 md:flex">
              <div className="flex h-7 w-[120px] items-center rounded-t-md border border-b-0 border-[var(--color-border)] bg-white px-3 text-xs font-medium text-[var(--color-text-primary)]">
                Overview
              </div>
              {["Ponds", "Feeding"].map((tab) => (
                <div key={tab} className="flex h-7 w-[120px] items-center px-3 text-xs text-[var(--color-text-secondary)]">
                  {tab}
                </div>
              ))}
            </div>
            <div className="mx-auto flex h-[26px] max-w-[280px] flex-1 items-center justify-center gap-1.5 rounded-md bg-neutral-200 px-3 font-mono text-[11px] text-[var(--color-text-secondary)]">
              <span className="text-[var(--color-text-muted)]">
                <LockIcon />
              </span>
              <span className="truncate">app.aquacore.io/dashboard</span>
            </div>
          </div>

          <div className="grid min-h-[520px] grid-cols-1 lg:grid-cols-[200px_1fr]">
            <aside className="hidden flex-col border-r border-[var(--color-border)] bg-white py-4 lg:flex">
              <div className="mb-2 border-b border-[var(--color-border)] px-4 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent)]">
                    <span className="text-[11px] font-bold text-white">A</span>
                  </div>
                  <span className="text-[13px] font-bold text-[var(--color-text-primary)]">AquaCore</span>
                </div>
              </div>
              <p className="px-4 pb-2 pt-4 text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                OPERATIONS
              </p>
              <nav>
                {navItems.map((item) => (
                  <div
                    key={item.label}
                    className={`flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-[13px] transition-all duration-200 hover:bg-[var(--color-surface)] ${
                      item.active
                        ? "border-l-2 border-[var(--color-accent)] bg-[var(--color-accent-light)] pl-[14px] font-medium text-[var(--color-accent)]"
                        : "text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                ))}
              </nav>
              <div className="mt-auto border-t border-[var(--color-border)] px-4 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] font-semibold text-[var(--color-text-secondary)]">
                    AO
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-primary)]">Ayo Okafor</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">Farm Owner</p>
                  </div>
                </div>
              </div>
            </aside>

            <main className="overflow-hidden bg-neutral-50 p-5">
              <div className="mb-4">
                <StatGrid />
              </div>

              <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px]">
                <section className="h-[200px] rounded-md border border-[var(--color-border)] bg-white p-4">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-text-primary)]">Fish growth — Batch #4</p>
                      <p className="text-[11px] text-[var(--color-text-muted)]">Catfish · Started Day 1</p>
                    </div>
                    <div className="flex gap-2">
                      {["7D", "30D", "90D"].map((period) => (
                        <span
                          key={period}
                          className={`rounded border px-2.5 py-1 text-[11px] ${
                            period === "30D"
                              ? "border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-white"
                              : "border-[var(--color-border)] text-[var(--color-text-secondary)]"
                          }`}
                        >
                          {period}
                        </span>
                      ))}
                    </div>
                  </div>
                  <GrowthChart />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex gap-4">
                      <span className="flex items-center text-[11px] text-[var(--color-text-secondary)]">
                        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                        Actual growth
                      </span>
                      <span className="flex items-center text-[11px] text-[var(--color-text-secondary)]">
                        <span className="mr-1 inline-block w-4 border-t-2 border-dashed border-[var(--color-border)]" />
                        Target
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-[var(--color-accent)]">+340g avg · On track ↗</span>
                  </div>
                </section>

                <section className="flex h-[200px] flex-col rounded-md border border-[var(--color-border)] bg-white p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-semibold text-[var(--color-text-primary)]">Water quality</p>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                      All clear
                    </span>
                  </div>
                  <div className="flex-1">
                    {waterMetrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="flex items-center justify-between border-b border-neutral-100 py-2.5 last:border-0"
                      >
                        <span className="text-xs text-[var(--color-text-secondary)]">{metric.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-[var(--color-accent)]">{metric.value}</span>
                          <span className="h-1 w-10 rounded-full bg-neutral-100">
                            <span
                              className="block h-full rounded-full bg-[var(--color-accent)]"
                              style={{ width: metric.fill }}
                            />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 border-t border-neutral-100 pt-2 text-[10px] text-[var(--color-text-muted)]">
                    Last checked: 07:45 AM · Pond 4
                  </p>
                </section>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_180px]">
                <section className="rounded-md border border-[var(--color-border)] bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold text-[var(--color-text-primary)]">Today&apos;s schedule</p>
                    <span className="text-[11px] font-medium text-[var(--color-accent)]">3 of 6 done</span>
                  </div>
                  <div className="mb-4 h-1 rounded-full bg-neutral-100">
                    <div className="h-full w-1/2 rounded-full bg-[var(--color-accent)]" />
                  </div>
                  {scheduleRows.map((row) => (
                    <div
                      key={`${row.pond}-${row.time}`}
                      className="grid grid-cols-[12px_minmax(48px,64px)_minmax(0,1fr)_44px] items-center gap-2.5 border-b border-neutral-100 py-2 last:border-0"
                    >
                      <span
                        className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-full border ${
                          row.done
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                            : "border-[var(--color-border-strong)]"
                        }`}
                      >
                        {row.done && <CheckIcon />}
                      </span>
                      <span className="whitespace-nowrap text-[13px] font-medium text-[var(--color-text-primary)]">
                        {row.pond}
                      </span>
                      <span className="truncate whitespace-nowrap text-xs text-[var(--color-text-secondary)]">
                        {row.species} · {row.kg}kg
                      </span>
                      <span className="justify-self-end whitespace-nowrap font-mono text-xs text-[var(--color-text-muted)]">
                        {row.time}
                      </span>
                    </div>
                  ))}
                </section>

                <section className="rounded-md border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-[22px] w-[22px] items-center justify-center rounded bg-[var(--color-accent)] text-[9px] font-extrabold text-white">
                      AI
                    </span>
                    <p className="text-xs font-semibold text-[var(--color-text-primary)]">AI Farm Insight</p>
                    <span className="ml-auto text-[10px] text-[var(--color-accent)]">Live</span>
                  </div>
                  <p className="mb-2 text-[13px] leading-[1.55] text-[var(--color-text-primary)]">
                    “Pond 4 growth is 12% below target curve at Day 34. Increase feed ration by 8% — from 120kg to
                    130kg daily.”
                  </p>
                  <div className="flex gap-2">
                    <button className="rounded border border-[var(--color-accent)] px-3 py-1 text-[11px] font-semibold text-[var(--color-accent)] transition-all duration-200 hover:bg-[var(--color-accent)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
                      Apply
                    </button>
                    <button className="rounded px-3 py-1 text-[11px] text-[var(--color-text-secondary)] transition-all duration-200 hover:bg-white hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
                      Dismiss
                    </button>
                  </div>
                  <div className="my-3 border-t border-[var(--color-accent-border)]" />
                  <p className="mb-2 text-[13px] leading-[1.55] text-[var(--color-text-primary)]">
                    “Pond 3 DO levels trending low (5.4 mg/L). Increase aeration or reduce feeding temporarily.”
                  </p>
                  <span className="text-[11px] font-medium text-[var(--color-warning)]">⚠ Action needed</span>
                </section>

                <section className="rounded-md border border-[var(--color-border)] bg-white p-4 lg:col-auto">
                  <p className="mb-3 text-xs font-semibold text-[var(--color-text-primary)]">Recent activity</p>
                  {activityItems.map((item) => (
                    <div key={`${item.text}-${item.time}`} className="flex gap-2 pb-3 last:pb-0">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${activityToneClass(item.tone)}`} />
                      <div>
                        <p className="text-xs leading-[1.4] text-[var(--color-text-primary)]">{item.text}</p>
                        <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </section>
              </div>
            </main>
          </div>
        </div>
      </div>
    </section>
  );
}
