import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import SugerenciasClient from "@/components/SugerenciasClient";

export const metadata = { title: "Sugerencias — Finora" };

export default async function SugerenciasPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <SugerenciasClient />;
}
