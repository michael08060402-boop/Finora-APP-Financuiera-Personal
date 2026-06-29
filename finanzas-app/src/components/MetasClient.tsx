"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, X, Target, PlusCircle } from "lucide-react";
import { useConfig } from "./ConfigProvider";

type Goal = { id: string; name: string; description?: string; targetAmount: number; currentAmount: number; deadline?: string; color: string };

const COLORS = ["#10b981","#6366f1","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"];
const empty = { name: "", description: "", targetAmount: "", deadline: "", color: "#10b981" };

export default function MetasClient() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/goals");
    setGoals(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(empty); setShowForm(true); };
  const openEdit = (g: Goal) => {
    setEditing(g);
    setForm({ name: g.name, description: g.description ?? "", targetAmount: String(g.targetAmount), deadline: g.deadline ? g.deadline.split("T")[0] : "", color: g.color });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault(); setSaving(true);
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/goals/${editing.id}` : "/api/goals";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, currentAmount: editing?.currentAmount ?? 0 }) });
    await load(); setSaving(false); setShowForm(false);
  };

  const handleDelete = async (id: string) => { setDeletingId(id); await fetch(`/api/goals/${id}`, { method: "DELETE" }); await load(); setDeletingId(null); };

  const handleAddAmount = async (g: Goal) => {
    const n = parseFloat(addAmount);
    if (!n || n <= 0) return;
    await fetch(`/api/goals/${g.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...g, targetAmount: g.targetAmount, currentAmount: g.currentAmount + n }),
    });
    setAddingId(null); setAddAmount(""); await load();
  };

  const { formatAmount: fmt, t } = useConfig();

  return (
    <div className="flex-1 min-h-screen" style={{ background: "#080b14" }}>
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-white/5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-white font-bold text-xl sm:text-2xl">{t("goal_title")}</h1>
            <p className="text-slate-500 text-sm mt-0.5 hidden sm:block">{t("goal_subtitle")}</p>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-white text-sm font-semibold flex-shrink-0">
            <Plus size={16} /> <span className="hidden sm:inline">{t("goal_new")}</span>
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-emerald-500" /></div>
        ) : goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4"><Target size={24} className="text-slate-600" /></div>
            <p className="text-slate-400 font-medium">Sin metas aún</p>
            <p className="text-slate-600 text-sm mt-1">Crea tu primera meta de ahorro</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {goals.map((g, i) => {
              const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
              const done = pct >= 100;
              const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000) : null;
              return (
                <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="rounded-2xl border border-white/5 p-5 flex flex-col gap-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${g.color}20` }}>
                        <Target size={18} style={{ color: g.color }} />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{g.name}</p>
                        {g.description && <p className="text-slate-500 text-xs">{g.description}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(g)} className="text-slate-600 hover:text-slate-300 p-1 rounded-lg hover:bg-white/5"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(g.id)} disabled={deletingId === g.id} className="text-slate-600 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10">
                        {deletingId === g.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-400">{fmt(g.currentAmount)} ahorrado</span>
                      <span className="font-semibold" style={{ color: g.color }}>{pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, delay: i * 0.07 + 0.2 }}
                        className="h-full rounded-full" style={{ background: g.color }} />
                    </div>
                    <p className="text-slate-500 text-xs mt-1.5">Meta: {fmt(g.targetAmount)}</p>
                  </div>

                  {done ? (
                    <div className="text-center py-1 rounded-xl text-emerald-400 text-sm font-semibold bg-emerald-500/10">¡Meta alcanzada!</div>
                  ) : (
                    <div>
                      {daysLeft !== null && (
                        <p className="text-slate-500 text-xs mb-2">{daysLeft > 0 ? `${daysLeft} días restantes` : "Fecha vencida"}</p>
                      )}
                      {addingId === g.id ? (
                        <div className="flex flex-col gap-2">
                          <input type="number" min="0.01" step="0.01" placeholder="Monto a agregar" value={addAmount}
                            onChange={e => setAddAmount(e.target.value)}
                            className="input-field w-full rounded-xl px-3 py-2 text-white text-sm placeholder-slate-600" />
                          <div className="flex gap-2">
                            <button onClick={() => handleAddAmount(g)} className="btn-primary flex-1 py-2 rounded-xl text-white text-sm font-medium">Agregar</button>
                            <button onClick={() => setAddingId(null)} className="flex-1 py-2 rounded-xl bg-white/5 text-slate-400 text-sm hover:bg-white/10 transition-all">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setAddingId(g.id); setAddAmount(""); }}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-white/10 text-slate-400 text-sm hover:text-white hover:border-white/20 transition-all">
                          <PlusCircle size={14} /> Agregar dinero
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={e => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-bold text-lg">{editing ? "Editar meta" : "Nueva meta"}</h2>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {[
                  { label: "Nombre", key: "name", type: "text", placeholder: "Ej: Vacaciones" },
                  { label: "Descripción (opcional)", key: "description", type: "text", placeholder: "Ej: Viaje a la playa" },
                  { label: "Monto objetivo (S/.)", key: "targetAmount", type: "number", placeholder: "0.00" },
                  { label: "Fecha límite (opcional)", key: "deadline", type: "date", placeholder: "" },
                ].map(({ label, key, type, placeholder }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-slate-300 text-sm font-medium">{label}</label>
                    <input type={type} placeholder={placeholder} value={form[key as keyof typeof form]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      required={key === "name" || key === "targetAmount"}
                      className="input-field w-full rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600"
                      style={type === "date" ? { colorScheme: "dark" } : undefined} />
                  </div>
                ))}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-sm font-medium">Color</label>
                  <div className="flex gap-2">
                    {COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                        className="w-7 h-7 rounded-full transition-all" style={{ background: c, outline: form.color === c ? `3px solid ${c}` : "none", outlineOffset: 2 }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 text-sm font-medium hover:bg-white/10 transition-all">Cancelar</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1 py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : editing ? "Guardar" : "Crear meta"}
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

