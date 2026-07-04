const features = [
  {
    icon: "✦",
    title: "AI Fish Farm Assistant",
    description: "Receive intelligent recommendations on feeding, harvest timing, mortality risks, and profitability.",
    preview: "Pond 4 feed can be reduced 5% without affecting growth.",
  },
  {
    icon: "◎",
    title: "Fish Batch Tracking",
    description: "Track every batch from fingerling to harvest with survival rates, FCR, and growth analytics.",
    preview: "BAT-003 · 97.5% survival · harvest in 7 days",
  },
  {
    icon: "◈",
    title: "Water Quality Monitoring",
    description: "Monitor pH, dissolved oxygen, ammonia, temperature, and salinity with AI water ratings.",
    preview: "pH 7.2 · D.O. 6.8 mg/L · all parameters optimal",
  },
  {
    icon: "▣",
    title: "Inventory Management",
    description: "Never run out of feed. Track stock levels, expiry dates, and automatic reorder suggestions.",
    preview: "8,450 kg in stock · 18 days remaining",
  },
  {
    icon: "◉",
    title: "Harvest Planning",
    description: "Predict harvest dates, projected weight, estimated revenue, and buyer assignments.",
    preview: "BAT-003 ready · ₦5.2M projected revenue",
  },
  {
    icon: "◇",
    title: "Vendor Deliveries",
    description: "Track suppliers, purchase orders, delivery ETAs, and supplier performance ratings.",
    preview: "Fresh Aqua · 400 fingerlings · ETA 3 days",
  },
  {
    icon: "◆",
    title: "Financial Dashboard",
    description: "Know your farm's profitability with revenue, expenses, margins, and ROI in real time.",
    preview: "Net profit ₦4.7M · 51% margin · ROI 38%",
  },
  {
    icon: "▤",
    title: "Enterprise Reports",
    description: "Generate PDF, Excel, and CSV reports for stakeholders, auditors, and investors instantly.",
    preview: "Weekly · Monthly · Harvest · Inventory reports",
  },
] as const;

export default function LandingFeatureGrid(): React.JSX.Element {
  return (
    <section id="features" className="scroll-mt-20 bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-[600px] text-center">
          <p className="text-label mb-4">Features</p>
          <h2 className="text-[clamp(32px,4vw,48px)] font-bold leading-[1.1] tracking-[-0.04em]">
            Everything your farm needs. Nothing it doesn&apos;t.
          </h2>
          <p className="mt-5 text-lg leading-7 text-[var(--color-text-secondary)]">
            Purpose-built modules for commercial aquaculture—not a generic ERP with fish stickers on it.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group flex flex-col rounded-2xl border border-[var(--color-border)] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-border-strong)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-light)] text-lg text-[var(--color-accent)] transition-all duration-200 group-hover:bg-[var(--color-accent)] group-hover:text-white">
                {feature.icon}
              </div>
              <h3 className="mt-5 text-base font-bold tracking-[-0.02em]">{feature.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[var(--color-text-secondary)]">{feature.description}</p>
              <div className="mt-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
                <p className="font-mono text-[11px] leading-5 text-[var(--color-text-muted)]">{feature.preview}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
