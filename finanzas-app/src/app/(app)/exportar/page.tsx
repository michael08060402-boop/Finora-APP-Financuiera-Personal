import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import ExportarClient from "@/components/ExportarClient";

export default async function ExportarPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <ExportarClient />;
}

