import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ transactions: [], goals: [], wallets: [], budgets: [] });

  const [transactions, goals, wallets, budgets] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        OR: [
          { description: { contains: q, mode: "insensitive" } },
          { category:    { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { date: "desc" },
      take: 6,
    }),
    prisma.goal.findMany({
      where: {
        userId: user.id,
        OR: [
          { name:        { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 4,
    }),
    prisma.wallet.findMany({
      where: {
        userId: user.id,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { type: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 4,
    }),
    prisma.budget.findMany({
      where: {
        userId: user.id,
        category: { contains: q, mode: "insensitive" },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 4,
    }),
  ]);

  return NextResponse.json({ transactions, goals, wallets, budgets });
}

