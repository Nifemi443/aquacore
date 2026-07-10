const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Roadmap", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Support", href: "mailto:hello@ponddesk.io" },
      { label: "Community", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
] as const;

const socials = [
  { label: "LinkedIn", href: "#" },
  { label: "X", href: "#" },
  { label: "GitHub", href: "#" },
  { label: "YouTube", href: "#" },
] as const;

function LogoMark(): React.JSX.Element {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]">
      <span className="text-xs font-bold text-white">A</span>
    </div>
  );
}

export default function LandingFooter(): React.JSX.Element {
  return (
    <footer id="about" className="scroll-mt-20 border-t border-[var(--color-border)] bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <a href="#" className="inline-flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-80" aria-label="PondDesk home">
              <LogoMark />
              <span className="text-base font-bold tracking-[-0.02em]">PondDesk</span>
            </a>
            <p className="mt-5 max-w-[320px] text-sm leading-6 text-[var(--color-text-secondary)]">
              The operating system for modern fish farms. Manage ponds, batches, feeding, inventory,
              harvests, and finances from one dashboard.
            </p>
            <div className="mt-6 flex gap-4">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="text-sm font-medium text-[var(--color-text-muted)] transition-colors duration-200 hover:text-[var(--color-text-primary)]"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">{column.title}</p>
                <div className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      className="block text-sm text-[var(--color-text-secondary)] transition-all duration-200 hover:translate-x-0.5 hover:text-[var(--color-text-primary)]"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-[var(--color-border)] pt-8 text-xs text-[var(--color-text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 PondDesk. AI fish farm management software for commercial aquaculture.</p>
          <p>Built in Lagos · Serving farms across Africa</p>
        </div>
      </div>
    </footer>
  );
}
