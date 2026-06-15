import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import PerfilClient from "@/components/PerfilClient";

export const metadata = { title: "Mi Perfil  - Finora" };

export default async function PerfilPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <PerfilClient user={{ name: session.user?.name ?? "", email: session.user?.email ?? "", image: session.user?.image ?? "" }} />;
}

