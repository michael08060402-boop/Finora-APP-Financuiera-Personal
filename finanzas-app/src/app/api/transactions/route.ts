import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(transactions);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  const { date, description, amount, type, category } = await req.json();

  if (!date || !description || !amount || !type || !category) {
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      date: new Date(date),
      description,
      amount: parseFloat(amount),
      type,
      category,
    },
  });

  const sign = type === "income" ? "+" : "-";
  await logActivity(user.id, "created", "transaction", `Nueva transacción: "${description}" ${sign}S/. ${parseFloat(amount).toFixed(2)} · ${category}`);
  return NextResponse.json(transaction, { status: 201 });
}

