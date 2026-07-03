import FeedingsModule from "@/components/FeedingsModule";

export const metadata = {
  title: "Today's Feedings · AquaCore",
  description: "Monitor, schedule and record every feeding activity across all ponds in real time.",
};

export default function FeedingsPage(): React.JSX.Element {
  return <FeedingsModule />;
}
