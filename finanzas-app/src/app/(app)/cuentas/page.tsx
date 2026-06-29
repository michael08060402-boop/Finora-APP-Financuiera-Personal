import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import CuentasClient from "@/components/CuentasClient";

export default async function CuentasPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <CuentasClient />;
}
