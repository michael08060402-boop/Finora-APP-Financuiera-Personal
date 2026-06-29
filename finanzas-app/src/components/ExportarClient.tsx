"use client";

import { useState, useEffect } from "react";
import { Download, Loader2, CheckCircle2, FileText, Upload, ArrowLeftRight, Wallet, BarChart3, PiggyBank } from "lucide-react";
import { makeFormatter } from "@/lib/i18n";
import { useConfig } from "./ConfigProvider";
import ImportarCSVModal from "./ImportarCSVModal";

type TxRow     = { date: string; description: string; amount: number; type: string; category: string };
type WalletRow = { name: string; type: string; balance: number };

const WALLET_LABELS: Record<string, string> = {
  efectivo: "Efectivo", yape: "Yape", plin: "Plin",
  bancaria: "Cuenta Bancaria", credito: "Tarjeta de Crédito", ahorros: "Cuenta de Ahorros",
};

const CAT_COLORS: [number, number, number][] = [
  [16, 185, 129], [99, 102, 241], [245, 158, 11], [239, 68, 68],
  [139, 92, 246], [6, 182, 212], [236, 72, 153], [249, 115, 22],
];

const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// ─── PDF generation ──────────────────────────────────────────────────────────
type RGB = [number, number, number];
const GREEN:  RGB = [16, 185, 129];
const RED:    RGB = [239, 68, 68];
const INK:    RGB = [15,  23,  42];
const MUTED:  RGB = [100, 116, 139];
const BORDER: RGB = [226, 232, 240];
const SUBTLE: RGB = [248, 250, 252];

async function generatePDF(txs: TxRow[], wallets: WalletRow[]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW = 210; const MG = 16; const CW = PW - MG * 2;
  let y = 0;

  const storedCfg = (() => { try { return JSON.parse(localStorage.getItem("Finora_config") ?? "{}"); } catch { return {}; } })();
  const baseFmt = makeFormatter(storedCfg.currency ?? "PEN");
  const sanitize = (s: string) => { let r = ""; for (const c of s) { const cp = c.codePointAt(0) ?? 0; if (cp === 0x202F || cp === 0x00A0) r += " "; else if (cp === 0x2212) r += "-"; else r += c; } return r; };
  const fmt = (n: number) => sanitize(baseFmt(Math.abs(n)));

  function sectionLabel(title: string) {
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...MUTED);
    doc.text(title.toUpperCase(), MG, y);
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.3);
    doc.line(MG + doc.getTextWidth(title.toUpperCase()) + 2, y - 0.5, MG + CW, y - 0.5);
    y += 5;
  }

  function ensureSpace(needed: number) {
    if (y + needed > 277) { doc.addPage(); y = 20; }
  }

  // HEADER
  doc.setFillColor(...GREEN); doc.rect(0, 0, PW, 2, "F");
  y = 14;
  doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK);
  doc.text("Finora", MG, y);
  const nameW = doc.getTextWidth("Finora");
  doc.setFillColor(...GREEN); doc.circle(MG + nameW + 2, y - 2.5, 1.5, "F");
  doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
  doc.text("Reporte Financiero Personal", MG, y + 5.5);
  const fechaStr = new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFontSize(7.5); doc.text(fechaStr, MG + CW, y, { align: "right" });
  y += 12;
  doc.setDrawColor(...GREEN); doc.setLineWidth(0.5); doc.line(MG, y, MG + CW, y);
  y += 8;

  // SUMMARY CARDS
  const totalIncome  = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalNet     = totalIncome - totalExpense;
  const totalWallets = wallets.reduce((s, w) => s + w.balance, 0);

  const cards = [
    { label: "Ingresos totales", value: fmt(totalIncome),  color: GREEN },
    { label: "Gastos totales",   value: fmt(totalExpense), color: RED   },
    { label: "Balance neto",     value: fmt(totalNet),     color: totalNet >= 0 ? GREEN : RED },
    { label: "Saldo en cuentas", value: fmt(totalWallets), color: [99, 102, 241] as RGB },
  ];
  const cardW = (CW - 9) / 4; const cardH = 20;
  cards.forEach((c, i) => {
    const cx = MG + i * (cardW + 3);
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.3); doc.roundedRect(cx, y, cardW, cardH, 1.5, 1.5, "S");
    doc.setFillColor(...c.color); doc.roundedRect(cx, y, cardW, 1.5, 1, 1, "F"); doc.rect(cx, y + 0.7, cardW, 0.8, "F");
    doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED); doc.text(c.label, cx + 4, y + 7);
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...c.color);
    doc.text(c.value.length > 13 ? c.value.slice(0, 12) + "…" : c.value, cx + 4, y + 15);
  });
  y += cardH + 10;

  // BAR CHART
  sectionLabel("Ingresos vs Gastos — últimos 6 meses");
  const now = new Date();
  const monthData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const m = d.getMonth(); const yr = d.getFullYear();
    const slice = txs.filter(t => { const td = new Date(t.date); return td.getMonth() === m && td.getFullYear() === yr; });
    return { label: MONTHS_SHORT[m], income: slice.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0), expense: slice.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0) };
  });
  const maxVal = Math.max(...monthData.flatMap(m => [m.income, m.expense]), 1);
  const chartH = 48; const barArea = chartH - 12; const colW = CW / 6;
  doc.setFillColor(...SUBTLE); doc.roundedRect(MG, y, CW, chartH, 2, 2, "F");
  doc.setDrawColor(...BORDER); doc.setLineWidth(0.25); doc.roundedRect(MG, y, CW, chartH, 2, 2, "S");
  for (let li = 1; li <= 3; li++) {
    const ly = y + 4 + barArea - (li / 3) * barArea;
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.2); doc.line(MG + 12, ly, MG + CW - 4, ly);
    doc.setFontSize(5); doc.setTextColor(...MUTED);
    const val = maxVal * li / 3;
    doc.text(val >= 1000 ? `${(val/1000).toFixed(1)}k` : val.toFixed(0), MG + 1.5, ly + 1.2);
  }
  monthData.forEach((m, i) => {
    const cx = MG + i * colW; const bw = colW * 0.22; const gap = colW * 0.12;
    const baseY = y + 4 + barArea; const incH = (m.income / maxVal) * barArea; const expH = (m.expense / maxVal) * barArea;
    const startX = cx + colW / 2 - bw - gap / 2;
    if (incH > 0.5) { doc.setFillColor(...GREEN); doc.roundedRect(startX, baseY - incH, bw, incH, 0.6, 0.6, "F"); }
    if (expH > 0.5) { doc.setFillColor(...RED);   doc.roundedRect(startX + bw + gap, baseY - expH, bw, expH, 0.6, 0.6, "F"); }
    doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(...MUTED);
    doc.text(m.label, cx + colW / 2, y + chartH - 2, { align: "center" });
  });
  const lgX = MG + CW - 30;
  doc.setFillColor(...GREEN); doc.roundedRect(lgX, y + 3.5, 4, 3, 0.5, 0.5, "F");
  doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED); doc.text("Ingresos", lgX + 5.5, y + 6.2);
  doc.setFillColor(...RED); doc.roundedRect(lgX, y + 8, 4, 3, 0.5, 0.5, "F"); doc.text("Gastos", lgX + 5.5, y + 10.7);
  y += chartH + 10;

  // CATEGORIES + WALLETS
  const catMap: Record<string, number> = {};
  txs.filter(t => t.type === "expense").forEach(t => { catMap[t.category] = (catMap[t.category] ?? 0) + t.amount; });
  const catData = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 7);
  if (catData.length > 0 || wallets.length > 0) {
    const panelW = (CW - 6) / 2; const rowH = 8.5;
    const rows = Math.max(catData.length, Math.min(wallets.length, 6)); const panelH = rows * rowH + 16;
    ensureSpace(panelH + 14);
    sectionLabel("Distribución de gastos y cuentas");
    if (catData.length > 0) {
      const maxCat = catData[0][1];
      catData.forEach(([name, val], i) => {
        const ry = y + i * rowH; const color = CAT_COLORS[i % CAT_COLORS.length];
        const pct = totalExpense > 0 ? (val / totalExpense) * 100 : 0;
        const barMax = panelW - 52; const barW = Math.max((val / maxCat) * barMax, 0);
        doc.setFillColor(...color); doc.circle(MG + 2.5, ry + 3, 1.5, "F");
        doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...INK);
        doc.text(name.length > 11 ? name.slice(0, 10) + "." : name, MG + 6, ry + 4.5);
        doc.setFillColor(...BORDER); doc.roundedRect(MG + 36, ry + 1.5, barMax, 3.5, 1, 1, "F");
        if (barW > 0) { doc.setFillColor(...color); doc.roundedRect(MG + 36, ry + 1.5, barW, 3.5, 1, 1, "F"); }
        doc.setFontSize(6); doc.setTextColor(...MUTED);
        doc.text(`${pct.toFixed(0)}%`, MG + panelW - 1, ry + 4.5, { align: "right" });
      });
    }
    if (wallets.length > 0) {
      const rx = MG + panelW + 6;
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK);
      doc.text("Cuenta", rx, y - 1); doc.text("Saldo", rx + panelW - 1, y - 1, { align: "right" });
      doc.setDrawColor(...BORDER); doc.setLineWidth(0.25); doc.line(rx, y + 1, rx + panelW - 1, y + 1);
      wallets.slice(0, 6).forEach((w, i) => {
        const ry = y + 4 + i * rowH;
        doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...INK);
        doc.text(w.name.length > 18 ? w.name.slice(0, 17) + "." : w.name, rx, ry);
        doc.setFontSize(6); doc.setTextColor(...MUTED); doc.text(WALLET_LABELS[w.type] ?? w.type, rx, ry + 3.5);
        doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...GREEN);
        doc.text(fmt(w.balance), rx + panelW - 1, ry + 1, { align: "right" });
      });
      const totalY = y + 4 + Math.min(wallets.length, 6) * rowH + 1;
      doc.setDrawColor(...BORDER); doc.setLineWidth(0.25); doc.line(rx, totalY, rx + panelW - 1, totalY);
      doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...INK);
      doc.text("Total", rx, totalY + 5); doc.setTextColor(...GREEN);
      doc.text(fmt(totalWallets), rx + panelW - 1, totalY + 5, { align: "right" });
    }
    y += Math.max(catData.length, Math.min(wallets.length, 6)) * rowH + 18;
  }

  // TRANSACTIONS
  if (txs.length > 0) {
    ensureSpace(20);
    sectionLabel(`Ultimas transacciones (${Math.min(txs.length, 40)} de ${txs.length})`);
    const cols = [
      { header: "Fecha",       w: 24 },
      { header: "Descripcion", w: 67 },
      { header: "Categoria",   w: 33 },
      { header: "Tipo",        w: 18 },
      { header: "Monto",       w: 36 },
    ];
    const headerH = 7; const rowH = 6.5;
    doc.setFillColor(...INK); doc.roundedRect(MG, y, CW, headerH, 1.5, 1.5, "F");
    doc.rect(MG, y + headerH / 2, CW, headerH / 2, "F");
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    let hx = MG + 3;
    cols.forEach(c => { doc.text(c.header, hx, y + 4.8); hx += c.w; });
    y += headerH;
    txs.slice(0, 40).forEach((t, i) => {
      ensureSpace(rowH + 2);
      if (i % 2 === 0) { doc.setFillColor(...SUBTLE); doc.rect(MG, y, CW, rowH, "F"); }
      const isIncome = t.type === "income";
      const amtColor: RGB = isIncome ? GREEN : RED;
      const cells = [
        new Date(t.date).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "2-digit" }),
        t.description.length > 38 ? t.description.slice(0, 37) + "…" : t.description,
        t.category.length > 16 ? t.category.slice(0, 15) + "…" : t.category,
        isIncome ? "Ingreso" : "Gasto",
        `${isIncome ? "+" : "-"}${fmt(t.amount)}`,
      ];
      let cx = MG + 3;
      cells.forEach((v, ci) => {
        if (ci === 3 || ci === 4) { doc.setTextColor(...amtColor); doc.setFont("helvetica", ci === 4 ? "bold" : "normal"); }
        else { doc.setTextColor(...(ci === 0 ? MUTED : INK)); doc.setFont("helvetica", "normal"); }
        doc.setFontSize(6.5); doc.text(v, cx, y + 4.3); cx += cols[ci].w;
      });
      doc.setDrawColor(...BORDER); doc.setLineWidth(0.15); doc.line(MG, y + rowH, MG + CW, y + rowH);
      y += rowH;
    });
    if (txs.length > 40) { y += 3; doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED); doc.text(`... y ${txs.length - 40} transacciones mas no mostradas.`, MG, y); }
  }

  // FOOTER
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...GREEN); doc.setLineWidth(0.4); doc.line(MG, 289, MG + CW, 289);
    doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
    doc.text("Finora · Reporte generado automaticamente · Solo uso personal", MG, 293.5);
    doc.text(`${p} / ${pages}`, MG + CW, 293.5, { align: "right" });
  }

  doc.save(`finora-reporte-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ─── UI ──────────────────────────────────────────────────────────────────────
type DataStats = { txCount: number; walletCount: number; income: number; expense: number } | null;

export default function ExportarClient() {
  const { t } = useConfig();
  const [status,     setStatus]     = useState<"idle" | "loading" | "done" | "error">("idle");
  const [importOpen, setImportOpen] = useState(false);
  const [stats,      setStats]      = useState<DataStats>(null);

  useEffect(() => {
    Promise.all([fetch("/api/transactions"), fetch("/api/wallets")])
      .then(async ([txRes, wRes]) => {
        const txs:     TxRow[]     = await txRes.json();
        const wallets: WalletRow[] = await wRes.json();
        const income  = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const expense = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        setStats({ txCount: txs.length, walletCount: wallets.length, income, expense });
      })
      .catch(() => {});
  }, []);

  const handleExport = async () => {
    setStatus("loading");
    try {
      const [txRes, wRes] = await Promise.all([fetch("/api/transactions"), fetch("/api/wallets")]);
      const txs:     TxRow[]     = await txRes.json();
      const wallets: WalletRow[] = await wRes.json();
      await generatePDF(txs, wallets);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 4000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  return (
    <div className="flex-1 min-h-screen" style={{ background: "#080b14" }}>
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-white/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-white font-bold text-2xl">{t("exp_title")}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{t("exp_subtitle")}</p>
          </div>
          <button onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-semibold hover:bg-indigo-500/15 transition-all flex-shrink-0">
            <Upload size={15} /> <span className="hidden sm:inline">Importar CSV</span>
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-5">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* ── LEFT: Export ── */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="px-5 pt-5 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <FileText size={15} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Reporte Financiero PDF</p>
                    <p className="text-slate-500 text-xs">Fondo blanco · Listo para imprimir</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Contenido del reporte</p>
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                  {[
                    "Resumen de ingresos y gastos",
                    "Gráfico de barras — 6 meses",
                    "Gastos por categoría",
                    "Saldo en cuentas",
                    "Tabla de transacciones",
                    "Numeración de páginas",
                  ].map(text => (
                    <div key={text} className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={handleExport} disabled={status === "loading"}
              className={`w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all
                ${status === "done"   ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : status === "error" ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "btn-primary text-white disabled:opacity-60"}`}>
              {status === "loading" && <><Loader2 size={16} className="animate-spin" />Generando PDF...</>}
              {status === "done"    && <><CheckCircle2 size={16} />PDF descargado</>}
              {status === "error"   && <>Error al generar — intenta de nuevo</>}
              {status === "idle"    && <><Download size={16} />Descargar reporte PDF</>}
            </button>

            {/* Import card */}
            <div className="rounded-2xl border border-white/5 p-5" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Upload size={15} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Importar desde CSV</p>
                  <p className="text-slate-500 text-xs">Desde tu banco o Excel</p>
                </div>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed mb-3">
                Sube un archivo CSV con tus movimientos bancarios. Finora lo procesa automáticamente y los agrega a tus transacciones.
              </p>
              <button onClick={() => setImportOpen(true)}
                className="w-full py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-semibold hover:bg-indigo-500/15 transition-all flex items-center justify-center gap-2">
                <Upload size={14} /> Subir archivo CSV
              </button>
            </div>
          </div>

          {/* ── RIGHT: Data summary ── */}
          <div className="space-y-4">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{t("exp_info")}</p>

            {stats ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: ArrowLeftRight, label: t("nav_transactions"), value: stats.txCount.toString(),    color: "#6366f1", bg: "rgba(99,102,241,0.1)"  },
                    { icon: Wallet,         label: t("nav_accounts"),     value: stats.walletCount.toString(), color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
                    { icon: BarChart3,      label: t("income"),            value: `+${stats.income.toLocaleString("es-PE", { maximumFractionDigits: 0 })}`, color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
                    { icon: PiggyBank,      label: t("expense"),           value: `-${stats.expense.toLocaleString("es-PE", { maximumFractionDigits: 0 })}`, color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
                  ].map(({ icon: Icon, label, value, color, bg }) => (
                    <div key={label} className="rounded-2xl border border-white/5 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                        <Icon size={15} style={{ color }} />
                      </div>
                      <p className="text-slate-500 text-xs">{label}</p>
                      <p className="text-white font-bold text-lg mt-0.5" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>

              </>
            ) : (
              <div className="rounded-2xl border border-white/5 p-8 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                <Loader2 size={20} className="animate-spin text-slate-600" />
              </div>
            )}

            {/* Tips */}
            <div className="rounded-2xl border border-white/5 p-5 space-y-3" style={{ background: "rgba(255,255,255,0.02)" }}>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">{t("exp_tips")}</p>
              {[
                { tip: "El PDF se genera en tu navegador — no se envía a ningún servidor." },
                { tip: "Para mejores resultados, exporta con las últimas transacciones cargadas." },
                { tip: "El reporte muestra máximo 40 transacciones para mantenerlo legible." },
              ].map(({ tip }) => (
                <div key={tip} className="flex gap-2.5 text-xs text-slate-500">
                  <div className="w-1 h-1 rounded-full bg-slate-600 flex-shrink-0 mt-1.5" />
                  <span className="leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <ImportarCSVModal open={importOpen} onClose={() => setImportOpen(false)} onImported={() => {}} />
    </div>
  );
}
