const navItems = [
  { label: "Feeding", href: "#daily-operations" },
  { label: "Water", href: "#water-quality" },
  { label: "Growth", href: "#growth" },
  { label: "AI", href: "#ai-assistant" },
  { label: "Mobile", href: "#mobile" },
  { label: "Live data", href: "#live-dashboard" },
] as const;

function LogoMark(): React.JSX.Element {
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent)]">
      <span className="text-[11px] font-bold text-white">A</span>
    </div>
  );
}

export default function Nav(): React.JSX.Element {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-6 lg:px-20">
        <a
          href="#"
          className="flex items-center gap-2 transition-all duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
          aria-label="AquaCore home"
        >
          <LogoMark />
          <span className="text-sm font-bold tracking-[-0.02em] text-[var(--color-text-primary)]">AquaCore</span>
        </a>

        <div className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:-translate-y-px hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
            >
              {item.label}
            </a>
          ))}
        </div>

        <a
          href="/dashboard"
          className="rounded bg-[var(--color-text-primary)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px hover:bg-[var(--color-accent)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
        >
          Open dashboard
        </a>
      </nav>
    </header>
  );
}
