"use client";

import { useState } from "react";

interface Pond {
  id: string;
  species: string;
  kg: number;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const TODAY_INDEX = 3;

const PONDS: Pond[] = [
  { id: "Pond 1", species: "Tilapia", kg: 85 },
  { id: "Pond 2", species: "Catfish", kg: 120 },
  { id: "Pond 4", species: "Catfish", kg: 95 },
  { id: "Pond 6", species: "Tilapia", kg: 70 },
  { id: "Pond 7", species: "Catfish", kg: 110 },
  { id: "Pond 9", species: "Catfish", kg: 90 },
];

const INITIAL_DONE_CELLS = [
  true,
  true,
  true,
  true,
  false,
  false,
  false,
  true,
  true,
  true,
  false,
  false,
  false,
  false,
  true,
  true,
  false,
  false,
  false,
  false,
  false,
  true,
  true,
  true,
  false,
  false,
  false,
  false,
  true,
  true,
  true,
  false,
  false,
  false,
  false,
  true,
  false,
  false,
  false,
  false,
  false,
  false,
];

function CheckIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
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

function cellIndex(pondIndex: number, dayIndex: number): number {
  return pondIndex * DAYS.length + dayIndex;
}

function cellClass(done: boolean, animating: boolean, dayIndex: number): string {
  if (done) {
    return `border-[var(--color-accent)] bg-[var(--color-accent)] text-white hover:bg-emerald-900 ${
      animating ? "[animation:checkPop_300ms_ease_forwards]" : ""
    }`;
  }

  if (dayIndex > TODAY_INDEX) {
    return "border-neutral-200 bg-neutral-50 text-[var(--color-border-strong)] hover:border-[var(--color-border-strong)] hover:bg-white";
  }

  if (dayIndex === TODAY_INDEX) {
    return "border-[var(--color-border-strong)] bg-white text-transparent hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-light)]";
  }

  return "border-amber-200 bg-[var(--color-warning-light)] text-[var(--color-warning)] hover:border-amber-300 hover:bg-amber-100";
}

export default function WeeklyGrid(): React.JSX.Element {
  const [cells, setCells] = useState<boolean[]>(INITIAL_DONE_CELLS);
  const [animatingCells, setAnimatingCells] = useState<boolean[]>(
    () => new Array(INITIAL_DONE_CELLS.length).fill(false) as boolean[],
  );

  const totalDone = cells.filter(Boolean).length;
  const totalCells = cells.length;

  const toggleCell = (pondIndex: number, dayIndex: number): void => {
    const index = cellIndex(pondIndex, dayIndex);

    setCells((prev) => prev.map((done, i) => (i === index ? !done : done)));
    setAnimatingCells((prev) => prev.map((animating, i) => (i === index ? true : animating)));

    window.setTimeout(() => {
      setAnimatingCells((prev) => prev.map((animating, i) => (i === index ? false : animating)));
    }, 300);
  };

  return (
    <section
      id="weekly-overview"
      className="scroll-mt-20 border-y border-[var(--color-border)] bg-[var(--color-surface)] py-16 sm:py-24"
    >
      <div className="mx-auto mb-12 max-w-[560px] px-6 text-center">
        <p className="text-label mb-3 text-[var(--color-accent)]">WEEKLY OVERVIEW</p>
        <h2 className="mb-4 text-[clamp(26px,3.5vw,40px)] font-bold tracking-[-0.03em] text-[var(--color-text-primary)]">
          The full week. At a glance.
        </h2>
        <p className="text-base leading-[1.7] text-[var(--color-text-secondary)]">
          Click any cell to mark a feeding complete. AquaCore tracks every pond, every day.
        </p>
      </div>

      <div className="mx-auto max-w-[1040px] px-6 lg:px-20">
        <p className="mb-2 text-center text-[11px] text-[var(--color-text-muted)] sm:hidden">← scroll →</p>
        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[480px] border-collapse">
            <thead>
              <tr>
                <th className="w-[140px] pb-3 text-left text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                  POND
                </th>
                {DAYS.map((day, dayIndex) => (
                  <th key={day} className="pb-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--color-text-muted)]">
                        {day}
                      </span>
                      {dayIndex === TODAY_INDEX && (
                        <span className="rounded-sm bg-[var(--color-accent)] px-1.5 py-0.5 text-[9px] font-semibold text-white">
                          TODAY
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PONDS.map((pond, pondIndex) => (
                <tr key={pond.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="py-3 pr-4">
                    <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{pond.id}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                      {pond.species} · {pond.kg}kg
                    </p>
                  </td>
                  {DAYS.map((day, dayIndex) => {
                    const index = cellIndex(pondIndex, dayIndex);
                    const done = cells[index];
                    const animating = animatingCells[index];

                    return (
                      <td key={`${pond.id}-${day}`} className="px-1 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggleCell(pondIndex, dayIndex)}
                          className={`mx-auto flex h-11 w-11 items-center justify-center rounded-md border transition-all duration-200 hover:-translate-y-px hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 sm:h-9 sm:w-9 ${cellClass(
                            done,
                            animating,
                            dayIndex,
                          )}`}
                          aria-label={`${done ? "Mark pending" : "Mark complete"} for ${pond.id} on ${day}`}
                        >
                          {done && <CheckIcon />}
                          {!done && dayIndex > TODAY_INDEX && <span className="text-[9px]">—</span>}
                          {!done && dayIndex < TODAY_INDEX && <span className="text-[9px]">!</span>}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <span className="h-3 w-3 rounded-sm bg-[var(--color-accent)]" />
              Completed
            </span>
            <span className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <span className="h-3 w-3 rounded-sm bg-[var(--color-warning-light)] ring-1 ring-amber-200" />
              Missed
            </span>
            <span className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <span className="h-3 w-3 rounded-sm border border-dashed border-neutral-300 bg-neutral-50" />
              Upcoming
            </span>
            <span className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <span className="h-3 w-3 rounded-sm border border-[var(--color-border-strong)] bg-white" />
              Today
            </span>
          </div>

          <div>
            <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
              {totalDone} feedings completed this week
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              {totalDone * 95}kg feed logged · {((totalDone / totalCells) * 100).toFixed(0)}% on schedule
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
