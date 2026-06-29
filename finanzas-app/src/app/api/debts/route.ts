import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

async function getUser(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const user = await getUser(session.user.email);
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const debts = await prisma.debt.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(debts);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const user = await getUser(session.user.email);
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { personName, amount, description, type, dueDate } = await req.json();
  const debt = await prisma.debt.create({
    data: {
      userId: user.id,
      personName,
      amount: parseFloat(amount),
      description: description || null,
      type,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
  const label = type === "i_owe" ? `Le debes a ${personName}` : `${personName} te debe`;
  await logActivity(user.id, "created", "wallet", `Deuda registrada: ${label}  - S/. ${parseFloat(amount).toFixed(2)}`);
  return NextResponse.json(debt, { status: 201 });
}

