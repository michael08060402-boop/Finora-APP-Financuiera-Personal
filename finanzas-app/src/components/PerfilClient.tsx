"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Camera, Lock, Save, Loader2, CheckCircle } from "lucide-react";

type Props = { user: { name: string; email: string; image: string } };

export default function PerfilClient({ user }: Props) {
  const [form, setForm] = useState({ name: user.name, image: user.image });
  const [pass, setPass] = useState({ current: "", newPass: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleProfile = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault(); setSaving(true); setError(""); setSuccess("");
    const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) { setSuccess("Perfil actualizado correctamente"); } else { const d = await res.json(); setError(d.error); }
  };

  const handlePassword = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (pass.newPass !== pass.confirm) { setError("Las contraseñas no coinciden"); return; }
    if (pass.newPass.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    setSavingPass(true);
    const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: pass.current, newPassword: pass.newPass }) });
    setSavingPass(false);
    if (res.ok) { setSuccess("Contraseña actualizada"); setPass({ current: "", newPass: "", confirm: "" }); } else { const d = await res.json(); setError(d.error); }
  };

  return (
    <div className="flex-1 min-h-screen" style={{ background: "#080b14" }}>
      <div className="px-6 py-6 border-b border-white/5">
        <h1 className="text-white font-bold text-2xl">Mi Perfil</h1>
        <p className="text-slate-500 text-sm mt-0.5">Gestiona tu información personal</p>
      </div>

      <div className="px-6 py-6 max-w-2xl space-y-6">
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm">
            <CheckCircle size={16} /> {success}
          </motion.div>
        )}
        {error && (
          <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {/* Avatar + info */}
        <div className="rounded-2xl border border-white/5 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="flex items-center gap-5 mb-6">
            <div className="relative">
              {form.image ? (
                <img src={form.image} alt="avatar" className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <User size={28} className="text-emerald-400" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
                <Camera size={11} className="text-slate-400" />
              </div>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">{user.name}</p>
              <p className="text-slate-500 text-sm flex items-center gap-1.5"><Mail size={12} />{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleProfile} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-sm font-medium">Nombre completo</label>
              <div className="relative">
                <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input-field w-full rounded-xl pl-11 pr-4 py-3 text-white text-sm" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-sm font-medium">URL de foto de perfil</label>
              <div className="relative">
                <Camera size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input type="url" placeholder="https://..." value={form.image} onChange={e => setForm({ ...form, image: e.target.value })}
                  className="input-field w-full rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-slate-600" />
              </div>
              <p className="text-slate-600 text-xs">Pega la URL de una imagen de internet</p>
            </div>
            <button type="submit" disabled={saving} className="btn-primary self-start flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <><Save size={15} /> Guardar cambios</>}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="rounded-2xl border border-white/5 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
          <h2 className="text-white font-semibold mb-1">Cambiar contraseña</h2>
          <p className="text-slate-500 text-sm mb-5">Solo disponible si te registraste con email y contraseña</p>
          <form onSubmit={handlePassword} className="flex flex-col gap-4">
            {[
              { label: "Contraseña actual", key: "current", val: pass.current },
              { label: "Nueva contraseña", key: "newPass", val: pass.newPass },
              { label: "Confirmar nueva contraseña", key: "confirm", val: pass.confirm },
            ].map(({ label, key, val }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-slate-300 text-sm font-medium">{label}</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input type="password" value={val} onChange={e => setPass({ ...pass, [key]: e.target.value })}
                    className="input-field w-full rounded-xl pl-11 pr-4 py-3 text-white text-sm" />
                </div>
              </div>
            ))}
            <button type="submit" disabled={savingPass} className="btn-primary self-start flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold">
              {savingPass ? <Loader2 size={15} className="animate-spin" /> : <><Lock size={15} /> Actualizar contraseña</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

