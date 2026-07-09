import type { AppNavIconType } from "./nav-config";

export function NavIcon({ type }: { type: AppNavIconType }): React.JSX.Element {
  const paths: Record<AppNavIconType, React.ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    pond: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M7 14c2-2 4-2 6 0s4 2 6 0" />
      </>
    ),
    batch: (
      <>
        <path d="M12 3l9 5-9 5-9-5 9-5z" />
        <path d="M3 13l9 5 9-5" />
      </>
    ),
    feed: <path d="M5 12h14M7 8h10M8 16h8" />,
    inventory: (
      <>
        <path d="M21 8l-9-5-9 5 9 5 9-5z" />
        <path d="M3 8v8l9 5 9-5V8" />
      </>
    ),
    water: <path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z" />,
    harvest: <path d="M4 14c5-8 11-8 16 0M6 14v5h12v-5" />,
    reports: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M7 15l4-4 3 3 5-7" />
      </>
    ),
    delivery: (
      <>
        <path d="M3 7h11v8H3z" />
        <path d="M14 10h4l3 3v2h-7z" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </>
    ),
    ai: (
      <>
        <path d="M12 3l2 5 5 1-4 4 1 5-4-3-4 3 1-5-4-4 5-1 2-5z" />
      </>
    ),
    settings: (
      <>
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M19.4 15a8 8 0 0 0 .1-2l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L15 5.5h-4L10.6 8a8 8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a8 8 0 0 0 .1 2l-2.1 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1l.4 2.5h4l.4-2.5a8 8 0 0 0 1.7-1l2.4 1 2-3.5L19.4 15z" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {paths[type]}
    </svg>
  );
}
