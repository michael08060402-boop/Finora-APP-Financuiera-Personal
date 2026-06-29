import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [topUsers, monthlyVolume, txByType] = await Promise.all([
    // Most active users
    prisma.user.findMany({
      select: {
        id: true, name: true, email: true, image: true, createdAt: true,
        _count: { select: { transactions: true, goals: true, budgets: true } },
      },
      orderBy: { transactions: { _count: "desc" } },
      take: 10,
    }),

    // Monthly income & expense (last 6 months)
    prisma.$queryRaw<{ month: string; income: number; expense: number }[]>`
      SELECT
        TO_CHAR(date, 'YYYY-MM') AS month,
        SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
      FROM "Transaction"
      WHERE date >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month ASC
    `,

    // Transactions by type
    prisma.transaction.groupBy({
      by: ["type"],
      _count: { id: true },
      _sum:   { amount: true },
    }),
  ]);

  return NextResponse.json({
    topUsers: topUsers.map(u => ({
      id:           u.id,
      name:         u.name,
      email:        u.email,
      image:        u.image,
      createdAt:    u.createdAt,
      transactions: u._count.transactions,
      goals:        u._count.goals,
      budgets:      u._count.budgets,
    })),
    monthlyVolume: monthlyVolume.map(m => ({
      month:   m.month,
      income:  Number(m.income),
      expense: Number(m.expense),
    })),
    txByType: txByType.map(t => ({
      type:   t.type,
      count:  t._count.id,
      amount: t._sum.amount ?? 0,
    })),
  });
}
