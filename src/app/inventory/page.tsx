import FeedInventoryModule from "@/components/FeedInventoryModule";

export const metadata = {
  title: "Feed Inventory · AquaCore",
  description: "Monitor feed stock, consumption, suppliers, costs, and replenishment across the entire farm.",
};

export default function InventoryPage(): React.JSX.Element {
  return <FeedInventoryModule />;
}
