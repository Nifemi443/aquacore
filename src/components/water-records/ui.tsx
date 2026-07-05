import type { ChartMetric, ChartPeriod, NavIconType, WaterStatus } from "./types";
import { areaChartPath, sparklinePath } from "./utils";

export function NavIcon({ type }: { type: NavIconType }): React.JSX.Element {
  const paths: Record<NavIconType, React.ReactNode> = {
    dashboard: (<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
    pond: (<><circle cx="12" cy="12" r="9" /><path d="M7 14c2-2 4-2 6 0s4 2 6 0" /></>),
    batch: (<><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></>),
    feed: <path d="M5 12h14M7 8h10M8 16h8" />,
    inventory: (<><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /></>),
    water: <path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z" />,
    harvest: <path d="M4 14c5-8 11-8 16 0M6 14v5h12v-5" />,
    reports: (<><path d="M4 19V5" /><path d="M4 19h16" /><path d="M7 15l4-4 3 3 5-7" /></>),
    settings: (<><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M19.4 15a8 8 0 0 0 .1-2l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L15 5.5h-4L10.6 8a8 8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a8 8 0 0 0 .1 2l-2.1 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1l.4 2.5h4l.4-2.5a8 8 0 0 0 1.7-1l2.4 1 2-3.5L19.4 15z" /></>),
  };
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[type]}
    </svg>
  );
}

export function StatusBadge({ status, pulse }: { status: WaterStatus; pulse?: boolean }): React.JSX.Element {
  const styles = {
    Healthy: "bg-[var(--color-accent-light)] text-[var(--color-accent)]",
    Observation: "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
    Critical: "bg-[var(--color-danger-light)] text-[var(--color-danger)]",
  };
  const labels = { Healthy: "Healthy", Observation: "Observation", Critical: "Critical" };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]} ${pulse && status === "Critical" ? "badge-pulse-critical" : ""}`}>
      {labels[status]}
    </span>
  );
}

export function Sparkline({ points, color = "var(--color-accent)" }: { points: number[]; color?: string }): React.JSX.Element {
  const path = sparklinePath(points);
  return (
    <svg width="72" height="28" className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={path} />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  unit,
  trend,
  trendUp,
  sparkline,
  updated,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  trend: string;
  trendUp: boolean;
  sparkline: number[];
  updated: string;
  icon: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="group rounded-[18px] border border-[var(--color-border)] bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent-light)] text-[var(--color-accent)]">{icon}</div>
        <span className={`text-xs font-semibold ${trendUp ? "text-[var(--color-accent)]" : "text-[var(--color-danger)]"}`}>
          {trendUp ? "↑" : "↓"} {trend}
        </span>
      </div>
      <p className="mt-4 text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-[-0.04em]">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-[var(--color-text-muted)]">{unit}</span>}
      </p>
      <div className="mt-3 flex items-end justify-between">
        <Sparkline points={sparkline} />
        <span className="text-[10px] text-[var(--color-text-muted)]">{updated}</span>
      </div>
    </div>
  );
}

export function TrendChart({ points, metric }: { points: number[]; metric: ChartMetric }): React.JSX.Element {
  const w = 560;
  const h = 160;
  const { line, area } = areaChartPath(points, w, h);
  const colors: Record<ChartMetric, string> = {
    Temperature: "#0d7a5f",
    pH: "#2563eb",
    Oxygen: "#0891b2",
    Ammonia: "#d97706",
    Nitrite: "#7c3aed",
    "Water Level": "#059669",
    Turbidity: "#64748b",
  };
  const color = colors[metric];
  return (
    <div className="chart-animate w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[160px] w-full min-w-[400px]" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#grad-${metric})`} />
        <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={line} />
      </svg>
    </div>
  );
}

export function Toast({ message }: { message: string }): React.JSX.Element {
  return (
    <div className="toast-enter fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl border border-[var(--color-accent-border)] bg-white px-5 py-3 text-sm font-medium shadow-[0_8px_32px_rgba(0,0,0,0.12)] lg:left-auto lg:translate-x-0 lg:right-8">
      <span className="text-[var(--color-accent)]">✓</span> {message}
    </div>
  );
}

export function HealthRing({ score }: { score: number }): React.JSX.Element {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? "var(--color-accent)" : score >= 70 ? "var(--color-warning)" : "var(--color-danger)";
  return (
    <div className="relative inline-flex h-28 w-28 items-center justify-center">
      <svg className="-rotate-90" width="112" height="112">
        <circle cx="56" cy="56" r="42" fill="none" stroke="var(--color-border)" strokeWidth="8" />
        <circle cx="56" cy="56" r="42" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-bold tracking-[-0.04em]">{score}</p>
        <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">/ 100</p>
      </div>
    </div>
  );
}

export function PeriodTabs({ period, onChange }: { period: ChartPeriod; onChange: (p: ChartPeriod) => void }): React.JSX.Element {
  const periods: ChartPeriod[] = ["Daily", "Weekly", "Monthly", "Custom"];
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
      {periods.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          className={`min-h-9 rounded-md px-3 text-xs font-medium transition-all ${
            period === p ? "bg-white text-[var(--color-accent)] shadow-sm" : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

export const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)]";
