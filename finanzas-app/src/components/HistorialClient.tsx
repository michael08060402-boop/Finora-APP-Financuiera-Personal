"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowLeftRight, PiggyBank, Target, Wallet, Plus, Pencil, Trash2, Clock, TrendingUp } from "lucide-react";
import clsx from "clsx";
import { useConfig } from "./ConfigProvider";

type Log = { id: string; action: string; entity: string; description: string; createdAt: string };

const ENTITY_BASE: Record<string, { icon: React.ElementType; color: string; bg: string; tkey: string }> = {
  transaction: { icon: ArrowLeftRight, color: "#6366f1", bg: "rgba(99,102,241,0.12)",  tkey: "entity_transaction" },
  budget:      { icon: PiggyBank,      color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  tkey: "entity_budget"      },
  goal:        { icon: Target,         color: "#ec4899", bg: "rgba(236,72,153,0.12)",  tkey: "entity_goal"        },
  wallet:      { icon: Wallet,         color: "#10b981", bg: "rgba(16,185,129,0.12)",  tkey: "entity_wallet"      },
};

const ACTION_BASE: Record<string, { icon: React.ElementType; color: string; tkey: string }> = {
  created: { icon: Plus,   color: "#10b981", tkey: "action_created" },
  updated: { icon: Pencil, color: "#6366f1", tkey: "action_updated" },
  deleted: { icon: Trash2, color: "#ef4444", tkey: "action_deleted" },
};

function relativeTime(iso: string, lang: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  const en = lang === "en";
  if (mins  <  1)  return en ? "Just now"           : "Ahora mismo";
  if (mins  < 60)  return en ? `${mins} min ago`    : `Hace ${mins} min`;
  if (hours < 24)  return en ? `${hours} h ago`     : `Hace ${hours} h`;
  if (days  === 1) return en ? "Yesterday"           : "Ayer";
  if (days  <  7)  return en ? `${days} days ago`   : `Hace ${days} días`;
  return new Date(iso).toLocaleDateString(en ? "en-US" : "es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

function dayLabel(iso: string, lang: string): string {
  const d         = new Date(iso);
  const today     = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const itemDay   = new Date(d);    itemDay.setHours(0,0,0,0);
  const en = lang === "en";
  if (itemDay.getTime() === today.getTime())     return en ? "Today"          : "Hoy";
  if (itemDay.getTime() === yesterday.getTime()) return en ? "Yesterday"      : "Ayer";
  const diffDays = Math.floor((today.getTime() - itemDay.getTime()) / 86_400_000);
  if (diffDays < 7)  return en ? "This week"      : "Esta semana";
  if (diffDays < 14) return en ? "Two weeks ago"  : "Hace dos semanas";
  return d.toLocaleDateString(en ? "en-US" : "es-PE", { month: "long", year: "numeric" });
}

export default function HistorialClient() {
  const { t, lang } = useConfig();

  const ENTITY_CONFIG = Object.fromEntries(
    Object.entries(ENTITY_BASE).map(([k, v]) => [k, { ...v, label: t(v.tkey as Parameters<typeof t>[0]) }])
  );
  const ACTION_CONFIG = Object.fromEntries(
    Object.entries(ACTION_BASE).map(([k, v]) => [k, { ...v, label: t(v.tkey as Parameters<typeof t>[0]) }])
  );
  const [logs,    setLogs]    = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<"all" | "transaction" | "budget" | "goal" | "wallet">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/activity");
      const data = res.ok ? await res.json() : [];
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? logs : logs.filter(l => l.entity === filter);

  const groups: { label: string; items: Log[] }[] = [];
  filtered.forEach(log => {
    const lbl  = dayLabel(log.createdAt, lang);
    const last = groups[groups.length - 1];
    if (last && last.label === lbl) last.items.push(log);
    else groups.push({ label: lbl, items: [log] });
  });

  // Stats derived from all logs
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayCount  = logs.filter(l => {
    const d = new Date(l.createdAt); d.setHours(0,0,0,0);
    return d.getTime() === todayStart.getTime();
  }).length;
  const weekCount   = logs.filter(l => {
    const d = Math.floor((Date.now() - new Date(l.createdAt).getTime()) / 86_400_000);
    return d < 7;
  }).length;

  const entityCounts = Object.keys(ENTITY_CONFIG).map(key => ({
    key,
    ...ENTITY_CONFIG[key],
    count: logs.filter(l => l.entity === key).length,
  }));

  const actionCounts = Object.keys(ACTION_CONFIG).map(key => ({
    key,
    ...ACTION_CONFIG[key],
    count: logs.filter(l => l.action === key).length,
  }));

  return (
    <div className="flex-1 min-h-screen" style={{ background: "#080b14" }}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-white/5">
        <h1 className="text-white font-bold text-2xl">{t("his_title")}</h1>
        <p className="text-slate-500 text-sm">{t("his_subtitle")}</p>
        <div className="flex gap-2 mt-4 flex-wrap">
          {(([
            ["all",         t("his_filter_all")   ],
            ["transaction", t("nav_transactions") ],
            ["budget",      t("nav_budgets")      ],
            ["goal",        t("nav_goals")        ],
            ["wallet",      t("nav_accounts")     ],
          ]) as Array<[typeof filter, string]>).map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={clsx("px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all border",
                filter === val
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10")}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Body: timeline + stats sidebar */}
      <div className="px-4 sm:px-6 py-5 flex gap-6">

        {/* ── Timeline ── */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 size={28} className="animate-spin text-emerald-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <Clock size={22} className="text-slate-600" />
              </div>
              <p className="text-slate-400 font-medium">{t("his_empty")}</p>
              <p className="text-slate-600 text-sm mt-1 leading-relaxed">{t("his_empty_msg")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {groups.map(group => (
                <div key={group.label}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{group.label}</span>
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-slate-700 text-xs">{group.items.length} {lang === "en" ? (group.items.length > 1 ? "actions" : "action") : (group.items.length > 1 ? "acciones" : "acción")}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {group.items.map((log, i) => {
                      const entity     = ENTITY_CONFIG[log.entity] ?? ENTITY_CONFIG.transaction;
                      const action     = ACTION_CONFIG[log.action] ?? ACTION_CONFIG.created;
                      const EntityIcon = entity.icon;
                      const ActionIcon = action.icon;
                      return (
                        <motion.div key={log.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-start gap-4 rounded-2xl border border-white/5 p-4 group"
                          style={{ background: "rgba(255,255,255,0.02)" }}>
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: entity.bg }}>
                            <EntityIcon size={18} style={{ color: entity.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-200 text-sm leading-snug">{log.description}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md"
                                style={{ background: `${action.color}14`, color: action.color }}>
                                <ActionIcon size={10} />{action.label}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-md"
                                style={{ background: entity.bg, color: entity.color }}>
                                {entity.label}
                              </span>
                            </div>
                          </div>
                          <span className="text-slate-600 text-xs flex-shrink-0 mt-0.5 group-hover:text-slate-400 transition-colors">
                            {relativeTime(log.createdAt, lang)}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {logs.length === 100 && (
                <p className="text-slate-600 text-xs text-center pb-4">{t("his_showing_last")}</p>
              )}
            </div>
          )}
        </div>

        {/* ── Stats sidebar ── */}
        {!loading && logs.length > 0 && (
          <div className="hidden lg:flex flex-col gap-4 w-56 flex-shrink-0">

            {/* Summary */}
            <div className="rounded-2xl border border-white/5 p-4 space-y-3" style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{t("his_summary")}</p>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">{t("his_total")}</span>
                  <span className="text-white font-bold text-sm">{logs.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">{t("his_today")}</span>
                  <span className="text-emerald-400 font-semibold text-sm">{todayCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs">{t("his_this_week")}</span>
                  <span className="text-indigo-400 font-semibold text-sm">{weekCount}</span>
                </div>
              </div>
            </div>

            {/* By entity */}
            <div className="rounded-2xl border border-white/5 p-4 space-y-3" style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{t("his_by_section")}</p>
              <div className="flex flex-col gap-2.5">
                {entityCounts.filter(e => e.count > 0).map(e => {
                  const Icon = e.icon;
                  const pct  = logs.length > 0 ? (e.count / logs.length) * 100 : 0;
                  return (
                    <div key={e.key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Icon size={11} style={{ color: e.color }} />
                          <span className="text-slate-400 text-xs">{e.label}</span>
                        </div>
                        <span className="text-slate-300 text-xs font-medium">{e.count}</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/5">
                        <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: e.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By action */}
            <div className="rounded-2xl border border-white/5 p-4 space-y-3" style={{ background: "rgba(255,255,255,0.03)" }}>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                <TrendingUp size={11} /> {t("his_actions_lbl")}
              </p>
              <div className="flex flex-col gap-2">
                {actionCounts.filter(a => a.count > 0).map(a => {
                  const Icon = a.icon;
                  return (
                    <div key={a.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center"
                          style={{ background: `${a.color}18` }}>
                          <Icon size={10} style={{ color: a.color }} />
                        </div>
                        <span className="text-slate-400 text-xs">{a.label}</span>
                      </div>
                      <span className="text-slate-300 text-xs font-medium">{a.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
