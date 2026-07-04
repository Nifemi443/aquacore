const charts = [
  {
    label: "Revenue",
    value: "₦9.2M",
    trend: "+12%",
    trendTone: "positive" as const,
    type: "area" as const,
    path: "M0 52 C30 48 60 40 90 34 C120 28 150 22 200 14",
    fillPath: "M0 52 C30 48 60 40 90 34 C120 28 150 22 200 14 L200 64 L0 64 Z",
  },
  {
    label: "Feed Usage",
    value: "245 kg/day",
    trend: "-4%",
    trendTone: "positive" as const,
    type: "bars" as const,
    bars: [72, 58, 65, 48, 52, 44, 40],
  },
  {
    label: "Growth",
    value: "+8%/wk",
    trend: "Ahead",
    trendTone: "neutral" as const,
    type: "area" as const,
    path: "M0 58 C35 54 70 42 105 32 C140 22 170 16 200 10",
    fillPath: "M0 58 C35 54 70 42 105 32 C140 22 170 16 200 10 L200 64 L0 64 Z",
  },
  {
    label: "Harvest Forecast",
    value: "7 days",
    trend: "BAT-003",
    trendTone: "neutral" as const,
    type: "bars" as const,
    bars: [30, 42, 55, 68, 80, 92, 100],
  },
  {
    label: "Mortality",
    value: "0.4%",
    trend: "Below avg",
    trendTone: "positive" as const,
    type: "area" as const,
    path: "M0 18 C40 22 80 28 120 36 C150 42 175 48 200 52",
    fillPath: "M0 18 C40 22 80 28 120 36 C150 42 175 48 200 52 L200 64 L0 64 Z",
  },
  {
    label: "Water Quality",
    value: "96/100",
    trend: "Optimal",
    trendTone: "positive" as const,
    type: "line" as const,
    path: "M0 42 C30 38 60 30 90 26 C120 22 160 18 200 16",
    fillPath: null,
  },
] as const;

function TrendBadge({ trend, tone }: { trend: string; tone: "positive" | "neutral" | "warning" }): React.JSX.Element {
  const styles = {
    positive: "bg-[var(--color-accent-light)] text-[var(--color-accent)]",
    neutral: "bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]",
    warning: "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[tone]}`}>
      {trend}
    </span>
  );
}

function AreaChart({ path, fillPath }: { path: string; fillPath: string }): React.JSX.Element {
  return (
    <svg width="100%" height="72" viewBox="0 0 200 64" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D7A5F" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0D7A5F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#areaFill)" />
      <path
        d={path}
        fill="none"
        stroke="#0D7A5F"
        strokeWidth="2"
        strokeLinecap="round"
        className="[stroke-dasharray:260] [stroke-dashoffset:260] [animation:chartDraw_1s_ease-out_forwards]"
      />
    </svg>
  );
}

function LineChart({ path }: { path: string }): React.JSX.Element {
  return (
    <svg width="100%" height="72" viewBox="0 0 200 64" preserveAspectRatio="none" aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke="#0D7A5F"
        strokeWidth="2"
        strokeLinecap="round"
        className="[stroke-dasharray:260] [stroke-dashoffset:260] [animation:chartDraw_1s_ease-out_forwards]"
      />
      <circle cx="200" cy="16" r="3" fill="#0D7A5F" />
    </svg>
  );
}

function BarChart({ bars }: { bars: readonly number[] }): React.JSX.Element {
  const barWidth = 200 / bars.length - 4;

  return (
    <svg width="100%" height="72" viewBox="0 0 200 64" preserveAspectRatio="none" aria-hidden="true">
      {bars.map((height, index) => {
        const barHeight = (height / 100) * 52;
        const x = index * (barWidth + 4) + 2;
        const y = 60 - barHeight;
        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx="2"
            fill="#0D7A5F"
            opacity={0.35 + (index / bars.length) * 0.55}
          />
        );
      })}
    </svg>
  );
}

function ChartVisual({ chart }: { chart: (typeof charts)[number] }): React.JSX.Element {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2 pt-3">
      {chart.type === "area" && chart.fillPath && <AreaChart path={chart.path} fillPath={chart.fillPath} />}
      {chart.type === "line" && <LineChart path={chart.path} />}
      {chart.type === "bars" && <BarChart bars={chart.bars} />}
    </div>
  );
}

export default function LandingAnalytics(): React.JSX.Element {
  return (
    <section className="bg-[var(--color-surface)] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-[600px] text-center">
          <p className="text-label mb-4">Analytics</p>
          <h2 className="text-[clamp(32px,4vw,48px)] font-bold leading-[1.1] tracking-[-0.04em]">
            Farm analytics that drive decisions.
          </h2>
          <p className="mt-5 text-lg leading-7 text-[var(--color-text-secondary)]">
            Revenue, feed usage, growth curves, harvest forecasts, mortality trends, and water quality—all in one view.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {charts.map((chart) => (
            <div
              key={chart.label}
              className="group rounded-2xl border border-[var(--color-border)] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-border-strong)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                    {chart.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[var(--color-text-primary)]">
                    {chart.value}
                  </p>
                </div>
                <TrendBadge trend={chart.trend} tone={chart.trendTone} />
              </div>
              <ChartVisual chart={chart} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
