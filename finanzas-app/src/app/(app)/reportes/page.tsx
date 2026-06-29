import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import ReportesClient from "@/components/ReportesClient";

export default async function ReportesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <ReportesClient />;
}

