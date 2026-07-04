import LandingHeroVisual from "@/components/landing/LandingHeroVisual";

export default function LandingHero(): React.JSX.Element {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f8fcfa] via-white to-white px-6 pb-24 pt-32 sm:pb-32 sm:pt-40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(13,122,95,0.08),transparent)]" />

      <div className="relative mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-[720px] text-center">
          <p className="text-label mb-6">AI-Powered Fish Farm Operating System</p>
          <h1 className="font-display text-[clamp(40px,6vw,72px)] font-bold leading-[1.05] tracking-[-0.04em] text-[var(--color-text-primary)]">
            Run your entire fish farm from one dashboard.
          </h1>
          <p className="mx-auto mt-6 max-w-[580px] text-lg leading-[1.7] text-[var(--color-text-secondary)]">
            AquaCore helps commercial fish farms manage ponds, fish batches, feeding schedules, inventory, harvests,
            water quality, vendors, and farm finances—all powered by AI.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/dashboard"
              className="min-h-12 rounded-lg bg-[var(--color-accent)] px-8 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px hover:bg-emerald-900 hover:shadow-[0_8px_24px_rgba(13,122,95,0.3)]"
            >
              Start Free Trial
            </a>
            <a
              href="mailto:hello@aquacore.io"
              className="min-h-12 rounded-lg border border-[var(--color-border)] bg-white px-8 py-3 text-sm font-medium text-[var(--color-text-primary)] transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
            >
              Book Demo
            </a>
          </div>
        </div>

        <div className="mt-16 sm:mt-20">
          <LandingHeroVisual />
        </div>
      </div>
    </section>
  );
}
