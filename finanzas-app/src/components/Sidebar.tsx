"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ArrowLeftRight, Target, PiggyBank,
  Settings, ChevronLeft, ChevronRight, UserCircle, Wallet, BarChart3,
  Download, Clock, Search, X, HandCoins,
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { useConfig } from "./ConfigProvider";
import type { TKey } from "@/lib/i18n";

const navItems: { href: string; icon: React.ElementType; key: TKey }[] = [
  { href: "/dashboard",     icon: LayoutDashboard, key: "nav_dashboard"    },
  { href: "/buscar",        icon: Search,          key: "nav_search"       },
  { href: "/transacciones", icon: ArrowLeftRight,  key: "nav_transactions" },
  { href: "/cuentas",       icon: Wallet,          key: "nav_accounts"     },
  { href: "/presupuestos",  icon: PiggyBank,       key: "nav_budgets"      },
  { href: "/metas",         icon: Target,          key: "nav_goals"        },
  { href: "/reportes",      icon: BarChart3,       key: "nav_reports"      },
  { href: "/exportar",      icon: Download,        key: "nav_export"       },
  { href: "/historial",     icon: Clock,           key: "nav_history"      },
  { href: "/deudas",        icon: HandCoins,       key: "nav_debts"        },
  { href: "/perfil",        icon: UserCircle,      key: "nav_profile"      },
  { href: "/configuracion", icon: Settings,        key: "nav_settings"     },
];

interface Props {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onClose }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useConfig();

  const inner = (
    <div className="flex flex-col h-full">
      {/* Logo row */}
      <div className={clsx(
        "flex items-center gap-3 px-4 py-5 border-b border-white/5 flex-shrink-0",
        collapsed && "justify-center px-0",
      )}>
        <Image src="/logo.png" alt="Finora" width={40} height={40} className="rounded-xl flex-shrink-0" />
        {!collapsed && <span className="text-white font-bold text-base tracking-tight flex-1">Finora</span>}
        {/* Mobile close button */}
        {!collapsed && onClose && (
          <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-slate-300 p-1">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-2 flex-1 mt-2 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, key }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150",
                collapsed && "justify-center px-0",
                active
                  ? "bg-emerald-500/15 text-emerald-400 font-medium"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5",
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{t(key)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Desktop collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-white/10 bg-slate-900 items-center justify-center text-slate-400 hover:text-slate-200 transition-colors z-10"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </div>
  );

  return (
    <>
      {/* â”€â”€ Desktop sidebar (always visible on lg+) â”€â”€ */}
      <aside
        className={clsx(
          "app-sidebar hidden lg:flex flex-col relative border-r border-white/5 transition-all duration-300 flex-shrink-0",
          collapsed ? "w-16" : "w-56",
        )}
        style={{ background: "rgba(255,255,255,0.02)" }}
      >
        {inner}
      </aside>

      {/* â”€â”€ Mobile drawer (slide in from left) â”€â”€ */}
      <aside
        className={clsx(
          "app-sidebar lg:hidden fixed inset-y-0 left-0 z-40 w-64 flex flex-col border-r border-white/5 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ background: "#0b1120" }}
      >
        {inner}
      </aside>
    </>
  );
}

