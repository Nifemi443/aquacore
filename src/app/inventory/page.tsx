import type { Metadata } from "next";
import FeedInventoryModule from "@/components/FeedInventoryModule";

export const metadata: Metadata = {
  title: "Feed Inventory",
};

export default function InventoryPage(): React.JSX.Element {
  return <FeedInventoryModule />;
}
