"use client";

import { useState } from "react";
import { MessageSquarePlus, Send, CheckCircle2, Loader2, Lightbulb, Bug, Sparkles } from "lucide-react";
import clsx from "clsx";

const CATEGORIES = [
  { icon: Lightbulb, label: "Mejora",        value: "Mejora de funcionalidad" },
  { icon: Bug,       label: "Error",          value: "Reporte de error"        },
  { icon: Sparkles,  label: "Nueva función",  value: "Nueva función"           },
];

export default function SugerenciasClient() {
  const [title,    setTitle]    = useState("");
  const [message,  setMessage]  = useState("");
  const [category, setCategory] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setLoading(true);
    setError("");
    try {
      const fullTitle = category ? `[${category}] ${title}` : title;
      const res = await fetch("/api/suggestions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title: fullTitle, message }),
      });
      if (res.ok) {
        setSuccess(true);
        setTitle(""); setMessage(""); setCategory("");
      } else {
        const d = await res.json();
        setError(d.error ?? "Error al enviar la sugerencia");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 flex items-center justify-center">
            <MessageSquarePlus size={18} className="text-indigo-400" />
          </div>
          <h1 className="text-white font-bold text-2xl">Sugerencias</h1>
        </div>
        <p className="text-slate-500 text-sm">
          ¿Tienes una idea para mejorar Finora? Nos encantaría escucharla.
          Tu sugerencia llega directamente al equipo.
        </p>
      </div>

      {success ? (
        <div className="rounded-2xl border border-emerald-500/20 p-8 text-center"
          style={{ background: "rgba(16,185,129,0.04)" }}>
          <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
          <h2 className="text-white font-bold text-lg mb-1">¡Sugerencia enviada!</h2>
          <p className="text-slate-400 text-sm mb-5">
            Gracias por tu aporte. El equipo revisará tu sugerencia pronto.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="px-5 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-all">
            Enviar otra sugerencia
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category chips */}
          <div>
            <p className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wider">Tipo</p>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(({ icon: Icon, label, value }) => (
                <button key={value} type="button"
                  onClick={() => setCategory(category === value ? "" : value)}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all",
                    category === value
                      ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-300"
                      : "border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/5"
                  )}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Poder filtrar por rango de fechas"
              maxLength={120}
              required
              className="input-field w-full px-4 py-3 rounded-xl text-white text-sm placeholder-slate-600"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-slate-400 text-xs font-medium uppercase tracking-wider block mb-2">
              Descripción
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe con detalle tu sugerencia o el problema que encontraste..."
              rows={5}
              maxLength={1000}
              required
              className="input-field w-full px-4 py-3 rounded-xl text-white text-sm placeholder-slate-600 resize-none"
            />
            <p className="text-slate-600 text-xs mt-1 text-right">{message.length}/1000</p>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !title.trim() || !message.trim()}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-medium text-sm hover:bg-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Enviar sugerencia
          </button>
        </form>
      )}
    </div>
  );
}
