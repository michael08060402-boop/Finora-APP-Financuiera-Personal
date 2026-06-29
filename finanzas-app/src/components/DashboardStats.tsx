"use client";

import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import Link from "next/link";
import { useConfig } from "./ConfigProvider";
import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

type Tx = { id: string; description: string; amount: number; type: string; category: string; date: Date };

function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => format(v));

  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.2, ease: "easeOut" });
    return controls.stop;
  }, [value, mv]);

  return <motion.span>{display}</motion.span>;
}

export default function DashboardStats({
  totalIncome, totalExpense, balance, recent, greeting,
}: {
  totalIncome: number; totalExpense: number; balance: number;
  recent: Tx[]; greeting: string;
}) {
  const { formatAmount: fmt, t } = useConfig();
  const fmtDate = (d: Date) => new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });

  return (
    <>
      {/* Header */}
      <div>
        <h1 className="text-white font-bold text-2xl">{t("dash_greeting")}, {greeting}</h1>
        <p className="text-slate-400 mt-0.5 text-sm">{t("dash_subtitle")}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t("dash_total_balance"), raw: balance,      color: balance >= 0 ? "text-emerald-400" : "text-red-400", icon: Wallet,      bg: "border-white/5"      },
          { label: t("dash_total_income"),  raw: totalIncome,  color: "text-emerald-400",                                  icon: TrendingUp,  bg: "border-emerald-500/20" },
          { label: t("dash_total_expense"), raw: totalExpense, color: "text-red-400",                                      icon: TrendingDown, bg: "border-red-500/20"   },
        ].map((c) => (
          <div key={c.label} className={`rounded-2xl p-5 border ${c.bg}`} style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-400 text-sm">{c.label}</p>
              <c.icon size={16} className="text-slate-600" />
            </div>
            <p className={`font-bold text-2xl ${c.color}`}>
              <CountUp value={c.raw} format={fmt} />
            </p>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-white font-semibold text-sm">{t("dash_recent")}</h2>
          <Link href="/transacciones" className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors">{t("dash_see_all")}</Link>
        </div>
        {recent.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-slate-500 text-sm">{t("dash_no_txs")}</p>
            <Link href="/transacciones" className="text-emerald-400 text-sm mt-1 inline-block hover:text-emerald-300">{t("dash_add_one")}</Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recent.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.06 }}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === "income" ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                    {tx.type === "income" ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-red-400" />}
                  </div>
                  <div>
                    <p className="text-slate-200 text-sm font-medium">{tx.description}</p>
                    <p className="text-slate-500 text-xs">{tx.category} · {fmtDate(tx.date)}</p>
                  </div>
                </div>
                <span className={`font-bold text-sm ${tx.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                  {tx.type === "expense" ? "-" : "+"}{fmt(tx.amount)}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
