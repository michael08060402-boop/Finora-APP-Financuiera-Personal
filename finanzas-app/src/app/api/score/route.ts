import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const [transactions, budgets, goals] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: startOfMonth, lte: endOfMonth } },
    }),
    prisma.budget.findMany({ where: { userId: user.id, month, year } }),
    prisma.goal.findMany({ where: { userId: user.id } }),
  ]);

  const income  = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // Component 1: Savings rate (40 pts)
  // If income=0, score is 0. If saves >= 20% of income, full 40 pts.
  let savingsScore = 0;
  if (income > 0) {
    const savingsRate = Math.max(0, (income - expense) / income); // 0..1
    savingsScore = Math.min(40, Math.round(savingsRate * 200)); // 20% savings = 40pts
  }

  // Component 2: Budget adherence (40 pts)
  // Each budget not exceeded = ok. Score = (ok_budgets / total_budgets) * 40
  let budgetScore = 40; // default full if no budgets set
  if (budgets.length > 0) {
    const spendMap: Record<string, number> = {};
    transactions.filter(t => t.type === "expense").forEach(t => {
      spendMap[t.category] = (spendMap[t.category] ?? 0) + t.amount;
    });
    const okCount = budgets.filter(b => (spendMap[b.category] ?? 0) <= b.amount).length;
    budgetScore = Math.round((okCount / budgets.length) * 40);
  }

  // Component 3: Goal progress (20 pts)
  // Average % of all active goals, capped at 20 pts
  let goalScore = 0;
  if (goals.length > 0) {
    const avgProgress = goals.reduce((s, g) => s + Math.min(g.currentAmount / g.targetAmount, 1), 0) / goals.length;
    goalScore = Math.round(avgProgress * 20);
  }

  const total = savingsScore + budgetScore + goalScore;

  return NextResponse.json({
    total,
    savingsScore,
    budgetScore,
    goalScore,
    income,
    expense,
    budgetCount: budgets.length,
    goalCount: goals.length,
    month,
    year,
  });
}

