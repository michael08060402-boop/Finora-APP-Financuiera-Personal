"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, Lock, Save, Loader2, CheckCircle } from "lucide-react";
import clsx from "clsx";
import { useConfig } from "./ConfigProvider";

type Props = { user: { name: string; email: string; image: string } };

const AVATARS = [
  { emoji: "😊", color: "#10b981" }, { emoji: "😎", color: "#6366f1" },
  { emoji: "🦁", color: "#f59e0b" }, { emoji: "🐯", color: "#ef4444" },
  { emoji: "🦊", color: "#f97316" }, { emoji: "🐺", color: "#8b5cf6" },
  { emoji: "🦋", color: "#ec4899" }, { emoji: "🐬", color: "#06b6d4" },
  { emoji: "🌙", color: "#6366f1" }, { emoji: "⭐", color: "#f59e0b" },
  { emoji: "🔥", color: "#ef4444" }, { emoji: "🚀", color: "#6366f1" },
  { emoji: "💎", color: "#06b6d4" }, { emoji: "🎯", color: "#10b981" },
  { emoji: "🎸", color: "#8b5cf6" }, { emoji: "🌊", color: "#06b6d4" },
];

function getAvatarColor(emoji: string) {
  return AVATARS.find(a => a.emoji === emoji)?.color ?? "#10b981";
}

function isUrl(s: string) {
  return s.startsWith("http://") || s.startsWith("https://");
}

const DEFAULT_AVATAR = AVATARS[0];

function AvatarDisplay({ image, size = 64 }: { image: string; size?: number }) {
  if (image && isUrl(image)) {
    return (
      <img src={image} alt="avatar"
        className="rounded-2xl object-cover flex-shrink-0"
        style={{ width: size, height: size }} />
    );
  }
  const emoji = image || DEFAULT_AVATAR.emoji;
  const color = getAvatarColor(emoji) || DEFAULT_AVATAR.color;
  return (
    <div className="rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, background: `${color}25` }}>
      <span style={{ fontSize: size * 0.45 }}>{emoji}</span>
    </div>
  );
}

export default function PerfilClient({ user }: Props) {
  const router = useRouter();
  const { t } = useConfig();
  const [form,       setForm]       = useState({ name: user.name, image: user.image });
  const [pass,       setPass]       = useState({ current: "", newPass: "", confirm: "" });
  const [saving,     setSaving]     = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [success,    setSuccess]    = useState("");
  const [error,      setError]      = useState("");

  const handleProfile = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault(); setSaving(true); setError(""); setSuccess("");
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { setSuccess("Perfil actualizado correctamente"); router.refresh(); }
    else { const d = await res.json(); setError(d.error); }
  };

  const handlePassword = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (pass.newPass !== pass.confirm) { setError("Las contraseñas no coinciden"); return; }
    if (pass.newPass.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    setSavingPass(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pass.current, newPassword: pass.newPass }),
    });
    setSavingPass(false);
    if (res.ok) { setSuccess("Contrasena actualizada"); setPass({ current: "", newPass: "", confirm: "" }); }
    else { const d = await res.json(); setError(d.error); }
  };

  const currentColor = isUrl(form.image) ? "#10b981" : getAvatarColor(form.image || DEFAULT_AVATAR.emoji);

  return (
    <div className="flex-1 min-h-screen" style={{ background: "#080b14" }}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-white/5">
        <h1 className="text-white font-bold text-2xl">{t("prf_title")}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t("prf_subtitle")}</p>
      </div>

      <div className="px-4 sm:px-6 py-5">
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm mb-5">
            <CheckCircle size={16} /> {success}
          </motion.div>
        )}
        {error && (
          <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm mb-5">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-5">

          {/* LEFT — profile card */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/5 p-6 flex flex-col items-center text-center"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="relative mb-4">
                <AvatarDisplay image={form.image} size={96} />
                <div className="absolute -inset-1 rounded-2xl opacity-30 pointer-events-none"
                  style={{ boxShadow: `0 0 0 2px ${currentColor}` }} />
              </div>
              <p className="text-white font-bold text-lg leading-tight">{form.name || user.name}</p>
              <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
                <Mail size={12} />{user.email}
              </p>
              {!isUrl(form.image) && (
                <div className="mt-3 flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-white/5"
                  style={{ background: `${currentColor}12`, color: currentColor }}>
                  <span style={{ fontSize: 14 }}>{form.image || DEFAULT_AVATAR.emoji}</span>
                  Avatar activo
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/5 p-5 space-y-3"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Informacion</p>
              {[
                { label: "Nombre", value: form.name || "—" },
                { label: "Correo", value: user.email },
                { label: "Avatar", value: isUrl(form.image) ? "Foto de Google" : (form.image || "😊") + " Emoji" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-slate-500 text-xs">{label}</span>
                  <span className="text-slate-200 text-xs font-medium truncate max-w-[150px] text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — forms */}
          <div className="space-y-5">

            {/* Profile form */}
            <div className="rounded-2xl border border-white/5 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
              <h2 className="text-white font-semibold mb-5">Editar perfil</h2>
              <form onSubmit={handleProfile} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-300 text-sm font-medium">Nombre completo</label>
                  <div className="relative">
                    <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input type="text" required value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="input-field w-full rounded-xl pl-11 pr-4 py-3 text-white text-sm" />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-slate-300 text-sm font-medium">Avatar</label>
                  <div className="grid grid-cols-8 gap-2">
                    {AVATARS.map(({ emoji, color }) => (
                      <button key={emoji} type="button"
                        onClick={() => setForm({ ...form, image: emoji })}
                        className={clsx(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all",
                          form.image === emoji ? "scale-110" : "opacity-60 hover:opacity-100 hover:scale-105",
                        )}
                        style={{
                          background: `${color}25`,
                          ...(form.image === emoji ? { outline: `2px solid ${color}`, outlineOffset: "2px" } : {}),
                        }}>
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {form.image && isUrl(form.image) && (
                    <div className="flex items-center gap-3 mt-1">
                      <img src={form.image} alt="Google avatar" className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-500" />
                      <div>
                        <p className="text-slate-300 text-xs">Foto de Google activa</p>
                        <button type="button" onClick={() => setForm({ ...form, image: "" })}
                          className="text-slate-500 hover:text-red-400 text-xs transition-colors">
                          Quitar y usar emoji
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={saving}
                  className="btn-primary self-start flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold">
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <><Save size={15} /> Guardar cambios</>}
                </button>
              </form>
            </div>

            {/* Password form */}
            <div className="rounded-2xl border border-white/5 p-6" style={{ background: "rgba(255,255,255,0.03)" }}>
              <h2 className="text-white font-semibold mb-1">Cambiar contrasena</h2>
              <p className="text-slate-500 text-sm mb-5">Solo disponible si te registraste con email y contrasena</p>
              <form onSubmit={handlePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Contrasena actual",          key: "current", val: pass.current },
                  { label: "Nueva contrasena",           key: "newPass", val: pass.newPass },
                  { label: "Confirmar nueva contrasena", key: "confirm", val: pass.confirm },
                ].map(({ label, key, val }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-slate-300 text-sm font-medium">{label}</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input type="password" value={val}
                        onChange={e => setPass({ ...pass, [key]: e.target.value })}
                        className="input-field w-full rounded-xl pl-11 pr-4 py-3 text-white text-sm" />
                    </div>
                  </div>
                ))}
                <div className="sm:col-span-3">
                  <button type="submit" disabled={savingPass}
                    className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold">
                    {savingPass ? <Loader2 size={15} className="animate-spin" /> : <><Lock size={15} /> Actualizar contrasena</>}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
