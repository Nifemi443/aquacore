import { APP_NAV_ITEMS, type AppNavKey } from "./nav-config";
import { NavIcon } from "./NavIcon";

export function AppSidebar({ activeKey }: { activeKey: AppNavKey }): React.JSX.Element {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[256px] border-r border-[var(--color-border)] bg-white/95 px-4 py-5 backdrop-blur-xl lg:block">
      <a
        href="/dashboard"
        className="flex items-center gap-2 px-2 transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">
          A
        </div>
        <div>
          <p className="text-sm font-bold tracking-[-0.02em]">PondDesk</p>
          <p className="text-[11px] text-[var(--color-text-muted)]">Farm OS</p>
        </div>
      </a>

      <nav className="mt-8 space-y-1" aria-label="Main navigation">
        {APP_NAV_ITEMS.map((item) => {
          const active = item.key === activeKey;
          return (
            <a
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-all duration-200 hover:-translate-y-px hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 ${
                active
                  ? "border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] font-medium text-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)]"
              }`}
            >
              <NavIcon type={item.icon} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
