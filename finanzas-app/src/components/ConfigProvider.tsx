"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { type Lang, type TKey, getT, makeFormatter } from "@/lib/i18n";

const STORAGE_KEY = "Finora_config";
const EVENT_NAME  = "Finora-config-update";

type ConfigCtxType = {
  currency:     string;
  lang:         Lang;
  formatAmount: (n: number) => string;
  t:            (key: TKey) => string;
};

const ConfigCtx = createContext<ConfigCtxType>({
  currency:     "PEN",
  lang:         "es",
  formatAmount: makeFormatter("PEN"),
  t:            getT("es"),
});

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState("PEN");
  const [lang,     setLang]     = useState<Lang>("es");

  const loadFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const cfg = JSON.parse(raw);
      if (cfg.currency) setCurrency(cfg.currency);
      if (cfg.language === "en" || cfg.language === "es") setLang(cfg.language);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadFromStorage();
    window.addEventListener(EVENT_NAME, loadFromStorage);
    window.addEventListener("storage", loadFromStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, loadFromStorage);
      window.removeEventListener("storage", loadFromStorage);
    };
  }, [loadFromStorage]);

  const value: ConfigCtxType = {
    currency,
    lang,
    formatAmount: makeFormatter(currency),
    t: getT(lang),
  };

  return <ConfigCtx.Provider value={value}>{children}</ConfigCtx.Provider>;
}

export function useConfig() {
  return useContext(ConfigCtx);
}

