interface WaterMetric {
  label: string;
  value: string;
  range: string;
  status: "Optimal" | "Watch";
  fill: string;
}

const metrics: WaterMetric[] = [
  { label: "Temperature", value: "28°C", range: "Safe range: 26–30°C", status: "Optimal", fill: "62%" },
  { label: "pH", value: "7.1", range: "Safe range: 6.8–7.8", status: "Optimal", fill: "71%" },
  { label: "Dissolved Oxygen", value: "6.2 mg/L", range: "Target: above 5.5", status: "Optimal", fill: "78%" },
  { label: "Ammonia", value: "0.02 ppm", range: "Target: below 0.05", status: "Optimal", fill: "20%" },
  { label: "Water Clarity", value: "82%", range: "Secchi reading stable", status: "Watch", fill: "82%" },
];

function TrendChart(): React.JSX.Element {
  return (
    <svg width="100%" height="140" viewBox="0 0 620 140" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="waterQualityFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D7A5F" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0D7A5F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1="28" x2="620" y2="28" stroke="#F2F2F2" />
      <line x1="0" y1="70" x2="620" y2="70" stroke="#F2F2F2" />
      <line x1="0" y1="112" x2="620" y2="112" stroke="#F2F2F2" />
      <path
        d="M0 82 C70 74 124 82 190 68 C260 54 318 56 378 44 C448 30 506 34 620 24 L620 140 L0 140 Z"
        fill="url(#waterQualityFill)"
      />
      <path
        d="M0 82 C70 74 124 82 190 68 C260 54 318 56 378 44 C448 30 506 34 620 24"
        fill="none"
        stroke="#0D7A5F"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0 100 C92 92 150 96 236 84 C318 74 430 76 620 62"
        fill="none"
        stroke="#D4D4D4"
        strokeWidth="1.5"
        strokeDasharray="6 5"
        strokeLinecap="round"
      />
      <circle cx="620" cy="24" r="5" fill="#0D7A5F" />
      <text x="0" y="136" fontSize="10" fill="#A3A3A3">
        Mon
      </text>
      <text x="150" y="136" fontSize="10" fill="#A3A3A3">
        Tue
      </text>
      <text x="300" y="136" fontSize="10" fill="#A3A3A3">
        Wed
      </text>
      <text x="450" y="136" fontSize="10" fill="#A3A3A3">
        Thu
      </text>
      <text x="590" y="136" fontSize="10" fill="#0D7A5F" fontWeight="600">
        Now
      </text>
    </svg>
  );
}

export default function WaterQualityMonitoring(): React.JSX.Element {
  return (
    <section
      id="water-quality"
      className="scroll-mt-20 border-y border-[var(--color-border)] bg-[var(--color-surface)] py-16 sm:py-24"
    >
      <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-20">
        <div>
          <p className="text-label mb-4 text-[var(--color-accent)]">WATER QUALITY</p>
          <h2 className="mb-5 max-w-[420px] text-[clamp(26px,3.5vw,40px)] font-bold tracking-[-0.03em] text-[var(--color-text-primary)]">
            Know which pond needs attention before fish are stressed.
          </h2>
          <p className="text-base leading-[1.7] text-[var(--color-text-secondary)]">
            PondDesk keeps daily readings organized by pond, shows safe ranges in context, and makes trends obvious
            without forcing teams to scan notebooks or message threads.
          </p>
        </div>

        <div
          className="overflow-hidden rounded-xl border border-[var(--color-border-strong)] bg-white"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}
        >
          <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Pond 4 water quality</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">Last checked 07:45 AM · recorded by Ayo</p>
              </div>
              <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                4 of 5 optimal
              </span>
            </div>
            <div className="mt-6">
              <TrendChart />
            </div>
          </div>

          <div className="grid gap-0 sm:grid-cols-2">
            {metrics.map((metric, index) => (
              <div
                key={metric.label}
                className={`border-[var(--color-border)] p-5 ${
                  index % 2 === 0 ? "sm:border-r" : ""
                } ${index < 3 ? "border-b" : ""}`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{metric.label}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">{metric.range}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      metric.status === "Optimal"
                        ? "bg-emerald-100 text-[var(--color-accent)]"
                        : "bg-[var(--color-warning-light)] text-[var(--color-warning)]"
                    }`}
                  >
                    {metric.status}
                  </span>
                </div>
                <p className="text-2xl font-bold tracking-[-0.03em] text-[var(--color-text-primary)]">{metric.value}</p>
                <div className="mt-4 h-1.5 rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: metric.fill }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
