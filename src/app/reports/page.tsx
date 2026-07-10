import type { Metadata } from "next";
import ReportsModule from "@/components/ReportsModule";

export const metadata: Metadata = {
  title: "Reports",
};

export default function ReportsPage(): React.JSX.Element {
  return <ReportsModule />;
}
