import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  // Fetch DB user only for name/image — session JWT may be stale after profile update
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { name: true, image: true },
  });

  const user = {
    name: dbUser?.name ?? session.user.name,
    email: session.user.email,
    image: dbUser?.image ?? session.user.image,
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080b14" }}>
      <AppShell user={user}>
        {children}
      </AppShell>
    </div>
  );
}
