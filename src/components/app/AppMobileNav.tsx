"use client";

import { useState } from "react";
import { APP_NAV_ITEMS, MOBILE_NAV_KEYS, type AppNavKey } from "./nav-config";
import { NavIcon } from "./NavIcon";

export function AppMobileNav({ activeKey }: { activeKey: AppNavKey }): React.JSX.Element {
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryItems = APP_NAV_ITEMS.filter((item) => MOBILE_NAV_KEYS.includes(item.key));
  const secondaryItems = APP_NAV_ITEMS.filter((item) => !MOBILE_NAV_KEYS.includes(item.key));

  return (
    <>
      {moreOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      <nav
        className="fixed bottom-4 left-4 right-4 z-50 lg:hidden"
        aria-label="Mobile navigation"
      >
        {moreOpen && secondaryItems.length > 0 && (
          <div className="mb-2 rounded-2xl border border-[var(--color-border)] bg-white/95 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl">
            {secondaryItems.map((item) => {
              const active = item.key === activeKey;
              return (
                <a
                  key={item.key}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors ${
                    active
                      ? "bg-[var(--color-accent-light)] font-medium text-[var(--color-accent)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                  }`}
                >
                  <NavIcon type={item.icon} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-white/95 p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {primaryItems.map((item) => {
            const active = item.key === activeKey;
            return (
              <a
                key={item.key}
                href={item.href}
                className={`flex min-w-[4.25rem] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition-all ${
                  active
                    ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                }`}
              >
                <NavIcon type={item.icon} />
                <span className="truncate">{item.shortLabel}</span>
              </a>
            );
          })}
          {secondaryItems.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen((open) => !open)}
              aria-expanded={moreOpen}
              aria-label="More navigation options"
              className={`flex min-w-[4.25rem] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-medium transition-all ${
                moreOpen || secondaryItems.some((item) => item.key === activeKey)
                  ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
              }`}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
              <span>More</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
