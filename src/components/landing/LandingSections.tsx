import ScrollReveal from "@/components/landing/ScrollReveal";

const problems = [
  { title: "Forgotten feeding schedules", description: "Miss a feeding window and you only find out at harvest." },
  { title: "Paper records get lost", description: "Notebooks fade, pages tear, and nobody can find last week's data." },
  { title: "No visibility into inventory", description: "You discover you're out of feed when the ponds are already waiting." },
  { title: "Harvest planning becomes difficult", description: "Without clear batch records, timing and buyer prep stays guesswork." },
] as const;

const features = [
  { icon: "◎", title: "Pond Management", description: "Monitor every pond." },
  { icon: "▣", title: "Fish Batch Tracking", description: "Track stocking to harvest." },
  { icon: "◷", title: "Daily Feeding", description: "Know exactly what has been fed." },
  { icon: "◇", title: "Feed Inventory", description: "Never run out of feed." },
] as const;

const steps = [
  { number: "1", title: "Create your farm" },
  { number: "2", title: "Add your ponds and fish batches" },
  { number: "3", title: "Track your daily operations" },
] as const;

const benefits = [
  { title: "Save time", description: "Stop rewriting the same records every day." },
  { title: "Replace notebooks", description: "One place for feeding, water, and harvest logs." },
  { title: "Track farm operations", description: "See what's done and what still needs attention." },
  { title: "Prepare for harvest", description: "Know which batches are ready before buyers call." },
] as const;

const callouts = [
  { label: "Ponds", top: "18%", left: "8%" },
  { label: "Today's Feeding", top: "18%", right: "6%" },
  { label: "Inventory", bottom: "28%", left: "6%" },
  { label: "Harvest", bottom: "22%", right: "8%" },
] as const;

function PreviewMockup(): React.JSX.Element {
  return (
    <div className="relative mx-auto max-w-[900px]">
      {callouts.map((callout) => (
        <span
          key={callout.label}
          className="absolute z-10 hidden rounded-full border border-[var(--color-accent-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)] shadow-[0_4px_16px_rgba(13,122,95,0.12)] sm:inline-block"
          style={{
            top: "top" in callout ? callout.top : undefined,
            bottom: "bottom" in callout ? callout.bottom : undefined,
            left: "left" in callout ? callout.left : undefined,
            right: "right" in callout ? callout.right : undefined,
          }}
        >
          {callout.label}
        </span>
      ))}

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[0_24px_64px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-2 text-xs text-[var(--color-text-muted)]">Dashboard</span>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {["4 Ponds", "7 Batches", "5/7 Fed"].map((kpi) => (
                <div key={kpi} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-center text-xs font-semibold">
                  {kpi}
                </div>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {["Pond A · Fed", "Pond B · Due 12PM", "Pond C · Missed", "Pond D · Harvest soon"].map((pond) => (
                <div key={pond} className="rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-xs font-medium">
                  {pond}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">Tasks</p>
              <p className="mt-2 text-xs">Feed Pond B</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Water test — Pond A</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-[var(--color-warning-light)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-warning)]">Inventory</p>
              <p className="mt-1 text-xs font-medium">42 bags · running low</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">Harvest</p>
              <p className="mt-1 text-xs font-medium">BAT-003 · Jul 15</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingSections(): React.JSX.Element {
  return (
    <>
      {/* Social proof */}
      <ScrollReveal>
        <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14">
          <div className="mx-auto max-w-[1100px] text-center">
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">Built for modern fish farmers</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {["Commercial Farms", "Hatcheries", "Aquaculture Businesses"].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-dashed border-[var(--color-border-strong)] bg-white px-5 py-2 text-sm text-[var(--color-text-muted)]"
                >
                  {label} · Coming Soon
                </span>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Problem */}
      <ScrollReveal>
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-[1100px]">
            <h2 className="max-w-[520px] text-[clamp(28px,4vw,40px)] font-bold leading-[1.12] tracking-[-0.04em]">
              Most fish farms still run on notebooks.
            </h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {problems.map((problem) => (
                <div
                  key={problem.title}
                  className="rounded-2xl border border-[var(--color-border)] bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  <p className="font-semibold">{problem.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{problem.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-12 text-lg font-medium text-[var(--color-text-primary)]">
              Managing a growing fish farm shouldn&apos;t feel this hard.
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* Solution */}
      <ScrollReveal>
        <section id="features" className="scroll-mt-20 bg-[var(--color-surface)] px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-[1100px]">
            <h2 className="text-center text-[clamp(28px,4vw,40px)] font-bold leading-[1.12] tracking-[-0.04em]">
              Everything your farm needs in one dashboard.
            </h2>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-[var(--color-border)] bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-light)] text-lg text-[var(--color-accent)]">
                    {feature.icon}
                  </div>
                  <h3 className="mt-5 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Product preview */}
      <ScrollReveal>
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-[1100px] text-center">
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.12] tracking-[-0.04em]">
              One dashboard. Full visibility.
            </h2>
            <p className="mx-auto mt-4 max-w-[480px] text-[var(--color-text-secondary)]">
              See ponds, feedings, inventory, and harvests at a glance—without digging through notebooks.
            </p>
            <div className="mt-14">
              <PreviewMockup />
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* How it works */}
      <ScrollReveal>
        <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-[800px] text-center">
            <h2 className="text-2xl font-bold tracking-[-0.03em] sm:text-3xl">How it works</h2>
            <div className="mt-12 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex flex-col items-center sm:flex-row">
                  <div className="flex flex-col items-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">
                      {step.number}
                    </span>
                    <p className="mt-3 max-w-[180px] text-sm font-medium">{step.title}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <span className="my-2 text-[var(--color-text-muted)] sm:mx-4 sm:my-0 sm:mt-[-24px]" aria-hidden="true">
                      ↓
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Why use it */}
      <ScrollReveal>
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-[1100px]">
            <h2 className="text-center text-[clamp(28px,4vw,40px)] font-bold leading-[1.12] tracking-[-0.04em]">
              Why use PondDesk?
            </h2>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-[var(--color-border)] bg-white p-6 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  <h3 className="font-semibold">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Final CTA */}
      <ScrollReveal>
        <section id="cta" className="scroll-mt-20 px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-[720px] rounded-3xl bg-gradient-to-br from-[#0D7A5F] to-[#052E22] px-8 py-16 text-center sm:px-12">
            <h2 className="text-[clamp(26px,4vw,36px)] font-bold leading-[1.12] tracking-[-0.03em] text-white">
              Ready to modernize your fish farm?
            </h2>
            <p className="mx-auto mt-4 max-w-[400px] text-white/80">Join the waitlist today and be among the first farms on PondDesk.</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="mailto:hello@ponddesk.io?subject=PondDesk%20Waitlist"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-[var(--color-accent)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
              >
                Join Waitlist
              </a>
              <a
                href="mailto:hello@ponddesk.io?subject=PondDesk%20Demo"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 px-8 text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02] hover:bg-white/10"
              >
                Book Demo
              </a>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </>
  );
}
