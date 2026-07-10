"use client";

import { useEffect, useState } from "react";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Solutions", href: "#solutions" },
  { label: "Customers", href: "#customers" },
  { label: "Resources", href: "#faq" },
  { label: "About", href: "#about" },
] as const;

function LogoMark(): React.JSX.Element {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]">
      <span className="text-xs font-bold text-white">A</span>
    </div>
  );
}

export default function LandingNav(): React.JSX.Element {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-[var(--color-border)] bg-white/90 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 lg:px-8">
        <a
          href="#"
          className="flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
          aria-label="PondDesk home"
        >
          <LogoMark />
          <span className="font-display text-[15px] font-bold tracking-[-0.03em]">PondDesk</span>
        </a>

        <div className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:text-[var(--color-text-primary)]"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="mailto:hello@ponddesk.io"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:text-[var(--color-text-primary)] sm:inline-block"
          >
            Book Demo
          </a>
          <a
            href="/dashboard"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:text-[var(--color-text-primary)] md:inline-block"
          >
            Login
          </a>
          <a
            href="/dashboard"
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px hover:bg-emerald-900 hover:shadow-[0_4px_12px_rgba(13,122,95,0.25)]"
          >
            Start Free Trial
          </a>
        </div>
      </nav>
    </header>
  );
}
