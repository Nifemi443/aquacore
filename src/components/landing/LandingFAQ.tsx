"use client";

import { useState } from "react";

const faqs = [
  {
    question: "How does AquaCore work?",
    answer: "AquaCore is a cloud-based fish farm operating system. You set up your farm, add ponds and batches, then record daily operations like feeding, water tests, and mortality. AI analyzes your data and provides recommendations on feeding, harvest timing, inventory, and profitability.",
  },
  {
    question: "Can I manage multiple farms?",
    answer: "Yes. The Professional plan supports multiple ponds and batches. The Enterprise plan includes full multi-farm support with role-based permissions, allowing managers to oversee several locations from one dashboard.",
  },
  {
    question: "Can I use it offline?",
    answer: "Yes. AquaCore's mobile app works offline. Record feedings, water tests, and mortality in the field, and data syncs automatically when you reconnect.",
  },
  {
    question: "Does it support large commercial farms?",
    answer: "Absolutely. AquaCore is built for commercial aquaculture operations with hundreds of ponds, multiple species, and large teams. Enterprise plans include custom integrations and dedicated support.",
  },
  {
    question: "Can my staff use it?",
    answer: "Yes. Add unlimited team members with role-based access. Workers can record feedings and water tests from mobile. Managers get full analytics and AI insights.",
  },
  {
    question: "How secure is my data?",
    answer: "All data is encrypted in transit and at rest. We maintain audit logs, role-based permissions, and regular backups. Enterprise plans include compliance documentation for government and cooperative projects.",
  },
] as const;

export default function LandingFAQ(): React.JSX.Element {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[720px]">
        <div className="text-center">
          <p className="text-label mb-4">FAQ</p>
          <h2 className="text-[clamp(32px,4vw,48px)] font-bold leading-[1.1] tracking-[-0.04em]">
            Frequently asked questions.
          </h2>
        </div>

        <div className="mt-12 divide-y divide-[var(--color-border)]">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.question}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors duration-200 hover:text-[var(--color-accent)]"
                >
                  <span className="text-base font-semibold">{faq.question}</span>
                  <span className={`shrink-0 text-xl text-[var(--color-text-muted)] transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}>
                    +
                  </span>
                </button>
                {isOpen && (
                  <p className="pb-5 text-sm leading-7 text-[var(--color-text-secondary)] [animation:fadeSlideUp_200ms_ease-out]">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
