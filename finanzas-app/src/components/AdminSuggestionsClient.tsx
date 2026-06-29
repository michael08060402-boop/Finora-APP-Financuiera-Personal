"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquarePlus, User, CheckCheck, Eye, Clock } from "lucide-react";
import clsx from "clsx";

type Suggestion = {
  id:        string;
  title:     string;
  message:   string;
  status:    string;
  createdAt: string;
  user:      { name: string | null; email: string; image: string | null };
};

const STATUS = {
  pending:     { label: "Pendiente",    color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: Clock     },
  reviewed:    { label: "Revisado",     color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", icon: Eye       },
  implemented: { label: "Implementado", color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20",icon: CheckCheck},
} as const;

type StatusKey = keyof typeof STATUS;

export default function AdminSuggestionsClient() {
  const [items,    setItems]    = useState<Suggestion[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [filter,   setFilter]   = useState<StatusKey | "all">("all");

  useEffect(() => {
    fetch("/api/admin/suggestions")
      .then(r => r.json())
      .then(d => { setItems(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: StatusKey) => {
    setActingId(id);
    const res  = await fetch(`/api/admin/suggestions/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status }),
    });
    if (res.ok) setItems(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    setActingId(null);
  };

  const counts = {
    all:         items.length,
    pending:     items.filter(s => s.status === "pending").length,
    reviewed:    items.filter(s => s.status === "reviewed").length,
    implemented: items.filter(s => s.status === "implemented").length,
  };

  const filtered = filter === "all" ? items : items.filter(s => s.status === filter);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <div className="min-h-screen p-6" style={{ background: "#080b14" }}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center">
            <MessageSquarePlus size={16} className="text-indigo-400" />
          </div>
          <h1 className="text-white font-bold text-2xl">Sugerencias</h1>
        </div>
        <p className="text-slate-500 text-sm">Mejoras e ideas enviadas por los usuarios</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {(["all", "pending", "reviewed", "implemented"] as const).map(k => {
          const cfg = k === "all"
            ? { label: "Total", color: "text-white", bg: "bg-white/5", border: "border-white/10" }
            : { label: STATUS[k].label, color: STATUS[k].color, bg: STATUS[k].bg, border: STATUS[k].border };
          return (
            <button key={k} onClick={() => setFilter(k)}
              className={clsx(
                "rounded-2xl border p-4 text-left transition-all",
                cfg.bg, cfg.border,
                filter === k ? "ring-1 ring-white/20" : "opacity-70 hover:opacity-100"
              )}>
              <p className={clsx("font-bold text-2xl", cfg.color)}>{counts[k]}</p>
              <p className="text-slate-500 text-xs mt-0.5">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-indigo-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-600 text-sm">No hay sugerencias en esta categoría</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const st = STATUS[s.status as StatusKey] ?? STATUS.pending;
            const St = st.icon;
            return (
              <div key={s.id} className="rounded-2xl border border-white/5 p-5"
                style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    {/* User */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="relative w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <User size={11} className="text-slate-500" />
                        {s.user.image && (
                          <img src={s.user.image} className="absolute inset-0 w-6 h-6 object-cover rounded-lg" alt=""
                            referrerPolicy="no-referrer"
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        )}
                      </div>
                      <span className="text-slate-400 text-xs">{s.user.name ?? s.user.email}</span>
                      <span className="text-slate-600 text-xs">·</span>
                      <span className="text-slate-600 text-xs">{fmtDate(s.createdAt)}</span>
                    </div>
                    {/* Title */}
                    <p className="text-white font-semibold text-sm mb-1">{s.title}</p>
                    {/* Message */}
                    <p className="text-slate-400 text-sm leading-relaxed">{s.message}</p>
                  </div>

                  {/* Status + actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={clsx(
                      "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium",
                      st.bg, st.border, st.color
                    )}>
                      <St size={11} /> {st.label}
                    </span>

                    {s.status !== "implemented" && (
                      <div className="flex gap-1.5">
                        {s.status === "pending" && (
                          <button
                            onClick={() => updateStatus(s.id, "reviewed")}
                            disabled={actingId === s.id}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 transition-all disabled:opacity-50">
                            {actingId === s.id ? <Loader2 size={11} className="animate-spin" /> : <Eye size={11} />}
                            Marcar revisado
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus(s.id, "implemented")}
                          disabled={actingId === s.id}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-50">
                          {actingId === s.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCheck size={11} />}
                          Implementado
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
