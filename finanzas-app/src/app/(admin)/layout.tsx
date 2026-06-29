import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((session?.user as any)?.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex min-h-screen" style={{ background: "#080b14" }}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
