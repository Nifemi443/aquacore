interface Message {
  role: "farmer" | "assistant";
  text: string;
}

const messages: Message[] = [
  { role: "farmer", text: "Which pond needs attention before afternoon feeding?" },
  {
    role: "assistant",
    text: "Pond 3 should be checked first. Dissolved oxygen is trending down at 5.4 mg/L and temperature is 30°C. Reduce the 12:00 feeding by 15% unless aeration improves before noon.",
  },
  { role: "farmer", text: "How much feed should Pond B receive tomorrow?" },
  {
    role: "assistant",
    text: "Pond B should receive 72kg tomorrow across two feedings: 34kg at 08:00 and 38kg at 15:00. That keeps the batch on its target growth curve without overfeeding.",
  },
];

const quickQuestions = [
  "Show today’s unfinished tasks",
  "When should I harvest Batch C?",
  "Which pond has poor water quality?",
] as const;

function SparkIcon(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
      <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />
    </svg>
  );
}

export default function AIFarmAssistant(): React.JSX.Element {
  return (
    <section
      id="ai-assistant"
      className="scroll-mt-20 border-y border-[var(--color-border)] bg-[var(--color-surface)] py-16 sm:py-24"
    >
      <div className="mx-auto grid max-w-[1120px] grid-cols-1 items-center gap-10 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-20">
        <div>
          <p className="text-label mb-4 text-[var(--color-accent)]">AI FARM ASSISTANT</p>
          <h2 className="mb-5 max-w-[420px] text-[clamp(26px,3.5vw,40px)] font-bold tracking-[-0.03em] text-[var(--color-text-primary)]">
            Ask farm questions in plain language.
          </h2>
          <p className="text-base leading-[1.7] text-[var(--color-text-secondary)]">
            AquaCore’s assistant reads the same pond, feeding, growth, and water data your team logs every day. It gives
            operational answers, not generic advice.
          </p>
        </div>

        <div
          className="overflow-hidden rounded-xl border border-[var(--color-border-strong)] bg-white"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}
        >
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-accent)] text-white">
                <SparkIcon />
              </span>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">AquaCore Assistant</p>
                <p className="text-xs text-[var(--color-text-muted)]">Connected to 12 ponds · 6 open tasks</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
              Live data
            </span>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            {messages.map((message) => (
              <div
                key={message.text}
                className={`flex ${message.role === "farmer" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[86%] rounded-lg px-4 py-3 text-sm leading-6 ${
                    message.role === "farmer"
                      ? "bg-[var(--color-text-primary)] text-white"
                      : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            <div className="rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)]">
                Assistant used
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {["Water quality", "Feed history", "Growth curve"].map((source) => (
                  <div key={source} className="rounded-md border border-[var(--color-accent-border)] bg-white px-3 py-2">
                    <p className="text-xs font-medium text-[var(--color-text-primary)]">{source}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  className="min-h-11 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-xs font-medium text-[var(--color-text-secondary)] transition-all duration-200 hover:-translate-y-px hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
