"use client";

import { useState } from "react";

interface FeedingItem {
  id: number;
  pond: string;
  species: string;
  pellet: string;
  kg: number;
  time: string;
  status: "pending" | "completing" | "done";
  completedAt?: string;
}

const initialItems: FeedingItem[] = [
  { id: 1, pond: "Pond 1", species: "Tilapia", pellet: "3mm", kg: 85, time: "07:00 AM", status: "pending" },
  { id: 2, pond: "Pond 4", species: "Catfish", pellet: "2mm", kg: 120, time: "08:00 AM", status: "pending" },
  { id: 3, pond: "Pond 7", species: "Catfish", pellet: "2mm", kg: 95, time: "09:30 AM", status: "pending" },
  { id: 4, pond: "Pond 2", species: "Tilapia", pellet: "3mm", kg: 70, time: "12:00 PM", status: "pending" },
  { id: 5, pond: "Pond 9", species: "Catfish", pellet: "4mm", kg: 110, time: "02:30 PM", status: "pending" },
  { id: 6, pond: "Pond 6", species: "Catfish", pellet: "2mm", kg: 90, time: "04:00 PM", status: "pending" },
];

const proofPoints = [
  "Auto-generated from your batch data — no manual entry",
  "Feed inventory deducted automatically on completion",
  "Overdue alerts sent to your phone via WhatsApp",
];

function CheckIcon({ className = "" }: { className?: string }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l5 5L19 7" />
    </svg>
  );
}

function formattedCurrentTime(): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
}

function cardClass(status: FeedingItem["status"]): string {
  if (status === "done") {
    return "cursor-default border-[var(--color-accent-border)] bg-[var(--color-accent-light)]";
  }

  if (status === "completing") {
    return "scale-[0.99] border-[var(--color-accent-border)] bg-[var(--color-accent-light)]";
  }

  return "cursor-pointer border-[var(--color-border)] bg-white hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]";
}

export default function FeedingTracker(): React.JSX.Element {
  const [items, setItems] = useState<FeedingItem[]>(initialItems);

  const completedCount = items.filter((item) => item.status === "done").length;
  const totalCount = items.length;
  const progress = (completedCount / totalCount) * 100;

  const handleComplete = (id: number): void => {
    const target = items.find((item) => item.id === id);

    if (!target || target.status !== "pending") {
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "completing" } : item)),
    );

    window.setTimeout(() => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "done", completedAt: formattedCurrentTime() } : item,
        ),
      );
    }, 150);
  };

  return (
    <section
      id="daily-operations"
      className="scroll-mt-20 border-b border-[var(--color-border)] bg-white py-16 sm:py-24"
    >
      <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-10 px-6 md:grid-cols-2 lg:gap-20 lg:px-20">
        <div>
          <p className="text-label mb-4 text-[var(--color-accent)]">DAILY OPERATIONS</p>
          <h2 className="mb-5 max-w-[360px] text-[clamp(26px,3.5vw,40px)] font-bold tracking-[-0.03em] text-[var(--color-text-primary)]">
            Mark feedings complete. In seconds.
          </h2>
          <p className="mb-8 text-base leading-[1.7] text-[var(--color-text-secondary)]">
            Every morning, PondDesk generates your feeding schedule. Tap a card when done. The system logs the time,
            updates inventory, and flags anything overdue.
          </p>

          <div className="space-y-4">
            {proofPoints.map((point) => (
              <div key={point} className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                  <CheckIcon />
                </span>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{point}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 hidden md:block">
            <div className="flex items-baseline gap-2">
              <span
                key={completedCount}
                className="text-5xl font-extrabold tabular-nums text-[var(--color-text-primary)]"
                style={{ animation: "countUp 200ms ease-out" }}
              >
                {completedCount}
              </span>
              <span className="text-base text-[var(--color-text-secondary)]">of {totalCount} feedings done today</span>
            </div>
            <div className="mt-3 h-1.5 w-[280px] rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="space-y-2.5">
            {items.map((item) => {
              const isActive = item.status === "completing" || item.status === "done";
              const isDone = item.status === "done";

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleComplete(item.id)}
                  disabled={isDone}
                  className={`group flex min-h-11 w-full items-center gap-4 rounded-lg border px-5 py-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 ${cardClass(
                    item.status,
                  )}`}
                  style={isDone ? { animation: "cardComplete 300ms ease-out forwards" } : undefined}
                >
                  <span
                    className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                      isActive
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                        : "border-[var(--color-border-strong)] bg-white group-hover:border-[var(--color-accent)]"
                    }`}
                  >
                    {isActive && <CheckIcon className="[animation:checkPop_300ms_ease_forwards]" />}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center">
                      <span
                        className={`text-sm font-semibold ${
                          isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"
                        }`}
                      >
                        {item.pond}
                      </span>
                      <span className="mx-2 text-[var(--color-border)]">·</span>
                      <span
                        className={`text-[13px] ${
                          isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"
                        }`}
                      >
                        {item.species}
                      </span>
                    </span>
                    <span className="mt-1 flex items-center text-xs">
                      <span className="text-[var(--color-text-muted)]">{item.pellet} pellet</span>
                      <span className="mx-2 text-[var(--color-border)]">·</span>
                      <span className="font-medium text-[var(--color-text-primary)]">{item.kg} kg</span>
                    </span>
                  </span>

                  {isDone ? (
                    <span className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-[var(--color-accent)]">
                        Completed
                      </span>
                      <span className="font-mono text-[11px] text-[var(--color-text-muted)]">{item.completedAt}</span>
                    </span>
                  ) : (
                    <span className="shrink-0 font-mono text-xs text-[var(--color-text-muted)]">{item.time}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 border-t border-neutral-100 pt-4 sm:flex sm:items-center sm:justify-between">
            <p className="text-xs text-[var(--color-text-muted)]">Updated automatically · Inventory synced</p>
            <p className="mt-2 text-xs font-medium text-[var(--color-accent)] sm:mt-0">
              Feed log → {completedCount * 95}kg recorded today
            </p>
          </div>

          <div className="mt-8 md:hidden">
            <div className="flex items-baseline gap-2">
              <span
                key={completedCount}
                className="text-5xl font-extrabold tabular-nums text-[var(--color-text-primary)]"
                style={{ animation: "countUp 200ms ease-out" }}
              >
                {completedCount}
              </span>
              <span className="text-base text-[var(--color-text-secondary)]">of {totalCount} feedings done today</span>
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
