"use client";

import { useEffect, useState } from "react";
import {
  Loader2, ShieldAlert, ShieldCheck, LogIn, XCircle,
  AlertTriangle, Clock, CheckCircle2,
} from "lucide-react";
import clsx from "clsx";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

type Login = {
  id: string; email: string; userId: string | null;
  success: boolean; provider: string; ip: string | null; createdAt: string;
};
type AuditLog = {
  id: string; action: string; entity: string; description: string;
  createdAt: string; user: { name: string | null; email: string } | null;
};
type SecurityData = {
  recentLogins:  Login[];
  stats: { failedToday: number; successToday: number; suspiciousCount: number; totalToday: number };
  suspicious:    { email: string; attempts: number }[];
  failedPerDay:  { day: string; count: number }[];
  failedPerHour: { hour: string; count: number }[];
  auditLogs:     AuditLog[];
};

function Card({ label, value, icon: Icon, color, bg }: { label: string; value: number | string; icon: React.ElementType; color: string; bg: string }) {
  return (
    <div className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
        <Icon size={16} style={{ color }} />
      </div>
      <p className="text-slate-500 text-xs">{label}</p>
      <p className="text-white font-bold text-2xl mt-0.5">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
      <p className="text-slate-300 font-semibold text-sm mb-4">{title}</p>
      {children}
    </div>
  );
}

export default function AdminSecurityClient() {
  const [data,    setData]    = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<"logins" | "audit">("logins");

  useEffect(() => {
    fetch("/api/admin/security")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 size={28} className="animate-spin text-red-400" />
    </div>
  );
  if (!data) return null;

  const fmtTime = (d: string) => new Date(d).toLocaleString("es-PE", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
  const fmtDay = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short" });

  return (
    <div className="min-h-screen p-6" style={{ background: "#080b14" }}>
      <div className="mb-6">
        <h1 className="text-white font-bold text-2xl">Seguridad</h1>
        <p className="text-slate-500 text-sm mt-0.5">Registro de accesos, auditoría y actividad sospechosa</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card label="Accesos hoy"           value={data.stats.totalToday}       icon={LogIn}       color="#6366f1" bg="rgba(99,102,241,0.1)"  />
        <Card label="Exitosos hoy"          value={data.stats.successToday}     icon={ShieldCheck} color="#10b981" bg="rgba(16,185,129,0.1)"  />
        <Card label="Fallidos hoy"          value={data.stats.failedToday}      icon={XCircle}     color="#ef4444" bg="rgba(239,68,68,0.1)"   />
        <Card label="Cuentas sospechosas"   value={data.stats.suspiciousCount}  icon={ShieldAlert} color="#f59e0b" bg="rgba(245,158,11,0.1)"  />
      </div>

      {/* Suspicious accounts alert */}
      {data.suspicious.length > 0 && (
        <div className="rounded-2xl border border-yellow-500/20 p-4 mb-5 flex gap-3" style={{ background: "rgba(245,158,11,0.05)" }}>
          <AlertTriangle size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-yellow-400 font-semibold text-sm mb-1">Actividad sospechosa detectada</p>
            <div className="flex flex-wrap gap-2">
              {data.suspicious.map(s => (
                <span key={s.email} className="text-xs bg-yellow-500/10 text-yellow-300 px-3 py-1 rounded-lg border border-yellow-500/20">
                  {s.email} · <span className="font-bold">{s.attempts}</span> intentos en 1h
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
        <ChartCard title="Intentos fallidos — últimos 7 días">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.failedPerDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
                formatter={(v) => [v as number, "intentos fallidos"]}
                labelFormatter={(d) => fmtDay(String(d))}
              />
              <Bar dataKey="count" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Intentos fallidos — últimas 24h por hora">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.failedPerHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 10 }} interval={3} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
                formatter={(v) => [v as number, "fallidos"]}
              />
              <Bar dataKey="count" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tabs: Login history / Audit log */}
      <div className="flex gap-1 p-1 rounded-xl mb-4 w-fit" style={{ background: "rgba(255,255,255,0.03)" }}>
        {(["logins", "audit"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === t ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
            )}>
            {t === "logins" ? "Historial de accesos" : "Log de auditoría"}
          </button>
        ))}
      </div>

      {tab === "logins" && (
        <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                {["Estado", "Email", "Proveedor", "IP", "Fecha"].map(h => (
                  <th key={h} className="text-left text-slate-500 font-medium px-5 py-3 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recentLogins.map(l => (
                <tr key={l.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3">
                    {l.success
                      ? <span className="flex items-center gap-1.5 text-emerald-400 text-xs"><CheckCircle2 size={13} /> Exitoso</span>
                      : <span className="flex items-center gap-1.5 text-red-400 text-xs"><XCircle size={13} /> Fallido</span>}
                  </td>
                  <td className="px-5 py-3 text-slate-300">{l.email}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-slate-400">{l.provider}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs font-mono">{l.ip ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs flex items-center gap-1">
                    <Clock size={11} /> {fmtTime(l.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.recentLogins.length === 0 && (
            <p className="text-center text-slate-600 text-sm py-10">Sin registros de acceso</p>
          )}
        </div>
      )}

      {tab === "audit" && (
        <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                {["Acción", "Entidad", "Descripción", "Usuario", "Fecha"].map(h => (
                  <th key={h} className="text-left text-slate-500 font-medium px-5 py-3 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.auditLogs.map(l => (
                <tr key={l.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-medium">{l.action}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{l.entity}</td>
                  <td className="px-5 py-3 text-slate-300 text-xs max-w-xs truncate">{l.description}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{l.user?.email ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{fmtTime(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.auditLogs.length === 0 && (
            <p className="text-center text-slate-600 text-sm py-10">Sin logs de auditoría</p>
          )}
        </div>
      )}
    </div>
  );
}
