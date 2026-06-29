import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const existing = await prisma.budget.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  await prisma.budget.delete({ where: { id } });
  await logActivity(user.id, "deleted", "budget", `Presupuesto eliminado: ${existing.category}`);
  return NextResponse.json({ ok: true });
}
