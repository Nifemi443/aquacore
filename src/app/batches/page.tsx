import type { Metadata } from "next";
import FishBatchesModule from "@/components/FishBatchesModule";

export const metadata: Metadata = {
  title: "Fish Batches",
};

export default function BatchesPage(): React.JSX.Element {
  return <FishBatchesModule />;
}
