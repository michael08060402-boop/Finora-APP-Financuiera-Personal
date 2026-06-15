"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, CheckCircle2, AlertTriangle, Loader2, ArrowRight } from "lucide-react";
import Papa from "papaparse";

const EXPENSE_CATS = ["Alimentacion","Transporte","Vivienda","Salud","Entretenimiento","Educacion","Ropa","Tecnologia","Otro"];
const INCOME_CATS  = ["Salario","Freelance","Inversiones","Regalo","Otro"];
const ALL_CATS     = [...new Set([...INCOME_CATS, ...EXPENSE_CATS])];

type RawRow = Record<string, string>;
type MappedRow = { date: string; description: string; amount: number; type: "income"|"expense"; category: string; valid: boolean; error?: string };

function guessCol(headers: string[], keywords: string[]): string {
  return headers.find(h => keywords.some(k => h.toLowerCase().includes(k))) ?? "";
}

function parseAmount(v: string): number {
  return parseFloat(v.replace(/[^0-9.\-]/g, "")) || 0;
}

function parseDate(v: string): string {
  const clean = v.trim();
  const parts = clean.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number);
    if (c > 1900) return `${c}-${String(b).padStart(2,"0")}-${String(a).padStart(2,"0")}`;
    if (a > 1900) return `${a}-${String(b).padStart(2,"0")}-${String(c).padStart(2,"0")}`;
  }
  return clean;
}

export default function ImportarCSVModal({ open, onClose, onImported }: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload"|"map"|"preview"|"done">("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<RawRow[]>([]);
  const [map, setMap] = useState({ date: "", description: "", amount: "", type: "", category: "" });
  const [defaultType, setDefaultType] = useState<"income"|"expense">("expense");
  const [defaultCat, setDefaultCat] = useState("Otro");
  const [preview, setPreview] = useState<MappedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [drag, setDrag] = useState(false);

  const reset = () => {
    setStep("upload"); setHeaders([]); setRawRows([]); setPreview([]);
    setMap({ date: "", description: "", amount: "", type: "", category: "" });
  };

  const handleFile = useCallback((file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const hs = res.meta.fields ?? [];
        setHeaders(hs);
        setRawRows(res.data as RawRow[]);
        setMap({
          date:        guessCol(hs, ["fecha","date","dia","day"]),
          description: guessCol(hs, ["descripci","description","detalle","concepto","desc","glosa"]),
          amount:      guessCol(hs, ["monto","amount","importe","valor","total","cargo","abono"]),
          type:        guessCol(hs, ["tipo","type","movimiento"]),
          category:    guessCol(hs, ["categoria","category","rubro","clasificacion"]),
        });
        setStep("map");
      },
    });
  }, []);

  const buildPreview = () => {
    const rows: MappedRow[] = rawRows.slice(0, 200).map(r => {
      const dateStr = map.date ? parseDate(r[map.date] ?? "") : "";
      const desc    = map.description ? (r[map.description] ?? "").trim() : "";
      const amt     = map.amount ? parseAmount(r[map.amount] ?? "0") : 0;
      const rawType = map.type ? (r[map.type] ?? "").toLowerCase() : "";
      const type: "income"|"expense" =
        rawType.includes("ingr") || rawType.includes("income") || rawType.includes("abono") ? "income"
        : rawType.includes("gasto") || rawType.includes("expense") || rawType.includes("cargo") ? "expense"
        : defaultType;
      const cat = map.category ? (r[map.category] ?? defaultCat) : defaultCat;
      const valid = !!dateStr && !!desc && amt > 0;
      const error = !valid ? (!dateStr ? "Sin fecha" : !desc ? "Sin descripcion" : "Monto invalido") : undefined;
      return { date: dateStr, description: desc, amount: amt, type, category: cat, valid, error };
    });
    setPreview(rows);
    setStep("preview");
  };

  const handleImport = async () => {
    setImporting(true);
    const validRows = preview.filter(r => r.valid);
    const res = await fetch("/api/transactions/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: validRows }),
    });
    const data = await res.json();
    setImportedCount(data.imported ?? 0);
    setImporting(false);
    setStep("done");
    onImported();
  };

  const validCount = preview.filter(r => r.valid).length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={e => e.target === e.currentTarget && onClose()}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="glass-card rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center">
                  <FileText size={15} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Importar CSV del banco</p>
                  <p className="text-slate-500 text-xs">
                    {step === "upload"  && "Sube tu archivo CSV exportado del banco"}
                    {step === "map"     && "Indica que columna corresponde a cada campo"}
                    {step === "preview" && `${validCount} de ${preview.length} filas validas`}
                    {step === "done"    && `${importedCount} transacciones importadas`}
                  </p>
                </div>
              </div>
              <button onClick={() => { onClose(); reset(); }} className="text-slate-500 hover:text-slate-300">
                <X size={17} />
              </button>
            </div>

            {/* Steps indicator */}
            <div className="flex gap-0 flex-shrink-0 px-5 pt-4">
              {["Archivo","Columnas","Vista previa","Listo"].map((s, i) => {
                const idx = ["upload","map","preview","done"].indexOf(step);
                return (
                  <div key={s} className="flex items-center gap-1 flex-1">
                    <div className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold flex-shrink-0 transition-all ${i <= idx ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-600"}`}>
                      {i < idx ? "v" : i + 1}
                    </div>
                    <span className={`text-xs ${i <= idx ? "text-slate-300" : "text-slate-600"} hidden sm:block`}>{s}</span>
                    {i < 3 && <div className="flex-1 h-px mx-1" style={{ background: i < idx ? "#6366f1" : "rgba(255,255,255,0.06)" }} />}
                  </div>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">

              {/* Step 1: Upload */}
              {step === "upload" && (
                <div
                  onDragOver={e => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all ${drag ? "border-indigo-500/60 bg-indigo-500/5" : "border-white/10 hover:border-white/20 hover:bg-white/2"}`}>
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                    <Upload size={24} className="text-indigo-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">Arrastra tu archivo aqui</p>
                    <p className="text-slate-500 text-sm mt-1">o haz clic para seleccionarlo</p>
                    <p className="text-slate-600 text-xs mt-3">Acepta archivos .csv exportados de tu banco<br/>BCP, Interbank, BBVA, Scotiabank, etc.</p>
                  </div>
                  <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>
              )}

              {/* Step 2: Map columns */}
              {step === "map" && (
                <div className="flex flex-col gap-4">
                  <p className="text-slate-400 text-sm">Columnas detectadas en tu CSV. Indica a que campo corresponde cada una:</p>

                  {(["date","description","amount","type","category"] as const).map(field => {
                    const labels: Record<string, string> = {
                      date: "Fecha *", description: "Descripcion *", amount: "Monto *",
                      type: "Tipo (ingreso/gasto)", category: "Categoria",
                    };
                    return (
                      <div key={field} className="flex items-center gap-3">
                        <label className="text-slate-300 text-sm w-36 flex-shrink-0">{labels[field]}</label>
                        <select value={map[field]} onChange={e => setMap({ ...map, [field]: e.target.value })}
                          className="select-field flex-1 rounded-xl px-3 py-2.5 text-sm">
                          <option value="">No usar</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    );
                  })}

                  <div className="flex gap-4 mt-2 flex-wrap">
                    <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                      <label className="text-slate-400 text-xs">Tipo por defecto</label>
                      <select value={defaultType} onChange={e => setDefaultType(e.target.value as "income"|"expense")}
                        className="select-field rounded-xl px-3 py-2.5 text-sm">
                        <option value="expense">Gasto</option>
                        <option value="income">Ingreso</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                      <label className="text-slate-400 text-xs">Categoria por defecto</label>
                      <select value={defaultCat} onChange={e => setDefaultCat(e.target.value)}
                        className="select-field rounded-xl px-3 py-2.5 text-sm">
                        {ALL_CATS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {rawRows.length > 0 && (
                    <div className="mt-2 rounded-xl border border-white/5 overflow-hidden">
                      <p className="text-slate-500 text-xs px-3 py-2 border-b border-white/5">Vista rapida - primeras 3 filas</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-white/5">
                              {headers.map(h => <th key={h} className="px-3 py-2 text-slate-500 font-medium whitespace-nowrap">{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {rawRows.slice(0, 3).map((r, i) => (
                              <tr key={i} className="border-b border-white/3 last:border-b-0">
                                {headers.map(h => <td key={h} className="px-3 py-2 text-slate-400 whitespace-nowrap max-w-[140px] truncate">{r[h]}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <button onClick={buildPreview}
                    disabled={!map.date || !map.description || !map.amount}
                    className="btn-primary py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 mt-2 disabled:opacity-40 disabled:cursor-not-allowed">
                    Ver vista previa <ArrowRight size={15} />
                  </button>
                </div>
              )}

              {/* Step 3: Preview */}
              {step === "preview" && (
                <div className="flex flex-col gap-4">
                  {validCount < preview.length && (
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/8">
                      <AlertTriangle size={14} className="text-amber-400" />
                      <p className="text-amber-300 text-xs">{preview.length - validCount} fila{preview.length - validCount > 1 ? "s" : ""} seran omitidas por datos incompletos.</p>
                    </div>
                  )}

                  <div className="rounded-xl border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-xs text-left">
                        <thead className="sticky top-0" style={{ background: "#0d1526" }}>
                          <tr className="border-b border-white/5">
                            <th className="px-3 py-2 text-slate-500">Fecha</th>
                            <th className="px-3 py-2 text-slate-500">Descripcion</th>
                            <th className="px-3 py-2 text-slate-500">Monto</th>
                            <th className="px-3 py-2 text-slate-500">Tipo</th>
                            <th className="px-3 py-2 text-slate-500">Categoria</th>
                            <th className="px-3 py-2 text-slate-500">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.map((r, i) => (
                            <tr key={i} className={`border-b border-white/3 last:border-b-0 ${!r.valid ? "opacity-40" : ""}`}>
                              <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{r.date}</td>
                              <td className="px-3 py-2 text-slate-300 max-w-[160px] truncate">{r.description}</td>
                              <td className="px-3 py-2 whitespace-nowrap font-medium" style={{ color: r.type === "income" ? "#10b981" : "#ef4444" }}>
                                {r.type === "income" ? "+" : "-"}{r.amount.toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-slate-400">{r.type === "income" ? "Ingreso" : "Gasto"}</td>
                              <td className="px-3 py-2 text-slate-400">{r.category}</td>
                              <td className="px-3 py-2">
                                {r.valid
                                  ? <span className="text-emerald-400">OK</span>
                                  : <span className="text-red-400" title={r.error}>Error</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setStep("map")} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 text-sm hover:bg-white/8 transition-all">
                      Volver
                    </button>
                    <button onClick={handleImport} disabled={importing || validCount === 0}
                      className="btn-primary flex-1 py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
                      {importing ? <Loader2 size={15} className="animate-spin" /> : <><Upload size={15} /> Importar {validCount} transacciones</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Done */}
              {step === "done" && (
                <div className="flex flex-col items-center py-8 gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 size={30} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">{importedCount} transacciones importadas</p>
                    <p className="text-slate-500 text-sm mt-1">Puedes verlas en la seccion de Transacciones.</p>
                  </div>
                  <button onClick={() => { onClose(); reset(); }}
                    className="btn-primary px-6 py-3 rounded-xl text-white text-sm font-semibold mt-2">
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
