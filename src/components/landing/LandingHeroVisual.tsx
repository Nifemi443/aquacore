"use client";

import { useEffect, useState } from "react";

const tabs = ["Dashboard", "Batches", "Feeding", "Analytics", "AI", "Water"] as const;
type Tab = (typeof tabs)[number];

const stats = [
  { label: "Active ponds", value: "24" },
  { label: "Survival rate", value: "96.4%" },
  { label: "Feed saved", value: "23%" },
] as const;

function MiniChart(): React.JSX.Element {
  return (
    <svg width="100%" height="80" viewBox="0 0 280 80" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="heroChartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D7A5F" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#0D7A5F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 70 C40 62 80 58 120 48 C160 38 200 28 280 18 L280 80 L0 80 Z" fill="url(#heroChartFill)" />
      <path
        d="M0 70 C40 62 80 58 120 48 C160 38 200 28 280 18"
        fill="none"
        stroke="#0D7A5F"
        strokeWidth="2"
        strokeLinecap="round"
        className="[stroke-dasharray:400] [stroke-dashoffset:400] [animation:chartDraw_1.2s_ease-out_forwards]"
      />
    </svg>
  );
}

export default function LandingHeroVisual(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>("Dashboard");
  const [statIndex, setStatIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStatIndex((current) => (current + 1) % stats.length);
    }, 2800);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[920px] overflow-hidden px-4 sm:px-6">
      {/* Floating dots */}
      {[
        { top: "8%", left: "6%", delay: "0s" },
        { top: "18%", right: "8%", delay: "1s" },
        { bottom: "22%", left: "4%", delay: "2s" },
        { bottom: "12%", right: "6%", delay: "0.5s" },
      ].map((dot, index) => (
        <span
          key={index}
          className="dot-drift absolute h-2 w-2 rounded-full bg-[var(--color-accent)]/30"
          style={{ top: dot.top, left: dot.left, right: dot.right, bottom: dot.bottom, animationDelay: dot.delay }}
        />
      ))}

      {/* Stat pill */}
      <div className="absolute left-0 top-12 z-10 hidden rounded-2xl border border-[var(--color-border)] bg-white/90 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:block">
        <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">{stats[statIndex].label}</p>
        <p className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[var(--color-accent)] [animation:countUp_400ms_ease-out]">
          {stats[statIndex].value}
        </p>
      </div>

      {/* AI insight pill */}
      <div className="absolute bottom-16 right-0 z-10 hidden max-w-[200px] rounded-2xl border border-[var(--color-accent-border)] bg-[var(--color-accent-light)]/90 px-4 py-3 shadow-[0_8px_32px_rgba(13,122,95,0.12)] backdrop-blur-xl md:block">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-accent)]">AI Insight</p>
        <p className="mt-1 text-xs leading-5 text-[var(--color-text-primary)]">
          Pond 4 feed ration can be reduced 5% without affecting growth.
        </p>
      </div>

      {/* Browser mockup */}
      <div className="hero-float mx-auto rounded-2xl border border-[var(--color-border)] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-3 flex-1 rounded-md bg-[var(--color-surface)] px-3 py-1 text-center text-[11px] text-[var(--color-text-muted)]">
            app.ponddesk.io/dashboard
          </span>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-[var(--color-border)] px-4 py-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                activeTab === tab
                  ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-[140px_1fr] sm:p-5">
          <div className="hidden space-y-1 sm:block">
            {["Overview", "Ponds", "Batches", "Feeding", "Inventory", "Harvest"].map((item, index) => (
              <div
                key={item}
                className={`rounded-md px-3 py-2 text-xs font-medium ${
                  index === 0 ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]" : "text-[var(--color-text-secondary)]"
                }`}
              >
                {item}
              </div>
            ))}
          </div>

          <div className="min-w-0 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Total Fish", value: "18,420" },
                { label: "Biomass", value: "7.4t" },
                { label: "Health", value: "96/100" },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">{kpi.label}</p>
                  <p className="mt-1 text-sm font-bold">{kpi.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold">
                  {activeTab === "Dashboard" && "Farm Growth"}
                  {activeTab === "Batches" && "Batch Performance"}
                  {activeTab === "Feeding" && "Today's Feedings"}
                  {activeTab === "Analytics" && "Revenue Trend"}
                  {activeTab === "AI" && "AI Recommendations"}
                  {activeTab === "Water" && "Water Quality"}
                </p>
                <span className="rounded-full bg-[var(--color-accent-light)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-accent)]">
                  Live
                </span>
              </div>
              {activeTab === "Water" ? (
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "pH", value: "7.2" },
                    { label: "D.O.", value: "6.8" },
                    { label: "Temp", value: "27°C" },
                    { label: "NH₃", value: "0.02" },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-lg bg-[var(--color-surface)] p-2">
                      <p className="text-[10px] text-[var(--color-text-muted)]">{metric.label}</p>
                      <p className="text-xs font-bold text-[var(--color-accent)]">{metric.value}</p>
                    </div>
                  ))}
                </div>
              ) : activeTab === "AI" ? (
                <div className="space-y-2">
                  <p className="rounded-lg bg-[var(--color-surface)] px-3 py-2 text-[11px] leading-5 text-[var(--color-text-secondary)]">
                    Harvest Batch E in 9 days for optimal market weight.
                  </p>
                  <p className="rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] px-3 py-2 text-[11px] leading-5">
                    Feed inventory sufficient for 18 days at current consumption.
                  </p>
                </div>
              ) : (
                <MiniChart />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { pond: "Pond A", status: "Fed", color: "text-[var(--color-accent)]" },
                { pond: "Pond D", status: "Due 4PM", color: "text-[var(--color-warning)]" },
              ].map((pond) => (
                <div key={pond.pond} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2">
                  <span className="text-xs font-medium">{pond.pond}</span>
                  <span className={`text-[10px] font-semibold ${pond.color}`}>{pond.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
