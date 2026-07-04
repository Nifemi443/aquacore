const logos = [
  "AquaHarvest",
  "BlueWave Farms",
  "Fresh Aqua",
  "Lagos Fisheries",
  "Nile Hatchery",
  "Greenwater Co-op",
] as const;

export default function LandingTrustBar(): React.JSX.Element {
  return (
    <section className="border-y border-[var(--color-border)] bg-white py-12">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
        <p className="text-center text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
          Trusted by commercial fish farms, hatcheries, and agritech teams
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {logos.map((name) => (
            <div
              key={name}
              className="flex h-10 items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-semibold tracking-[-0.02em] text-[var(--color-text-muted)] transition-all duration-200 hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)]"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
