import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import PresupuestosClient from "@/components/PresupuestosClient";

export const metadata = { title: "Presupuestos  - Finora" };

export default async function PresupuestosPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <PresupuestosClient />;
}

