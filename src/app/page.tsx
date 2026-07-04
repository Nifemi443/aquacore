import LandingAI from "@/components/landing/LandingAI";
import LandingAnalytics from "@/components/landing/LandingAnalytics";
import LandingBenefits from "@/components/landing/LandingBenefits";
import LandingCaseStudy from "@/components/landing/LandingCaseStudy";
import LandingFAQ from "@/components/landing/LandingFAQ";
import LandingFeatureGrid from "@/components/landing/LandingFeatureGrid";
import LandingFinalCTA from "@/components/landing/LandingFinalCTA";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingHero from "@/components/landing/LandingHero";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingMobile from "@/components/landing/LandingMobile";
import LandingNav from "@/components/landing/LandingNav";
import LandingProblem from "@/components/landing/LandingProblem";
import LandingProductShowcase from "@/components/landing/LandingProductShowcase";
import LandingSolution from "@/components/landing/LandingSolution";
import LandingTestimonials from "@/components/landing/LandingTestimonials";
import LandingTrustBar from "@/components/landing/LandingTrustBar";

export default function Home(): React.JSX.Element {
  return (
    <>
      <LandingNav />
      <main>
        <LandingHero />
        <LandingTrustBar />
        <LandingProblem />
        <LandingSolution />
        <LandingFeatureGrid />
        <LandingAI />
        <LandingProductShowcase />
        <LandingHowItWorks />
        <LandingBenefits />
        <LandingAnalytics />
        <LandingMobile />
        <LandingTestimonials />
        <LandingCaseStudy />
        <LandingFAQ />
        <LandingFinalCTA />
      </main>
      <LandingFooter />
    </>
  );
}
