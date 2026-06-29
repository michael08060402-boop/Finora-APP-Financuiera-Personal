import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((session?.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const categories = await prisma.transaction.groupBy({
    by: ["category", "type"],
    _count: { id: true },
    _sum:   { amount: true },
    orderBy: { _count: { id: "desc" } },
  });

  // Merge by category name
  const map = new Map<string, { category: string; income: number; expense: number; incomeCount: number; expenseCount: number }>();
  for (const c of categories) {
    const prev = map.get(c.category) ?? { category: c.category, income: 0, expense: 0, incomeCount: 0, expenseCount: 0 };
    if (c.type === "income") {
      prev.income      += c._sum.amount ?? 0;
      prev.incomeCount += c._count.id;
    } else {
      prev.expense      += c._sum.amount ?? 0;
      prev.expenseCount += c._count.id;
    }
    map.set(c.category, prev);
  }

  const result = Array.from(map.values())
    .sort((a, b) => (b.incomeCount + b.expenseCount) - (a.incomeCount + a.expenseCount));

  return NextResponse.json(result);
}
