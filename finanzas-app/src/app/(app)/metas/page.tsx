import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import MetasClient from "@/components/MetasClient";

export const metadata = { title: "Metas  - Finora" };

export default async function MetasPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <MetasClient />;
}

