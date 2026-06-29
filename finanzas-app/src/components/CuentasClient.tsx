"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, X, Wallet, Check } from "lucide-react";
import clsx from "clsx";
import { useConfig } from "./ConfigProvider";

type WalletType = { id: string; name: string; type: string; balance: number; color: string };
type WalletTypeDef = { value: string; label: string; emoji: string };

const WALLET_TYPES: WalletTypeDef[] = [
  { value: "efectivo",  label: "Efectivo",           emoji: "💵" },
  { value: "yape",      label: "Yape",                emoji: "📱" },
  { value: "plin",      label: "Plin",                emoji: "📲" },
  { value: "bancaria",  label: "Cuenta Bancaria",     emoji: "🏦" },
  { value: "credito",   label: "Tarjeta de Crédito",  emoji: "💳" },
  { value: "ahorros",   label: "Cuenta de Ahorros",   emoji: "💰" },
];

const COLORS = ["#10b981","#6366f1","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#f97316"];
const CUSTOM_KEY = "finora_custom_wallet_types";
const empty = { name: "", type: "efectivo", balance: "", color: "#10b981" };

export default function CuentasClient() {
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WalletType | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [nameAutoSet, setNameAutoSet] = useState(false);
  const [customTypes, setCustomTypes] = useState<WalletTypeDef[]>([]);
  const [addingCustom, setAddingCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const customInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? "[]");
      setCustomTypes(stored);
    } catch {}
  }, []);

  const allTypes = [...WALLET_TYPES, ...customTypes];

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/wallets");
    setWallets(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setNameAutoSet(false);
    setAddingCustom(false);
    setCustomLabel("");
    setShowForm(true);
  };

  const openEdit = (w: WalletType) => {
    setEditing(w);
    setForm({ name: w.name, type: w.type, balance: String(w.balance), color: w.color });
    setNameAutoSet(false);
    setAddingCustom(false);
    setShowForm(true);
  };

  const handleTypeSelect = (value: string) => {
    const wt = allTypes.find(t => t.value === value);
    if (!form.name || nameAutoSet) {
      setForm(f => ({ ...f, type: value, name: wt?.label ?? "" }));
      setNameAutoSet(true);
    } else {
      setForm(f => ({ ...f, type: value }));
    }
    setAddingCustom(false);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameAutoSet(false);
    setForm(f => ({ ...f, name: e.target.value }));
  };

  const confirmCustomType = () => {
    const label = customLabel.trim();
    if (!label) return;
    const value = label.toLowerCase().replace(/\s+/g, "_");
    const newType: WalletTypeDef = { value, label, emoji: "🏷️" };
    const updated = [...customTypes, newType];
    setCustomTypes(updated);
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(updated));
    handleTypeSelect(value);
    setCustomLabel("");
    setAddingCustom(false);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault(); setSaving(true);
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/wallets/${editing.id}` : "/api/wallets";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    await load(); setSaving(false); setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/wallets/${id}`, { method: "DELETE" });
    await load(); setDeletingId(null);
  };

  const { formatAmount: fmt, t } = useConfig();
  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);
  const getType = (type: string) => allTypes.find(wt => wt.value === type) ?? { emoji: "🏷️", label: type };

  return (
    <div className="flex-1 min-h-screen" style={{ background: "#080b14" }}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-white/5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-white font-bold text-xl sm:text-2xl">{t("acc_title")}</h1>
            <p className="text-slate-500 text-sm mt-0.5 hidden sm:block">{t("acc_subtitle")}</p>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-white text-sm font-semibold flex-shrink-0">
            <Plus size={16} /> <span className="hidden sm:inline">{t("acc_new")}</span>
          </button>
        </div>

        {/* Total balance */}
        <div className="mt-4 rounded-2xl border border-emerald-500/20 p-4 sm:p-5 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))" }}>
          <div>
            <p className="text-slate-400 text-sm">{t("acc_total_balance")}</p>
            <p className="text-emerald-400 font-bold text-3xl mt-1">{fmt(totalBalance)}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <Wallet size={26} className="text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Accounts grid */}
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-emerald-500" /></div>
        ) : wallets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Wallet size={24} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">Sin cuentas registradas</p>
            <p className="text-slate-600 text-sm mt-1">Agrega tu primera cuenta o método de pago</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wallets.map((w, i) => {
              const wt = getType(w.type);
              return (
                <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="rounded-2xl border border-white/5 p-5 relative overflow-hidden group"
                  style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: w.color }} />
                  <div className="flex items-start justify-between mt-1">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                        style={{ background: `${w.color}18` }}>
                        {wt.emoji}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{w.name}</p>
                        <p className="text-slate-500 text-xs">{wt.label}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(w)} className="text-slate-500 hover:text-slate-200 p-1.5 rounded-lg hover:bg-white/5">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(w.id)} disabled={deletingId === w.id}
                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10">
                        {deletingId === w.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">{t("acc_available")}</p>
                    <p className="font-bold text-2xl" style={{ color: w.color }}>{fmt(w.balance)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={e => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 w-full sm:max-w-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-bold text-lg">{editing ? "Editar cuenta" : "Nueva cuenta"}</h2>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Type selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-sm font-medium">Tipo de cuenta</label>
                  <div className="grid grid-cols-2 gap-2">
                    {allTypes.map(wt => (
                      <button key={wt.value} type="button" onClick={() => handleTypeSelect(wt.value)}
                        className={clsx("flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all",
                          form.type === wt.value ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-white/5 text-slate-400 hover:border-white/15 hover:text-slate-300")}>
                        <span>{wt.emoji}</span>
                        <span className="truncate">{wt.label}</span>
                      </button>
                    ))}

                    {/* Add custom type */}
                    {!addingCustom ? (
                      <button type="button" onClick={() => { setAddingCustom(true); setTimeout(() => customInputRef.current?.focus(), 50); }}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-white/10 text-slate-500 hover:border-emerald-500/30 hover:text-emerald-400 text-sm transition-all">
                        <Plus size={14} />
                        <span>Otro tipo</span>
                      </button>
                    ) : (
                      <div className="col-span-2 flex gap-2">
                        <input
                          ref={customInputRef}
                          type="text"
                          value={customLabel}
                          onChange={e => setCustomLabel(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); confirmCustomType(); } if (e.key === "Escape") setAddingCustom(false); }}
                          placeholder="Nombre del tipo..."
                          className="input-field flex-1 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-600"
                        />
                        <button type="button" onClick={confirmCustomType}
                          className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 transition-all flex-shrink-0">
                          <Check size={14} />
                        </button>
                        <button type="button" onClick={() => setAddingCustom(false)}
                          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center hover:bg-white/10 transition-all flex-shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-sm font-medium">Nombre</label>
                  <input type="text" required placeholder={`Ej: Mi ${getType(form.type).label}`}
                    value={form.name} onChange={handleNameChange}
                    className="input-field w-full rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600" />
                </div>

                {/* Balance */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-sm font-medium">Saldo inicial (S/.)</label>
                  <input type="number" step="0.01" placeholder="0.00"
                    value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
                    className="input-field w-full rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600" />
                </div>

                {/* Color */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-sm font-medium">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                        className="w-7 h-7 rounded-full transition-all"
                        style={{ background: c, outline: form.color === c ? `3px solid ${c}` : "none", outlineOffset: 2 }} />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mt-1">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 text-sm font-medium hover:bg-white/10 transition-all">
                    Cancelar
                  </button>
                  <button type="submit" disabled={saving}
                    className="btn-primary flex-1 py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : editing ? "Guardar" : "Crear cuenta"}
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
