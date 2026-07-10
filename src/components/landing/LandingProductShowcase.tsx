"use client";

import { useState } from "react";

const tabs = [
  { id: "dashboard", label: "Dashboard", kpis: ["18,420 fish", "96.4% survival", "₦14.8M value"] },
  { id: "batches", label: "Fish Batches", kpis: ["12 active", "4 harvests due", "96.4% survival"] },
  { id: "feeding", label: "Today's Feeding", kpis: ["36 scheduled", "28 completed", "97% compliance"] },
  { id: "inventory", label: "Feed Inventory", kpis: ["8,450 kg", "18 days left", "₦8.4M value"] },
  { id: "water", label: "Water Quality", kpis: ["pH 7.2", "D.O. 6.8", "27°C temp"] },
  { id: "harvest", label: "Harvest", kpis: ["7 days to next", "₦5.2M revenue", "92% ready"] },
  { id: "analytics", label: "Analytics", kpis: ["+23% feed savings", "₦4.7M profit", "38% ROI"] },
] as const;

type TabId = (typeof tabs)[number]["id"];

function PreviewChart({ tab }: { tab: TabId }): React.JSX.Element {
  const colors = tab === "water"
    ? ["#0D7A5F", "#34D399", "#6EE7B7", "#A7F3D0"]
    : ["#0D7A5F", "#0D7A5F", "#0D7A5F", "#0D7A5F"];

  return (
    <svg width="100%" height="120" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
      {tab === "water" ? (
        <>
          {[60, 45, 75, 55].map((h, i) => (
            <rect key={i} x={40 + i * 90} y={120 - h} width="50" height={h} rx="4" fill={colors[i]} opacity="0.8" />
          ))}
        </>
      ) : (
        <>
          <defs>
            <linearGradient id="previewFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0D7A5F" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0D7A5F" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 100 C60 90 120 70 180 55 C240 40 300 30 400 20 L400 120 L0 120 Z" fill="url(#previewFill)" />
          <path d="M0 100 C60 90 120 70 180 55 C240 40 300 30 400 20" fill="none" stroke="#0D7A5F" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export default function LandingProductShowcase(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const current = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <section className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-[600px] text-center">
          <p className="text-label mb-4">Product</p>
          <h2 className="text-[clamp(32px,4vw,48px)] font-bold leading-[1.1] tracking-[-0.04em]">
            See every module in action.
          </h2>
          <p className="mt-5 text-lg leading-7 text-[var(--color-text-secondary)]">
            Click through the modules your team uses every day.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-px ${
                activeTab === tab.id
                  ? "border-[var(--color-accent-border)] bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                  : "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all duration-500">
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-5 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            <span className="ml-3 text-xs text-[var(--color-text-muted)]">app.ponddesk.io/{current.id}</span>
          </div>
          <div className="grid gap-6 p-6 sm:grid-cols-[1fr_2fr] sm:p-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold tracking-[-0.03em]">{current.label}</h3>
              <div className="space-y-3">
                {current.kpis.map((kpi) => (
                  <div key={kpi} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                    <p className="text-sm font-semibold">{kpi}</p>
                  </div>
                ))}
              </div>
              <a
                href={`/${current.id === "dashboard" ? "dashboard" : current.id === "batches" ? "batches" : current.id === "feeding" ? "feedings" : current.id === "inventory" ? "inventory" : "dashboard"}`}
                className="inline-flex text-sm font-medium text-[var(--color-accent)] underline-offset-4 hover:underline"
              >
                Open {current.label} →
              </a>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 [animation:fadeSlideUp_400ms_ease-out]">
              <PreviewChart tab={activeTab} />
              <div className="mt-4 grid grid-cols-3 gap-3">
                {["This week", "Last week", "Target"].map((label, i) => (
                  <div key={label} className="text-center">
                    <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
                    <p className="mt-1 text-sm font-bold">{["+8%", "+4%", "On track"][i]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
