"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Loader2, X, ChevronLeft, ChevronRight, Info, AlertTriangle, AlertOctagon } from "lucide-react";
import clsx from "clsx";
import { useConfig } from "./ConfigProvider";

const EXPENSE_CATEGORIES = ["Alimentación","Transporte","Vivienda","Salud","Entretenimiento","Educación","Ropa","Tecnología","Otro"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

type Budget = { id: string; category: string; amount: number; month: number; year: number };
type SpendMap = Record<string, number>;
type CountMap = Record<string, number>;

export default function PresupuestosClient() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spending, setSpending] = useState<SpendMap>({});
  const [txCounts, setTxCounts] = useState<CountMap>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "", amount: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [bRes, tRes] = await Promise.all([
      fetch(`/api/budgets?month=${month}&year=${year}`),
      fetch(`/api/transactions`),
    ]);
    const b: Budget[] = await bRes.json();
    const transactions: { type: string; category: string; amount: number; date: string }[] = await tRes.json();
    setBudgets(b);
    const map: SpendMap = {};
    const counts: CountMap = {};
    transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === "expense" && d.getMonth() + 1 === month && d.getFullYear() === year;
    }).forEach(t => {
      map[t.category] = (map[t.category] ?? 0) + t.amount;
      counts[t.category] = (counts[t.category] ?? 0) + 1;
    });
    setSpending(map);
    setTxCounts(counts);
    setLoading(false);
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const changeMonth = (dir: number) => {
    let m = month + dir; let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault(); setSaving(true);
    await fetch("/api/budgets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, month, year }),
    });
    await load(); setSaving(false); setShowForm(false); setForm({ category: "", amount: "" });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    await load(); setDeletingId(null);
  };

  const { formatAmount: fmt, t } = useConfig();
  const usedCategories = budgets.map(b => b.category);

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (spending[b.category] ?? 0), 0);
  const totalAvailable = totalBudget - totalSpent;
  const overallPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  return (
    <div className="flex-1 min-h-screen" style={{ background: "#080b14" }}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-white/5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <h1 className="text-white font-bold text-xl sm:text-2xl">{t("bud_title")}</h1>
              <p className="text-slate-500 text-sm mt-0.5 hidden sm:block">{t("bud_subtitle")}</p>
            </div>
            <button onClick={() => setShowInfo(!showInfo)} className="text-slate-600 hover:text-slate-400 ml-1 mt-0.5 flex-shrink-0">
              <Info size={15} />
            </button>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-white text-sm font-semibold flex-shrink-0">
            <Plus size={16} /> <span className="hidden sm:inline">{t("bud_new")}</span>
          </button>
        </div>

        {/* Tooltip explicación */}
        <AnimatePresence>
          {showInfo && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 text-sm text-slate-400 leading-relaxed">
              <span className="text-indigo-400 font-medium">¿Cómo funciona?</span> Defines un límite máximo de gasto por categoría.
              Cada vez que registras un <span className="text-white">gasto</span> en Transacciones, se cuenta automáticamente aquí.
              Por ejemplo: límite S/. 300 en Alimentación 
            </motion.div>
          )}
        </AnimatePresence>

        {/* Month navigator */}
        <div className="flex items-center gap-3 mt-4">
          <button onClick={() => changeMonth(-1)} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
            <ChevronLeft size={18} />
          </button>
          <span className="text-white font-semibold min-w-[150px] text-center">{MONTHS[month - 1]} {year}</span>
          <button onClick={() => changeMonth(1)} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-emerald-500" /></div>
        ) : (
          <>
            {/* */}
            {!loading && budgets.length > 0 && (() => {
              const exceeded = budgets.filter(b => (spending[b.category] ?? 0) > b.amount);
              const warning  = budgets.filter(b => {
                const pct = ((spending[b.category] ?? 0) / b.amount) * 100;
                return pct >= 80 && pct <= 100;
              });
              return (
                <AnimatePresence>
                  {exceeded.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mb-4 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 flex items-start gap-3">
                      <AlertOctagon size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-300 text-sm font-semibold">Presupuesto excedido</p>
                        <p className="text-red-400/70 text-xs mt-0.5">
                          {exceeded.map(b => b.category).join(", ")}  - ya superaste el límite establecido.
                        </p>
                      </div>
                    </motion.div>
                  )}
                  {warning.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 flex items-start gap-3">
                      <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-300 text-sm font-semibold">Cerca del límite</p>
                        <p className="text-amber-400/70 text-xs mt-0.5">
                          {warning.map(b => {
                            const pct = Math.round(((spending[b.category] ?? 0) / b.amount) * 100);
                            return `${b.category} (${pct}%)`;
                          }).join(", ")}  - estás cerca de tu límite mensual.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              );
            })()}

            {/* Summary row */}
            {budgets.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {[
                  { label: t("bud_total"),     value: fmt(totalBudget), color: "#6366f1", sub: "límite del mes" },
                  { label: t("bud_spent"),     value: fmt(totalSpent), color: overallPct >= 90 ? "#ef4444" : "#f59e0b", sub: `${overallPct.toFixed(0)}% usado` },
                  { label: t("bud_available"), value: fmt(Math.max(totalAvailable, 0)), color: "#10b981", sub: totalAvailable < 0 ? "Excedido" : "Disponible" },
                ].map(({ label, value, color, sub }) => (
                  <div key={label} className="rounded-2xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <p className="text-slate-500 text-xs mb-1">{label}</p>
                    <p className="font-bold text-lg" style={{ color }}>{value}</p>
                    <p className="text-slate-600 text-xs mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            )}

            {budgets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4 text-2xl">💸</div>
                <p className="text-slate-400 font-medium">Sin presupuestos para {MONTHS[month - 1]}</p>
                <p className="text-slate-600 text-sm mt-1 max-w-xs">
                  Agrega un límite de gasto. Por ejemplo: S/. 300 para Alimentación, S/. 100 para Transporte.
                </p>
                <button onClick={() => setShowForm(true)} className="mt-4 btn-primary px-4 py-2 rounded-xl text-white text-sm">
                  Agregar mi primer presupuesto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgets.map((b, i) => {
                  const spent = spending[b.category] ?? 0;
                  const available = b.amount - spent;
                  const pct = Math.min((spent / b.amount) * 100, 100);
                  const over = spent > b.amount;
                  const warn = !over && pct > 80;
                  const barColor = over ? "#ef4444" : warn ? "#f59e0b" : "#10b981";
                  const count = txCounts[b.category] ?? 0;

                  return (
                    <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: over ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)" }}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-white font-semibold">{b.category}</p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            Límite: {fmt(b.amount)} · <span className="text-slate-600">{count === 0 ? "sin gastos aún" : `${count} gasto${count > 1 ? "s" : ""} registrado${count > 1 ? "s" : ""}`}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-lg",
                            over ? "bg-red-500/10 text-red-400" : warn ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400")}>
                            {pct.toFixed(0)}%
                          </span>
                          <button onClick={() => handleDelete(b.id)} disabled={deletingId === b.id}
                            className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10">
                            {deletingId === b.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          </button>
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden mb-3">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: i * 0.05 + 0.2 }}
                          className="h-full rounded-full" style={{ background: barColor }} />
                      </div>

                      {/* Detalle debajo */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">Gastado:</span>
                          <span className="text-white font-medium">{fmt(spent)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {over ? (
                            <span className="text-red-400 font-medium">Excedido</span>
                          ) : (
                            <>
                              <span className="text-slate-500">Queda:</span>
                              <span className="font-medium" style={{ color: barColor }}>{fmt(available)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-white font-bold text-lg">Nuevo límite de gasto</h2>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
              </div>
              <p className="text-slate-500 text-xs mb-5">Define cuánto máximo quieres gastar en esta categoría durante {MONTHS[month - 1]}.</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-sm font-medium">Categoría</label>
                  <select required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="select-field w-full rounded-xl px-4 py-3 text-sm">
                    <option value="">Selecciona una categoría</option>
                    {EXPENSE_CATEGORIES.filter(c => !usedCategories.includes(c)).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {EXPENSE_CATEGORIES.filter(c => !usedCategories.includes(c)).length === 0 && (
                    <p className="text-amber-400 text-xs">Ya tienes límites para todas las categorías este mes.</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-sm font-medium">Límite máximo (S/.)</label>
                  <input type="number" required min="1" step="0.01" placeholder="Ej: 300.00" value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="input-field w-full rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600" />
                  <p className="text-slate-600 text-xs">Si gastas más de este monto, la barra se pondrá roja.</p>
                </div>
                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 text-sm font-medium hover:bg-white/10 transition-all">Cancelar</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1 py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : "Crear límite"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

