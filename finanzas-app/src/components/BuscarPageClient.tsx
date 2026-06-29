"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, ArrowLeftRight, Target, Wallet, PiggyBank, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useConfig } from "./ConfigProvider";

type SearchResults = {
  transactions: { id: string; description: string; amount: number; type: string; category: string; date: string }[];
  goals:        { id: string; name: string; targetAmount: number; currentAmount: number; color: string }[];
  wallets:      { id: string; name: string; type: string; balance: number; color: string }[];
  budgets:      { id: string; category: string; amount: number; month: number; year: number }[];
};

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const WALLET_LABELS: Record<string,string> = {
  efectivo:"Efectivo", yape:"Yape", plin:"Plin",
  bancaria:"Cuenta Bancaria", credito:"Tarjeta de Crédito", ahorros:"Cuenta de Ahorros",
};

function useDebounce<T>(value: T, ms: number): T {
  const [dv, setDv] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDv(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return dv;
}

export default function BuscarPageClient() {
  const { formatAmount: fmt, t } = useConfig();
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<SearchResults | null>(null);
  const [loading, setLoading]   = useState(false);
  const [filter, setFilter]     = useState<"all"|"transaction"|"goal"|"wallet"|"budget">("all");
  const dq                      = useDebounce(query, 280);
  const inputRef                = useRef<HTMLInputElement>(null);
  const router                  = useRouter();

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (dq.trim().length < 2) { setResults(null); return; }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(dq)}`)
      .then(r => r.json())
      .then(d => { setResults(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [dq]);

  const total = results ? results.transactions.length + results.goals.length + results.wallets.length + results.budgets.length : 0;

  const sections = [
    {
      key: "transaction" as const,
      label: t("nav_transactions"),
      icon: ArrowLeftRight,
      color: "#6366f1",
      items: results?.transactions ?? [],
      href: "/transacciones",
      render: (t: SearchResults["transactions"][0]) => ({
        title: t.description,
        sub: `${t.category} · ${new Date(t.date).toLocaleDateString("es-PE",{day:"2-digit",month:"short",year:"numeric"})}`,
        badge: <span className={clsx("text-sm font-bold", t.type === "income" ? "text-emerald-400" : "text-red-400")}>{t.type==="income"?"+":"-"}{fmt(t.amount)}</span>,
        iconBg: "rgba(99,102,241,0.12)",
        iconColor: "#6366f1",
      }),
    },
    {
      key: "goal" as const,
      label: t("nav_goals"),
      icon: Target,
      color: "#ec4899",
      items: results?.goals ?? [],
      href: "/metas",
      render: (g: SearchResults["goals"][0]) => ({
        title: g.name,
        sub: `${fmt(g.currentAmount)} de ${fmt(g.targetAmount)} · ${g.targetAmount > 0 ? ((g.currentAmount/g.targetAmount)*100).toFixed(0) : 0}%`,
        badge: null,
        iconBg: `${g.color}18`,
        iconColor: g.color,
      }),
    },
    {
      key: "wallet" as const,
      label: t("nav_accounts"),
      icon: Wallet,
      color: "#10b981",
      items: results?.wallets ?? [],
      href: "/cuentas",
      render: (w: SearchResults["wallets"][0]) => ({
        title: w.name,
        sub: WALLET_LABELS[w.type] ?? w.type,
        badge: <span className="text-sm font-bold text-emerald-400">{fmt(w.balance)}</span>,
        iconBg: `${w.color}18`,
        iconColor: w.color,
      }),
    },
    {
      key: "budget" as const,
      label: t("nav_budgets"),
      icon: PiggyBank,
      color: "#f59e0b",
      items: results?.budgets ?? [],
      href: "/presupuestos",
      render: (b: SearchResults["budgets"][0]) => ({
        title: b.category,
        sub: `${MONTHS[b.month - 1]} ${b.year}`,
        badge: <span className="text-sm font-bold text-amber-400">{fmt(b.amount)}</span>,
        iconBg: "rgba(245,158,11,0.12)",
        iconColor: "#f59e0b",
      }),
    },
  ];

  const visibleSections = filter === "all" ? sections : sections.filter(s => s.key === filter);

  return (
    <div className="flex-1 min-h-screen" style={{ background: "#080b14" }}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-white/5">
        <h1 className="text-white font-bold text-2xl">{t("search_title")}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t("search_subtitle")}</p>

        {/* Search bar */}
        <div className="flex items-center gap-3 mt-5 rounded-2xl border border-white/8 px-4 py-3.5 focus-within:border-emerald-500/40"
          style={{ background: "rgba(255,255,255,0.03)", transition: "border-color 0.2s" }}>
          {loading ? <Loader2 size={18} className="text-slate-500 animate-spin flex-shrink-0"/> : <Search size={18} className="text-slate-500 flex-shrink-0"/>}
          <input ref={inputRef} type="text" placeholder={t("search_placeholder2")}
            value={query} onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-slate-600 text-base outline-none" />
          {query && <button onClick={() => { setQuery(""); setResults(null); }} className="text-slate-600 hover:text-slate-400 text-xs transition-colors">Limpiar</button>}
        </div>

        {/* Filters */}
        {results && total > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            <button onClick={() => setFilter("all")}
              className={clsx("px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                filter === "all" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10")}>
              {t("tx_filter_all")} ({total})
            </button>
            {sections.filter(s => s.items.length > 0).map(s => (
              <button key={s.key} onClick={() => setFilter(s.key)}
                className={clsx("px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                  filter === s.key ? "text-white border-white/20 bg-white/5" : "border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10")}
                style={filter === s.key ? { borderColor: `${s.color}40`, color: s.color, background: `${s.color}10` } : {}}>
                {s.label} ({s.items.length})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        {!query && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-5">
              <Search size={26} className="text-slate-600" />
            </div>
            <p className="text-slate-300 font-semibold text-lg">Busca en todo el sistema</p>
            <p className="text-slate-500 text-sm mt-2 max-w-xs">
              Escribe el nombre de una transacción, categoría, meta, cuenta o presupuesto
            </p>
            <div className="grid grid-cols-2 gap-3 mt-8 max-w-sm">
              {[
                ["🔍", "Transacción o categoría", "Busca por nombre o tipo"],
                ["💰", "Monto o fecha", "Filtra por cantidad"],
                ["💳", "Método de pago", "Encuentra por cuenta"],
                ["📊", "Límites por categoría", "Ve tus presupuestos"],
              ].map(([emoji, title, desc]) => (
                <div key={title} className="rounded-xl border border-white/5 p-4 text-left" style={{background:"rgba(255,255,255,0.02)"}}>
                  <span className="text-xl">{emoji}</span>
                  <p className="text-slate-300 text-sm font-medium mt-2">{title}</p>
                  <p className="text-slate-600 text-xs mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {query.length === 1 && (
          <p className="text-center text-slate-500 text-sm py-12">Escribe al menos 2 caracteres...</p>
        )}

        {results && total === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-slate-400 font-medium">Sin resultados para <span className="text-white">"{query}"</span></p>
            <p className="text-slate-600 text-sm mt-1">Prueba con otra palabra o verifica la ortografía</p>
          </div>
        )}

        {results && total > 0 && (
          <div className="flex flex-col gap-8 max-w-3xl">
            {visibleSections.filter(s => s.items.length > 0).map(section => {
              const SIcon = section.icon;
              return (
                <div key={section.key}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <SIcon size={14} style={{ color: section.color }} />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: section.color }}>{section.label}</span>
                      <span className="text-xs text-slate-600">({section.items.length})</span>
                    </div>
                    <button onClick={() => router.push(section.href)}
                      className="text-xs text-slate-600 hover:text-slate-400 flex items-center gap-1 transition-colors">
                      Ver todos <ArrowRight size={10} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {(section.items as any[]).map((item: any) => {
                      const rendered = section.render(item);
                      return (
                        <button key={item.id} onClick={() => router.push(section.href)}
                          className="flex items-center gap-4 rounded-2xl border border-white/5 px-5 py-4 hover:border-white/10 hover:bg-white/3 transition-all text-left group"
                          style={{background:"rgba(255,255,255,0.02)"}}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: rendered.iconBg }}>
                            <SIcon size={16} style={{ color: rendered.iconColor }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate group-hover:text-emerald-300 transition-colors">{rendered.title}</p>
                            <p className="text-slate-500 text-xs mt-0.5 truncate">{rendered.sub}</p>
                          </div>
                          {rendered.badge}
                          <ArrowRight size={14} className="text-slate-700 group-hover:text-slate-500 flex-shrink-0 transition-colors" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

