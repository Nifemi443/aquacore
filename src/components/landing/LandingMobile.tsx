const screens = [
  { label: "Dashboard", content: "18,420 fish · 96.4% survival · ₦14.8M farm value" },
  { label: "AI Assistant", content: "Which batch is ready for harvest?" },
  { label: "Feeding", content: "28 of 36 feedings completed today" },
  { label: "Inventory", content: "8,450 kg in stock · 18 days remaining" },
  { label: "Harvest", content: "BAT-003 ready in 7 days · ₦5.2M" },
] as const;

export default function LandingMobile(): React.JSX.Element {
  return (
    <section className="overflow-hidden bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-label mb-4">Mobile</p>
            <h2 className="text-[clamp(32px,4vw,48px)] font-bold leading-[1.1] tracking-[-0.04em]">
              Your farm in your pocket.
            </h2>
            <p className="mt-5 text-lg leading-7 text-[var(--color-text-secondary)]">
              Record feedings, check water quality, and get AI insights from the pond side—on any device, even offline.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-[var(--color-text-secondary)]">
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent-light)] text-xs text-[var(--color-accent)]">✓</span>
                Works offline — syncs when connected
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent-light)] text-xs text-[var(--color-accent)]">✓</span>
                QR code scanning for ponds and batches
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-accent-light)] text-xs text-[var(--color-accent)]">✓</span>
                Push notifications for feeding and alerts
              </li>
            </ul>
          </div>

          <div className="relative flex justify-center gap-6">
            {screens.slice(0, 2).map((screen, index) => (
              <div
                key={screen.label}
                className={`w-[200px] sm:w-[220px] ${index === 1 ? "mt-12 hero-float" : ""}`}
                style={index === 1 ? { animationDelay: "1s" } : undefined}
              >
                <div className="rounded-[2rem] border-[6px] border-[var(--color-text-primary)] bg-[var(--color-text-primary)] p-1 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
                  <div className="overflow-hidden rounded-[1.4rem] bg-white">
                    <div className="flex items-center justify-center bg-[var(--color-surface)] py-2">
                      <span className="h-1 w-12 rounded-full bg-[var(--color-border)]" />
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">{screen.label}</p>
                      <p className="mt-3 text-xs leading-5 text-[var(--color-text-secondary)]">{screen.content}</p>
                      <div className="mt-4 h-20 rounded-lg bg-[var(--color-accent-light)]" />
                      <div className="mt-3 space-y-2">
                        <div className="h-2 rounded bg-[var(--color-surface)]" />
                        <div className="h-2 w-3/4 rounded bg-[var(--color-surface)]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
