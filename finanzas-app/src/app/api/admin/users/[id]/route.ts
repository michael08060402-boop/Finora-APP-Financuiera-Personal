import { NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

async function guardAdmin() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((session?.user as any)?.role !== "admin") return null;
  return session;
}

export async function GET(_req: Request, { params }: Ctx) {
  const session = await guardAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, image: true,
      role: true, isActive: true, createdAt: true,
      _count: { select: { transactions: true, wallets: true, goals: true, budgets: true, debts: true } },
      transactions: { orderBy: { date: "desc" }, take: 10,
        select: { id: true, description: true, amount: true, type: true, category: true, date: true } },
      wallets: { select: { id: true, name: true, type: true, balance: true, color: true } },
      goals:   { select: { id: true, name: true, targetAmount: true, currentAmount: true, color: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await guardAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body: { role?: string; isActive?: boolean } = await req.json();

  const selfEmail = session.user?.email;
  const self = await prisma.user.findUnique({ where: { email: selfEmail! }, select: { id: true } });
  if (self?.id === id && body.role !== undefined) {
    return NextResponse.json({ error: "No puedes cambiar tu propio rol" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(body.role     !== undefined && { role:     body.role     }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
    select: { id: true, role: true, isActive: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await guardAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const self = await prisma.user.findUnique({ where: { email: session!.user!.email! }, select: { id: true } });
  if (self?.id === id) {
    return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
