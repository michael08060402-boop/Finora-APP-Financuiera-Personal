import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080b14" }}>
      <AppShell user={user}>
        {children}
      </AppShell>
    </div>
  );
}

