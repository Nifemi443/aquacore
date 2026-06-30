import AIFarmAssistant from "@/components/AIFarmAssistant";
import FeedingTracker from "@/components/FeedingTracker";
import Footer from "@/components/Footer";
import GrowthAnalytics from "@/components/GrowthAnalytics";
import Hero from "@/components/Hero";
import LiveDashboard from "@/components/LiveDashboard";
import MobilePreview from "@/components/MobilePreview";
import Nav from "@/components/Nav";
import WaterQualityMonitoring from "@/components/WaterQualityMonitoring";

export default function Home(): React.JSX.Element {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <FeedingTracker />
        <WaterQualityMonitoring />
        <GrowthAnalytics />
        <AIFarmAssistant />
        <MobilePreview />
        <LiveDashboard />
      </main>
      <Footer />
    </>
  );
}
