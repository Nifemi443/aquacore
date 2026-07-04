const steps = [
  { number: "1", title: "Create your farm", description: "Set up your farm profile, species, and team in under 5 minutes." },
  { number: "2", title: "Add ponds", description: "Map every pond with capacity, species, and batch assignments." },
  { number: "3", title: "Record daily operations", description: "Log feedings, water tests, mortality, and inventory from any device." },
  { number: "4", title: "Receive AI insights", description: "Get recommendations on feeding, harvest timing, costs, and risks automatically." },
] as const;

export default function LandingHowItWorks(): React.JSX.Element {
  return (
    <section className="bg-[var(--color-surface)] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-[600px] text-center">
          <p className="text-label mb-4">How it works</p>
          <h2 className="text-[clamp(32px,4vw,48px)] font-bold leading-[1.1] tracking-[-0.04em]">
            From setup to insights in four steps.
          </h2>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {index < steps.length - 1 && (
                <span className="absolute right-0 top-8 hidden h-px w-full translate-x-1/2 bg-[var(--color-border)] lg:block" />
              )}
              <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">
                  {step.number}
                </div>
                <h3 className="mt-5 text-base font-bold tracking-[-0.02em]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
