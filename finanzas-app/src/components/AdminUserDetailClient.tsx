"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, User, TrendingUp, TrendingDown, Wallet, Target, Shield, UserX, UserCheck } from "lucide-react";
import clsx from "clsx";

type UserDetail = {
  id: string; name: string | null; email: string; image: string | null;
  role: string; isActive: boolean; createdAt: string;
  _count: { transactions: number; wallets: number; goals: number; budgets: number; debts: number };
  transactions: { id: string; description: string; amount: number; type: string; category: string; date: string }[];
  wallets:      { id: string; name: string; type: string; balance: number; color: string }[];
  goals:        { id: string; name: string; targetAmount: number; currentAmount: number; color: string }[];
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 0 }).format(n);
}

export default function AdminUserDetailClient({ userId }: { userId: string }) {
  const router  = useRouter();
  const [user,    setUser]    = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then(r => r.json())
      .then(d => { setUser(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  const patch = async (body: { role?: string; isActive?: boolean }) => {
    if (!user) return;
    setActing(true);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) setUser(prev => prev ? { ...prev, ...data } : prev);
    setActing(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 size={28} className="animate-spin text-red-400" />
    </div>
  );
  if (!user) return (
    <div className="flex items-center justify-center min-h-screen text-slate-500">Usuario no encontrado</div>
  );

  const totalIncome  = user.transactions.filter(t => t.type === "income") .reduce((s, t) => s + t.amount, 0);
  const totalExpense = user.transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="min-h-screen p-6" style={{ background: "#080b14" }}>
      {/* Back */}
      <button onClick={() => router.push("/admin/users")}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mb-6 transition-colors">
        <ArrowLeft size={15} /> Volver a usuarios
      </button>

      {/* Profile card */}
      <div className="rounded-2xl border border-white/5 p-6 mb-5 flex items-start justify-between gap-6 flex-wrap"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0">
            {user.image
              ? <img src={user.image} className="w-14 h-14 rounded-2xl object-cover" alt="" />
              : <User size={22} className="text-slate-500" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-white font-bold text-xl">{user.name ?? "Sin nombre"}</h1>
              <span className={clsx(
                "text-xs px-2 py-0.5 rounded-md font-medium flex items-center gap-1",
                user.role === "admin" ? "bg-red-500/15 text-red-400" : "bg-white/5 text-slate-400"
              )}>
                {user.role === "admin" && <Shield size={9} />}
                {user.role}
              </span>
              {!user.isActive && (
                <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-yellow-500/15 text-yellow-400">
                  Suspendido
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm">{user.email}</p>
            <p className="text-slate-600 text-xs mt-0.5">
              Registrado el {new Date(user.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => patch({ role: user.role === "admin" ? "user" : "admin" })}
            disabled={acting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-slate-300 hover:bg-white/5 transition-all disabled:opacity-50">
            {acting ? <Loader2 size={13} className="animate-spin" /> : <Shield size={13} />}
            {user.role === "admin" ? "Quitar admin" : "Hacer admin"}
          </button>
          <button
            onClick={() => patch({ isActive: !user.isActive })}
            disabled={acting}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50",
              user.isActive
                ? "border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/5"
                : "border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5"
            )}>
            {acting ? <Loader2 size={13} className="animate-spin" /> : user.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
            {user.isActive ? "Suspender cuenta" : "Reactivar cuenta"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-5">
        {[
          { label: "Transacciones", value: user._count.transactions, icon: TrendingUp,  color: "#6366f1" },
          { label: "Cuentas",       value: user._count.wallets,      icon: Wallet,      color: "#10b981" },
          { label: "Metas",         value: user._count.goals,        icon: Target,      color: "#ec4899" },
          { label: "Presupuestos",  value: user._count.budgets,      icon: Shield,      color: "#f59e0b" },
          { label: "Deudas",        value: user._count.debts,        icon: TrendingDown,color: "#ef4444" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-white/5 p-4 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
            <Icon size={16} className="mx-auto mb-1.5" style={{ color }} />
            <p className="text-white font-bold text-xl">{value}</p>
            <p className="text-slate-500 text-xs">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Last 10 transactions */}
        <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="px-5 py-4 border-b border-white/5">
            <p className="text-white font-semibold text-sm">Últimas transacciones</p>
            <div className="flex gap-4 mt-1 text-xs">
              <span className="text-emerald-400">Ingresos recientes: {fmt(totalIncome)}</span>
              <span className="text-red-400">Gastos recientes: {fmt(totalExpense)}</span>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {user.transactions.length === 0
              ? <p className="text-slate-600 text-sm text-center py-8">Sin transacciones</p>
              : user.transactions.map(t => (
                <div key={t.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-slate-200 text-sm truncate">{t.description}</p>
                    <p className="text-slate-600 text-xs">{t.category} · {new Date(t.date).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}</p>
                  </div>
                  <span className={clsx("font-medium text-sm flex-shrink-0", t.type === "income" ? "text-emerald-400" : "text-red-400")}>
                    {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                  </span>
                </div>
              ))
            }
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* Wallets */}
          <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="px-5 py-4 border-b border-white/5">
              <p className="text-white font-semibold text-sm">Cuentas</p>
            </div>
            <div className="divide-y divide-white/5">
              {user.wallets.length === 0
                ? <p className="text-slate-600 text-sm text-center py-6">Sin cuentas</p>
                : user.wallets.map(w => (
                  <div key={w.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: w.color }} />
                      <div>
                        <p className="text-slate-200 text-sm">{w.name}</p>
                        <p className="text-slate-600 text-xs">{w.type}</p>
                      </div>
                    </div>
                    <span className="text-slate-300 font-medium text-sm">{fmt(w.balance)}</span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Goals */}
          <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
            <div className="px-5 py-4 border-b border-white/5">
              <p className="text-white font-semibold text-sm">Metas de ahorro</p>
            </div>
            <div className="divide-y divide-white/5">
              {user.goals.length === 0
                ? <p className="text-slate-600 text-sm text-center py-6">Sin metas</p>
                : user.goals.map(g => {
                  const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
                  return (
                    <div key={g.id} className="px-5 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-slate-200 text-sm">{g.name}</p>
                        <span className="text-xs text-slate-500">{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: g.color }} />
                      </div>
                      <p className="text-slate-600 text-xs mt-1">{fmt(g.currentAmount)} / {fmt(g.targetAmount)}</p>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
