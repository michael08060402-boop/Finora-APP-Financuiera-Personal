"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const benefits = [
  "Dashboard personalizado en tiempo real",
  "Presupuestos y metas de ahorro",
  "Reportes y gráficas detalladas",
  "100% seguro y privado",
];

const floatingCards = [
  { label: "Balance total", value: "+$12,400", color: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-500/20", top: "18%", left: "62%", delay: 0 },
  { label: "Meta de ahorro", value: "72% logrado", color: "from-violet-500/20 to-purple-500/20", border: "border-violet-500/20", top: "52%", left: "66%", delay: 1.5 },
  { label: "Gastos este mes", value: "-$890", color: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/20", top: "76%", left: "58%", delay: 3 },
];

const passwordRules = [
  { label: "Al menos 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Una letra mayúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Un número", test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setIsLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Ocurrió un error");
      return;
    }

    router.push("/login?registered=1");
  };

  const strength = passwordRules.filter((r) => r.test(form.password)).length;
  const strengthColors = ["bg-red-500", "bg-amber-500", "bg-emerald-500"];

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: "#080b14" }}>
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden" style={{ background: "linear-gradient(160deg, #081a0f 0%, #0a1a10 50%, #08100a 100%)" }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(16,185,129,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 20%, rgba(99,102,241,0.08) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 480,
            height: 480,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex items-center gap-3"
        >
          <Image src="/logo.png" alt="Finora" width={58} height={58} className="rounded-xl" />
          <span className="text-white font-bold text-3xl tracking-tight">Finora</span>
        </motion.div>

        <div className="relative z-10 flex flex-col gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <p className="text-emerald-400 text-base font-semibold uppercase tracking-widest mb-3">
              Empieza hoy
            </p>
            <h1 className="text-white font-bold leading-tight" style={{ fontSize: "clamp(2.4rem, 3.5vw, 3.6rem)" }}>
              Crea tu cuenta <br />
              <span className="shimmer-text">en segundos</span>
            </h1>
            <p className="text-slate-400 mt-4 text-lg leading-relaxed max-w-sm">
              Únete a miles de personas que ya controlan su dinero de forma inteligente.
            </p>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col gap-3"
          >
            {benefits.map((b, i) => (
              <motion.li
                key={b}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3 text-slate-300 text-base"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                  <Check size={11} className="text-emerald-400" />
                </div>
                {b}
              </motion.li>
            ))}
          </motion.ul>
        </div>

        {/* Floating stat cards */}
        {floatingCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 + i * 0.15 }}
            className={`float-${i + 1} absolute glass-card rounded-2xl px-4 py-3 bg-gradient-to-br ${card.color} border ${card.border}`}
            style={{ top: card.top, left: card.left, zIndex: 1 }}
          >
            <p className="text-slate-400 text-xs uppercase tracking-wider">{card.label}</p>
            <p className="text-white font-bold text-lg mt-0.5">{card.value}</p>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          <p className="text-slate-600 text-xs">Seguro · Privado · Tuyo</p>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        </motion.div>
      </div>

      {/* DIVIDER */}
      <div className="hidden lg:block w-px flex-shrink-0" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(16,185,129,0.15) 25%, rgba(16,185,129,0.35) 50%, rgba(16,185,129,0.15) 75%, transparent 100%)" }} />

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(16,185,129,0.04) 0%, transparent 70%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Image src="/logo.png" alt="Finora" width={34} height={34} className="rounded-lg" />
            <span className="text-white font-bold">Finora</span>
          </div>

          <div className="glass-card rounded-3xl p-8 lg:p-10">
            <div className="mb-7">
              <h2 className="text-white font-bold text-2xl lg:text-3xl leading-tight">Crear cuenta</h2>
              <p className="text-slate-400 mt-2 text-base">Es gratis, siempre</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 text-sm font-medium">Nombre completo</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="Juan Pérez"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field w-full rounded-xl pl-11 pr-4 py-3.5 text-white text-sm placeholder-slate-600"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 text-sm font-medium">Correo electrónico</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="tu@correo.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field w-full rounded-xl pl-11 pr-4 py-3.5 text-white text-sm placeholder-slate-600"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 text-sm font-medium">Contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input-field w-full rounded-xl pl-11 pr-12 py-3.5 text-white text-sm placeholder-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password strength */}
                {form.password.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-col gap-2 mt-1">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? strengthColors[strength - 1] : "bg-slate-800"}`}
                        />
                      ))}
                    </div>
                    <div className="flex flex-col gap-1">
                      {passwordRules.map((r) => (
                        <div key={r.label} className="flex items-center gap-2">
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${r.test(form.password) ? "bg-emerald-500" : "bg-slate-800 border border-slate-700"}`}>
                            {r.test(form.password) && <Check size={8} className="text-white" />}
                          </div>
                          <span className={`text-xs transition-colors ${r.test(form.password) ? "text-slate-300" : "text-slate-600"}`}>{r.label}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" required className="mt-0.5 accent-emerald-500" />
                <span className="text-slate-400 text-xs leading-relaxed">
                  Acepto los{" "}
                  <a href="#" className="text-emerald-400 hover:text-emerald-300 transition-colors">Términos de Servicio</a>
                  {" "}y la{" "}
                  <a href="#" className="text-emerald-400 hover:text-emerald-300 transition-colors">Política de Privacidad</a>
                </span>
              </label>

              {/* Error */}
              {error && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                  {error}
                </p>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full rounded-xl py-3.5 text-white font-semibold text-sm flex items-center justify-center gap-2 mt-1"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Crear mi cuenta
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </form>

            <p className="text-center text-slate-500 text-sm mt-6">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

