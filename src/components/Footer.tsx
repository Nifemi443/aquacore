const productLinks = [
  { label: "Feeding tracker", href: "#daily-operations" },
  { label: "Water quality", href: "#water-quality" },
  { label: "Growth analytics", href: "#growth" },
  { label: "AI farm assistant", href: "#ai-assistant" },
  { label: "Mobile companion", href: "#mobile" },
] as const;

const companyLinks = [
  { label: "Live overview", href: "#live-dashboard" },
  { label: "Join waitlist", href: "#" },
  { label: "Contact sales", href: "mailto:hello@aquacore.io" },
] as const;

function LogoMark(): React.JSX.Element {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]">
      <span className="text-xs font-bold text-white">A</span>
    </div>
  );
}

export default function Footer(): React.JSX.Element {
  return (
    <footer className="border-t border-[var(--color-border)] bg-white">
      <div className="mx-auto max-w-[1120px] px-6 py-16 lg:px-20">
        <div className="grid gap-12 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <a
              href="#"
              className="inline-flex items-center gap-2 transition-all duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
              aria-label="AquaCore home"
            >
              <LogoMark />
              <span className="text-base font-bold tracking-[-0.02em] text-[var(--color-text-primary)]">AquaCore</span>
            </a>
            <p className="mt-5 max-w-[320px] text-sm leading-6 text-[var(--color-text-secondary)]">
              Operating software for commercial fish farms: feeding schedules, pond health, growth curves, and live farm
              visibility in one calm workspace.
            </p>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">Product</p>
            <div className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-[var(--color-text-secondary)] transition-all duration-200 hover:translate-x-1 hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">Company</p>
            <div className="mt-4 space-y-3">
              {companyLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="block text-sm text-[var(--color-text-secondary)] transition-all duration-200 hover:translate-x-1 hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-[var(--color-border)] pt-8 text-xs text-[var(--color-text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 AquaCore. Built for aquaculture operators.</p>
          <p>Now in beta · Nigerian aquaculture first</p>
        </div>
      </div>
    </footer>
  );
}
