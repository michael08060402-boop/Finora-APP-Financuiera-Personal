import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PerfilClient from "@/components/PerfilClient";

export const metadata = { title: "Mi Perfil - Finora" };

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { name: true, email: true, image: true },
  });

  return (
    <PerfilClient
      user={{
        name: dbUser?.name ?? session.user?.name ?? "",
        email: dbUser?.email ?? session.user?.email ?? "",
        image: dbUser?.image ?? session.user?.image ?? "",
      }}
    />
  );
}

