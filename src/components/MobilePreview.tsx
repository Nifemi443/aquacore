interface TaskItem {
  label: string;
  time: string;
  done: boolean;
}

interface PondCard {
  pond: string;
  species: string;
  day: number;
  avgWeight: string;
  status: "Optimal" | "Monitor";
}

interface MobileBullet {
  text: string;
}

const tasks: TaskItem[] = [
  { label: "Feed Pond 1 — 85kg", time: "07:00", done: true },
  { label: "Feed Pond 4 — 120kg", time: "08:00", done: true },
  { label: "Water check, Pond 3", time: "10:00", done: false },
];

const pondCards: PondCard[] = [
  { pond: "Pond 4", species: "Catfish", day: 34, avgWeight: "680g", status: "Optimal" },
  { pond: "Pond 7", species: "Tilapia", day: 61, avgWeight: "420g", status: "Optimal" },
  { pond: "Pond 3", species: "Catfish", day: 12, avgWeight: "140g", status: "Monitor" },
];

const bullets: MobileBullet[] = [
  { text: "Mark feedings done from anywhere" },
  { text: "Real-time alerts via WhatsApp" },
  { text: "Offline mode — works without data" },
  { text: "Syncs automatically when connected" },
];

const navItems = ["Home", "Ponds", "Feed", "Reports"] as const;

function CheckIcon({ size = 10 }: { size?: number }): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
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

function StatusIcons(): React.JSX.Element {
  return (
    <div className="flex items-center gap-1 text-[var(--color-text-primary)]">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M4 18h2M8 14h2M12 10h2M16 6h2" strokeLinecap="round" />
      </svg>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M5 10a10 10 0 0 1 14 0M8 13a6 6 0 0 1 8 0M11 16a2 2 0 0 1 2 0" strokeLinecap="round" />
      </svg>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="7" width="16" height="10" rx="2" />
        <path d="M21 11v2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function NavIcon({ active }: { active: boolean }): React.JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={active ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"}
    >
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v9h12v-9" />
    </svg>
  );
}

function PhoneFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}): React.JSX.Element {
  return (
    <div
      className={`relative h-[440px] w-[220px] overflow-hidden rounded-[32px] border-2 border-[var(--color-text-primary)] bg-white ${className}`}
      style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.12), 0 32px 64px rgba(0,0,0,0.08)" }}
    >
      <div className="absolute left-1/2 top-0 z-10 h-5 w-[60px] -translate-x-1/2 rounded-b-xl bg-[var(--color-text-primary)]" />
      <div className="flex h-8 items-center justify-between px-4 pt-1">
        <span className="text-[11px] font-semibold text-[var(--color-text-primary)]">9:41</span>
        <StatusIcons />
      </div>
      {children}
    </div>
  );
}

function TasksPhone(): React.JSX.Element {
  return (
    <PhoneFrame className="absolute left-0 top-10 z-[1] hidden rotate-[-4deg] md:block">
      <div className="border-b border-neutral-100 px-4 py-3">
        <p className="text-[13px] font-bold text-[var(--color-text-primary)]">Good morning, Ayo 👋</p>
        <p className="text-[10px] text-[var(--color-text-muted)]">Monday · 6 tasks today</p>
      </div>

      <div>
        {tasks.map((task) => (
          <div key={task.label} className="flex h-[52px] items-center gap-2.5 border-b border-[var(--color-surface)] px-4 py-3">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                task.done
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                  : "border-[var(--color-border-strong)]"
              }`}
            >
              {task.done && <CheckIcon />}
            </span>
            <span className="text-xs font-medium text-[var(--color-text-primary)]">{task.label}</span>
            <span className="ml-auto text-[10px] text-[var(--color-text-muted)]">{task.time}</span>
          </div>
        ))}
      </div>

      <div className="absolute bottom-0 grid h-14 w-full grid-cols-4 border-t border-neutral-100 bg-white">
        {navItems.map((item, index) => (
          <div
            key={item}
            className={`flex flex-col items-center justify-center gap-1 text-[9px] ${
              index === 0 ? "text-[var(--color-accent)]" : "text-[var(--color-text-muted)]"
            }`}
          >
            <NavIcon active={index === 0} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}

function OverviewPhone(): React.JSX.Element {
  return (
    <PhoneFrame className="relative z-[2] mx-auto rotate-[2deg] md:absolute md:left-[120px] md:top-0">
      <div className="bg-[var(--color-accent)] px-4 pb-4 pt-8">
        <p className="text-sm font-bold text-white">Pond Overview</p>
        <p className="text-[10px] text-white/70">12 ponds · 4 active batches</p>
      </div>

      <div className="py-1">
        {pondCards.map((pond) => (
          <div key={pond.pond} className="mx-3 my-2 rounded-lg border border-[var(--color-border)] bg-white p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--color-text-primary)]">{pond.pond}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  pond.status === "Optimal"
                    ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                    : "bg-[var(--color-warning-light)] text-[var(--color-warning)]"
                }`}
              >
                {pond.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-[var(--color-text-secondary)]">
                {pond.species} · Day {pond.day}
              </span>
              <span className="text-[10px] font-medium text-[var(--color-text-primary)]">{pond.avgWeight} avg</span>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-0 flex w-full justify-between border-t border-neutral-100 bg-[var(--color-surface)] px-3 py-2.5">
        {[
          ["D.O.", "6.2"],
          ["pH", "7.1"],
          ["Temp", "28°C"],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="text-[9px] text-[var(--color-text-muted)]">{label}</p>
            <p className="text-[11px] font-semibold text-[var(--color-text-primary)]">{value}</p>
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}

export default function MobilePreview(): React.JSX.Element {
  return (
    <section id="mobile" className="scroll-mt-20 overflow-hidden bg-white py-16 sm:py-24">
      <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-10 px-6 md:grid-cols-2 lg:gap-20 lg:px-20">
        <div className="relative h-auto md:h-[520px]">
          <TasksPhone />
          <OverviewPhone />
        </div>

        <div>
          <p className="text-label mb-4 text-[var(--color-accent)]">MOBILE COMPANION</p>
          <h2 className="mb-5 max-w-[380px] text-[clamp(26px,3.5vw,40px)] font-bold tracking-[-0.03em] text-[var(--color-text-primary)]">
            Your farm in your pocket.
          </h2>
          <p className="mb-8 text-base leading-[1.7] text-[var(--color-text-secondary)]">
            Mark feedings complete from the pond edge. Check water quality without walking back to the office. Get
            alerts before problems become losses.
          </p>

          <div>
            {bullets.map((bullet) => (
              <div key={bullet.text} className="mb-4 flex items-center gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                  <CheckIcon size={12} />
                </span>
                <p className="text-sm text-[var(--color-text-primary)]">{bullet.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <a
              href="#"
              className="flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)] transition-all duration-200 hover:gap-3 hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
            >
              Join the waitlist to get mobile access →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
