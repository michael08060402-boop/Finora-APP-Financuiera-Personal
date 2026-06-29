"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, ArrowLeftRight, Wallet, Target, PiggyBank, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

type Stats = {
  totalUsers: number;
  totalTransactions: number;
  totalWallets: number;
  totalGoals: number;
  totalBudgets: number;
  totalIncome: number;
  totalExpense: number;
  recentUsers: { id: string; name: string | null; email: string; createdAt: string; role: string }[];
  usersPerDay:    { day: string; count: number }[];
  txPerDay:       { day: string; count: number }[];
  incomeVsExpense:{ day: string; income: number; expense: number }[];
  userGrowth:     { month: string; total: number; new: number }[];
  activeUsersPerMonth: { month: string; active: number }[];
  topCategories:  { category: string; count: number; total: number }[];
};

const COLORS = ["#10b981","#6366f1","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#f97316"];

function fmt(n: number) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 0 }).format(n);
}

function fmtDay(d: string) {
  return new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
      <p className="text-slate-300 font-semibold text-sm mb-4">{title}</p>
      {children}
    </div>
  );
}

export default function AdminDashboardClient() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 size={28} className="animate-spin text-red-400" />
    </div>
  );
  if (!stats) return null;

  const STAT_CARDS = [
    { label: "Usuarios",       value: stats.totalUsers,        icon: Users,          color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
    { label: "Transacciones",  value: stats.totalTransactions, icon: ArrowLeftRight, color: "#6366f1", bg: "rgba(99,102,241,0.1)"  },
    { label: "Cuentas",        value: stats.totalWallets,      icon: Wallet,         color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
    { label: "Metas",          value: stats.totalGoals,        icon: Target,         color: "#ec4899", bg: "rgba(236,72,153,0.1)"  },
    { label: "Presupuestos",   value: stats.totalBudgets,      icon: PiggyBank,      color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  ];

  return (
    <div className="min-h-screen p-6" style={{ background: "#080b14" }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white font-bold text-2xl">Panel de administración</h1>
        <p className="text-slate-500 text-sm mt-0.5">Métricas globales de la plataforma Finora</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon size={16} style={{ color }} />
            </div>
            <p className="text-slate-500 text-xs">{label}</p>
            <p className="text-white font-bold text-2xl mt-0.5">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Income / Expense totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-emerald-500/15 p-5" style={{ background: "rgba(16,185,129,0.04)" }}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-emerald-400" />
            <p className="text-slate-400 text-xs">Ingresos totales</p>
          </div>
          <p className="text-emerald-400 font-bold text-2xl">{fmt(stats.totalIncome)}</p>
        </div>
        <div className="rounded-2xl border border-red-500/15 p-5" style={{ background: "rgba(239,68,68,0.04)" }}>
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={14} className="text-red-400" />
            <p className="text-slate-400 text-xs">Gastos totales</p>
          </div>
          <p className="text-red-400 font-bold text-2xl">{fmt(stats.totalExpense)}</p>
        </div>
        <div className="rounded-2xl border border-indigo-500/15 p-5" style={{ background: "rgba(99,102,241,0.04)" }}>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} className="text-indigo-400" />
            <p className="text-slate-400 text-xs">Balance neto</p>
          </div>
          <p className={`font-bold text-2xl ${stats.totalIncome - stats.totalExpense >= 0 ? "text-indigo-400" : "text-red-400"}`}>
            {fmt(stats.totalIncome - stats.totalExpense)}
          </p>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Nuevos usuarios — últimos 30 días">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.usersPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(v) => [v as number, "usuarios"]}
                labelFormatter={(d) => fmtDay(String(d))}
              />
              <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Transacciones diarias — últimos 30 días">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.txPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(v) => [v as number, "transacciones"]}
                labelFormatter={(d) => fmtDay(String(d))}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
        <ChartCard title="Ingresos vs Gastos — últimos 7 días">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.incomeVsExpense}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
                labelStyle={{ color: "#94a3b8" }}
                labelFormatter={(d) => fmtDay(String(d))}
              />
              <Bar dataKey="income"  name="Ingresos" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="expense" name="Gastos"   fill="#ef4444" radius={[4,4,0,0]} />
              <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top categorías de gasto">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stats.topCategories} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={75} paddingAngle={2}>
                {stats.topCategories.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
                formatter={(v, _name, entry) => [(v as number) + " transacciones", (entry as { payload: { category: string } }).payload.category]}
              />
              <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 11 }} formatter={(v) => v} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 3 — Growth */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
        <ChartCard title="Crecimiento acumulado de usuarios — últimos 6 meses">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
                formatter={(v, name) => [v as number, name === "total" ? "Total usuarios" : "Nuevos"]}
              />
              <Line type="monotone" dataKey="total" name="total" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444", r: 4 }} />
              <Line type="monotone" dataKey="new"   name="new"   stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 3 }} strokeDasharray="4 2" />
              <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} formatter={v => v === "total" ? "Total acumulado" : "Nuevos registros"} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Usuarios activos por mes — últimos 6 meses">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.activeUsersPerMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
                formatter={(v) => [v as number, "usuarios activos"]}
              />
              <Bar dataKey="active" name="Activos" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent users table */}
      <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="px-5 py-4 border-b border-white/5">
          <p className="text-white font-semibold text-sm">Usuarios recientes</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
              {["Nombre", "Email", "Rol", "Registro"].map(h => (
                <th key={h} className="text-left text-slate-500 font-medium px-5 py-3 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.recentUsers.map(u => (
              <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                <td className="px-5 py-3 text-slate-200">{u.name ?? "—"}</td>
                <td className="px-5 py-3 text-slate-400">{u.email}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${u.role === "admin" ? "bg-red-500/15 text-red-400" : "bg-white/5 text-slate-400"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500 text-xs">
                  {new Date(u.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
