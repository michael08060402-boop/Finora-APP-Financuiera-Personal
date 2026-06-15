import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

async function getUser(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const user = await getUser(session.user.email);
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const existing = await prisma.wallet.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const { name, type, balance, color } = await req.json();
  const updated = await prisma.wallet.update({
    where: { id },
    data: { name, type, balance: parseFloat(balance), color },
  });
  await logActivity(user.id, "updated", "wallet", `Cuenta editada: "${name}"`);
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const user = await getUser(session.user.email);
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const existing = await prisma.wallet.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  await prisma.wallet.delete({ where: { id } });
  await logActivity(user.id, "deleted", "wallet", `Cuenta eliminada: "${existing.name}"`);
  return NextResponse.json({ ok: true });
}
