export default function LandingFinalCTA(): React.JSX.Element {
  return (
    <section className="px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0D7A5F] via-[#0a6b52] to-[#052E22] px-8 py-16 text-center sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
          <div className="relative">
            <h2 className="text-[clamp(28px,4vw,44px)] font-bold leading-[1.1] tracking-[-0.04em] text-white">
              Ready to modernize your fish farm?
            </h2>
            <p className="mx-auto mt-5 max-w-[480px] text-lg leading-7 text-white/80">
              Join commercial farms using AquaCore to reduce waste, increase survival, and grow profitability.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/dashboard"
                className="min-h-12 rounded-lg bg-white px-8 py-3 text-sm font-medium text-[var(--color-accent)] transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
              >
                Start Free Trial
              </a>
              <a
                href="mailto:hello@aquacore.io"
                className="min-h-12 rounded-lg border border-white/30 px-8 py-3 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px hover:border-white/60 hover:bg-white/10"
              >
                Book Demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
