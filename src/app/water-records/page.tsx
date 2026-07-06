import { redirect } from "next/navigation";

// Water Records is kept in the codebase but hidden from public navigation.
export default function WaterRecordsPage(): never {
  redirect("/dashboard");
}
