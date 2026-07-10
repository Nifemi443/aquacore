import { getNavItem, type AppNavKey } from "./nav-config";

export function AppMobileHeader({ activeKey }: { activeKey: AppNavKey }): React.JSX.Element {
  const item = getNavItem(activeKey);

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <a href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">
            A
          </div>
          <div>
            <p className="text-sm font-bold tracking-[-0.02em]">PondDesk</p>
            <p className="text-[11px] text-[var(--color-text-muted)]">{item?.label ?? "Farm OS"}</p>
          </div>
        </a>
      </div>
    </header>
  );
}
