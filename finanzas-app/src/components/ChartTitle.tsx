"use client";

import { useConfig } from "./ConfigProvider";
import type { TKey } from "@/lib/i18n";

export default function ChartTitle({ tkey }: { tkey: TKey }) {
  const { t } = useConfig();
  return <h2 className="text-white font-semibold mb-4 text-sm">{t(tkey)}</h2>;
}
