"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Bell, LogOut, User, X, Menu,
  Loader2, ArrowLeftRight, Wallet, Target, PiggyBank, Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { doSignOut } from "@/app/actions";
import { useTheme } from "./ThemeProvider";
import { useConfig } from "./ConfigProvider";
import SearchModal from "./SearchModal";
import clsx from "clsx";

type NavUser = { name?: string | null; image?: string | null; email?: string | null };
type Log = { id: string; action: string; entity: string; description: string; createdAt: string };

const ENTITY_COLORS: Record<string, string> = {
  transaction: "#6366f1", budget: "#f59e0b", goal: "#ec4899", wallet: "#10b981",
};
const ENTITY_ICONS: Record<string, React.ElementType> = {
  transaction: ArrowLeftRight, budget: PiggyBank, goal: Target, wallet: Wallet,
};

const CATEGORIES = {
  income:  ["Salario","Freelance","Inversiones","Regalo","Otro"],
  expense: ["Alimentación","Transporte","Vivienda","Salud","Entretenimiento","Educación","Ropa","Tecnología","Otro"],
};

function relTime(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  const h = Math.floor(d / 3600000);
  if (m < 1)  return "ahora";
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(d / 86400000)}d`;
}

export default function TopNav({ user, onMenuOpen }: { user: NavUser | undefined; onMenuOpen?: () => void }) {
  const { theme } = useTheme();
  const { t, formatAmount } = useConfig();
  const router = useRouter();

  // Search
  const [searchOpen, setSearchOpen] = useState(false);

  // Notifications
  const [notifOpen, setNotifOpen]   = useState(false);
  const [notifs, setNotifs]         = useState<Log[]>([]);
  const [unread, setUnread]         = useState(0);
  const notifRef                    = useRef<HTMLDivElement>(null);

  // Profile dropdown
  const [profileOpen, setProfileOpen]       = useState(false);
  const profileRef                          = useRef<HTMLDivElement>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Quick action
  const [quickOpen, setQuickOpen]   = useState(false);
  const [qForm, setQForm]           = useState({ type: "expense", description: "", amount: "", category: "", date: new Date().toISOString().split("T")[0] });
  const [qSaving, setQSaving]       = useState(false);

  // Ctrl+K
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); } };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  // Close notif on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Load notifications
  const loadNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/activity");
      if (!res.ok) return;
      const data: Log[] = await res.json();
      setNotifs(data.slice(0, 8));
      setUnread(Math.min(data.length, 3));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadNotifs(); }, [loadNotifs]);

  // Quick action submit
  const handleQuick = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setQSaving(true);
    await fetch("/api/transactions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(qForm),
    });
    setQSaving(false);
    setQuickOpen(false);
    setQForm({ type: "expense", description: "", amount: "", category: "", date: new Date().toISOString().split("T")[0] });
    router.refresh();
  };

  const isDark = theme === "dark";
  const hdr = isDark
    ? { bg: "rgba(8,11,20,0.95)", border: "rgba(255,255,255,0.05)" }
    : { bg: "rgba(255,255,255,0.97)", border: "rgba(0,0,0,0.08)" };

  return (
    <>
      <header className="app-header flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 border-b z-40"
        style={{ background: hdr.bg, borderColor: hdr.border, backdropFilter: "blur(12px)" }}>

        {/* */}
        <button onClick={onMenuOpen} className={clsx(
          "lg:hidden w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
          isDark ? "text-slate-400 hover:text-slate-200 hover:bg-white/5" : "text-slate-500 hover:text-slate-700 hover:bg-black/5"
        )}>
          <Menu size={18} />
        </button>

        {/* */}
        <button onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 flex-1 max-w-md rounded-xl px-3 sm:px-3.5 py-2 border transition-all text-left min-w-0"
          style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
          <Search size={14} className="text-slate-500 flex-shrink-0" />
          <span className={clsx("text-sm flex-1 truncate", isDark ? "text-slate-600" : "text-slate-400")}>
            <span className="hidden sm:inline">{t("search_placeholder")}</span>
            <span className="sm:hidden">Buscar...</span>
          </span>
          <kbd className="hidden sm:inline text-xs border rounded px-1.5 py-0.5 font-mono flex-shrink-0"
            style={{ color: isDark ? "#475569" : "#94a3b8", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
            Ctrl K
          </kbd>
        </button>

        {/* */}
        <div className="flex-1" />

        {/* */}
        <button onClick={() => setQuickOpen(true)} title="Acción rápida"
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all bg-emerald-500 hover:bg-emerald-400 shadow-md shadow-emerald-500/25">
          <Plus size={15} className="text-white" />
        </button>

        {/* */}
        <div ref={notifRef} className="relative">
          <button onClick={() => { setNotifOpen(!notifOpen); setUnread(0); }}
            className={clsx("w-8 h-8 rounded-xl flex items-center justify-center transition-all relative",
              isDark ? "hover:bg-white/8 text-slate-400 hover:text-slate-200" : "hover:bg-black/5 text-slate-500 hover:text-slate-700")}>
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold leading-none">
                {unread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
                className="absolute -right-16 sm:right-0 top-10 w-[calc(100vw-2rem)] sm:w-80 rounded-2xl border shadow-2xl overflow-hidden z-50"
                style={{ background: isDark ? "#0d1526" : "#ffffff", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                <div className="px-4 py-3 border-b flex items-center justify-between"
                  style={{ borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)" }}>
                  <p className={clsx("text-sm font-semibold", isDark ? "text-white" : "text-slate-800")}>Actividad reciente</p>
                  <button onClick={() => { router.push("/historial"); setNotifOpen(false); }}
                    className="text-xs text-emerald-500 hover:text-emerald-400">Ver todo</button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifs.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Clock size={20} className="text-slate-600 mx-auto mb-2" />
                      <p className={clsx("text-xs", isDark ? "text-slate-500" : "text-slate-400")}>Sin actividad aún</p>
                    </div>
                  ) : notifs.map(n => {
                    const Icon = ENTITY_ICONS[n.entity] ?? Clock;
                    const color = ENTITY_COLORS[n.entity] ?? "#64748b";
                    return (
                      <div key={n.id} className={clsx("flex items-start gap-3 px-4 py-3 border-b last:border-b-0 transition-colors",
                        isDark ? "border-white/5 hover:bg-white/3" : "border-black/5 hover:bg-black/3")}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                          <Icon size={13} style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={clsx("text-xs leading-snug truncate", isDark ? "text-slate-300" : "text-slate-700")}>{n.description}</p>
                          <p className="text-slate-500 text-[10px] mt-0.5">{relTime(n.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile avatar dropdown */}
        <div ref={profileRef} className="relative">
          <button onClick={() => setProfileOpen(!profileOpen)} title="Mi perfil"
            className={clsx("w-8 h-8 rounded-full overflow-hidden flex-shrink-0 transition-all ring-2 ring-transparent",
              profileOpen ? "ring-emerald-500/50" : "hover:ring-emerald-500/30")}>
            {user?.image && (user.image.startsWith("http://") || user.image.startsWith("https://")) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-500/20 text-base">
                {user?.image || "😊"}
              </div>
            )}
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
                className="absolute right-0 top-10 w-52 rounded-2xl border shadow-2xl overflow-hidden z-50"
                style={{ background: isDark ? "#0d1526" : "#ffffff", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                {/* User info */}
                <div className="px-4 py-3 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                  <p className={clsx("text-sm font-semibold truncate", isDark ? "text-white" : "text-slate-800")}>{user?.name ?? "Usuario"}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email ?? ""}</p>
                </div>
                {/* Ir a perfil */}
                <button onClick={() => { router.push("/perfil"); setProfileOpen(false); }}
                  className={clsx("w-full flex items-center gap-2.5 px-4 py-3 text-sm transition-colors",
                    isDark ? "text-slate-300 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-black/5 hover:text-slate-900")}>
                  <User size={14} />
                  {t("topnav_go_profile")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="w-px h-5" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)" }} />

        {/* Logout — red background, triggers confirmation */}
        <button onClick={() => setShowLogoutConfirm(true)} title="Cerrar sesión"
          className="flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 transition-all">
          <LogOut size={14} />
          <span className="hidden sm:inline">{t("topnav_exit")}</span>
        </button>
      </header>

      {/* Logout confirmation modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
            onClick={e => e.target === e.currentTarget && setShowLogoutConfirm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.93, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93 }} transition={{ duration: 0.18 }}
              className="rounded-2xl p-6 w-full max-w-sm shadow-2xl border"
              style={{ background: isDark ? "#0d1526" : "#ffffff", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
              <div className="w-11 h-11 rounded-xl bg-red-500/15 flex items-center justify-center mb-4">
                <LogOut size={20} className="text-red-400" />
              </div>
              <h3 className={clsx("font-bold text-lg mb-1", isDark ? "text-white" : "text-slate-800")}>{t("topnav_logout_q")}</h3>
              <p className={clsx("text-sm mb-6", isDark ? "text-slate-400" : "text-slate-500")}>
                {t("topnav_logout_msg")}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowLogoutConfirm(false)}
                  className={clsx("flex-1 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isDark ? "bg-white/5 text-slate-300 hover:bg-white/10" : "bg-black/5 text-slate-600 hover:bg-black/10")}>
                  {t("topnav_cancel")}
                </button>
                <form action={doSignOut} className="flex-1">
                  <button type="submit"
                    className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-all flex items-center justify-center gap-1.5">
                    <LogOut size={13} /> {t("topnav_sign_out")}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* */}
      <AnimatePresence>
        {quickOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={e => e.target === e.currentTarget && setQuickOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm overflow-hidden shadow-2xl"
              style={{ background: isDark ? "#0d1526" : "#ffffff", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}` }}>
              <div className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500 flex items-center justify-center">
                    <Plus size={14} className="text-white" />
                  </div>
                  <p className={clsx("font-semibold text-sm", isDark ? "text-white" : "text-slate-800")}>{t("quick_action")}</p>
                </div>
                <button onClick={() => setQuickOpen(false)} className="text-slate-500 hover:text-slate-400"><X size={16} /></button>
              </div>

              <form onSubmit={handleQuick} className="p-5 flex flex-col gap-3">
                {/* Type */}
                <div className="flex gap-2">
                  {(["expense", "income"] as const).map(tp => (
                    <button key={tp} type="button" onClick={() => setQForm({ ...qForm, type: tp, category: "" })}
                      className={clsx("flex-1 py-2 rounded-xl text-xs font-semibold transition-all",
                        qForm.type === tp
                          ? tp === "income" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                          : isDark ? "bg-white/5 text-slate-400 hover:text-slate-300" : "bg-black/5 text-slate-500 hover:text-slate-700")}>
                      {tp === "income" ? t("income") : t("expense")}
                    </button>
                  ))}
                </div>

                <input required type="text" placeholder={t("description")} value={qForm.description}
                  onChange={e => setQForm({ ...qForm, description: e.target.value })}
                  className="input-field w-full rounded-xl px-4 py-2.5 text-sm"
                  style={{ color: isDark ? "white" : "#0f172a" }} />

                <div className="grid grid-cols-2 gap-2">
                  <input required type="number" min="0.01" step="0.01" placeholder={t("amount")} value={qForm.amount}
                    onChange={e => setQForm({ ...qForm, amount: e.target.value })}
                    className="input-field w-full rounded-xl px-4 py-2.5 text-sm"
                    style={{ color: isDark ? "white" : "#0f172a" }} />
                  <input required type="date" value={qForm.date}
                    onChange={e => setQForm({ ...qForm, date: e.target.value })}
                    className="input-field w-full rounded-xl px-4 py-2.5 text-sm"
                    style={{ colorScheme: isDark ? "dark" : "light", color: isDark ? "white" : "#0f172a" }} />
                </div>

                <select required value={qForm.category} onChange={e => setQForm({ ...qForm, category: e.target.value })}
                  className="select-field w-full rounded-xl px-4 py-2.5 text-sm">
                  <option value="">{t("category")}</option>
                  {CATEGORIES[qForm.type as "income" | "expense"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <button type="submit" disabled={qSaving}
                  className="btn-primary py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 mt-1">
                  {qSaving ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> {t("quick_add_tx")}</>}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

