import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import ConfiguracionClient from "@/components/ConfiguracionClient";

export const metadata = { title: "Configuración  - Finora" };

export default async function ConfiguracionPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <ConfiguracionClient />;
}

