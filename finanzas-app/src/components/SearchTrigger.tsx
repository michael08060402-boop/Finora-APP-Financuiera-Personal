"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import SearchModal from "./SearchModal";

export default function SearchTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/15 transition-all text-sm"
        style={{ background: "rgba(255,255,255,0.03)" }}>
        <Search size={13} />
        <span className="hidden sm:inline text-xs">Buscar...</span>
        <kbd className="hidden sm:inline text-xs border border-white/10 rounded px-1.5 py-0.5 font-mono text-slate-700">Ctrl K</kbd>
      </button>
      <SearchModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

