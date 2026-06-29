"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowLeftRight, Target, Wallet, PiggyBank, Loader2, ArrowRight } from "lucide-react";
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

interface Props { open: boolean; onClose: () => void; }

export default function SearchModal({ open, onClose }: Props) {
  const { formatAmount: fmt } = useConfig();
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const debouncedQ            = useDebounce(query, 280);
  const inputRef              = useRef<HTMLInputElement>(null);
  const router                = useRouter();

  // Focus input when modal opens
  useEffect(() => { if (open) { setTimeout(() => inputRef.current?.focus(), 80); } else { setQuery(""); setResults(null); } }, [open]);

  // Escape to close
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  // Fetch
  useEffect(() => {
    if (debouncedQ.trim().length < 2) { setResults(null); return; }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQ)}`)
      .then(r => r.json())
      .then(d => { setResults(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [debouncedQ]);

  const navigate = useCallback((href: string) => { router.push(href); onClose(); }, [router, onClose]);

  const totalResults = results
    ? results.transactions.length + results.goals.length + results.wallets.length + results.budgets.length
    : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[8vh] sm:pt-[12vh] px-3 sm:px-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={e => e.target === e.currentTarget && onClose()}>

          <motion.div initial={{ opacity: 0, y: -20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }} transition={{ duration: 0.18 }}
            className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.08)" }}>

            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-white/5">
              {loading
                ? <Loader2 size={18} className="text-slate-500 animate-spin flex-shrink-0" />
                : <Search size={18} className="text-slate-500 flex-shrink-0" />}
              <input ref={inputRef} type="text" placeholder="Buscar transacciones, metas, cuentas..."
                value={query} onChange={e => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-slate-600 text-sm outline-none" />
              {query && (
                <button onClick={() => { setQuery(""); setResults(null); inputRef.current?.focus(); }}
                  className="text-slate-600 hover:text-slate-400 transition-colors">
                  <X size={15} />
                </button>
              )}
              <kbd className="hidden sm:flex items-center gap-0.5 text-xs text-slate-600 border border-white/10 rounded px-1.5 py-0.5 font-mono">Esc</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[65vh] overflow-y-auto">
              {!query && (
                <div className="px-4 py-8 text-center">
                  <p className="text-slate-500 text-sm">Escribe para buscar en todo el sistema</p>
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-700">
                    {[["💳","Cuentas"],["📊","Presupuestos"],["🎯","Metas"]].map(([e,l]) => (
                      <span key={l}>{e} {l}</span>
                    ))}
                  </div>
                </div>
              )}

              {query.length === 1 && (
                <p className="px-4 py-6 text-center text-slate-600 text-sm">Escribe al menos 2 caracteres...</p>
              )}

              {results && totalResults === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-slate-400 text-sm">Sin resultados para <span className="text-white">"{query}"</span></p>
                  <p className="text-slate-600 text-xs mt-1">Prueba con otra palabra</p>
                </div>
              )}

              {results && totalResults > 0 && (
                <div className="py-2">
                  {/* Transactions */}
                  {results.transactions.length > 0 && (
                    <ResultSection
                      title="Transacciones" icon={ArrowLeftRight} iconColor="#6366f1"
                      onSeeAll={() => navigate("/transacciones")}>
                      {results.transactions.map(t => (
                        <ResultItem key={t.id} onClick={() => navigate("/transacciones")}
                          icon={<ArrowLeftRight size={14} style={{ color: "#6366f1" }} />}
                          iconBg="rgba(99,102,241,0.12)"
                          title={t.description}
                          sub={`${t.category} · ${new Date(t.date).toLocaleDateString("es-PE",{day:"2-digit",month:"short"})}`}
                          badge={
                            <span className={clsx("text-xs font-bold", t.type === "income" ? "text-emerald-400" : "text-red-400")}>
                              {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                            </span>
                          }
                        />
                      ))}
                    </ResultSection>
                  )}

                  {/* Goals */}
                  {results.goals.length > 0 && (
                    <ResultSection title="Metas" icon={Target} iconColor="#ec4899" onSeeAll={() => navigate("/metas")}>
                      {results.goals.map(g => {
                        const pct = g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0;
                        return (
                          <ResultItem key={g.id} onClick={() => navigate("/metas")}
                            icon={<Target size={14} style={{ color: g.color }} />}
                            iconBg={`${g.color}18`}
                            title={g.name}
                            sub={`${fmt(g.currentAmount)} de ${fmt(g.targetAmount)}`}
                            badge={<span className="text-xs text-slate-500">{pct.toFixed(0)}%</span>}
                          />
                        );
                      })}
                    </ResultSection>
                  )}

                  {/* Wallets */}
                  {results.wallets.length > 0 && (
                    <ResultSection title="Cuentas" icon={Wallet} iconColor="#10b981" onSeeAll={() => navigate("/cuentas")}>
                      {results.wallets.map(w => (
                        <ResultItem key={w.id} onClick={() => navigate("/cuentas")}
                          icon={<Wallet size={14} style={{ color: w.color }} />}
                          iconBg={`${w.color}18`}
                          title={w.name}
                          sub={WALLET_LABELS[w.type] ?? w.type}
                          badge={<span className="text-xs text-emerald-400 font-medium">{fmt(w.balance)}</span>}
                        />
                      ))}
                    </ResultSection>
                  )}

                  {/* Budgets */}
                  {results.budgets.length > 0 && (
                    <ResultSection title="Presupuestos" icon={PiggyBank} iconColor="#f59e0b" onSeeAll={() => navigate("/presupuestos")}>
                      {results.budgets.map(b => (
                        <ResultItem key={b.id} onClick={() => navigate("/presupuestos")}
                          icon={<PiggyBank size={14} className="text-amber-400" />}
                          iconBg="rgba(245,158,11,0.12)"
                          title={b.category}
                          sub={`${MONTHS[b.month - 1]} ${b.year}`}
                          badge={<span className="text-xs text-amber-400 font-medium">{fmt(b.amount)}</span>}
                        />
                      ))}
                    </ResultSection>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between">
              <p className="text-slate-700 text-xs">
                {results && totalResults > 0 ? `${totalResults} resultado${totalResults !== 1 ? "s" : ""}` : "Finora Search"}
              </p>
              <div className="flex gap-3 text-xs text-slate-700">
                <span>Esc cerrar</span>
                <span>Enter seleccionar</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ResultSection({ title, icon: Icon, iconColor, onSeeAll, children }: {
  title: string; icon: React.ElementType; iconColor: string;
  onSeeAll: () => void; children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1.5">
          <Icon size={12} style={{ color: iconColor }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: iconColor }}>{title}</span>
        </div>
        <button onClick={onSeeAll} className="text-xs text-slate-600 hover:text-slate-400 flex items-center gap-1 transition-colors">
          Ver todos <ArrowRight size={10} />
        </button>
      </div>
      {children}
    </div>
  );
}

function ResultItem({ onClick, icon, iconBg, title, sub, badge }: {
  onClick: () => void; icon: React.ReactNode; iconBg: string;
  title: string; sub: string; badge: React.ReactNode;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left group">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-200 text-sm truncate group-hover:text-white transition-colors">{title}</p>
        <p className="text-slate-600 text-xs truncate">{sub}</p>
      </div>
      {badge}
    </button>
  );
}

