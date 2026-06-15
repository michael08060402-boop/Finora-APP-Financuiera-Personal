"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, AlertOctagon, X } from "lucide-react";

type BudgetAlert = { category: string; pct: number; exceeded: boolean };

export default function BudgetAlertsBanner() {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    Promise.all([
      fetch(`/api/budgets?month=${month}&year=${year}`).then(r => r.json()),
      fetch("/api/transactions").then(r => r.json()),
    ]).then(([budgets, txs]) => {
      const spendMap: Record<string, number> = {};
      (txs as { type: string; category: string; amount: number; date: string }[])
        .filter(t => {
          const d = new Date(t.date);
          return t.type === "expense" && d.getMonth() + 1 === month && d.getFullYear() === year;
        })
        .forEach(t => { spendMap[t.category] = (spendMap[t.category] ?? 0) + t.amount; });

      const result: BudgetAlert[] = (budgets as { category: string; amount: number }[])
        .map(b => ({ category: b.category, pct: Math.round(((spendMap[b.category] ?? 0) / b.amount) * 100), exceeded: (spendMap[b.category] ?? 0) > b.amount }))
        .filter(b => b.pct >= 80)
        .sort((a, b) => b.pct - a.pct);

      setAlerts(result);
    }).catch(() => {});
  }, []);

  if (dismissed || alerts.length === 0) return null;

  const exceeded = alerts.filter(a => a.exceeded);
  const warning  = alerts.filter(a => !a.exceeded);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
        className="flex flex-col gap-2">
        {exceeded.length > 0 && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 flex items-start gap-3">
            <AlertOctagon size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-red-300 text-sm font-semibold">Presupuesto excedido este mes</p>
              <p className="text-red-400/70 text-xs mt-0.5 truncate">
                {exceeded.map(a => `${a.category} (${a.pct}%)`).join(" - ")}
              </p>
            </div>
            <button onClick={() => setDismissed(true)} className="text-red-500/50 hover:text-red-400 flex-shrink-0">
              <X size={14} />
            </button>
          </div>
        )}
        {warning.length > 0 && (
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 flex items-start gap-3">
            <AlertTriangle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-amber-300 text-sm font-semibold">Cerca del limite de presupuesto</p>
              <p className="text-amber-400/70 text-xs mt-0.5 truncate">
                {warning.map(a => `${a.category} (${a.pct}%)`).join(" - ")}
              </p>
            </div>
            <button onClick={() => setDismissed(true)} className="text-amber-500/50 hover:text-amber-400 flex-shrink-0">
              <X size={14} />
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
