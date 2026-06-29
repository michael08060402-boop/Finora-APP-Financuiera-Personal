"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, LogOut, Shield, BarChart2, Tags, ShieldAlert, MessageSquarePlus, X } from "lucide-react";
import clsx from "clsx";
import { signOut } from "next-auth/react";

const LINKS = [
  { href: "/admin",             label: "Dashboard",   icon: LayoutDashboard  },
  { href: "/admin/users",       label: "Usuarios",    icon: Users            },
  { href: "/admin/reports",     label: "Reportes",    icon: BarChart2        },
  { href: "/admin/categories",  label: "Categorías",  icon: Tags             },
  { href: "/admin/security",    label: "Seguridad",   icon: ShieldAlert      },
  { href: "/admin/suggestions", label: "Sugerencias", icon: MessageSquarePlus },
];

interface Props {
  mobileOpen?: boolean;
  onClose?: () => void;
}

function SidebarInner({ onClose }: { onClose?: () => void }) {
  const path = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center">
            <Shield size={16} className="text-red-400" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Finora Admin</p>
            <p className="text-red-400 text-xs font-medium">Panel de control</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-slate-300 p-1">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="px-3 py-4 flex flex-col gap-1 flex-1">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
          return (
            <Link key={href} href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-red-500/15 text-red-400"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}>
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/5">
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all">
          <LogOut size={15} /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default function AdminSidebar({ mobileOpen = false, onClose }: Props) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex w-60 flex-shrink-0 flex-col border-r border-white/5 sticky top-0 h-screen"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <SidebarInner />
      </aside>

      {/* Mobile drawer */}
      <aside className={clsx(
        "lg:hidden fixed inset-y-0 left-0 z-40 w-64 flex flex-col border-r border-white/5 transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )} style={{ background: "#0d1120" }}>
        <SidebarInner onClose={onClose} />
      </aside>
    </>
  );
}
