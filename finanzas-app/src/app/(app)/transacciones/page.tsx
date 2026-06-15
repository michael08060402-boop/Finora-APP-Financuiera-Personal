import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import TransaccionesClient from "@/components/TransaccionesClient";

export const metadata = { title: "Transacciones  - Finora" };

export default async function TransaccionesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <TransaccionesClient />;
}

