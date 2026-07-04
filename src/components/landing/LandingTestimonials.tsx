const testimonials = [
  {
    name: "Emeka Okafor",
    role: "Farm Owner",
    farm: "Greenwater Farm · Lagos",
    review: "We went from paper notebooks to full digital operations in two weeks. Feed waste dropped immediately and we finally know our true cost per kilogram.",
    rating: 5,
    initials: "EO",
  },
  {
    name: "Fatima Bello",
    role: "Hatchery Owner",
    farm: "Fresh Aqua Hatchery · Kano",
    review: "AquaCore tracks every batch from fingerling delivery to pond transfer. Our survival rates improved 18% in the first cycle.",
    rating: 5,
    initials: "FB",
  },
  {
    name: "David Chen",
    role: "Operations Manager",
    farm: "BlueWave Commercial Farms",
    review: "The AI assistant alone saves our managers two hours a day. It tells us which ponds need attention before problems become expensive.",
    rating: 5,
    initials: "DC",
  },
  {
    name: "Amina Yusuf",
    role: "Agricultural Consultant",
    farm: "Nile Agritech Advisory",
    review: "I recommend AquaCore to every commercial farm I consult. The financial dashboard and harvest forecasting are enterprise-grade.",
    rating: 5,
    initials: "AY",
  },
] as const;

export default function LandingTestimonials(): React.JSX.Element {
  return (
    <section id="customers" className="scroll-mt-20 bg-[var(--color-surface)] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-[600px] text-center">
          <p className="text-label mb-4">Customers</p>
          <h2 className="text-[clamp(32px,4vw,48px)] font-bold leading-[1.1] tracking-[-0.04em]">
            Trusted by farms across Nigeria.
          </h2>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-light)] text-sm font-bold text-[var(--color-accent)]">
                  {item.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{item.role} · {item.farm}</p>
                </div>
                <div className="ml-auto text-sm text-[var(--color-warning)]" aria-label={`${item.rating} out of 5 stars`}>
                  {"★".repeat(item.rating)}
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-[var(--color-text-secondary)]">&ldquo;{item.review}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
