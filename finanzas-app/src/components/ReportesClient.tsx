"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, TrendingUp, TrendingDown, DollarSign, BarChart3, ArrowUp, ArrowDown, Minus, ChevronLeft, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import clsx from "clsx";
import { useConfig } from "./ConfigProvider";

const MONTHS_LONG  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const COLORS = ["#10b981","#6366f1","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899","#f97316","#14b8a6","#84cc16"];

type Tx = { date: string; amount: number; type: string; category: string };
type Mode = "evolucion" | "comparar";
type EvolPeriod = "6m" | "12m" | "year";
type ComparePreset = "prevmes" | "prevtrim" | "prevyear" | "custom";

const fmtK = (v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v);

function getPeriodStats(txs: Tx[], m: number, y: number) {
  const slice = txs.filter(t => { const d = new Date(t.date); return d.getMonth() === m && d.getFullYear() === y; });
  const income  = slice.filter(t => t.type === "income").reduce((s,t) => s+t.amount, 0);
  const expense = slice.filter(t => t.type === "expense").reduce((s,t) => s+t.amount, 0);
  const cats: Record<string,number> = {};
  slice.filter(t => t.type === "expense").forEach(t => { cats[t.category] = (cats[t.category]??0) + t.amount; });
  return { income, expense, balance: income - expense, count: slice.length, cats };
}

function getMultiMonthData(txs: Tx[], count: number, refDate?: Date) {
  const now = refDate ?? new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    const s = getPeriodStats(txs, d.getMonth(), d.getFullYear());
    return { name: MONTHS_SHORT[d.getMonth()], year: d.getFullYear(), ...s, net: s.income - s.expense };
  });
}

function getYearData(txs: Tx[], year: number) {
  return Array.from({ length: 12 }, (_, m) => {
    const s = getPeriodStats(txs, m, year);
    return { name: MONTHS_SHORT[m], ...s, net: s.income - s.expense };
  });
}

function pctChange(a: number, b: number) {
  if (a === 0) return b > 0 ? 100 : 0;
  return ((b - a) / a) * 100;
}

function ChangeIndicator({ from, to, invert = false }: { from: number; to: number; invert?: boolean }) {
  const diff = to - from;
  const pct  = pctChange(from, to);
  const positive = invert ? diff < 0 : diff > 0;
  const neutral = diff === 0;
  return (
    <div className={clsx("flex items-center gap-1 text-xs font-medium",
      neutral ? "text-slate-500" : positive ? "text-emerald-400" : "text-red-400")}>
      {neutral ? <Minus size={12}/> : positive ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}
      {neutral ? "Igual" : `${Math.abs(pct).toFixed(1)}%`}
    </div>
  );
}

function makeTooltip(fmt: (n: number) => string) {
  return ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-white/10 p-3 text-xs" style={{ background: "#0f1624" }}>
        <p className="text-slate-300 font-medium mb-1.5">{label}</p>
        {payload.map((p: any) => {
          const name = p.name === "income" ? "Ingresos" : p.name === "expense" ? "Gastos" : p.name === "A" ? "Período A" : p.name === "B" ? "Período B" : "Neto";
          return <p key={p.dataKey} style={{ color: p.fill || p.color }}>{name}: {fmt(p.value)}</p>;
        })}
      </div>
    );
  };
}

export default function ReportesClient() {
  const { formatAmount: fmt, t } = useConfig();
  const tooltip = makeTooltip(fmt);
  const [txs, setTxs]     = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode]   = useState<Mode>("evolucion");
  const [evolPeriod, setEvolPeriod] = useState<EvolPeriod>("6m");
  const [preset, setPreset] = useState<ComparePreset>("prevmes");

  const now = new Date();
  const [cA, setCA] = useState({ month: now.getMonth(), year: now.getFullYear() });
  const [cB, setCB] = useState({ month: now.getMonth() === 0 ? 11 : now.getMonth() - 1, year: now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear() });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/transactions");
    setTxs(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Resolve compare periods from preset
  const resolvedA = (() => {
    if (preset === "custom") return cA;
    const today = new Date();
    if (preset === "prevmes")  return { month: today.getMonth(), year: today.getFullYear() };
    if (preset === "prevtrim") {
      const m = today.getMonth();
      return { month: m < 3 ? 2 : m < 6 ? 5 : m < 9 ? 8 : 11, year: today.getFullYear() };
    }
    return { month: -1, year: today.getFullYear() }; // year mode handled separately
  })();

  const resolvedB = (() => {
    if (preset === "custom") return cB;
    const today = new Date();
    if (preset === "prevmes") {
      return { month: today.getMonth() === 0 ? 11 : today.getMonth() - 1, year: today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear() };
    }
    if (preset === "prevtrim") {
      const m = today.getMonth();
      return { month: m < 3 ? 11 : m < 6 ? 2 : m < 9 ? 5 : 8, year: m < 3 ? today.getFullYear() - 1 : today.getFullYear() };
    }
    return { month: -1, year: today.getFullYear() - 1 };
  })();

  const isYearMode = preset === "prevyear";
  const statsA = isYearMode ? null : getPeriodStats(txs, resolvedA.month, resolvedA.year);
  const statsB = isYearMode ? null : getPeriodStats(txs, resolvedB.month, resolvedB.year);
  const yearDataA = isYearMode ? getYearData(txs, now.getFullYear())     : null;
  const yearDataB = isYearMode ? getYearData(txs, now.getFullYear() - 1) : null;

  const labelA = isYearMode ? `Año ${now.getFullYear()}` : `${MONTHS_LONG[resolvedA.month]} ${resolvedA.year}`;
  const labelB = isYearMode ? `Año ${now.getFullYear() - 1}` : `${MONTHS_LONG[resolvedB.month]} ${resolvedB.year}`;

  const totalIncome  = txs.filter(t => t.type === "income").reduce((s,t) => s+t.amount, 0);
  const totalExpense = txs.filter(t => t.type === "expense").reduce((s,t) => s+t.amount, 0);

  const catTotals: Record<string,number> = {};
  txs.filter(t => t.type === "expense").forEach(t => { catTotals[t.category] = (catTotals[t.category]??0) + t.amount; });
  const catData = Object.entries(catTotals).sort((a,b) => b[1]-a[1]).slice(0,8).map(([name,value]) => ({ name, value }));

  const evolData = evolPeriod === "year"
    ? getYearData(txs, now.getFullYear())
    : getMultiMonthData(txs, evolPeriod === "6m" ? 6 : 12);

  function MonthPicker({ value, onChange }: { value: { month: number; year: number }; onChange: (v: { month: number; year: number }) => void }) {
    const changeM = (dir: number) => {
      let m = value.month + dir; let y = value.year;
      if (m > 11) { m = 0; y++; } if (m < 0) { m = 11; y--; }
      onChange({ month: m, year: y });
    };
    return (
      <div className="flex items-center gap-2">
        <button onClick={() => changeM(-1)} className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-white/5"><ChevronLeft size={14}/></button>
        <span className="text-white text-sm font-medium min-w-[110px] text-center">{MONTHS_LONG[value.month]} {value.year}</span>
        <button onClick={() => changeM(1)} className="text-slate-500 hover:text-slate-300 p-1 rounded-lg hover:bg-white/5"><ChevronRight size={14}/></button>
      </div>
    );
  }

  if (loading) return <div className="flex-1 flex items-center justify-center" style={{background:"#080b14"}}><Loader2 size={28} className="animate-spin text-emerald-500"/></div>;

  return (
    <div className="flex-1 min-h-screen" style={{ background: "#080b14" }}>
      {/* */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-white/5">
        <h1 className="text-white font-bold text-xl sm:text-2xl">{t("nav_reports")}</h1>
        <p className="text-slate-500 text-sm mt-0.5">{t("rep_subtitle")}</p>

        {/* Mode tabs */}
        <div className="flex gap-1 mt-5 bg-white/4 p-1 rounded-xl w-fit border border-white/5">
          {([["evolucion", t("rep_tab_evol")],["comparar", t("rep_tab_compare")]] as [typeof mode, string][]).map(([v,l]) => (
            <button key={v} onClick={() => setMode(v)}
              className={clsx("px-4 py-2 rounded-lg text-sm font-medium transition-all",
                mode === v ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" : "text-slate-500 hover:text-slate-300")}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-6">

        {/* */}
        {mode === "evolucion" && (
          <>
            {/* Period selector */}
            <div className="flex gap-2 flex-wrap">
              {([["6m", t("rep_6m")],["12m", t("rep_12m")],["year", t("rep_year")]] as [EvolPeriod,string][]).map(([v,l]) => (
                <button key={v} onClick={() => setEvolPeriod(v)}
                  className={clsx("px-4 py-2 rounded-xl text-xs font-medium transition-all border",
                    evolPeriod === v ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10")}>
                  {l}
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label:t("rep_total_income"),  value:totalIncome, color:"#10b981", icon:TrendingUp },
                { label:t("rep_total_expense"), value:totalExpense, color:"#ef4444", icon:TrendingDown },
                { label:t("rep_net"),  value:totalIncome-totalExpense, color:(totalIncome-totalExpense)>=0?"#10b981":"#ef4444", icon:DollarSign },
              ].map(({ label, value, color, icon:Icon }) => (
                <div key={label} className="rounded-2xl border border-white/5 p-5" style={{background:"rgba(255,255,255,0.02)"}}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:`${color}18`}}>
                      <Icon size={15} style={{color}}/>
                    </div>
                    <p className="text-slate-400 text-xs">{label}</p>
                  </div>
                  <p className="font-bold text-xl" style={{color}}>{fmt(value)}</p>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div className="rounded-2xl border border-white/5 p-6" style={{background:"rgba(255,255,255,0.02)"}}>
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 size={15} className="text-emerald-400"/>
                <h2 className="text-white font-semibold text-sm">Ingresos vs Gastos</h2>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={evolData} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="name" tick={{fill:"#64748b",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={fmtK}/>
                  <Tooltip content={tooltip} cursor={{fill:"rgba(255,255,255,0.03)"}}/>
                  <Bar dataKey="income"  name="income"  fill="#10b981" radius={[4,4,0,0]}/>
                  <Bar dataKey="expense" name="expense" fill="#ef4444" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Categories + net */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/5 p-6" style={{background:"rgba(255,255,255,0.02)"}}>
                <h2 className="text-white font-semibold text-sm mb-4">Gastos por categoría</h2>
                {catData.length === 0
                  ? <p className="text-slate-500 text-sm text-center py-10">Sin gastos aún</p>
                  : <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={catData} cx="50%" cy="50%" innerRadius={48} outerRadius={80} dataKey="value" paddingAngle={3}>
                          {catData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                        </Pie>
                        <Tooltip formatter={((v:number) => fmt(v)) as any} contentStyle={{background:"#0f1624",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,fontSize:11}}/>
                      </PieChart>
                    </ResponsiveContainer>
                }
              </div>
              <div className="rounded-2xl border border-white/5 p-6 flex flex-col gap-2.5 overflow-auto" style={{background:"rgba(255,255,255,0.02)"}}>
                <h2 className="text-white font-semibold text-sm mb-1">Detalle categorías</h2>
                {catData.map((c,i) => {
                  const pct = totalExpense > 0 ? (c.value/totalExpense)*100 : 0;
                  return (
                    <div key={c.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{background:COLORS[i%COLORS.length]}}/>
                          <span className="text-slate-300 text-xs">{c.name}</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-slate-500 text-xs">{pct.toFixed(0)}%</span>
                          <span className="text-white text-xs font-medium">{fmt(c.value)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{width:`${pct}%`,background:COLORS[i%COLORS.length]}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Net balance */}
            <div className="rounded-2xl border border-white/5 p-6" style={{background:"rgba(255,255,255,0.02)"}}>
              <h2 className="text-white font-semibold text-sm mb-4">Balance neto por mes</h2>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={evolData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="name" tick={{fill:"#64748b",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={fmtK}/>
                  <Tooltip content={tooltip} cursor={{fill:"rgba(255,255,255,0.03)"}}/>
                  <Bar dataKey="net" name="Neto" radius={[4,4,0,0]}>
                    {evolData.map((d,i) => <Cell key={i} fill={d.net>=0?"#10b981":"#ef4444"}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* */}
        {mode === "comparar" && (
          <>
            {/* Preset selector */}
            <div className="rounded-2xl border border-white/5 p-5" style={{background:"rgba(255,255,255,0.02)"}}>
              <p className="text-slate-400 text-sm font-medium mb-3">¿Qué quieres comparar?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {([
                  ["prevmes",  "Este mes vs mes anterior",        "Comparación mensual rápida"],
                  ["prevtrim", "Este trimestre vs trimestre ant.", "Q1, Q2, Q3, Q4"],
                  ["prevyear", "Este año vs año anterior",        "Evolución anual completa"],
                  ["custom",   "Elegir dos períodos",             "Cualquier mes contra otro"],
                ] as const).map(([v, l, sub]) => (
                  <button key={v} onClick={() => setPreset(v)}
                    className={clsx("flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl border text-left transition-all",
                      preset === v ? "border-emerald-500/40 bg-emerald-500/8 text-emerald-300" : "border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-300")}>
                    <span className="text-sm font-medium">{l}</span>
                    <span className="text-xs opacity-60">{sub}</span>
                  </button>
                ))}
              </div>

              {/* Custom pickers */}
              {preset === "custom" && (
                <div className="flex items-center gap-4 pt-3 border-t border-white/5 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"/>
                    <span className="text-slate-400 text-xs">Período A:</span>
                    <MonthPicker value={cA} onChange={setCA}/>
                  </div>
                  <div className="text-slate-700 text-sm font-bold">vs</div>
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"/>
                    <span className="text-slate-400 text-xs">Período B:</span>
                    <MonthPicker value={cB} onChange={setCB}/>
                  </div>
                </div>
              )}
            </div>

            {/* Period labels */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"/>
                <span className="text-white font-semibold text-sm">{labelA}</span>
              </div>
              <span className="text-slate-700 font-bold">vs</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"/>
                <span className="text-white font-semibold text-sm">{labelB}</span>
              </div>
            </div>

            {/* YEAR vs YEAR comparison */}
            {isYearMode && yearDataA && yearDataB && (() => {
              const totalA = { income: yearDataA.reduce((s,d)=>s+d.income,0), expense: yearDataA.reduce((s,d)=>s+d.expense,0) };
              const totalB = { income: yearDataB.reduce((s,d)=>s+d.income,0), expense: yearDataB.reduce((s,d)=>s+d.expense,0) };
              const yearCompareData = yearDataA.map((d,i) => ({ name: d.name, A: d.income - d.expense, B: yearDataB[i].income - yearDataB[i].expense }));
              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label:"Ingresos", vA: totalA.income, vB: totalB.income, good:"higher" },
                      { label:"Gastos",   vA: totalA.expense, vB: totalB.expense, good:"lower" },
                    ].map(({ label, vA, vB, good }) => (
                      <div key={label} className="rounded-2xl border border-white/5 p-5" style={{background:"rgba(255,255,255,0.02)"}}>
                        <p className="text-slate-400 text-xs mb-3">{label} totales</p>
                        <div className="flex items-end gap-4">
                          <div>
                            <p className="text-emerald-400 font-bold text-xl">{fmt(vA)}</p>
                            <p className="text-slate-600 text-xs mt-0.5">{labelA}</p>
                          </div>
                          <ChangeIndicator from={vB} to={vA} invert={good === "lower"}/>
                          <div>
                            <p className="text-indigo-400 font-bold text-xl">{fmt(vB)}</p>
                            <p className="text-slate-600 text-xs mt-0.5">{labelB}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-white/5 p-6" style={{background:"rgba(255,255,255,0.02)"}}>
                    <h2 className="text-white font-semibold text-sm mb-5">Balance neto mensual: {labelA} vs {labelB}</h2>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={yearCompareData} barGap={3}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                        <XAxis dataKey="name" tick={{fill:"#64748b",fontSize:11}} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={fmtK}/>
                        <Tooltip content={tooltip} cursor={{fill:"rgba(255,255,255,0.03)"}}/>
                        <Bar dataKey="A" name="A" fill="#10b981" radius={[4,4,0,0]}/>
                        <Bar dataKey="B" name="B" fill="#6366f1" radius={[4,4,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              );
            })()}

            {/* MONTH vs MONTH comparison */}
            {!isYearMode && statsA && statsB && (() => {
              const metrics = [
                { label:"Ingresos",       vA:statsA.income,  vB:statsB.income,  icon:TrendingUp,   color:"#10b981", invert:false },
                { label:"Gastos",         vA:statsA.expense, vB:statsB.expense, icon:TrendingDown, color:"#ef4444", invert:true  },
                { label:"Balance neto",   vA:statsA.balance, vB:statsB.balance, icon:DollarSign,   color:statsA.balance>=0?"#10b981":"#ef4444", invert:false },
                { label:"Transacciones",  vA:statsA.count,   vB:statsB.count,   icon:BarChart3,    color:"#6366f1", invert:false, isCount:true },
              ];

              // Category comparison
              const allCats = [...new Set([...Object.keys(statsA.cats), ...Object.keys(statsB.cats)])].sort();
              const catCompare = allCats.map(c => ({ name:c, A:statsA.cats[c]??0, B:statsB.cats[c]??0 })).sort((a,b)=>b.A+b.B - (a.A+a.B)).slice(0,7);

              return (
                <>
                  {/* Metric cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {metrics.map(({ label, vA, vB, icon:Icon, color, invert, isCount }) => (
                      <div key={label} className="rounded-2xl border border-white/5 p-5" style={{background:"rgba(255,255,255,0.02)"}}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:`${color}18`}}>
                            <Icon size={13} style={{color}}/>
                          </div>
                          <p className="text-slate-400 text-xs">{label}</p>
                        </div>
                        <div className="flex items-end gap-3">
                          <div>
                            <p className="text-white font-bold text-xl">{isCount ? vA : fmt(vA)}</p>
                            <p className="text-slate-600 text-xs mt-0.5">{labelA}</p>
                          </div>
                          <div className="pb-1">
                            <ChangeIndicator from={vB} to={vA} invert={invert}/>
                          </div>
                          <div>
                            <p className="text-slate-400 font-semibold text-lg">{isCount ? vB : fmt(vB)}</p>
                            <p className="text-slate-600 text-xs mt-0.5">{labelB}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Category comparison */}
                  {catCompare.length > 0 && (
                    <div className="rounded-2xl border border-white/5 p-6" style={{background:"rgba(255,255,255,0.02)"}}>
                      <h2 className="text-white font-semibold text-sm mb-5">Gastos por categoría: {labelA} vs {labelB}</h2>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={catCompare} layout="vertical" barGap={3}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                          <XAxis type="number" tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={fmtK}/>
                          <YAxis type="category" dataKey="name" tick={{fill:"#94a3b8",fontSize:11}} axisLine={false} tickLine={false} width={80}/>
                          <Tooltip content={tooltip} cursor={{fill:"rgba(255,255,255,0.03)"}}/>
                          <Bar dataKey="A" name="A" fill="#10b981" radius={[0,3,3,0]}/>
                          <Bar dataKey="B" name="B" fill="#6366f1" radius={[0,3,3,0]}/>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2"><div className="w-3 h-2 rounded bg-emerald-500"/><span className="text-slate-400 text-xs">{labelA}</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-2 rounded bg-indigo-500"/><span className="text-slate-400 text-xs">{labelB}</span></div>
                      </div>
                    </div>
                  )}

                  {catCompare.length === 0 && (
                    <div className="rounded-2xl border border-white/5 p-8 text-center" style={{background:"rgba(255,255,255,0.02)"}}>
                      <p className="text-slate-500 text-sm">Sin gastos registrados en estos períodos</p>
                      <p className="text-slate-600 text-xs mt-1">Agrega transacciones de tipo gasto para ver la comparativa</p>
                    </div>
                  )}
                </>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}

