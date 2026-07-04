const modules = [
  "Dashboard", "Pond Management", "Fish Batches", "Today's Feeding", "Inventory",
  "Water Quality", "Harvest", "Reports", "Vendor Management", "AI Assistant", "Finance", "Analytics",
] as const;

export default function LandingSolution(): React.JSX.Element {
  return (
    <section id="solutions" className="scroll-mt-20 bg-[var(--color-surface)] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1200px] text-center">
        <p className="text-label mb-4">The solution</p>
        <h2 className="text-[clamp(32px,4vw,48px)] font-bold leading-[1.1] tracking-[-0.04em]">
          Meet AquaCore.
        </h2>
        <p className="mx-auto mt-5 max-w-[560px] text-lg leading-7 text-[var(--color-text-secondary)]">
          One operating system for every part of your farm—from fingerling to harvest, from feed bag to profit report.
        </p>

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((module, index) => (
            <div
              key={module}
              className="group rounded-2xl border border-[var(--color-border)] bg-white p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-accent-border)] hover:shadow-[0_8px_32px_rgba(13,122,95,0.08)]"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent-light)] text-sm font-bold text-[var(--color-accent)] transition-colors duration-200 group-hover:bg-[var(--color-accent)] group-hover:text-white">
                {module.charAt(0)}
              </div>
              <p className="text-sm font-semibold">{module}</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Built for commercial aquaculture</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
