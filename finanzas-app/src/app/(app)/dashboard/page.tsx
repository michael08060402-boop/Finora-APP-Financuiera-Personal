import { auth } from "../../../../auth";
import { prisma } from "@/lib/prisma";
import { LineChartComponent, DonutChart } from "@/components/DashboardCharts";
import DashboardStats from "@/components/DashboardStats";
import ScoreWidget from "@/components/ScoreWidget";
import BudgetAlertsBanner from "@/components/BudgetAlertsBanner";
import ChartTitle from "@/components/ChartTitle";

export const metadata = { title: "Dashboard  - Finora" };

export default async function DashboardPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({ where: { email: session!.user!.email! } });

  const all = user ? await prisma.transaction.findMany({ where: { userId: user.id }, orderBy: { date: "asc" } }) : [];
  const recent = [...all].reverse().slice(0, 5);

  const totalIncome  = all.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = all.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance      = totalIncome - totalExpense;

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const m = d.getMonth();
    const y = d.getFullYear();
    const label = d.toLocaleDateString("es-PE", { month: "short" });
    const month_txs = all.filter(t => { const td = new Date(t.date); return td.getMonth() === m && td.getFullYear() === y; });
    return {
      month: label,
      ingresos: month_txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
      gastos:   month_txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });

  const now = new Date();
  const thisMonth = all.filter(t => {
    const td = new Date(t.date);
    return t.type === "expense" && td.getMonth() === now.getMonth() && td.getFullYear() === now.getFullYear();
  });
  const categoryMap: Record<string, number> = {};
  thisMonth.forEach(t => { categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.amount; });
  const donutData = Object.entries(categoryMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const greeting = user?.name?.split(" ")[0] ?? session?.user?.name?.split(" ")[0] ?? "";

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
      <BudgetAlertsBanner />
      <DashboardStats
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        balance={balance}
        recent={recent}
        greeting={greeting}
      />

      {/* Charts + Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
          <ChartTitle tkey="dash_income_vs_expense" />
          <LineChartComponent data={monthlyData} />
        </div>
        <ScoreWidget />
      </div>

      <div className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
        <ChartTitle tkey="dash_expense_by_cat" />
        <DonutChart data={donutData} />
      </div>
    </div>
  );
}

