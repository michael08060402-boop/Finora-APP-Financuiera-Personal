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
  const user = await getUser(session.user.email);
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.debt.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const newPaid = parseFloat(body.paid ?? existing.paid);
  const status = newPaid >= existing.amount ? "paid" : newPaid > 0 ? "partial" : "pending";

  const debt = await prisma.debt.update({
    where: { id },
    data: {
      personName:  body.personName  ?? existing.personName,
      amount:      body.amount !== undefined ? parseFloat(body.amount) : existing.amount,
      paid:        newPaid,
      description: body.description ?? existing.description,
      dueDate:     body.dueDate ? new Date(body.dueDate) : existing.dueDate,
      status,
    },
  });

  if (body.paid !== undefined && newPaid > (existing.paid ?? 0)) {
    const added = newPaid - (existing.paid ?? 0);
    await logActivity(user.id, "updated", "wallet", `Pago parcial de deuda con ${existing.personName}: S/. ${added.toFixed(2)}`);
  }

  return NextResponse.json(debt);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const user = await getUser(session.user.email);
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { id } = await params;
  const existing = await prisma.debt.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.debt.delete({ where: { id } });
  await logActivity(user.id, "deleted", "wallet", `Deuda eliminada con ${existing.personName}`);
  return NextResponse.json({ ok: true });
}
