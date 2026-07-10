import HeroProductVisual from "@/components/HeroProductVisual";

export default function Hero(): React.JSX.Element {
  return (
    <section className="bg-white px-6 pb-32 pt-40">
      {/* Copy — centered, constrained width */}
      <div className="mx-auto max-w-[720px]">
        <p className="text-label mb-6 text-center">
          NOW IN BETA · BUILT FOR NIGERIAN AQUACULTURE
        </p>

        <h1 className="mb-6 text-center text-[clamp(52px,7vw,80px)] font-bold leading-[1.05] tracking-[-0.04em] text-[#0A0A0A]">
          <span className="block">Every pond.</span>
          <span className="block">Every batch.</span>
          <span className="block">Every decision.</span>
        </h1>

        <p className="mx-auto mb-10 max-w-[520px] text-center text-[17px] leading-[1.7] text-[#737373]">
          PondDesk gives commercial fish farmers precise feeding schedules,
          treatment protocols, and growth forecasting — built around how
          Nigerian aquaculture actually operates.
        </p>

        <div className="mb-12 flex items-center justify-center gap-4">
          <a
            href="/dashboard"
            className="rounded-[4px] bg-[#0D7A5F] px-6 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#052E22]"
          >
            Start managing your farm →
          </a>
          <a
            href="#"
            className="text-sm text-[#0A0A0A] underline underline-offset-4 transition-colors duration-150 hover:text-[#737373]"
          >
            See how it works
          </a>
        </div>

        <div className="mb-0 flex items-center justify-center text-[13px] font-medium text-[#737373]">
          <span>500+ farms managed</span>
          <span className="mx-6 text-neutral-200">|</span>
          <span>12 species supported</span>
          <span className="mx-6 text-neutral-200">|</span>
          <span>Avg 23% feed savings</span>
        </div>
      </div>

      {/* Product visual — full dashboard preview */}
      <HeroProductVisual />
    </section>
  );
}
