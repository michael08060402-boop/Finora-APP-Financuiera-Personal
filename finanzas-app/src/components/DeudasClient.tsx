"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Loader2, X, HandCoins, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";
import { useConfig } from "./ConfigProvider";

type Debt = {
  id: string;
  personName: string;
  amount: number;
  paid: number;
  description?: string;
  type: "i_owe" | "owed_to_me";
  status: "pending" | "partial" | "paid";
  dueDate?: string;
  createdAt: string;
};

type DebtType = "i_owe" | "owed_to_me";
type FormState = { personName: string; amount: string; description: string; type: DebtType; dueDate: string };
const empty: FormState = { personName: "", amount: "", description: "", type: "i_owe", dueDate: "" };

export default function DeudasClient() {
  const { formatAmount: fmt, t } = useConfig();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [tab, setTab] = useState<"all" | "i_owe" | "owed_to_me">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/debts");
    setDebts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/debts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    await load();
    setSaving(false);
    setShowForm(false);
    setForm(empty);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/debts/${id}`, { method: "DELETE" });
    await load();
    setDeletingId(null);
  };

  const handlePay = async (debt: Debt) => {
    const n = parseFloat(payAmount);
    if (!n || n <= 0) return;
    const newPaid = Math.min(debt.paid + n, debt.amount);
    await fetch(`/api/debts/${debt.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: newPaid }),
    });
    setPayingId(null);
    setPayAmount("");
    await load();
  };

  const filtered = tab === "all" ? debts : debts.filter(d => d.type === tab);
  const iOwe    = debts.filter(d => d.type === "i_owe"    && d.status !== "paid").reduce((s, d) => s + (d.amount - d.paid), 0);
  const owedMe  = debts.filter(d => d.type === "owed_to_me" && d.status !== "paid").reduce((s, d) => s + (d.amount - d.paid), 0);

  const statusStyle: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "Pendiente", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    partial: { label: "Parcial",   color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
    paid:    { label: "Pagado",    color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  };

  return (
    <div className="flex-1 min-h-screen" style={{ background: "#080b14" }}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-white/5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-white font-bold text-xl sm:text-2xl">{t("deb_title")}</h1>
            <p className="text-slate-500 text-sm mt-0.5 hidden sm:block">{t("deb_subtitle")}</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-white text-sm font-semibold flex-shrink-0">
            <Plus size={16} /> <span className="hidden sm:inline">{t("deb_new")}</span>
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-2xl border border-red-500/15 p-4" style={{ background: "rgba(239,68,68,0.05)" }}>
            <p className="text-slate-500 text-xs mb-1">{t("deb_i_owe")}</p>
            <p className="text-red-400 font-bold text-xl">{fmt(iOwe)}</p>
            <p className="text-slate-600 text-xs mt-0.5">{t("deb_pending_pay")}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/15 p-4" style={{ background: "rgba(16,185,129,0.05)" }}>
            <p className="text-slate-500 text-xs mb-1">{t("deb_owed_to_me")}</p>
            <p className="text-emerald-400 font-bold text-xl">{fmt(owedMe)}</p>
            <p className="text-slate-600 text-xs mt-0.5">{t("deb_pending_collect")}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {(([["all", t("deb_filter_all")], ["i_owe", t("deb_i_owe")], ["owed_to_me", t("deb_owed_to_me")]]) as [typeof tab, string][]).map(([val, lbl]) => (
            <button key={val} onClick={() => setTab(val)}
              className={clsx("px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all border",
                tab === val
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10")}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <HandCoins size={24} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">Sin deudas registradas</p>
            <p className="text-slate-600 text-sm mt-1">Registra préstamos que hiciste o que te hicieron</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 max-w-2xl">
            {filtered.map((d, i) => {
              const pct = Math.min((d.paid / d.amount) * 100, 100);
              const remaining = d.amount - d.paid;
              const st = statusStyle[d.status];
              const isOwedToMe = d.type === "owed_to_me";
              const accentColor = isOwedToMe ? "#10b981" : "#ef4444";
              const daysLeft = d.dueDate ? Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / 86400000) : null;

              return (
                <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-base font-bold"
                        style={{ background: `${accentColor}18`, color: accentColor }}>
                        {d.personName[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">{d.personName}</p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {isOwedToMe ? "Te debe" : "Le debes"}
                          {d.description && <> · <span className="text-slate-600">{d.description}</span></>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-lg font-medium" style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                      <button onClick={() => handleDelete(d.id)} disabled={deletingId === d.id}
                        className="text-slate-600 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-all">
                        {deletingId === d.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Amount + progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">
                        Pagado: <span className="text-white font-medium">{fmt(d.paid)}</span>
                      </span>
                      <span className="text-slate-400">
                        Total: <span className="font-semibold" style={{ color: accentColor }}>{fmt(d.amount)}</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ background: accentColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: i * 0.04 + 0.1 }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {d.status !== "paid" && (
                        <span>Pendiente: <span className="text-white font-medium">{fmt(remaining)}</span></span>
                      )}
                      {daysLeft !== null && d.status !== "paid" && (
                        <span className={daysLeft < 0 ? "text-red-400" : daysLeft < 7 ? "text-amber-400" : "text-slate-500"}>
                          {daysLeft < 0 ? `Venció hace ${Math.abs(daysLeft)}d` : `Vence en ${daysLeft}d`}
                        </span>
                      )}
                    </div>

                    {d.status !== "paid" && (
                      <div className="flex-shrink-0">
                        {payingId === d.id ? (
                          <div className="flex items-center gap-2">
                            <input type="number" min="0.01" step="0.01" placeholder="Monto" value={payAmount}
                              onChange={e => setPayAmount(e.target.value)}
                              className="input-field w-24 rounded-xl px-3 py-1.5 text-white text-xs" />
                            <button onClick={() => handlePay(d)}
                              className="btn-primary px-3 py-1.5 rounded-xl text-white text-xs font-medium">OK</button>
                            <button onClick={() => setPayingId(null)} className="text-slate-500 hover:text-slate-300">
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setPayingId(d.id); setPayAmount(""); }}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all">
                            {isOwedToMe ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                            {isOwedToMe ? "Registrar cobro" : "Registrar pago"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={e => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-bold text-lg">Nueva deuda / préstamo</h2>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Tipo */}
                <div className="flex gap-2">
                  {(["i_owe", "owed_to_me"] as const).map(tp => (
                    <button key={tp} type="button" onClick={() => setForm({ ...form, type: tp })}
                      className={clsx("flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border",
                        form.type === tp
                          ? tp === "i_owe" ? "bg-red-500/15 text-red-300 border-red-500/30" : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : "border-white/5 text-slate-500 hover:text-slate-300")}>
                      {tp === "i_owe" ? t("deb_i_owe") : t("deb_owed_to_me")}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-sm font-medium">
                    {form.type === "i_owe" ? "¿A quién le debes?" : "¿Quién te debe?"}
                  </label>
                  <input required type="text" placeholder="Nombre de la persona"
                    value={form.personName} onChange={e => setForm({ ...form, personName: e.target.value })}
                    className="input-field w-full rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-sm font-medium">Monto (S/.)</label>
                  <input required type="number" min="0.01" step="0.01" placeholder="0.00"
                    value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="input-field w-full rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-sm font-medium">Descripción (opcional)</label>
                  <input type="text" placeholder="Ej: Préstamo para la moto"
                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className="input-field w-full rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-sm font-medium">Fecha límite (opcional)</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    className="input-field w-full rounded-xl px-4 py-3 text-white text-sm"
                    style={{ colorScheme: "dark" }} />
                </div>

                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 text-sm font-medium hover:bg-white/10 transition-all">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving}
                    className="btn-primary flex-1 py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : "Registrar"}
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

