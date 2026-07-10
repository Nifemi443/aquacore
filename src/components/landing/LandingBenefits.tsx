"use client";

import { useEffect, useRef, useState } from "react";

const metrics = [
  { label: "Reduce feed waste", value: 35, suffix: "%" },
  { label: "Increase survival", value: 18, suffix: "%" },
  { label: "Save admin time", value: 70, suffix: "%" },
  { label: "Improve farm visibility", value: 100, suffix: "%" },
] as const;

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }): React.JSX.Element {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1200;
          const start = performance.now();
          const animate = (now: number): void => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="text-5xl font-bold tracking-[-0.05em] text-[var(--color-accent)] sm:text-6xl">
      {count}{suffix}
    </span>
  );
}

export default function LandingBenefits(): React.JSX.Element {
  return (
    <section className="bg-white px-6 py-24 sm:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-[600px] text-center">
          <p className="text-label mb-4">Results</p>
          <h2 className="text-[clamp(32px,4vw,48px)] font-bold leading-[1.1] tracking-[-0.04em]">
            Measurable impact from day one.
          </h2>
          <p className="mt-5 text-lg leading-7 text-[var(--color-text-secondary)]">
            Farms using PondDesk see improvements across feed efficiency, survival, and profitability.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
            >
              <AnimatedCounter target={metric.value} suffix={metric.suffix} />
              <p className="mt-3 text-sm font-medium text-[var(--color-text-secondary)]">{metric.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] p-8 text-center">
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">
            Average farm profitability increased within the first harvest cycle.
          </p>
        </div>
      </div>
    </section>
  );
}
