const before = ["Notebook records", "Paper mortality logs", "Manual calculations", "No farm visibility", "Guesswork on profitability"] as const;
const after = ["Everything digital", "AI-powered recommendations", "Real-time analytics", "Full farm visibility", "Higher profits per harvest"] as const;

export default function LandingCaseStudy(): React.JSX.Element {
  return (
    <section className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-[600px] text-center">
          <p className="text-label mb-4">Case study</p>
          <h2 className="text-[clamp(32px,4vw,48px)] font-bold leading-[1.1] tracking-[-0.04em]">
            Before and after AquaCore.
          </h2>
          <p className="mt-5 text-lg leading-7 text-[var(--color-text-secondary)]">
            How Greenwater Farm transformed operations in one harvest cycle.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Before AquaCore</p>
            <ul className="mt-6 space-y-4">
              {before.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-danger-light)] text-xs text-[var(--color-danger)]">×</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] p-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-accent)]">After AquaCore</p>
            <ul className="mt-6 space-y-4">
              {after.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-[var(--color-text-primary)]">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs text-white">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 rounded-2xl border border-[var(--color-border)] bg-white p-6 text-center sm:p-8">
          {[
            { label: "Feed savings", value: "23%" },
            { label: "Survival increase", value: "+18%" },
            { label: "Admin time saved", value: "70%" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold tracking-[-0.04em] text-[var(--color-accent)]">{stat.value}</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
