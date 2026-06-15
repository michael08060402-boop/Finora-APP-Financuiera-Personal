"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#080b14" }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(16,185,129,0.06) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <TrendingUp size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">Finora</span>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-8 lg:p-10">
          {!sent ? (
            <>
              <div className="mb-7">
                <h2 className="text-white font-bold text-2xl">¿Olvidaste tu contraseña?</h2>
                <p className="text-slate-400 mt-2 text-sm leading-relaxed">
                  Ingresa tu correo y te enviaremos un enlace para restablecerla.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field w-full rounded-xl pl-11 pr-4 py-3.5 text-white text-sm placeholder-slate-600"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full rounded-xl py-3.5 text-white font-semibold text-sm flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      Enviar enlace
                      <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center py-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-white font-bold text-xl">Revisa tu correo</h3>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed max-w-xs">
                Enviamos un enlace a <span className="text-emerald-400 font-medium">{email}</span>. Revisa también tu carpeta de spam.
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-slate-500 text-xs mt-6 hover:text-slate-400 transition-colors"
              >
                ¿No llegó? Reenviar correo
              </button>
            </motion.div>
          )}

          <div className="mt-6 pt-5 border-t border-white/5">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-slate-500 text-sm hover:text-slate-300 transition-colors"
            >
              <ArrowLeft size={14} />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

