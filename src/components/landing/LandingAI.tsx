"use client";

import { useState } from "react";

const prompts = [
  "Which pond needs feeding?",
  "Which batch is ready for harvest?",
  "How much feed do I need next week?",
  "What caused yesterday's mortality?",
  "What is today's expected revenue?",
] as const;

const responses: Record<string, string> = {
  "Which pond needs feeding?": "Pond C and Pond E have pending afternoon feedings. Pond C is 35 minutes overdue. Assign Tunde to complete both before 4 PM.",
  "Which batch is ready for harvest?": "BAT-003 (Tilapia, Pond D) is at 94% harvest readiness. Optimal window is July 15–18. Lagos Fish Market Co. is already assigned as buyer.",
  "How much feed do I need next week?": "Based on current biomass and growth rates, you need approximately 1,820 kg next week. Coppens Starter 2mm is critically low—order 1,200 kg before Friday.",
  "What caused yesterday's mortality?": "2 mortalities in Pond E were recorded during a salt bath treatment. This is within expected range for treatment batches. No disease indicators detected in water quality logs.",
  "What is today's expected revenue?": "Today's projected revenue from active batches is ₦142,000. BAT-003 harvest in 7 days will add ₦5.2M. Monthly projection: ₦6.1M.",
};

export default function LandingAI(): React.JSX.Element {
  const [activePrompt, setActivePrompt] = useState<string>(prompts[0]);

  return (
    <section className="bg-[var(--color-surface)] px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-label mb-4">AI-powered</p>
            <h2 className="text-[clamp(32px,4vw,48px)] font-bold leading-[1.1] tracking-[-0.04em]">
              Your AI farm manager.
            </h2>
            <p className="mt-5 text-lg leading-7 text-[var(--color-text-secondary)]">
              Ask PondDesk anything about your farm. Get instant answers grounded in your live operational data—not
              generic advice.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => setActivePrompt(prompt)}
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200 hover:-translate-y-px ${
                    activePrompt === prompt
                      ? "border-[var(--color-accent-border)] bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                      : "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.08)]">
            <div className="border-b border-[var(--color-border)] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-bold text-white">
                  AI
                </div>
                <div>
                  <p className="text-sm font-semibold">PondDesk Assistant</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Powered by your farm data</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[var(--color-accent)] px-4 py-3 text-sm text-white">
                  {activePrompt}
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-light)] text-[10px] font-bold text-[var(--color-accent)]">
                  AI
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm leading-6 text-[var(--color-text-secondary)] [animation:fadeSlideUp_300ms_ease-out]">
                  {responses[activePrompt]}
                </div>
              </div>
            </div>
            <div className="border-t border-[var(--color-border)] px-5 py-4">
              <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                <span className="flex-1 text-sm text-[var(--color-text-muted)]">Ask anything about your farm…</span>
                <span className="rounded-md bg-[var(--color-accent)] px-3 py-1 text-xs font-medium text-white">Send</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
