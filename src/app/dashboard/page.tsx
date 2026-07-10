import type { Metadata } from "next";
import DashboardApp from "@/components/DashboardApp";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage(): React.JSX.Element {
  return <DashboardApp />;
}
