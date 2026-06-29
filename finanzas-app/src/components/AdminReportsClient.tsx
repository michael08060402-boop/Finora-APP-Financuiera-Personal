"use client";

import { useEffect, useState } from "react";
import { Loader2, User, Download, FileText } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";

type Reports = {
  topUsers: { id: string; name: string | null; email: string; image: string | null; transactions: number; goals: number; budgets: number }[];
  monthlyVolume: { month: string; income: number; expense: number }[];
  txByType: { type: string; count: number; amount: number }[];
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 0 }).format(n);
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
      <p className="text-slate-300 font-semibold text-sm mb-4">{title}</p>
      {children}
    </div>
  );
}

export default function AdminReportsClient() {
  const [data,    setData]    = useState<Reports | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reports")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 size={28} className="animate-spin text-red-400" />
    </div>
  );
  if (!data) return null;

  const totalIncome  = data.txByType.find(t => t.type === "income")?.amount  ?? 0;
  const totalExpense = data.txByType.find(t => t.type === "expense")?.amount ?? 0;
  const totalTxs     = data.txByType.reduce((s, t) => s + t.count, 0);

  const exportCSV = (filename: string, rows: string[][], headers: string[]) => {
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a   = document.createElement("a");
    a.href    = "data:text/csv;charset=utf-8," + encodeURIComponent("﻿" + csv);
    a.download = filename;
    a.click();
  };

  const exportUsers = () => exportCSV(
    "usuarios_finora.csv",
    data.topUsers.map(u => [u.name ?? "", u.email, String(u.transactions), String(u.goals), String(u.budgets)]),
    ["Nombre", "Email", "Transacciones", "Metas", "Presupuestos"],
  );

  const exportVolume = () => exportCSV(
    "volumen_mensual_finora.csv",
    data.monthlyVolume.map(m => [m.month, String(m.income), String(m.expense), String(m.income - m.expense)]),
    ["Mes", "Ingresos", "Gastos", "Balance"],
  );

  const exportPDF = () => window.print();

  return (
    <div className="min-h-screen p-6" style={{ background: "#080b14" }}>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-white font-bold text-2xl">Reportes de uso</h1>
          <p className="text-slate-500 text-sm mt-0.5">Actividad y volumen de la plataforma</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportUsers}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/5 transition-all">
            <Download size={14} /> Exportar usuarios CSV
          </button>
          <button onClick={exportVolume}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-500/20 text-indigo-400 text-sm hover:bg-indigo-500/5 transition-all">
            <Download size={14} /> Exportar volumen CSV
          </button>
          <button onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5 transition-all">
            <FileText size={14} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total transacciones", value: totalTxs.toLocaleString(), color: "#6366f1" },
          { label: "Volumen ingresos",    value: fmt(totalIncome),          color: "#10b981" },
          { label: "Volumen gastos",      value: fmt(totalExpense),         color: "#ef4444" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-slate-500 text-xs mb-1">{label}</p>
            <p className="font-bold text-2xl" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Monthly volume chart */}
      <div className="mb-5">
        <ChartCard title="Volumen mensual — últimos 6 meses">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.monthlyVolume}>
              <defs>
                <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
                formatter={(v, name) => [fmt(v as number), String(name)]}
              />
              <Area type="monotone" dataKey="income"  name="Ingresos" stroke="#10b981" fill="url(#gIncome)"  strokeWidth={2} />
              <Area type="monotone" dataKey="expense" name="Gastos"   stroke="#ef4444" fill="url(#gExpense)" strokeWidth={2} />
              <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Transactions by type */}
      <div className="mb-6">
        <ChartCard title="Transacciones por tipo">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.txByType} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis type="category" dataKey="type" tick={{ fill: "#64748b", fontSize: 11 }}
                tickFormatter={v => v === "income" ? "Ingresos" : "Gastos"} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
                formatter={(v) => [v as number, "transacciones"]}
              />
              <Bar dataKey="count" radius={[0,4,4,0]}
                fill="#6366f1"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top users */}
      <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="px-5 py-4 border-b border-white/5">
          <p className="text-white font-semibold text-sm">Usuarios más activos</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
              {["#", "Usuario", "Transacciones", "Metas", "Presupuestos"].map(h => (
                <th key={h} className="text-left text-slate-500 font-medium px-5 py-3 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.topUsers.map((u, i) => (
              <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                <td className="px-5 py-3 text-slate-600 text-xs font-bold">{i + 1}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <User size={13} className="text-slate-500" />
                      {u.image && (
                        <img
                          src={u.image}
                          className="absolute inset-0 w-8 h-8 object-cover"
                          alt=""
                          referrerPolicy="no-referrer"
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-slate-200 font-medium text-sm">{u.name ?? "Sin nombre"}</p>
                      <p className="text-slate-500 text-xs">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="text-indigo-400 font-bold">{u.transactions}</span>
                </td>
                <td className="px-5 py-3 text-slate-400">{u.goals}</td>
                <td className="px-5 py-3 text-slate-400">{u.budgets}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
