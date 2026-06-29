"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import PageTransition from "./PageTransition";

type NavUser = { name?: string | null; image?: string | null; email?: string | null };

export default function AppShell({ user, children }: { user: NavUser | undefined; children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on navigation
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          style={{ backdropFilter: "blur(2px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopNav user={user} onMenuOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto min-h-0">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </>
  );
}

