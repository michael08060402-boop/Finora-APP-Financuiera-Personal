import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import HistorialClient from "@/components/HistorialClient";

export default async function HistorialPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <HistorialClient />;
}

