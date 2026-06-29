import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import BuscarPageClient from "@/components/BuscarPageClient";

export default async function BuscarPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <BuscarPageClient />;
}

