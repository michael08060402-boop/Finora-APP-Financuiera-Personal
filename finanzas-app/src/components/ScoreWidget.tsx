"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, PiggyBank, Target, Loader2, Info } from "lucide-react";

type ScoreData = {
  total: number;
  savingsScore: number;
  budgetScore: number;
  goalScore: number;
  income: number;
  expense: number;
  budgetCount: number;
  goalCount: number;
};

function scoreLabel(n: number): { label: string; color: string; bg: string } {
  if (n >= 85) return { label: "Excelente",   color: "#10b981", bg: "rgba(16,185,129,0.12)" };
  if (n >= 65) return { label: "Bueno",        color: "#6366f1", bg: "rgba(99,102,241,0.12)" };
  if (n >= 45) return { label: "Regular",      color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  return              { label: "Por mejorar",  color: "#ef4444", bg: "rgba(239,68,68,0.12)"  };
}

function Arc({ pct, color }: { pct: number; color: string }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const sweep = circ * 0.75;
  const dash = (pct / 100) * sweep;

  return (
    <svg width="140" height="105" viewBox="0 0 140 105" className="overflow-visible">
      <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)"
        strokeWidth="10" strokeDasharray={`${sweep} ${circ}`}
        strokeDashoffset={circ * 0.125} strokeLinecap="round" />
      <motion.circle cx="70" cy="70" r={r} fill="none" stroke={color}
        strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ * 0.125}
        strokeLinecap="round"
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${dash} ${circ}` }}
        transition={{ duration: 1.2, ease: "easeOut" }} />
    </svg>
  );
}

export default function ScoreWidget() {
  const [data, setData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    fetch("/api/score")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="rounded-2xl border border-white/5 p-5 flex items-center justify-center h-48"
      style={{ background: "rgba(255,255,255,0.02)" }}>
      <Loader2 size={22} className="animate-spin text-emerald-500" />
    </div>
  );

  if (!data) return null;

  const { label, color, bg } = scoreLabel(data.total);

  const breakdown = [
    { icon: TrendingUp, label: "Ahorro",        score: data.savingsScore, max: 40, color: "#10b981",
      tip: data.income === 0 ? "Registra ingresos este mes" : "Ahorra 20% de tus ingresos para 40 pts" },
    { icon: PiggyBank,  label: "Presupuestos",  score: data.budgetScore,  max: 40, color: "#6366f1",
      tip: data.budgetCount === 0 ? "Crea presupuestos para sumar pts" : `${data.budgetCount} presupuesto${data.budgetCount > 1 ? "s" : ""} este mes` },
    { icon: Target,     label: "Metas",         score: data.goalScore,    max: 20, color: "#ec4899",
      tip: data.goalCount === 0 ? "Crea metas de ahorro para sumar pts" : `${data.goalCount} meta${data.goalCount > 1 ? "s" : ""} activa${data.goalCount > 1 ? "s" : ""}` },
  ];

  return (
    <div className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <p className="text-white font-semibold text-sm">Score Financiero</p>
          <button onClick={() => setShowTip(!showTip)} className="text-slate-600 hover:text-slate-400">
            <Info size={13} />
          </button>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-lg font-semibold" style={{ background: bg, color }}>
          {label}
        </span>
      </div>

      {showTip && (
        <p className="text-slate-500 text-xs mb-4 leading-relaxed border border-white/5 rounded-xl px-3 py-2 bg-white/2">
          Puntaje basado en 3 factores este mes: ahorro (40 pts), cumplimiento de presupuestos (40 pts) y progreso de metas (20 pts).
        </p>
      )}

      <div className="flex items-center justify-center relative -mb-2">
        <Arc pct={data.total} color={color} />
        <div className="absolute top-8 flex flex-col items-center">
          <motion.span className="font-bold text-3xl text-white"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            {data.total}
          </motion.span>
          <span className="text-slate-500 text-xs">/ 100</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-3">
        {breakdown.map(({ icon: Icon, label, score, max, color: c, tip }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${c}18` }}>
              <Icon size={11} style={{ color: c }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-slate-400 text-xs">{label}</span>
                <span className="text-white text-xs font-semibold">{score}<span className="text-slate-600">/{max}</span></span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: c }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(score / max) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }} />
              </div>
              <p className="text-slate-600 text-[10px] mt-0.5 truncate">{tip}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
