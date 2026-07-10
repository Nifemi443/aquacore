import type { Metadata } from "next";
import HarvestModule from "@/components/HarvestModule";

export const metadata: Metadata = {
  title: "Harvest",
};

export default function HarvestPage(): React.JSX.Element {
  return <HarvestModule />;
}
