"use client";

import { useState } from "react";
import { Download, Loader2, CheckCircle2, FileText, Upload } from "lucide-react";
import { makeFormatter } from "@/lib/i18n";
import ImportarCSVModal from "./ImportarCSVModal";

type TxRow = { date: string; description: string; amount: number; type: string; category: string };
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

async function generatePDF(txs: TxRow[], wallets: WalletRow[]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210; const mg = 15; const cW = W - mg * 2;
  let y = 0;

  const storedCfg = (() => { try { return JSON.parse(localStorage.getItem("Finora_config") ?? "{}"); } catch { return {}; } })();
  const baseFmt   = makeFormatter(storedCfg.currency ?? "PEN");
  const fmt       = (n: number) => baseFmt(Math.abs(n));
  const rgb = (r: number, g: number, b: number) => [r, g, b] as [number, number, number];

  // 
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, W, 30, "F");

  // Logo cuadro blanco
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(mg, 7, 12, 12, 2, 2, "F");
  doc.setFillColor(16, 185, 129);
  doc.rect(mg + 3, 10, 6, 1.5, "F");
  doc.rect(mg + 3, 13, 4, 1.5, "F");
  doc.rect(mg + 3, 16, 5, 1.5, "F");

  doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  doc.text("Finora", mg + 15, 14.5);
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(209, 250, 229);
  doc.text("Reporte Financiero Personal", mg + 15, 20.5);

  const fechaStr = new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
  doc.setFontSize(8); doc.setTextColor(209, 250, 229);
  doc.text(fechaStr, W - mg, 14.5, { align: "right" });

  y = 40;

  // 
  const totalIncome  = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalNet     = totalIncome - totalExpense;
  const totalWallets = wallets.reduce((s, w) => s + w.balance, 0);

  const summaryItems = [
    { label: "Ingresos totales", value: fmt(totalIncome), color: rgb(16,185,129) },
    { label: "Gastos totales",   value: fmt(totalExpense), color: rgb(239,68,68) },
    { label: "Balance neto",     value: fmt(totalNet),     color: totalNet >= 0 ? rgb(16,185,129) : rgb(239,68,68) },
    { label: "En cuentas",       value: fmt(totalWallets), color: rgb(99,102,241) },
  ];

  const cardW = (cW - 9) / 4;
  summaryItems.forEach((item, i) => {
    const cx = mg + i * (cardW + 3);
    // Borde izquierdo de color
    doc.setFillColor(...item.color); doc.rect(cx, y, 2.5, 22, "F");
    // Fondo gris muy claro
    doc.setFillColor(248, 250, 252); doc.rect(cx + 2.5, y, cardW - 2.5, 22, "F");
    // Borde
    doc.setDrawColor(226, 232, 240); doc.rect(cx, y, cardW, 22, "S");
    // Texto
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
    doc.text(item.label, cx + 5, y + 7);
    doc.setFontSize(9.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...item.color);
    const valueText = item.value.length > 14 ? item.value.slice(0, 13) + "..." : item.value;
    doc.text(valueText, cx + 5, y + 16);
  });
  y += 30;

  // ÁFICO: INGRESOS VS GASTOS 6 MESES 
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
  doc.text("Ingresos vs Gastos - últimos 6 meses", 14, y); y += 5;

  const chartH = 52; const barAreaH = chartH - 14;
  const now = new Date();
  const monthData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const m = d.getMonth(); const yr = d.getFullYear();
    const slice = txs.filter(t => { const td = new Date(t.date); return td.getMonth() === m && td.getFullYear() === yr; });
    return {
      label: MONTHS_SHORT[m],
      income:  slice.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: slice.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });

  const maxVal = Math.max(...monthData.flatMap(m => [m.income, m.expense]), 100);

  // Fondo del gráfico
  doc.setFillColor(248, 250, 252); doc.roundedRect(mg, y, cW, chartH, 2, 2, "F");
  doc.setDrawColor(226, 232, 240); doc.roundedRect(mg, y, cW, chartH, 2, 2, "S");

  // Líneas de referencia horizontales
  for (let li = 1; li <= 3; li++) {
    const ly = y + 6 + barAreaH - (li / 4) * barAreaH;
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.2);
    doc.line(mg + 4, ly, mg + cW - 4, ly);
    const val = (maxVal * li / 4);
    doc.setFontSize(5.5); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
    doc.text(`S/.${val >= 1000 ? (val/1000).toFixed(1)+"k" : val.toFixed(0)}`, mg + 2, ly + 1);
  }

  const colW = cW / 6;
  monthData.forEach((m, i) => {
    const cx = mg + i * colW;
    const bw = colW * 0.25;
    const gap = colW * 0.1;
    const baseY = y + 6 + barAreaH;

    const incH = maxVal > 0 ? (m.income / maxVal) * barAreaH : 0;
    const expH = maxVal > 0 ? (m.expense / maxVal) * barAreaH : 0;

    // Barras ingreso
    if (incH > 0) {
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(cx + gap + 3, baseY - incH, bw, incH, 0.8, 0.8, "F");
    }
    // Barras gasto
    if (expH > 0) {
      doc.setFillColor(239, 68, 68);
      doc.roundedRect(cx + gap * 2 + bw + 3, baseY - expH, bw, expH, 0.8, 0.8, "F");
    }
    // Etiqueta mes
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(71, 85, 105);
    doc.text(m.label, cx + colW / 2, y + chartH - 3, { align: "center" });
  });

  // Leyenda
  doc.setFillColor(16, 185, 129); doc.roundedRect(mg + cW - 38, y + 4, 5, 3.5, 0.5, 0.5, "F");
  doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(71, 85, 105);
  doc.text("Ingresos", mg + cW - 32, y + 6.8);
  doc.setFillColor(239, 68, 68); doc.roundedRect(mg + cW - 17, y + 4, 5, 3.5, 0.5, 0.5, "F");
  doc.text("Gastos", mg + cW - 11, y + 6.8);

  y += chartH + 8;

  // ÍA 
  const catMap: Record<string, number> = {};
  txs.filter(t => t.type === "expense").forEach(t => { catMap[t.category] = (catMap[t.category] ?? 0) + t.amount; });
  const catData = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 7);

  if (catData.length > 0) {
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
    doc.text("Distribución de gastos por categoría", mg, y); y += 5;

    const halfW = (cW - 5) / 2;
    const rowH = 9; const catBlockH = catData.length * rowH + 10;

    // Panel izquierdo: barras categorías
    doc.setFillColor(248, 250, 252); doc.roundedRect(mg, y, halfW, catBlockH, 2, 2, "F");
    doc.setDrawColor(226, 232, 240); doc.roundedRect(mg, y, halfW, catBlockH, 2, 2, "S");
    const maxCat = catData[0][1];

    catData.forEach(([name, val], i) => {
      const ry = y + 6 + i * rowH;
      const color = CAT_COLORS[i % CAT_COLORS.length];
      const pct = totalExpense > 0 ? (val / totalExpense) * 100 : 0;
      const barMaxW = halfW - 50;
      const barW = (val / maxCat) * barMaxW;

      // Punto de color
      doc.setFillColor(...color); doc.circle(mg + 5, ry + 3, 1.5, "F");

      // Nombre categoría
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(30, 41, 59);
      const shortName = name.length > 12 ? name.slice(0, 11) + "." : name;
      doc.text(shortName, mg + 9, ry + 4.5);

      // Barra de progreso (fondo)
      doc.setFillColor(226, 232, 240); doc.roundedRect(mg + halfW - barMaxW - 2, ry + 1, barMaxW, 4, 1, 1, "F");
      // Barra rellena
      if (barW > 0) { doc.setFillColor(...color); doc.roundedRect(mg + halfW - barMaxW - 2, ry + 1, barW, 4, 1, 1, "F"); }

      // Porcentaje
      doc.setFontSize(6); doc.setTextColor(100, 116, 139);
      doc.text(`${pct.toFixed(0)}%`, mg + halfW - 2, ry + 4.5, { align: "right" });
    });

    // Panel derecho: cuentas
    const rx = mg + halfW + 5;
    doc.setFillColor(248, 250, 252); doc.roundedRect(rx, y, halfW, catBlockH, 2, 2, "F");
    doc.setDrawColor(226, 232, 240); doc.roundedRect(rx, y, halfW, catBlockH, 2, 2, "S");

    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
    doc.text("Saldo en cuentas", rx + 5, y + 7);

    // Línea separadora
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3); doc.line(rx + 3, y + 9, rx + halfW - 3, y + 9);

    wallets.slice(0, 5).forEach((w, i) => {
      const ry = y + 14 + i * 9;
      doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(51, 65, 85);
      doc.text(`${w.name}`, rx + 5, ry);
      doc.setFontSize(6.5); doc.setTextColor(100, 116, 139);
      doc.text(WALLET_LABELS[w.type] ?? w.type, rx + 5, ry + 4);
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(16, 185, 129);
      doc.text(fmt(w.balance), rx + halfW - 3, ry, { align: "right" });
    });

    if (wallets.length > 0) {
      doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
      doc.line(rx + 3, y + catBlockH - 10, rx + halfW - 3, y + catBlockH - 10);
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
      doc.text("Total", rx + 5, y + catBlockH - 4);
      doc.setTextColor(16, 185, 129);
      doc.text(fmt(totalWallets), rx + halfW - 3, y + catBlockH - 4, { align: "right" });
    }

    y += catBlockH + 8;
  }

  // 
  if (y > 215) { doc.addPage(); y = 18; }

  const limit = Math.min(txs.length, 30);
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(15, 23, 42);
  doc.text(``, mg, y); y += 5;

  // Cabecera tabla
  const colWidths = [28, 60, 24, 18, 24];
  const headers   = ["Fecha", "Descripción", "Categoría", "Tipo", "Monto"];

  doc.setFillColor(15, 23, 42); doc.rect(mg, y, cW, 7.5, "F");
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  let hx = mg + 2;
  headers.forEach((h, i) => { doc.text(h, hx, y + 5); hx += colWidths[i]; });
  y += 7.5;

  txs.slice(0, limit).forEach((t, i) => {
    if (y > 275) { doc.addPage(); y = 18; }

    // Fondo alterno
    if (i % 2 === 0) { doc.setFillColor(248, 250, 252); } else { doc.setFillColor(255, 255, 255); }
    doc.rect(mg, y, cW, 7, "F");
    doc.setDrawColor(241, 245, 249); doc.setLineWidth(0.2);
    doc.line(mg, y + 7, mg + cW, y + 7);

    const isIncome = t.type === "income";
    const row = [
      new Date(t.date).toLocaleDateString("es-PE"),
      t.description.slice(0, 36),
      t.category,
      isIncome ? "Ingreso" : "Gasto",
      fmt(t.amount),
    ];

    let rx = mg + 2;
    row.forEach((v, ci) => {
      if (ci === 3) { doc.setTextColor(isIncome ? 16 : 220, isIncome ? 185 : 38, isIncome ? 129 : 38); }
      else if (ci === 4) { doc.setTextColor(isIncome ? 16 : 220, isIncome ? 185 : 38, isIncome ? 129 : 38); }
      else { doc.setTextColor(51, 65, 85); }
      doc.setFontSize(7); doc.setFont("helvetica", ci === 4 ? "bold" : "normal");
      doc.text(v, rx, y + 4.8);
      rx += colWidths[ci];
    });
    y += 7;
  });

  // 
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFillColor(248, 250, 252); doc.rect(0, 287, W, 10, "F");
    doc.setDrawColor(226, 232, 240); doc.line(0, 287, W, 287);
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(148, 163, 184);
    doc.text("Finora  - Reporte generado automáticamente. Solo para uso personal.", mg, 293);
    doc.text(`Página ${p} de ${pages}`, W - mg, 293, { align: "right" });
  }

  doc.save(`reporte_Finora_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export default function ExportarClient() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [importOpen, setImportOpen] = useState(false);

  const handleExport = async () => {
    setStatus("loading");
    try {
      const [txRes, wRes] = await Promise.all([fetch("/api/transactions"), fetch("/api/wallets")]);
      const txs: TxRow[] = await txRes.json();
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
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-white/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-white font-bold text-2xl">Exportar / Importar</h1>
            <p className="text-slate-500 text-sm mt-0.5">Descarga tu reporte PDF o importa transacciones desde el banco</p>
          </div>
          <button onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-semibold hover:bg-indigo-500/15 transition-all flex-shrink-0">
            <Upload size={15} /> <span className="hidden sm:inline">Importar CSV</span>
          </button>
        </div>
      </div>

      <div className="px-6 py-8 max-w-lg">
        {/* Vista previa del PDF */}
        <div className="rounded-2xl border border-white/5 overflow-hidden mb-5" style={{ background: "rgba(255,255,255,0.02)" }}>
          {/* Mini preview del PDF */}
          <div className="bg-emerald-500 px-5 py-3 flex items-center gap-3">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-white text-xs font-bold">F</div>
            <div>
              <p className="text-white font-bold text-sm">Finora</p>
              <p className="text-emerald-100 text-xs">Reporte Financiero Personal</p>
            </div>
          </div>
          <div className="p-5">
            <p className="text-white font-semibold mb-3 text-sm">El PDF incluirá:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { emoji: "📊", text: "Gráfico barras 6 meses" },
                { emoji: "🏷️", text: "Gastos por categoría" },
                { emoji: "📋", text: "Tabla de transacciones" },
                { emoji: "🎯", text: "Metas de ahorro" },
                { emoji: "💼", text: "Presupuestos del mes" },
                { emoji: "📈", text: "Resumen y balance" },
              ].map(({ emoji, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{emoji}</span><span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleExport} disabled={status === "loading"}
          className={`w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all
            ${status === "done" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            : status === "error" ? "bg-red-500/10 text-red-400 border border-red-500/20"
            : "btn-primary text-white disabled:opacity-60"}`}>
          {status === "loading" && <><Loader2 size={16} className="animate-spin" /> Generando PDF...</>}
          {status === "done" && <><CheckCircle2 size={16} /> PDF descargado con éxito</>}
          {status === "error" && <>Error al generar  - intenta de nuevo</>}
          {status === "idle" && <><Download size={16} /> Descargar reporte PDF</>}
        </button>

        <div className="mt-4 rounded-xl border border-white/5 p-4 flex gap-3" style={{ background: "rgba(255,255,255,0.01)" }}>
          <FileText size={15} className="text-slate-600 flex-shrink-0 mt-0.5" />
          <p className="text-slate-500 text-xs leading-relaxed">
            El PDF se genera directamente en tu navegador con fondo blanco y letras oscuras, listo para imprimir o compartir.
            Compatible con Adobe Acrobat, el visor de Windows y cualquier navegador.
          </p>
        </div>
      </div>

      <ImportarCSVModal open={importOpen} onClose={() => setImportOpen(false)} onImported={() => {}} />
    </div>
  );
}

