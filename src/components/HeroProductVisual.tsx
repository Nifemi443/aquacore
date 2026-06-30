"use client";

import { useState } from "react";

interface FeedingRow {
  id: string;
  pond: string;
  batch: string;
  time: string;
  amount: string;
  done: boolean;
}

const initialRows: FeedingRow[] = [
  { id: "pond-1", pond: "Pond 1", batch: "Tilapia · Batch A", time: "07:00", amount: "85kg", done: true },
  { id: "pond-4", pond: "Pond 4", batch: "Catfish · Batch C", time: "08:00", amount: "120kg", done: true },
  { id: "pond-7", pond: "Pond 7", batch: "Catfish · Batch C", time: "09:30", amount: "95kg", done: false },
  { id: "pond-2", pond: "Pond 2", batch: "Tilapia · Batch B", time: "12:00", amount: "70kg", done: false },
];

function CheckIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
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

function LockIcon(): React.JSX.Element {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function HeroProductVisual(): React.JSX.Element {
  const [rows, setRows] = useState<FeedingRow[]>(initialRows);
  const completedCount = rows.filter((row) => row.done).length;
  const progress = (completedCount / rows.length) * 100;

  const toggleRow = (id: string): void => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, done: true } : row)));
  };

  return (
    <div className="mx-auto mt-16 w-full max-w-[980px] px-4 sm:px-6">
      <div
        className="overflow-hidden rounded-xl border border-[var(--color-border-strong)] bg-white"
        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08), 0 24px 64px rgba(0,0,0,0.10)" }}
      >
        <div className="flex h-11 items-center gap-3 border-b border-[var(--color-border)] bg-neutral-100 px-4">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <div className="mx-auto flex h-[26px] max-w-[280px] flex-1 items-center justify-center gap-1.5 rounded-md bg-neutral-200 px-3 font-mono text-[11px] text-[var(--color-text-secondary)]">
            <span className="text-[var(--color-text-muted)]">
              <LockIcon />
            </span>
            <span className="truncate">app.aquacore.io/today</span>
          </div>
        </div>

        <div className="grid gap-6 bg-[var(--color-surface)] p-5 sm:p-8 lg:grid-cols-[1fr_280px]">
          <section className="rounded-lg border border-[var(--color-border)] bg-white p-5 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                  Today’s farm plan
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[var(--color-text-primary)]">
                  Complete morning feedings
                </h3>
                <p className="mt-2 max-w-[480px] text-sm leading-6 text-[var(--color-text-secondary)]">
                  AquaCore turns pond records into a clear schedule your team can follow from the farm floor.
                </p>
              </div>
              <div className="rounded-md border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] px-3 py-2 text-right">
                <p className="text-[11px] font-medium text-[var(--color-accent)]">{completedCount} of 4 done</p>
                <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">Inventory synced</p>
              </div>
            </div>

            <div className="mb-5 h-1.5 rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="space-y-3">
              {rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => toggleRow(row.id)}
                  disabled={row.done}
                  className={`grid min-h-14 w-full grid-cols-[24px_1fr_auto] items-center gap-4 rounded-md border px-4 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 ${
                    row.done
                      ? "cursor-default border-[var(--color-accent-border)] bg-[var(--color-accent-light)]"
                      : "border-[var(--color-border)] bg-white hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200 ${
                      row.done
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                        : "border-[var(--color-border-strong)] bg-white text-transparent"
                    }`}
                  >
                    <CheckIcon />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--color-text-primary)]">{row.pond}</span>
                    <span className="mt-0.5 block truncate text-xs text-[var(--color-text-secondary)]">
                      {row.batch} · {row.amount} feed
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-mono text-xs text-[var(--color-text-muted)]">{row.time}</span>
                    {row.done && (
                      <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-accent)]">
                        Logged
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
              <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                Why it matters
              </p>
              <p className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[var(--color-text-primary)]">285kg</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                feed scheduled this morning, deducted from inventory as each pond is completed.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--color-border)] bg-white p-5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">Pond 7 due next</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                95kg of 2mm pellet at 09:30. If missed, AquaCore flags the task before it becomes a farm-wide gap.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
