const problems = [
  "Forgotten feeding schedules",
  "Unknown fish mortality",
  "No inventory tracking",
  "Poor harvest planning",
  "No profitability insights",
  "No AI recommendations",
  "Poor farm visibility",
] as const;

export default function LandingProblem(): React.JSX.Element {
  return (
    <section className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-label mb-4">The problem</p>
            <h2 className="text-[clamp(32px,4vw,48px)] font-bold leading-[1.1] tracking-[-0.04em]">
              Fish farming shouldn&apos;t run on notebooks.
            </h2>
            <p className="mt-5 text-lg leading-7 text-[var(--color-text-secondary)]">
              Most commercial farms still rely on paper logs, spreadsheets, and memory. Records get lost, feed gets
              wasted, and nobody knows the true cost of a harvest until it&apos;s too late.
            </p>
            <ul className="mt-8 space-y-3">
              {problems.map((problem) => (
                <li key={problem} className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-danger-light)] text-[10px] font-bold text-[var(--color-danger)]">
                    ×
                  </span>
                  {problem}
                </li>
              ))}
            </ul>
            <p className="mt-10 text-xl font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">
              There has to be a better way.
            </p>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[0_16px_48px_rgba(0,0,0,0.06)]">
              <div className="space-y-4">
                {[
                  { icon: "📓", label: "Notebook records", detail: "3 ponds missing today's feed log" },
                  { icon: "📄", label: "Paper mortality sheets", detail: "Last updated 12 days ago" },
                  { icon: "📊", label: "Spreadsheet chaos", detail: "7 versions, none match" },
                  { icon: "❓", label: "Unknown profitability", detail: "Harvest revenue: ???" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-white p-4 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
                  >
                    <span className="text-2xl" aria-hidden="true">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-2xl bg-[var(--color-accent)]/5" />
          </div>
        </div>
      </div>
    </section>
  );
}
