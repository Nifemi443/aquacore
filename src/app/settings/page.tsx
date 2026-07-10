import type { Metadata } from "next";
import SettingsModule from "@/components/SettingsModule";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage(): React.JSX.Element {
  return <SettingsModule />;
}
