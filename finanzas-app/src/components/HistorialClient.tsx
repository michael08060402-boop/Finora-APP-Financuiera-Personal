"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowLeftRight, PiggyBank, Target, Wallet, Plus, Pencil, Trash2, Clock } from "lucide-react";
import clsx from "clsx";
import { useConfig } from "./ConfigProvider";

type Log = { id: string; action: string; entity: string; description: string; createdAt: string };

const ENTITY_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  transaction: { icon: ArrowLeftRight, color: "#6366f1", bg: "rgba(99,102,241,0.12)", label: "Transacción" },
  budget:      { icon: PiggyBank,     color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Presupuesto"  },
  goal:        { icon: Target,        color: "#ec4899", bg: "rgba(236,72,153,0.12)", label: "Meta"         },
  wallet:      { icon: Wallet,        color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "Cuenta"       },
};

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  created: { icon: Plus,    color: "#10b981", label: "Creado"    },
  updated: { icon: Pencil,  color: "#6366f1", label: "Editado"   },
  deleted: { icon: Trash2,  color: "#ef4444", label: "Eliminado" },
};

function relativeTime(iso: string): string {
  const now = Date.now();
  const d = new Date(iso).getTime();
  const diff = now - d;
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1)  return "Ahora mismo";
  if (mins  < 60)  return `Hace ${mins} min`;
  if (hours < 24)  return `Hace ${hours} h`;
  if (days  === 1) return "Ayer";
  if (days  <  7)  return `Hace ${days} días`;
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today    = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const itemDay   = new Date(d);    itemDay.setHours(0,0,0,0);
  if (itemDay.getTime() === today.getTime())     return "Hoy";
  if (itemDay.getTime() === yesterday.getTime()) return "Ayer";
  const diffDays = Math.floor((today.getTime() - itemDay.getTime()) / 86_400_000);
  if (diffDays < 7)  return "Esta semana";
  if (diffDays < 14) return "Hace dos semanas";
  return d.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
}

export default function HistorialClient() {
  const { t } = useConfig();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "transaction" | "budget" | "goal" | "wallet">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/activity");
      if (!res.ok) { setLogs([]); return; }
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? logs : logs.filter(l => l.entity === filter);

  // Agrupar por día
  const groups: { label: string; items: Log[] }[] = [];
  filtered.forEach(log => {
    const lbl = dayLabel(log.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === lbl) { last.items.push(log); }
    else { groups.push({ label: lbl, items: [log] }); }
  });

  return (
    <div className="flex-1 min-h-screen" style={{ background: "#080b14" }}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-white font-bold text-2xl">{t("his_title")}</h1>
        </div>
        <p className="text-slate-500 text-sm">{t("his_subtitle")}</p>

        {/* Filtros */}
        <div className="flex gap-2 mt-5 flex-wrap">
          {([
            ["all",         "Todos"        ],
            ["transaction", "Transacciones"],
            ["budget",      "Presupuestos" ],
            ["goal",        "Metas"        ],
            ["wallet",      "Cuentas"      ],
          ] as const).map(([val, lbl]) => (
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

      {/* Timeline */}
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={28} className="animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Clock size={22} className="text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">Sin actividad registrada</p>
            <p className="text-slate-600 text-sm mt-1 leading-relaxed">
              Crea una transacción, presupuesto, meta o cuenta y aparecerá aquí automáticamente.
            </p>
            <p className="text-slate-700 text-xs mt-3 px-4 py-2 rounded-xl bg-white/3 border border-white/5">
              Si el historial no aparece, asegúrate de haber ejecutado la migración de base de datos.
            </p>
          </div>
        ) : (
          <div className="max-w-2xl flex flex-col gap-8">
            {groups.map(group => (
              <div key={group.label}>
                {/* Day separator */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{group.label}</span>
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-slate-700 text-xs">{group.items.length} acción{group.items.length > 1 ? "es" : ""}</span>
                </div>

                {/* Items */}
                <div className="flex flex-col gap-2">
                  {group.items.map((log, i) => {
                    const entity = ENTITY_CONFIG[log.entity] ?? ENTITY_CONFIG.transaction;
                    const action = ACTION_CONFIG[log.action] ?? ACTION_CONFIG.created;
                    const EntityIcon = entity.icon;
                    const ActionIcon = action.icon;

                    return (
                      <motion.div key={log.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-start gap-4 rounded-2xl border border-white/5 p-4 group"
                        style={{ background: "rgba(255,255,255,0.02)" }}>

                        {/* Entity icon */}
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: entity.bg }}>
                          <EntityIcon size={18} style={{ color: entity.color }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-200 text-sm leading-snug">{log.description}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            {/* Action badge */}
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md"
                              style={{ background: `${action.color}14`, color: action.color }}>
                              <ActionIcon size={10} />
                              {action.label}
                            </span>
                            {/* Entity badge */}
                            <span className="text-xs px-2 py-0.5 rounded-md"
                              style={{ background: entity.bg, color: entity.color }}>
                              {entity.label}
                            </span>
                          </div>
                        </div>

                        {/* Time */}
                        <span className="text-slate-600 text-xs flex-shrink-0 mt-0.5 group-hover:text-slate-400 transition-colors">
                          {relativeTime(log.createdAt)}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}

            {logs.length === 100 && (
              <p className="text-slate-600 text-xs text-center">
                Mostrando los últimos 100 registros
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

