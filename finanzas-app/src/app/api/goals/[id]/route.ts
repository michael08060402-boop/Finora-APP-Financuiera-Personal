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
  const existing = await prisma.goal.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const { name, description, targetAmount, currentAmount, deadline, color } = await req.json();
  const updated = await prisma.goal.update({
    where: { id },
    data: { name, description, targetAmount: parseFloat(targetAmount), currentAmount: parseFloat(currentAmount ?? existing.currentAmount), deadline: deadline ? new Date(deadline) : null, color },
  });
  const prev = existing.currentAmount;
  const next = parseFloat(currentAmount ?? existing.currentAmount);
  const desc = next !== prev
    ? `Ahorro agregado a "${name}": S/. ${(next - prev).toFixed(2)} (total S/. ${next.toFixed(2)})`
    : `Meta editada: "${name}"`;
  await logActivity(user.id, "updated", "goal", desc);
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const user = await getUser(session.user.email);
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const existing = await prisma.goal.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  await prisma.goal.delete({ where: { id } });
  await logActivity(user.id, "deleted", "goal", `Meta eliminada: "${existing.name}"`);
  return NextResponse.json({ ok: true });
}
