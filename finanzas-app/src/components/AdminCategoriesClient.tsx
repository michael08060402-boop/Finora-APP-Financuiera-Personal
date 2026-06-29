"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

type Category = {
  category:     string;
  income:       number;
  expense:      number;
  incomeCount:  number;
  expenseCount: number;
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 0 }).format(n);
}

const COLORS = ["#10b981","#6366f1","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#f97316","#84cc16","#14b8a6"];

export default function AdminCategoriesClient() {
  const [cats,    setCats]    = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    fetch("/api/admin/categories")
      .then(r => r.json())
      .then(d => { setCats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = cats.filter(c => c.category.toLowerCase().includes(search.toLowerCase()));
  const chartData = cats.slice(0, 10).map((c, i) => ({
    name:    c.category,
    total:   c.incomeCount + c.expenseCount,
    color:   COLORS[i % COLORS.length],
  }));

  return (
    <div className="min-h-screen p-6" style={{ background: "#080b14" }}>
      <div className="mb-6">
        <h1 className="text-white font-bold text-2xl">Categorías globales</h1>
        <p className="text-slate-500 text-sm mt-0.5">Todas las categorías usadas en la plataforma</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={28} className="animate-spin text-red-400" />
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="rounded-2xl border border-white/5 p-5 mb-6" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-slate-300 font-semibold text-sm mb-4">Top 10 categorías por uso</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} width={100} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
                  formatter={(v) => [v as number, "transacciones"]}
                />
                <Bar dataKey="total" radius={[0,4,4,0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Search + table */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <p className="text-slate-500 text-sm">{cats.length} categorías encontradas</p>
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field px-4 py-2 rounded-xl text-white text-sm placeholder-slate-600 w-64"
            />
          </div>

          {/* MOBILE: cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filtered.length === 0 && <p className="text-center text-slate-600 text-sm py-10">Sin resultados</p>}
            {filtered.map((c, i) => (
              <div key={c.category} className="rounded-2xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-200 font-semibold">{c.category}</span>
                  <span className="ml-auto text-indigo-400 font-bold text-sm">{c.incomeCount + c.expenseCount} txs</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 px-3 py-2">
                    <p className="text-slate-500 mb-0.5">Ingresos</p>
                    <p className="text-emerald-400 font-medium">{c.incomeCount} txs · {fmt(c.income)}</p>
                  </div>
                  <div className="rounded-xl bg-red-500/5 border border-red-500/10 px-3 py-2">
                    <p className="text-slate-500 mb-0.5">Gastos</p>
                    <p className="text-red-400 font-medium">{c.expenseCount} txs · {fmt(c.expense)}</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center text-xs">
                  <span className="text-slate-500">Volumen total</span>
                  <span className="text-slate-200 font-semibold">{fmt(c.income + c.expense)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP: tabla */}
          <div className="hidden sm:block rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                  {["Categoría", "Ingresos", "Gastos", "Total transacciones", "Volumen total"].map(h => (
                    <th key={h} className="text-left text-slate-500 font-medium px-5 py-3 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.category} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-slate-200 font-medium">{c.category}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-emerald-400 text-xs">{c.incomeCount} txs · {fmt(c.income)}</td>
                    <td className="px-5 py-3 text-red-400 text-xs">{c.expenseCount} txs · {fmt(c.expense)}</td>
                    <td className="px-5 py-3"><span className="text-indigo-400 font-bold">{c.incomeCount + c.expenseCount}</span></td>
                    <td className="px-5 py-3 text-slate-300 font-medium">{fmt(c.income + c.expense)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center text-slate-600 text-sm py-10">Sin resultados</p>}
          </div>
        </>
      )}
    </div>
  );
}
