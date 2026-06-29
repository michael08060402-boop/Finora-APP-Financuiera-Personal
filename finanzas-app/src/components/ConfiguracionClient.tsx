"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, Globe, Bell, Shield, CheckCircle, Loader2 } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { useConfig } from "./ConfigProvider";

const CURRENCIES = [
  { code: "PEN", symbol: "S/.", name: "Sol peruano",          color: "#10b981" },
  { code: "USD", symbol: "$",   name: "Dólar estadounidense", color: "#6366f1" },
  { code: "EUR", symbol: "€",   name: "Euro",                 color: "#f59e0b" },
  { code: "MXN", symbol: "$",   name: "Peso mexicano",        color: "#ef4444" },
  { code: "COP", symbol: "$",   name: "Peso colombiano",      color: "#06b6d4" },
];

const STORAGE_KEY = "Finora_config";

function loadConfig() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function ConfiguracionClient() {
  const { t } = useConfig();
  const [currency,      setCurrency]      = useState("PEN");
  const [language,      setLanguage]      = useState("es");
  const [notifications, setNotifications] = useState({ budget: true, goals: true, weekly: false });
  const [status,        setStatus]        = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    const saved = loadConfig();
    if (saved) {
      if (saved.currency)      setCurrency(saved.currency);
      if (saved.language)      setLanguage(saved.language);
      if (saved.notifications) setNotifications(saved.notifications);
    }
  }, []);

  const handleSave = async () => {
    setStatus("saving");
    await new Promise(r => setTimeout(r, 400));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ currency, language, notifications }));
    window.dispatchEvent(new Event("Finora-config-update"));
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 3000);
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === currency);

  return (
    <div className="flex-1 min-h-screen" style={{ background: "#080b14" }}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-white/5">
        <h1 className="text-white font-bold text-2xl">{t("cfg_title")}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t("cfg_subtitle")}</p>
      </div>

      <div className="px-4 sm:px-6 py-5">
        {status === "saved" && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm mb-5">
            <CheckCircle size={16} /> Configuración guardada correctamente
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">

            {/* Currency */}
            <div className="rounded-2xl border border-white/5 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign size={16} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">Moneda</h2>
                  <p className="text-slate-500 text-xs">Moneda para mostrar tus finanzas</p>
                </div>
                {selectedCurrency && (
                  <span className="ml-auto text-xs px-2.5 py-1 rounded-lg font-bold"
                    style={{ background: `${selectedCurrency.color}18`, color: selectedCurrency.color, border: `1px solid ${selectedCurrency.color}30` }}>
                    {selectedCurrency.code}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {CURRENCIES.map(c => (
                  <button key={c.code} onClick={() => setCurrency(c.code)}
                    className={clsx("flex items-center justify-between px-4 py-3 rounded-xl border transition-all",
                      currency === c.code
                        ? "border-white/20 bg-white/5"
                        : "border-white/5 hover:border-white/10 hover:bg-white/5")}
                    style={currency === c.code ? { borderColor: `${c.color}50`, background: `${c.color}0d` } : {}}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{ background: `${c.color}18`, color: c.color }}>
                        {c.symbol}
                      </div>
                      <div className="text-left">
                        <p className="text-slate-200 text-sm">{c.name}</p>
                        <p className="text-slate-500 text-xs">{c.code}</p>
                      </div>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0"
                      style={currency === c.code
                        ? { borderColor: c.color, background: c.color }
                        : { borderColor: "rgba(255,255,255,0.2)" }}>
                      {currency === c.code && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Language */}
            <div className="rounded-2xl border border-white/5 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Globe size={16} className="text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">Idioma</h2>
                  <p className="text-slate-500 text-xs">Idioma de la interfaz</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { code: "es", label: "Español", flag: "🇪🇸", desc: "Interfaz en español" },
                  { code: "en", label: "English", flag: "🇺🇸", desc: "Interface in English" },
                ].map(l => (
                  <button key={l.code} onClick={() => setLanguage(l.code)}
                    className={clsx("flex flex-col items-start px-4 py-3.5 rounded-xl border text-sm font-medium transition-all",
                      language === l.code
                        ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
                        : "border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-300")}>
                    <span className="text-xl mb-1">{l.flag}</span>
                    <span className="font-semibold">{l.label}</span>
                    <span className="text-xs opacity-60 mt-0.5 font-normal">{l.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-5">

            {/* Notifications */}
            <div className="rounded-2xl border border-white/5 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Bell size={16} className="text-amber-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">Notificaciones</h2>
                  <p className="text-slate-500 text-xs">Qué alertas quieres recibir</p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {[
                  { key: "budget", label: "Alertas de presupuesto", desc: "Cuando te acercas al límite mensual" },
                  { key: "goals",  label: "Progreso de metas",      desc: "Actualizaciones de tus objetivos de ahorro" },
                  { key: "weekly", label: "Resumen semanal",         desc: "Informe de gastos cada semana" },
                ].map(({ key, label, desc }) => {
                  const on = notifications[key as keyof typeof notifications];
                  return (
                    <div key={key}
                      className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-white/3 transition-colors">
                      <div>
                        <p className="text-slate-200 text-sm font-medium">{label}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifications(n => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                        className={clsx("relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4",
                          on ? "bg-emerald-500" : "bg-white/10")}>
                        <div className={clsx("absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                          on ? "left-6" : "left-1")} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Account */}
            <div className="rounded-2xl border border-white/5 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-slate-500/10 flex items-center justify-center">
                  <Shield size={16} className="text-slate-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">Cuenta y seguridad</h2>
                  <p className="text-slate-500 text-xs">Gestiona tu información personal</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Cambiar contraseña",    desc: "Actualiza tu contraseña de acceso" },
                  { label: "Cambiar foto de perfil", desc: "Selecciona un avatar o emoji" },
                  { label: "Actualizar nombre",      desc: "Cómo te mostramos en la app" },
                ].map(({ label, desc }) => (
                  <Link key={label} href="/perfil"
                    className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group">
                    <div>
                      <p className="text-slate-200 text-sm">{label}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                    </div>
                    <span className="text-slate-600 group-hover:text-slate-400 transition-colors text-xs">→</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Save */}
            <button onClick={handleSave} disabled={status === "saving"}
              className="btn-primary w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
              {status === "saving"
                ? <><Loader2 size={15} className="animate-spin" /> Guardando...</>
                : "Guardar configuración"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
