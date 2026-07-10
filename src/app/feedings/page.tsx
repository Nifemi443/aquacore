import type { Metadata } from "next";
import FeedingsModule from "@/components/FeedingsModule";

export const metadata: Metadata = {
  title: "Today's Feedings",
};

export default function FeedingsPage(): React.JSX.Element {
  return <FeedingsModule />;
}
