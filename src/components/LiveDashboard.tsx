"use client";

import { useEffect, useRef, useState } from "react";

interface Pond {
  id: string;
  species: string;
  do: string;
  feed: string;
  day: string;
  health: "Optimal" | "Monitor" | "Alert";
  trend: "up" | "stable" | "down";
}

const POND_DATA: Pond[] = [
  { id: "PN-001", species: "Catfish", do: "6.8", feed: "Fed · 07:02", day: "Day 34", health: "Optimal", trend: "up" },
  { id: "PN-002", species: "Tilapia", do: "7.1", feed: "Due · 12:00", day: "Day 61", health: "Optimal", trend: "stable" },
  { id: "PN-003", species: "Catfish", do: "5.9", feed: "Fed · 07:08", day: "Day 12", health: "Monitor", trend: "down" },
  { id: "PN-004", species: "Catfish", do: "6.5", feed: "Fed · 06:55", day: "Day 89", health: "Optimal", trend: "up" },
  { id: "PN-005", species: "Tilapia", do: "7.3", feed: "Due · 16:00", day: "Day 44", health: "Optimal", trend: "stable" },
  { id: "PN-006", species: "Catfish", do: "5.4", feed: "Overdue · 2h", day: "Day 7", health: "Alert", trend: "down" },
  { id: "PN-007", species: "Tilapia", do: "6.9", feed: "Fed · 07:15", day: "Day 103", health: "Optimal", trend: "up" },
  { id: "PN-008", species: "Catfish", do: "6.2", feed: "Due · 12:00", day: "Day 55", health: "Monitor", trend: "stable" },
  { id: "PN-009", species: "Tilapia", do: "7.0", feed: "Fed · 07:00", day: "Day 28", health: "Optimal", trend: "up" },
  { id: "PN-010", species: "Catfish", do: "6.7", feed: "Fed · 06:48", day: "Day 77", health: "Optimal", trend: "stable" },
];

const SPARKLINE_POINTS: Record<Pond["trend"], string> = {
  up: "0,16 8,12 16,10 24,7 32,5 40,3 48,1",
  stable: "0,10 8,9 16,11 24,10 32,9 40,11 48,10",
  down: "0,2 8,4 16,7 24,9 32,12 40,14 48,18",
};

const HEALTH_COLOR: Record<Pond["health"], string> = {
  Optimal: "#0D7A5F",
  Monitor: "#B45309",
  Alert: "#B91C1C",
};

function doColor(value: string): string {
  return parseFloat(value) < 6.0 ? "#B45309" : "#404040";
}

function feedColor(feed: string): string {
  if (feed.startsWith("Fed")) return "#A3A3A3";
  if (feed.startsWith("Overdue")) return "#B91C1C";
  return "#404040";
}

function feedWeight(feed: string): number {
  return feed.startsWith("Overdue") ? 500 : 400;
}

export default function LiveDashboard(): React.JSX.Element {
  const [slots, setSlots] = useState([0, 1, 2, 3, 4, 5]);
  const [fadingSlot, setFadingSlot] = useState<number | null>(null);
  const nextRowRef = useRef(6);
  const slotCycleRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      const slot = slotCycleRef.current % 6;
      const nextRow = nextRowRef.current % POND_DATA.length;
      slotCycleRef.current++;
      nextRowRef.current++;
      setFadingSlot(slot);
      setTimeout(() => {
        setSlots((prev) => {
          const next = [...prev];
          next[slot] = nextRow;
          return next;
        });
        setFadingSlot(null);
      }, 400);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="live-dashboard" className="scroll-mt-20 border-y border-[#E5E5E5] bg-[#F9F9F9] py-16">
      <div className="mx-auto max-w-[1120px] px-6 lg:px-20">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-label mb-1">LIVE POND OVERVIEW</p>
            <p className="text-[13px] text-[#737373]">
              10 ponds monitored · data refreshes every 3 seconds
            </p>
          </div>
          <span className="flex items-center gap-2 text-[12px] font-medium text-[#0D7A5F]">
            <span className="live-dot" aria-hidden="true" />
            LIVE
          </span>
        </div>

        <p className="mb-2 text-center text-[11px] text-[#A3A3A3] md:hidden">← scroll →</p>
        <div className="overflow-x-auto rounded-[4px] border border-[#E5E5E5] bg-white [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[720px] table-fixed border-collapse">
            <colgroup>
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "28%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F9F9F9]">
                {["POND ID", "SPECIES", "D.O. (mg/L)", "FEED STATUS", "DAY", "HEALTH", "TREND"].map(
                  (label) => (
                    <th
                      key={label}
                      className="text-label overflow-hidden text-ellipsis whitespace-nowrap px-5 py-4 text-left"
                    >
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {slots.map((rowIndex, slot) => {
                const pond = POND_DATA[rowIndex];
                const isFading = fadingSlot === slot;
                return (
                  <tr
                    key={slot}
                    className={`h-[52px] border-b border-[#E5E5E5] bg-white last:border-b-0 ${
                      isFading ? "row-fading" : "row-entering"
                    }`}
                  >
                    <td className="overflow-hidden text-ellipsis whitespace-nowrap px-5 py-0 font-mono text-[13px] font-medium text-[#0A0A0A]">
                      {pond.id}
                    </td>
                    <td className="overflow-hidden text-ellipsis whitespace-nowrap px-5 py-0 font-mono text-[13px] text-[#737373]">
                      {pond.species}
                    </td>
                    <td
                      className="overflow-hidden text-ellipsis whitespace-nowrap px-5 py-0 font-mono text-[13px]"
                      style={{ color: doColor(pond.do) }}
                    >
                      {pond.do}
                    </td>
                    <td
                      className="overflow-hidden text-ellipsis whitespace-nowrap px-5 py-0 font-mono text-[13px]"
                      style={{ color: feedColor(pond.feed), fontWeight: feedWeight(pond.feed) }}
                    >
                      {pond.feed}
                    </td>
                    <td className="overflow-hidden text-ellipsis whitespace-nowrap px-5 py-0 font-mono text-[13px] text-[#A3A3A3]">
                      {pond.day}
                    </td>
                    <td
                      className="overflow-hidden text-ellipsis whitespace-nowrap px-5 py-0 font-mono text-[13px]"
                      style={{ color: HEALTH_COLOR[pond.health] }}
                    >
                      {pond.health}
                    </td>
                    <td className="overflow-hidden whitespace-nowrap px-5 py-0">
                      <svg width="48" height="20" aria-hidden="true">
                        <polyline
                          points={SPARKLINE_POINTS[pond.trend]}
                          fill="none"
                          stroke={HEALTH_COLOR[pond.health]}
                          strokeWidth="1.5"
                        />
                      </svg>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between">
          <p className="text-[12px] text-[#A3A3A3]">
            Showing 6 of 10 ponds · Rows update automatically
          </p>
          <a
            href="#"
            className="text-[12px] font-medium text-[#0D7A5F] underline-offset-4 hover:underline"
          >
            View all ponds →
          </a>
        </div>
      </div>
    </section>
  );
}
