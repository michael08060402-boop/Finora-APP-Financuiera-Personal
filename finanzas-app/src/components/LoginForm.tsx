"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { signIn, getSession } from "next-auth/react"; // getSession used for credentials role-check post-login

const floatingCards = [
  { label: "Ahorro mensual", value: "+$2,400", color: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-500/20", top: "10%", left: "60%", delay: 0 },
  { label: "Gastos controlados", value: "87%", color: "from-violet-500/20 to-purple-500/20", border: "border-violet-500/20", top: "50%", left: "62%", delay: 1.5 },
  { label: "Meta cumplida", value: "Vacaciones", color: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/20", top: "78%", left: "55%", delay: 3 },
];

const stats = [
  { value: "10k+", label: "Usuarios" },
  { value: "$2M+", label: "Gestionados" },
  { value: "4.9~.", label: "Valoración" },
];

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "suspended") {
      setError("Tu cuenta está suspendida. Contacta al administrador.");
    } else if (err === "OAuthAccountNotLinked") {
      setError("Este correo ya tiene cuenta con contraseña. Usa email y contraseña para entrar.");
    } else if (err) {
      setError("Error al iniciar sesión con Google. Intenta de nuevo.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const check = await fetch("/api/auth/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const { suspended } = await check.json();
      if (suspended) {
        setError("Tu cuenta está suspendida. Contacta al administrador.");
        setIsLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.error) {
        setError("Correo o contraseña incorrectos");
        setIsLoading(false);
      } else {
        const session = await getSession();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const role = (session?.user as any)?.role;
        router.push(role === "admin" ? "/admin" : "/dashboard");
        router.refresh();
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setIsLoading(false);
    }
  };

  const handleGoogle = () => signIn("google", { callbackUrl: "/auth/redirect" });

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: "#080b14" }}>
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden" style={{ background: "linear-gradient(160deg, #081a0f 0%, #0a1a10 50%, #08100a 100%)" }}>
        {/* Background gradient blobs */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(16,185,129,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 20%, rgba(99,102,241,0.08) 0%, transparent 60%)",
          }}
        />
        <div
          className="glow-pulse absolute rounded-full pointer-events-none"
          style={{
            width: 480,
            height: 480,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex items-center gap-3"
        >
          <Image src="/logo.png" alt="Finora" width={58} height={58} className="rounded-xl" />
          <span className="text-white font-bold text-3xl tracking-tight">Finora</span>
        </motion.div>

        {/* Central hero */}
        <div className="relative z-10 flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <p className="text-emerald-400 text-base font-semibold uppercase tracking-widest mb-3">
              Tu futuro financiero
            </p>
            <h1 className="text-white font-bold leading-tight" style={{ fontSize: "clamp(2.4rem, 3.5vw, 3.6rem)" }}>
              Toma el control{" "}
              <span className="shimmer-text">inteligente</span>
              <br />
              de tu dinero
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="text-slate-400 text-lg leading-relaxed max-w-sm"
          >
            Registra ingresos, controla gastos y alcanza tus metas. Todo en un solo lugar, diseñado para ti.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex gap-8 mt-2"
          >
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-white font-bold text-2xl">{s.value}</p>
                <p className="text-slate-500 text-sm mt-0.5">{s.label}</p>
              </div>
            ))}
          </motion.div>
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

        {/* Bottom decorative line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          <p className="text-slate-600 text-xs">Seguro · Privado · Tuyo</p>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        </motion.div>
      </div>

      {/* DIVIDER */}
      <div className="hidden lg:block w-px flex-shrink-0" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(16,185,129,0.15) 25%, rgba(16,185,129,0.35) 50%, rgba(16,185,129,0.15) 75%, transparent 100%)" }} />

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Subtle right-panel glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(16,185,129,0.05) 0%, transparent 70%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Image src="/logo.png" alt="Finora" width={34} height={34} className="rounded-lg" />
            <span className="text-white font-bold">Finora</span>
          </div>

          {/* Card */}
          <div className="glass-card rounded-3xl p-8 lg:p-10">
            <div className="mb-8">
              <h2 className="text-white font-bold text-2xl lg:text-3xl leading-tight">Bienvenido de vuelta</h2>
              <p className="text-slate-400 mt-2 text-base">Inicia sesión para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 text-sm font-medium">Correo electrónico</label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                  <input
                    type="email"
                    required
                    placeholder="tu@correo.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field w-full rounded-xl pl-11 pr-4 py-3.5 text-white text-sm placeholder-slate-600"
                    style={{ fontFamily: "inherit" }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-300 text-sm font-medium">Contraseña</label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input-field w-full rounded-xl pl-11 pr-12 py-3.5 text-white text-sm placeholder-slate-600"
                    style={{ fontFamily: "inherit" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-4 h-4 rounded border border-slate-600 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all" />
                </div>
                <span className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors">
                  Mantener sesión iniciada
                </span>
              </label>

              {/* Error */}
              {error && (
                <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl py-2.5 px-4">
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
                    Iniciar sesión
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-slate-600 text-xs">o continúa con</span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            {/* Social buttons */}
            <button
              type="button"
              onClick={handleGoogle}
              className="input-field w-full rounded-xl py-3 text-slate-300 text-sm font-medium flex items-center justify-center gap-3 hover:border-slate-600 transition-all"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                <path d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" fill="#FFC107"/>
                <path d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" fill="#FF3D00"/>
                <path d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8H6.3C9.7 35.6 16.3 44 24 44z" fill="#4CAF50"/>
                <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C37.2 38.8 44 33 44 24c0-1.2-.1-2.3-.4-3.5z" fill="#1976D2"/>
              </svg>
              Continuar con Google
            </button>

            {/* Register link */}
            <p className="text-center text-slate-500 text-sm mt-6">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
                Regístrate gratis
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

