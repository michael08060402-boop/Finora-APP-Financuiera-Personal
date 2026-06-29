import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const [
    totalUsers,
    totalTransactions,
    totalWallets,
    totalGoals,
    totalBudgets,
    incomeAgg,
    expenseAgg,
    recentUsers,
    allUsers,
    recentTransactions,
    topCategories,
    allUsersForGrowth,
    activeUsersRaw,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.transaction.count(),
    prisma.wallet.count(),
    prisma.goal.count(),
    prisma.budget.count(),
    prisma.transaction.aggregate({ where: { type: "income"  }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "expense" }, _sum: { amount: true } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true, role: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.transaction.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, type: true, amount: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.transaction.groupBy({
      by: ["category"],
      _count: { id: true },
      _sum: { amount: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),
    // All users for cumulative growth
    prisma.user.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    // Active users per month (users who had transactions)
    prisma.$queryRaw<{ month: string; active: bigint }[]>`
      SELECT TO_CHAR(date, 'YYYY-MM') AS month, COUNT(DISTINCT "userId") AS active
      FROM "Transaction"
      WHERE date >= ${sixMonthsAgo}
      GROUP BY month ORDER BY month ASC
    `,
  ]);

  // Group users by day
  const usersPerDay = groupByDay(allUsers.map(u => u.createdAt));

  // Group transactions by day
  const txPerDay = groupByDay(recentTransactions.map(t => t.createdAt));

  // Last 7 days income vs expense
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const incomeVsExpense = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const dayTxs = recentTransactions.filter(t => t.createdAt.toISOString().slice(0, 10) === key);
    return {
      day: key,
      income:  dayTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: dayTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });

  // Cumulative user growth by month (last 6 months)
  const growthMap = new Map<string, number>();
  allUsersForGrowth.forEach(u => {
    const month = u.createdAt.toISOString().slice(0, 7);
    growthMap.set(month, (growthMap.get(month) ?? 0) + 1);
  });
  const months6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(sixMonthsAgo);
    d.setMonth(d.getMonth() + i);
    return d.toISOString().slice(0, 7);
  });
  let cumulative = allUsersForGrowth.filter(u => u.createdAt < sixMonthsAgo).length;
  const userGrowth = months6.map(m => {
    cumulative += growthMap.get(m) ?? 0;
    return { month: m, total: cumulative, new: growthMap.get(m) ?? 0 };
  });

  return NextResponse.json({
    totalUsers,
    totalTransactions,
    totalWallets,
    totalGoals,
    totalBudgets,
    totalIncome:  incomeAgg._sum.amount  ?? 0,
    totalExpense: expenseAgg._sum.amount ?? 0,
    recentUsers,
    usersPerDay,
    txPerDay,
    incomeVsExpense,
    userGrowth,
    activeUsersPerMonth: activeUsersRaw.map(r => ({ month: r.month, active: Number(r.active) })),
    topCategories: topCategories.map(c => ({
      category: c.category,
      count:    c._count.id,
      total:    c._sum.amount ?? 0,
    })),
  });
}

function groupByDay(dates: Date[]): { day: string; count: number }[] {
  const map = new Map<string, number>();
  dates.forEach(d => {
    const key = d.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }));
}
