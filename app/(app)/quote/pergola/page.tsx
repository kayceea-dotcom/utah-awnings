"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo, useEffect } from "react";
import { calcPergola } from "@/lib/pricing/pergola";
import type { PergolaInputs } from "@/lib/pricing/pergola";
import TopBar from "@/components/TopBar";
import Field from "@/components/quote/Field";
import MaterialList from "@/components/quote/MaterialList";
import { ChevronDown, ChevronUp, RefreshCw, DollarSign } from "lucide-react";
import { useProfile } from "@/lib/hooks/useProfile";
import CoverDiagram from "@/components/quote/CoverDiagram";

const COLORS = ["White","Siennawood","Slate","Driftwood","Beechwood","Maplewood","Ebony","Sandlewood"];
const COLOR_OPTS = COLORS.map((c) => ({ value: c, label: c }));

const BEAM_TYPES = [
  { value: "3x8",      label: "3x8 Beam" },
  { value: "3x3",      label: "3x3 Beam" },
  { value: "4_i_beam", label: "4in I-Beam" },
  { value: "7_i_beam", label: "7in I-Beam" },
];

const END_CUTS = [
  { value: "scallop", label: "Scallop" },
  { value: "beveled", label: "Beveled" },
  { value: "mitered", label: "Mitered" },
  { value: "corbel",  label: "Corbel" },
];

const END_CUT_SIDES = [
  { value: "one_end",  label: "One End" },
  { value: "both_ends", label: "Both Ends" },
];

const LATTICE_TYPES = [
  { value: "2x2", label: "2x2 Tubing" },
  { value: "2x3", label: "2x3 Tubing" },
];

const LATTICE_SPACING = [
  { value: "1x", label: "1x Spacing (standard)" },
  { value: "1.5x", label: "1.5x Spacing (10lb snow load)" },
];

const RAFTER_GAUGES = [
  { value: "032", label: ".032 Gauge" },
];

const POST_HEIGHTS = [8, 10, 12, 14, 16, 20];

const DEFAULT: PergolaInputs = {
  jobName: "", salesman: "",
  projection: 0, width: 0,
  beamLength: 0, beamType: "3x8", beamEndCut: "beveled", beamQty: 2,
  rafterGauge: "032",
  latticeType: "2x2", latticeSpacing: "1x",
  headerBoard: true,
  posts: 0, postHeight: 10,
  colorPergola: "White",
  endCut: "scallop", endCutSide: "one_end",
  sprayPaint: false, groundMount: false,
  shadeBeamQty: 0,
  priceIncrease: 0, footings: 0, roofMounts: 0, misc: 0,
  markup: 1.8, taxRate: 0.0745,
};

type SectionId = "job" | "dimensions" | "structure" | "posts" | "colors" | "pricing";

function SectionCard({ id, title, open, onToggle, children }: {
  id: SectionId; title: string; open: boolean;
  onToggle: (id: SectionId) => void; children: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-4 lg:px-5 py-4 text-left hover:bg-gray-50 transition"
      >
        <span className="text-sm font-bold text-gray-800">{title}</span>
        {open ? <ChevronUp size={18} className="text-gray-400 flex-shrink-0" />
               : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="px-4 lg:px-5 pb-5 pt-1 grid grid-cols-2 gap-3 lg:gap-4">{children}</div>}
    </div>
  );
}

function TextInput({ label, value, onChange, hint, span, readOnly }: {
  label: string; value: string; onChange?: (v: string) => void;
  hint?: string; span?: number; readOnly?: boolean;
}) {
  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <Field label={label} hint={hint}>
        <input type="text" className={"input " + (readOnly ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "")}
          value={value} readOnly={readOnly}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined} />
      </Field>
    </div>
  );
}

function NumInput({ label, value, onChange, hint, span }: {
  label: string; value: number; onChange: (v: number) => void; hint?: string; span?: number;
}) {
  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <Field label={label} hint={hint}>
        <input type="number" className="input" value={value === 0 ? "" : value} placeholder="0"
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)} />
      </Field>
    </div>
  );
}

function SelectInput({ label, value, onChange, options, span }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; span?: number;
}) {
  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <Field label={label}>
        <div className="relative">
          <select className="select pr-8" value={value} onChange={(e) => onChange(e.target.value)}>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <ChevronDown size={15} className="text-gray-400" />
          </div>
        </div>
      </Field>
    </div>
  );
}

function ToggleInput({ label, value, onChange, yesLabel }: {
  label: string; value: boolean; onChange: (v: boolean) => void; yesLabel?: string;
}) {
  return (
    <div>
      <Field label={label}>
        <button onClick={() => onChange(!value)}
          className={"w-full rounded-xl border px-4 py-3 text-sm font-semibold transition text-left min-h-12 " +
            (value ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50")}>
          {value ? "Yes" + (yesLabel ? " - " + yesLabel : "") : "No"}
        </button>
      </Field>
    </div>
  );
}

function MobilePriceBar({ result, onExpand }: { result: ReturnType<typeof calcPergola>; onExpand: () => void }) {
  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  const margin = result.totalJobSale > 0 ? result.totalProfit / result.totalJobSale : 0;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 lg:hidden shadow-2xl" style={{ backgroundColor: "#1a1a1a" }}>
      <button onClick={onExpand} className="w-full px-4 py-3 flex items-center gap-3">
        <div className="flex-1 text-left">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Total Job Sale</p>
          <p className="text-white text-2xl font-black tracking-tight">{fmt(result.totalJobSale)}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Profit</p>
          <p className="text-green-400 text-lg font-bold">{fmt(result.totalProfit)}</p>
        </div>
        <div className="text-right ml-2">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Margin</p>
          <p className="text-white text-lg font-bold">{(margin * 100).toFixed(1)}%</p>
        </div>
        <ChevronUp size={18} className="text-gray-400 ml-1 flex-shrink-0" />
      </button>
    </div>
  );
}

function PriceSummaryPanel({ result, onClose }: { result: ReturnType<typeof calcPergola>; onClose?: () => void }) {
  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  const margin = result.totalJobSale > 0 ? result.totalProfit / result.totalJobSale : 0;
  return (
    <div className="card p-5 space-y-4">
      {onClose && (
        <button onClick={onClose} className="lg:hidden flex items-center gap-2 text-gray-500 text-sm font-semibold mb-2">
          <ChevronDown size={16} /> Close
        </button>
      )}
      <h2 className="section-heading">Price Summary</h2>
      <div className="rounded-2xl p-4 text-center border" style={{ backgroundColor: "#fdf2f2", borderColor: "#f9c9cb" }}>
        <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#CC2229" }}>Total Job Sale</p>
        <p className="text-3xl font-black tracking-tight" style={{ color: "#CC2229" }}>{fmt(result.totalJobSale)}</p>
        <div className="flex justify-center gap-3 mt-2 text-xs text-gray-500">
          <span>{result.totalSqFt.toFixed(0)} sq ft</span>
          <span>·</span>
          <span>{fmt(result.pricePerSqFt)}/sq ft</span>
        </div>
      </div>
      <div className="space-y-1.5 text-sm">
        {([
          ["Material Cost",   result.materialCost],
          ["Tax",             result.taxes],
          ...(result.priceIncrease ? [["Price Increase", result.priceIncrease]] : []),
          ["Total Materials", result.totalMaterials],
          ...(result.footings   ? [["Footings",    result.footings]]   : []),
          ...(result.roofMounts ? [["Roof Mounts", result.roofMounts]] : []),
          ...(result.misc       ? [["Misc",        result.misc]]        : []),
          ["Subtotal",        result.subtotal],
        ] as [string, number][]).map(([label, val]) => (
          <div key={label} className="flex justify-between text-gray-600">
            <span>{label}</span>
            <span className="font-mono text-gray-800">{fmt(val)}</span>
          </div>
        ))}
        <div className="border-t border-dashed border-gray-200 my-2" />
        <div className="flex justify-between text-gray-600">
          <span>Markup</span>
          <span className="font-mono text-gray-800">{result.markup}x</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>CC Fee (3.25%)</span>
          <span className="font-mono text-gray-800">{fmt(result.ccFee)}</span>
        </div>
        <div className="border-t border-gray-200 my-2" />
        <div className="flex justify-between font-bold text-gray-900">
          <span>Total Job Sale</span>
          <span className="font-mono">{fmt(result.totalJobSale)}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 border border-green-100 bg-green-50">
          <p className="text-xs text-green-600 font-bold uppercase tracking-wide">Profit</p>
          <p className="text-lg font-bold text-green-700">{fmt(result.totalProfit)}</p>
        </div>
        <div className="rounded-xl p-3 border border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Margin</p>
          <p className="text-lg font-bold text-gray-700">{(margin * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-xl p-3 border border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Cost/sq ft</p>
          <p className="text-lg font-bold text-gray-700">{fmt(result.costPerSqFt)}</p>
        </div>
        <div className="rounded-xl p-3 border border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Price/sq ft</p>
          <p className="text-lg font-bold text-gray-700">{fmt(result.pricePerSqFt)}</p>
        </div>
      </div>
    </div>
  );
}

export default function PergolaQuotePage() {
  const [inp, setInp] = useState<PergolaInputs>(DEFAULT);
  const [open, setOpen] = useState<Set<SectionId>>(
    new Set(["job","dimensions","structure","posts","colors","pricing"] as SectionId[])
  );
  const [showMaterials, setShowMaterials] = useState(false);
  const [showPricePanel, setShowPricePanel] = useState(false);
  const { profile } = useProfile();

  const result = useMemo(() => calcPergola(inp), [inp]);

  useEffect(() => {
    if (profile?.full_name) {
      setInp((p) => ({ ...p, salesman: profile.full_name }));
    }
  }, [profile]);

  function setField<K extends keyof PergolaInputs>(key: K, val: PergolaInputs[K]) {
    setInp((p) => ({ ...p, [key]: val }));
  }

  function handleWidthChange(v: number) {
    setInp((p) => ({ ...p, width: v, beamLength: Math.max(0, v - 0.5) }));
  }

  function toggleSection(s: SectionId) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(s)) { next.delete(s); } else { next.add(s); }
      return next;
    });
  }

  return (
    <>
      <TopBar title="Pergola" subtitle="Open air rafter and lattice system - live pricing">
        <button onClick={() => setInp(DEFAULT)} className="btn-secondary text-xs px-3 py-2">
          <RefreshCw size={13} /> Reset
        </button>
      </TopBar>

      <main className="flex-1 p-3 lg:p-6 pb-32 lg:pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-6 items-start">
            <div className="flex-1 min-w-0 space-y-3">

              <SectionCard id="job" title="Job Information" open={open.has("job")} onToggle={toggleSection}>
                <TextInput label="Job Name" value={inp.jobName} onChange={(v) => setField("jobName", v)} span={2} />
                <TextInput label="Salesman" value={inp.salesman} readOnly span={2} />
              </SectionCard>

              <SectionCard id="dimensions" title="Dimensions" open={open.has("dimensions")} onToggle={toggleSection}>
                <NumInput label="Projection (ft)" value={inp.projection} onChange={(v) => setField("projection", v)} hint="Depth of the cover" />
                <NumInput label="Width (ft)" value={inp.width} onChange={handleWidthChange} hint="Along the house" />
                <NumInput label="Beam Length (ft)" value={inp.beamLength} onChange={(v) => setField("beamLength", v)} hint="Width minus 6in" />
              </SectionCard>

              <SectionCard id="structure" title="Structure" open={open.has("structure")} onToggle={toggleSection}>
                <SelectInput label="Rafter Gauge" value={inp.rafterGauge} onChange={(v) => setField("rafterGauge", v)} options={RAFTER_GAUGES} />
                <SelectInput label="Beam Type" value={inp.beamType} onChange={(v) => setField("beamType", v)} options={BEAM_TYPES} />
                <NumInput label="Beam Qty" value={inp.beamQty} onChange={(v) => setField("beamQty", v)} hint="Usually 2" />
                <SelectInput label="End Cut" value={inp.endCut} onChange={(v) => setField("endCut", v)} options={END_CUTS} />
                <SelectInput label="End Cut Side" value={inp.endCutSide} onChange={(v) => setField("endCutSide", v)} options={END_CUT_SIDES} />
                <SelectInput label="Lattice Type" value={inp.latticeType} onChange={(v) => setField("latticeType", v as never)} options={LATTICE_TYPES} />
                <SelectInput label="Lattice Spacing" value={inp.latticeSpacing} onChange={(v) => setField("latticeSpacing", v as never)} options={LATTICE_SPACING} />
                <ToggleInput label="Header Board" value={inp.headerBoard} onChange={(v) => setField("headerBoard", v)} yesLabel="include" />
                <ToggleInput label="Spray Paint" value={inp.sprayPaint} onChange={(v) => setField("sprayPaint", v)} yesLabel="include" />
              </SectionCard>

              <SectionCard id="posts" title="Posts" open={open.has("posts")} onToggle={toggleSection}>
                <NumInput label="Posts (qty)" value={inp.posts} onChange={(v) => setField("posts", v)} />
                <SelectInput label="Post Height (ft)" value={String(inp.postHeight)} onChange={(v) => setField("postHeight", Number(v))}
                  options={POST_HEIGHTS.map((h) => ({ value: String(h), label: String(h) + " ft" }))} />
                <ToggleInput label="Ground Mount Posts" value={inp.groundMount} onChange={(v) => setField("groundMount", v)} />
              </SectionCard>

              <SectionCard id="colors" title="Colors" open={open.has("colors")} onToggle={toggleSection}>
                <SelectInput label="Pergola Color" value={inp.colorPergola} onChange={(v) => setField("colorPergola", v as never)} options={COLOR_OPTS} span={2} />
              </SectionCard>

              <SectionCard id="pricing" title="Pricing Adjustments" open={open.has("pricing")} onToggle={toggleSection}>
                <NumInput label="Markup" value={inp.markup} onChange={(v) => setField("markup", v)} hint="1.8 = 80% above cost" />
                <NumInput label="Tax Rate" value={inp.taxRate} onChange={(v) => setField("taxRate", v)} hint="e.g. 0.0745" />
                <NumInput label="Price Increase" value={inp.priceIncrease} onChange={(v) => setField("priceIncrease", v)} hint="e.g. 0.10 = 10%" />
                <NumInput label="Footings ($)" value={inp.footings} onChange={(v) => setField("footings", v)} />
                <NumInput label="Roof Mounts ($)" value={inp.roofMounts} onChange={(v) => setField("roofMounts", v)} />
                <NumInput label="Misc ($)" value={inp.misc} onChange={(v) => setField("misc", v)} />
              </SectionCard>

              <div className="hidden lg:block">
                <PriceSummaryPanel result={result} />
              </div>

              <div className="lg:hidden">
                <CoverDiagram
                  projection1={inp.projection}
                  width1={inp.width}
                  posts1={inp.posts}
                  downspouts={0}
                />
              </div>

              <button onClick={() => setShowMaterials((v) => !v)} className="btn-secondary w-full">
                <DollarSign size={15} />
                {showMaterials ? "Hide" : "Show"} Material List ({result.lineItems.length} items)
              </button>
              {showMaterials && <MaterialList items={result.lineItems} />}
            </div>

            <div className="hidden lg:block w-80 flex-shrink-0 sticky top-20 space-y-4">
              <CoverDiagram
                projection1={inp.projection}
                width1={inp.width}
                posts1={inp.posts}
                downspouts={0}
              />
              <PriceSummaryPanel result={result} />
            </div>
          </div>
        </div>
      </main>

      <MobilePriceBar result={result} onExpand={() => setShowPricePanel(true)} />

      {showPricePanel && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto">
            <PriceSummaryPanel result={result} onClose={() => setShowPricePanel(false)} />
          </div>
        </div>
      )}
    </>
  );
}
