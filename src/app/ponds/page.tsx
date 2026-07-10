import type { Metadata } from "next";
import PondsModule from "@/components/PondsModule";

export const metadata: Metadata = {
  title: "Ponds",
};

export default function PondsPage(): React.JSX.Element {
  return <PondsModule />;
}
