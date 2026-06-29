"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Loader2, TrendingUp, TrendingDown, Search, Filter } from "lucide-react";
import clsx from "clsx";
import { useConfig } from "./ConfigProvider";

type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  category: string;
};

const CATEGORIES = {
  income: ["Salario", "Freelance", "Inversiones", "Regalo", "Otro"],
  expense: ["Alimentación", "Transporte", "Vivienda", "Salud", "Entretenimiento", "Educación", "Ropa", "Tecnología", "Otro"],
};

const empty = { date: "", description: "", amount: "", type: "expense", category: "" };

export default function TransaccionesClient() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [error, setError] = useState("");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/transactions");
    const data = await res.json();
    setTransactions(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty, date: new Date().toISOString().split("T")[0] });
    setError("");
    setShowForm(true);
  };

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setForm({
      date: t.date.split("T")[0],
      description: t.description,
      amount: String(t.amount),
      type: t.type,
      category: t.category,
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/transactions/${editing.id}` : "/api/transactions";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Error al guardar");
      setSaving(false);
      return;
    }

    await fetchTransactions();
    setSaving(false);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    await fetchTransactions();
    setDeletingId(null);
  };

  const filtered = transactions.filter((t) => {
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || t.type === filterType;
    return matchSearch && matchType;
  });

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const { formatAmount: fmt, t } = useConfig();
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });

  const categories = CATEGORIES[form.type as "income" | "expense"];

  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ background: "#080b14" }}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-white/5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-white font-bold text-xl sm:text-2xl">{t("tx_title")}</h1>
            <p className="text-slate-500 text-sm mt-0.5 hidden sm:block">{t("tx_subtitle")}</p>
          </div>
          <button
            onClick={openCreate}
            className="btn-primary flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-white text-sm font-semibold flex-shrink-0"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{t("tx_new")}</span>
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4">
          {[
            { label: t("tx_balance"),         value: balance,       color: balance >= 0 ? "text-emerald-400" : "text-red-400", border: "border-white/5" },
            { label: t("dash_total_income"),   value: totalIncome,   color: "text-emerald-400", border: "border-emerald-500/20" },
            { label: t("dash_total_expense"),  value: totalExpense,  color: "text-red-400",     border: "border-red-500/20" },
          ].map((c) => (
            <div key={c.label} className={`rounded-xl p-3 sm:p-4 border ${c.border}`} style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wider truncate">{c.label}</p>
              <p className={`font-bold text-sm sm:text-lg mt-1 ${c.color} truncate`}>{fmt(c.value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 sm:px-6 py-3 flex flex-wrap gap-2 items-center border-b border-white/5">
        <div className="relative flex-1 min-w-[130px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-full pl-9 pr-4 py-2 rounded-xl text-white text-sm placeholder-slate-600"
          />
        </div>
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
          {([["all", t("tx_filter_all")], ["income", t("income")], ["expense", t("expense")]]).map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setFilterType(val)}
              className={clsx(
                "px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                filterType === val ? "bg-emerald-500 text-white" : "text-slate-400 hover:text-slate-200"
              )}
            >
              {lbl}
            </button>
          ))}
        </div>
        <div className="hidden sm:flex items-center gap-1 text-slate-500 text-xs">
          <Filter size={12} />
          {filtered.length} {t("tx_results")}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto px-4 sm:px-6 py-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
              <ArrowLeftRight size={20} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">Sin transacciones</p>
            <p className="text-slate-600 text-sm mt-1">Crea tu primera transacción con el botón de arriba</p>
          </div>
        ) : (
          <>
          {/* */}
          <div className="flex flex-col gap-2 sm:hidden">
            {filtered.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-white/5 p-3 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className={clsx("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                  t.type === "income" ? "bg-emerald-500/10" : "bg-red-500/10")}>
                  {t.type === "income" ? <TrendingUp size={15} className="text-emerald-400" /> : <TrendingDown size={15} className="text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm font-medium truncate">{t.description}</p>
                  <p className="text-slate-500 text-xs">{t.category} · {fmtDate(t.date)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={clsx("font-bold text-sm", t.type === "income" ? "text-emerald-400" : "text-red-400")}>
                    {t.type === "expense" ? "-" : "+"}{fmt(t.amount)}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(t)} className="text-slate-500 hover:text-slate-200 p-1 rounded-lg hover:bg-white/5"><Pencil size={12} /></button>
                    <button onClick={() => handleDelete(t.id)} disabled={deletingId === t.id} className="text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10">
                      {deletingId === t.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* */}
          <div className="hidden sm:block rounded-2xl overflow-hidden border border-white/5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5" style={{ background: "rgba(255,255,255,0.03)" }}>
                  {[t("tx_col_date"), t("tx_col_desc"), t("tx_col_cat"), t("tx_col_type"), t("tx_col_amount"), ""].map((h) => (
                    <th key={h} className="text-left text-slate-500 font-medium px-4 py-3 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <motion.tr key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors"
                    style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                    <td className="px-4 py-3 text-slate-400">{fmtDate(t.date)}</td>
                    <td className="px-4 py-3 text-slate-200 font-medium">{t.description}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-white/5 text-slate-400 text-xs">{t.category}</span></td>
                    <td className="px-4 py-3">
                      <span className={clsx("flex items-center gap-1 w-fit px-2 py-0.5 rounded-md text-xs font-medium",
                        t.type === "income" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                        {t.type === "income" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {t.type === "income" ? "Ingreso" : "Gasto"}
                      </span>
                    </td>
                    <td className={clsx("px-4 py-3 font-bold", t.type === "income" ? "text-emerald-400" : "text-red-400")}>
                      {t.type === "expense" ? "-" : "+"}{fmt(t.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(t)} className="text-slate-500 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-white/5"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(t.id)} disabled={deletingId === t.id} className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10">
                          {deletingId === t.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-md"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-bold text-lg">
                  {editing ? "Editar transacción" : "Nueva transacción"}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Type toggle */}
                <div className="flex gap-2">
                  {[["expense", "Gasto", "bg-red-500"], ["income", "Ingreso", "bg-emerald-500"]].map(([val, lbl, color]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setForm({ ...form, type: val, category: "" })}
                      className={clsx(
                        "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
                        form.type === val ? `${color} text-white` : "bg-white/5 text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>

                {/* Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-sm font-medium">Fecha</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="input-field w-full rounded-xl px-4 py-3 text-white text-sm"
                    style={{ colorScheme: "dark" }}
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-sm font-medium">Descripción</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Compra supermercado"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input-field w-full rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600"
                  />
                </div>

                {/* Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-sm font-medium">Monto (S/.)</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="input-field w-full rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600"
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-sm font-medium">Categoría</label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="select-field w-full rounded-xl px-4 py-3 text-sm"
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>
                )}

                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 text-sm font-medium hover:bg-white/10 transition-all">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1 py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : editing ? "Guardar cambios" : "Crear transacción"}
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

function ArrowLeftRight({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" />
    </svg>
  );
}

