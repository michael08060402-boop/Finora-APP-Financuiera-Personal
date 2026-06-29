"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Shield, User, UserX, UserCheck, Eye, AlertTriangle, X, CheckCircle } from "lucide-react";
import clsx from "clsx";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: { transactions: number; wallets: number; goals: number; budgets: number };
};

type Toast = { id: number; message: string; type: "success" | "error" };

function ToastList({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
      {toasts.map(t => (
        <div key={t.id}
          className={clsx(
            "flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium",
            t.type === "success"
              ? "bg-emerald-950 border-emerald-500/30 text-emerald-300"
              : "bg-red-950 border-red-500/30 text-red-300"
          )}>
          {t.type === "success" ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
          {t.message}
          <button onClick={() => remove(t.id)} className="ml-2 opacity-60 hover:opacity-100"><X size={13} /></button>
        </div>
      ))}
    </div>
  );
}

function DeleteModal({ user, onConfirm, onCancel, loading }: {
  user: UserRow; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="rounded-2xl border border-white/10 p-6 w-full max-w-sm" style={{ background: "#0f172a" }}>
        <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center mb-4">
          <AlertTriangle size={18} className="text-red-400" />
        </div>
        <h3 className="text-white font-bold text-base mb-1">Eliminar usuario</h3>
        <p className="text-slate-400 text-sm mb-1">
          ¿Eliminar a <span className="text-white font-medium">{user.name ?? user.email}</span>?
        </p>
        <p className="text-slate-600 text-xs mb-5">
          Se borrarán todas sus transacciones, cuentas, metas y presupuestos. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm hover:bg-white/5 transition-all disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

let toastId = 0;

export default function AdminUsersClient() {
  const router = useRouter();
  const [users,       setUsers]       = useState<UserRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [actingId,    setActingId]    = useState<string | null>(null);
  const [search,      setSearch]      = useState("");
  const [toasts,      setToasts]      = useState<Toast[]>([]);
  const [confirmUser, setConfirmUser] = useState<UserRow | null>(null);

  const addToast = (message: string, type: Toast["type"]) => {
    const id = ++toastId;
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  useEffect(() => {
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(d => { setUsers(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!confirmUser) return;
    setDeletingId(confirmUser.id);
    const res = await fetch(`/api/admin/users/${confirmUser.id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== confirmUser.id));
      addToast("Usuario eliminado correctamente", "success");
    } else {
      const data = await res.json();
      addToast(data.error ?? "Error al eliminar usuario", "error");
    }
    setDeletingId(null);
    setConfirmUser(null);
  };

  const handlePatch = async (u: UserRow, body: { isActive?: boolean; role?: string }) => {
    setActingId(u.id);
    try {
      const res  = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, ...data } : x));
        if (body.isActive !== undefined) addToast(body.isActive ? "Cuenta reactivada" : "Cuenta suspendida", "success");
        if (body.role     !== undefined) addToast(`Rol cambiado a ${body.role}`, "success");
      } else {
        addToast(data.error ?? "Error al actualizar usuario", "error");
      }
    } catch {
      addToast("Error de conexión", "error");
    }
    setActingId(null);
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 min-h-screen p-6" style={{ background: "#080b14" }}>
      <ToastList toasts={toasts} remove={id => setToasts(p => p.filter(t => t.id !== id))} />
      {confirmUser && (
        <DeleteModal
          user={confirmUser}
          onConfirm={handleDelete}
          onCancel={() => setConfirmUser(null)}
          loading={deletingId === confirmUser.id}
        />
      )}

      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white font-bold text-2xl">Gestión de usuarios</h1>
          <p className="text-slate-500 text-sm mt-0.5">{users.length} usuarios registrados</p>
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field px-4 py-2 rounded-xl text-white text-sm placeholder-slate-600 w-72"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={28} className="animate-spin text-red-400" />
        </div>
      ) : (
        <>
          {/* MOBILE: cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filtered.length === 0 && (
              <p className="text-center text-slate-600 text-sm py-12">Sin resultados</p>
            )}
            {filtered.map(u => (
              <div key={u.id} className="rounded-2xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <User size={16} className="text-slate-500" />
                    {u.image && (
                      <img src={u.image} className="absolute inset-0 w-10 h-10 object-cover" alt=""
                        referrerPolicy="no-referrer"
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 font-medium truncate">{u.name ?? "Sin nombre"}</p>
                    <p className="text-slate-500 text-xs truncate">{u.email}</p>
                  </div>
                  <span className={clsx(
                    "text-xs px-2 py-0.5 rounded-md font-medium flex items-center gap-1 flex-shrink-0",
                    u.role === "admin" ? "bg-red-500/15 text-red-400" : "bg-white/5 text-slate-400"
                  )}>
                    {u.role === "admin" && <Shield size={10} />}
                    {u.role}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                  <div>
                    <p className="text-slate-600 mb-0.5">Estado</p>
                    <span className={clsx("px-2 py-0.5 rounded-md font-medium",
                      u.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400")}>
                      {u.isActive ? "Activo" : "Suspendido"}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-0.5">Transacciones</p>
                    <p className="text-slate-300 font-medium">{u._count.transactions}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 mb-0.5">Registro</p>
                    <p className="text-slate-400">{new Date(u.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <button onClick={() => router.push(`/admin/users/${u.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all">
                    <Eye size={13} /> Ver detalle
                  </button>
                  {u.role !== "admin" && (
                    <button onClick={() => handlePatch(u, { isActive: !u.isActive })} disabled={actingId === u.id}
                      className={clsx("flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-all disabled:opacity-50",
                        u.isActive ? "text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20" : "text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20")}>
                      {actingId === u.id ? <Loader2 size={13} className="animate-spin" /> : u.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                      {u.isActive ? "Suspender" : "Reactivar"}
                    </button>
                  )}
                  {u.role !== "admin" && (
                    <button onClick={() => setConfirmUser(u)}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP: tabla */}
          <div className="hidden sm:block rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
                  {["Usuario", "Rol", "Estado", "Transacciones", "Registro", "Acciones"].map(h => (
                    <th key={h} className="text-left text-slate-500 font-medium px-5 py-3 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <User size={14} className="text-slate-500" />
                          {u.image && (
                            <img src={u.image} className="absolute inset-0 w-8 h-8 object-cover" alt=""
                              referrerPolicy="no-referrer"
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                          )}
                        </div>
                        <div>
                          <p className="text-slate-200 font-medium">{u.name ?? "Sin nombre"}</p>
                          <p className="text-slate-500 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={clsx("text-xs px-2 py-0.5 rounded-md font-medium flex items-center gap-1 w-fit",
                        u.role === "admin" ? "bg-red-500/15 text-red-400" : "bg-white/5 text-slate-400")}>
                        {u.role === "admin" && <Shield size={10} />}
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={clsx("text-xs px-2 py-0.5 rounded-md font-medium",
                        u.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400")}>
                        {u.isActive ? "Activo" : "Suspendido"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400">{u._count.transactions}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => router.push(`/admin/users/${u.id}`)} title="Ver detalle"
                          className="text-slate-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-indigo-500/10 transition-all">
                          <Eye size={14} />
                        </button>
                        {u.role !== "admin" && (
                          <button onClick={() => handlePatch(u, { isActive: !u.isActive })} disabled={actingId === u.id}
                            title={u.isActive ? "Suspender" : "Reactivar"}
                            className={clsx("p-1.5 rounded-lg transition-all disabled:opacity-50",
                              u.isActive ? "text-slate-500 hover:text-yellow-400 hover:bg-yellow-500/10" : "text-yellow-400 hover:text-emerald-400 hover:bg-emerald-500/10")}>
                            {actingId === u.id ? <Loader2 size={14} className="animate-spin" /> : u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                        )}
                        {u.role !== "admin" && (
                          <button onClick={() => setConfirmUser(u)} title="Eliminar usuario"
                            className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-slate-600 text-sm py-12">Sin resultados</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
