interface GrowthStat {
  label: string;
  value: string;
  detail: string;
  tone?: "accent" | "warning";
}

const stats: GrowthStat[] = [
  { label: "Average weight", value: "680g", detail: "+42g in 7 days", tone: "accent" },
  { label: "Survival rate", value: "94.8%", detail: "within target range", tone: "accent" },
  { label: "Expected harvest", value: "Aug 18", detail: "21 days remaining" },
  { label: "Performance", value: "+8%", detail: "above batch target", tone: "accent" },
];

function GrowthCurve(): React.JSX.Element {
  return (
    <svg width="100%" height="220" viewBox="0 0 720 220" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="growthAnalyticsFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D7A5F" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#0D7A5F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1="44" x2="720" y2="44" stroke="#F2F2F2" />
      <line x1="0" y1="88" x2="720" y2="88" stroke="#F2F2F2" />
      <line x1="0" y1="132" x2="720" y2="132" stroke="#F2F2F2" />
      <line x1="0" y1="176" x2="720" y2="176" stroke="#F2F2F2" />
      <path
        d="M38 196 C118 182 180 166 246 146 C326 120 396 92 470 72 C560 46 632 34 690 24 L690 220 L38 220 Z"
        fill="url(#growthAnalyticsFill)"
      />
      <path
        d="M38 196 C118 182 180 166 246 146 C326 120 396 92 470 72 C560 46 632 34 690 24"
        fill="none"
        stroke="#0D7A5F"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M38 204 C132 188 226 164 318 128 C410 92 500 58 690 34"
        fill="none"
        stroke="#D4D4D4"
        strokeWidth="1.5"
        strokeDasharray="7 6"
        strokeLinecap="round"
      />
      <circle cx="690" cy="24" r="8" fill="#0D7A5F" opacity="0.16" />
      <circle cx="690" cy="24" r="4" fill="#0D7A5F" />
      <text x="38" y="216" fontSize="10" fill="#A3A3A3">
        Day 1
      </text>
      <text x="226" y="216" fontSize="10" fill="#A3A3A3">
        Day 30
      </text>
      <text x="410" y="216" fontSize="10" fill="#A3A3A3">
        Day 60
      </text>
      <text x="650" y="216" fontSize="10" fill="#0D7A5F" fontWeight="600">
        Today
      </text>
    </svg>
  );
}

export default function GrowthAnalytics(): React.JSX.Element {
  return (
    <section id="growth" className="scroll-mt-20 bg-white py-16 sm:py-24">
      <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-10 px-6 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20 lg:px-20">
        <div
          className="overflow-hidden rounded-xl border border-[var(--color-border-strong)] bg-white"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}
        >
          <div className="border-b border-[var(--color-border)] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Batch C growth curve</p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">Pond 4 · Catfish · Day 67</p>
              </div>
              <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                Above target
              </span>
            </div>
            <div className="mt-8">
              <GrowthCurve />
            </div>
            <div className="mt-4 flex flex-wrap gap-5">
              <span className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                Actual growth
              </span>
              <span className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                <span className="w-5 border-t border-dashed border-[var(--color-border-strong)]" />
                Target curve
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`border-[var(--color-border)] p-5 ${index % 2 === 0 ? "border-r" : ""} ${
                  index < 2 ? "border-b" : ""
                }`}
              >
                <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                  {stat.label}
                </p>
                <p
                  className={`mt-3 text-3xl font-bold tracking-[-0.04em] ${
                    stat.tone === "accent" ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"
                  }`}
                >
                  {stat.value}
                </p>
                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-label mb-4 text-[var(--color-accent)]">GROWTH ANALYTICS</p>
          <h2 className="mb-5 max-w-[420px] text-[clamp(26px,3.5vw,40px)] font-bold tracking-[-0.03em] text-[var(--color-text-primary)]">
            Track whether every batch is becoming harvestable biomass.
          </h2>
          <p className="mb-6 text-base leading-[1.7] text-[var(--color-text-secondary)]">
            AquaCore connects feeding, mortality, and sample weights into a live production curve, so owners can see
            whether a batch is ahead, behind, or ready for harvest planning.
          </p>
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Harvest signal</p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              Batch C is projected to reach 1kg average weight by August 18 if feed conversion remains stable.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
