import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

async function getUser(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const user = await getUser(session.user.email);
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
  const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));
  const budgets = await prisma.budget.findMany({ where: { userId: user.id, month, year } });
  return NextResponse.json(budgets);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const user = await getUser(session.user.email);
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const { category, amount, month, year } = await req.json();
  const budget = await prisma.budget.upsert({
    where: { userId_category_month_year: { userId: user.id, category, month, year } },
    update: { amount: parseFloat(amount) },
    create: { userId: user.id, category, amount: parseFloat(amount), month, year },
  });
  await logActivity(user.id, "created", "budget", `Presupuesto creado: ${category}  - S/. ${parseFloat(amount).toFixed(2)}`);
  return NextResponse.json(budget, { status: 201 });
}

