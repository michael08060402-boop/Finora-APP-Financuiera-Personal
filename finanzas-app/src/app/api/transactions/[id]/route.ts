import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { date, description, amount, type, category } = await req.json();

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const existing = await prisma.transaction.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      date: new Date(date),
      description,
      amount: parseFloat(amount),
      type,
      category,
    },
  });

  await logActivity(user.id, "updated", "transaction", `Transacción editada: "${description}" · ${category}`);
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const existing = await prisma.transaction.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.transaction.delete({ where: { id } });
  await logActivity(user.id, "deleted", "transaction", `Transacción eliminada: "${existing.description}"`);
  return NextResponse.json({ ok: true });
}
