"use client";

import { useState, useMemo } from "react";
import { calcNewport } from "@/lib/pricing/newport";
import type { NewportInputs } from "@/lib/pricing/types";
import TopBar from "@/components/TopBar";
import Field from "@/components/quote/Field";
import PriceSummary from "@/components/quote/PriceSummary";
import MaterialList from "@/components/quote/MaterialList";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

const COLORS = ["White","Siennawood","Slate","Driftwood","Beechwood","Pewter","Maplewood","Ebony","Sandalwood"];

const PANEL_TYPES = [
  { value: "T6_024",     label: "T6 .024 - 6in Flat Pan" },
  { value: "T6_032",     label: "T6 .032 - 6in Flat Pan" },
  { value: "T6_040",     label: "T6 .040 - 6in Flat Pan" },
  { value: "flat_8_020", label: "8in Flat Pan .020" },
  { value: "flat_8_024", label: "8in Flat Pan .024" },
  { value: "flat_8_032", label: "8in Flat Pan .032" },
];

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

const HANGERS = [
  { value: "a_rail",              label: "A-Rail" },
  { value: "roll_form",           label: "Roll Form" },
  { value: "extruded",            label: "Extruded" },
  { value: "elevated_roof_mount", label: "Elevated Roof Mount" },
];

const GUTTERS = [
  { value: "roll_form", label: "Roll Form" },
  { value: "extruded",  label: "Extruded" },
];

const POST_HEIGHTS = [8, 10, 12, 14, 16, 20];
const WRAPS = [{ value: "3x8", label: "3x8" }, { value: "2x6", label: "2x6" }];
const COLOR_OPTS = COLORS.map((c) => ({ value: c, label: c }));

const DEFAULT: NewportInputs = {
  jobName: "", salesman: "",
  projection1: 0, width1: 0,
  projection2: 0, width2: 0,
  panelType1: "T6_024", panelType2: "",
  beamLength1: 0, beamLength2: 0,
  beamType1: "3x8", beamType2: "",
  beamEndCut1: "scallop", beamEndCut2: "",
  gutterType: "extruded", hangerType: "roll_form",
  posts1: 0, postHeight1: 8,
  posts2: 0, postHeight2: 8,
  colorPans: "White", colorGutterFascia: "White", colorPostsBeam: "White",
  wrapType: "2x6",
  rafterTails: false, bayWindowPopout: false,
  downspouts: 1, sprayPaint: false,
  groundMountPosts1: false, groundMountPosts2: false,
  fanBeamQty: 0, fanBeamLength: 16,
  shadeBeamQty: 0,
  priceIncrease: 0, footings: 0, roofMounts: 0, misc: 0,
  markup: 2.0, taxRate: 0.0745,
};

type SectionId = "job" | "dimensions" | "structure" | "posts" | "colors" | "extras" | "pricing";

function SectionCard({
  id, title, open, onToggle, children
}: {
  id: SectionId; title: string; open: boolean;
  onToggle: (id: SectionId) => void; children: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 transition"
      >
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        {open
          ? <ChevronUp size={16} className="text-slate-400" />
          : <ChevronDown size={16} className="text-slate-400" />
        }
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 grid grid-cols-2 gap-4">{children}</div>
      )}
    </div>
  );
}

function TextInput({ label, value, onChange, hint, span }: {
  label: string; value: string; onChange: (v: string) => void;
  hint?: string; span?: number;
}) {
  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <Field label={label} hint={hint}>
        <input type="text" className="input" value={value} onChange={(e) => onChange(e.target.value)} />
      </Field>
    </div>
  );
}

function NumInput({ label, value, onChange, hint, span }: {
  label: string; value: number; onChange: (v: number) => void;
  hint?: string; span?: number;
}) {
  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <Field label={label} hint={hint}>
        <input
          type="number"
          className="input"
          value={value === 0 ? "" : value}
          placeholder="0"
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
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
            {options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
            <ChevronDown size={14} className="text-slate-400" />
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
        <button
          onClick={() => onChange(!value)}
          className={"w-full rounded-lg border px-3 py-2 text-sm font-medium transition text-left " +
            (value
              ? "border-blue-300 bg-blue-50 text-blue-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}
        >
          {value ? "Yes" + (yesLabel ? " - " + yesLabel : "") : "No"}
        </button>
      </Field>
    </div>
  );
}

export default function FlatPanQuotePage() {
  const [inp, setInp] = useState<NewportInputs>(DEFAULT);
  const [open, setOpen] = useState<Set<SectionId>>(
    new Set(["job","dimensions","structure","posts","colors","extras","pricing"] as SectionId[])
  );
  const [showMaterials, setShowMaterials] = useState(false);

  const result = useMemo(() => calcNewport(inp), [inp]);

  function setField<K extends keyof NewportInputs>(key: K, val: NewportInputs[K]) {
    setInp((p) => ({ ...p, [key]: val }));
  }

  function handleWidth1Change(v: number) {
    setInp((p) => ({ ...p, width1: v, beamLength1: Math.max(0, v - 0.5) }));
  }
  function handleWidth2Change(v: number) {
    setInp((p) => ({ ...p, width2: v, beamLength2: Math.max(0, v - 0.5) }));
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
      <TopBar title="Flat Pan Cover" subtitle="T6 or 8in flat pan roof system - live pricing">
        <button onClick={() => setInp(DEFAULT)} className="btn-secondary text-xs">
          <RefreshCw size={13} /> Reset
        </button>
      </TopBar>

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-6 items-start">

            <div className="flex-1 min-w-0 space-y-3">

              <SectionCard id="job" title="Job Information" open={open.has("job")} onToggle={toggleSection}>
                <TextInput label="Job Name" value={inp.jobName} onChange={(v) => setField("jobName", v)} span={2} />
                <TextInput label="Salesman" value={inp.salesman} onChange={(v) => setField("salesman", v)} />
              </SectionCard>

              <SectionCard id="dimensions" title="Dimensions" open={open.has("dimensions")} onToggle={toggleSection}>
                <NumInput label="Projection #1 (ft)" value={inp.projection1} onChange={(v) => setField("projection1", v)} hint="Depth of the cover" />
                <NumInput label="Width #1 (ft)" value={inp.width1} onChange={handleWidth1Change} hint="Along the house" />
                <NumInput label="Projection #2 (ft)" value={inp.projection2} onChange={(v) => setField("projection2", v)} hint="Leave 0 if single run" />
                <NumInput label="Width #2 (ft)" value={inp.width2} onChange={handleWidth2Change} />
                <SelectInput label="Panel Type #1" value={inp.panelType1} onChange={(v) => setField("panelType1", v as never)} options={PANEL_TYPES} />
                <SelectInput label="Panel Type #2" value={inp.panelType2} onChange={(v) => setField("panelType2", v as never)}
                  options={[{ value: "", label: "None (single run)" }, ...PANEL_TYPES]} />
                <NumInput label="Beam Length #1 (ft)" value={inp.beamLength1} onChange={(v) => setField("beamLength1", v)} hint="Width minus 6 inches" />
                <NumInput label="Beam Length #2 (ft)" value={inp.beamLength2} onChange={(v) => setField("beamLength2", v)} />
              </SectionCard>

              <SectionCard id="structure" title="Structure" open={open.has("structure")} onToggle={toggleSection}>
                <SelectInput label="Beam Type #1" value={inp.beamType1} onChange={(v) => setField("beamType1", v as never)} options={BEAM_TYPES} />
                <SelectInput label="End Cut #1" value={inp.beamEndCut1} onChange={(v) => setField("beamEndCut1", v as never)} options={END_CUTS} />
                <SelectInput label="Beam Type #2" value={inp.beamType2} onChange={(v) => setField("beamType2", v as never)}
                  options={[{ value: "", label: "None" }, ...BEAM_TYPES]} />
                <SelectInput label="End Cut #2" value={inp.beamEndCut2} onChange={(v) => setField("beamEndCut2", v as never)}
                  options={[{ value: "", label: "N/A" }, ...END_CUTS]} />
                <SelectInput label="Hanger Type" value={inp.hangerType} onChange={(v) => setField("hangerType", v as never)} options={HANGERS} />
                <SelectInput label="Gutter Type" value={inp.gutterType} onChange={(v) => setField("gutterType", v as never)} options={GUTTERS} />
                <SelectInput label="Wrap Type" value={inp.wrapType} onChange={(v) => setField("wrapType", v as never)} options={WRAPS} />
                <ToggleInput label="Rafter Tails" value={inp.rafterTails} onChange={(v) => setField("rafterTails", v)} />
              </SectionCard>

              <SectionCard id="posts" title="Posts" open={open.has("posts")} onToggle={toggleSection}>
                <NumInput label="Posts #1 (qty)" value={inp.posts1} onChange={(v) => setField("posts1", v)} />
                <SelectInput label="Height #1 (ft)" value={String(inp.postHeight1)} onChange={(v) => setField("postHeight1", Number(v))}
                  options={POST_HEIGHTS.map((h) => ({ value: String(h), label: String(h) + " ft" }))} />
                <NumInput label="Posts #2 (qty)" value={inp.posts2} onChange={(v) => setField("posts2", v)} />
                <SelectInput label="Height #2 (ft)" value={String(inp.postHeight2)} onChange={(v) => setField("postHeight2", Number(v))}
                  options={POST_HEIGHTS.map((h) => ({ value: String(h), label: String(h) + " ft" }))} />
                <NumInput label="Downspouts" value={inp.downspouts} onChange={(v) => setField("downspouts", v)} />
                <ToggleInput label="Spray Paint" value={inp.sprayPaint} onChange={(v) => setField("sprayPaint", v)} yesLabel="include spray paint" />
              </SectionCard>

              <SectionCard id="colors" title="Colors" open={open.has("colors")} onToggle={toggleSection}>
                <SelectInput label="Pan Color" value={inp.colorPans} onChange={(v) => setField("colorPans", v as never)} options={COLOR_OPTS} />
                <SelectInput label="Gutter / Fascia Color" value={inp.colorGutterFascia} onChange={(v) => setField("colorGutterFascia", v as never)} options={COLOR_OPTS} />
                <SelectInput label="Posts / Beam Color" value={inp.colorPostsBeam} onChange={(v) => setField("colorPostsBeam", v as never)} options={COLOR_OPTS} />
              </SectionCard>

              <SectionCard id="extras" title="Fan Beam / Shade Beam" open={open.has("extras")} onToggle={toggleSection}>
                <NumInput label="Fan Beam Qty" value={inp.fanBeamQty} onChange={(v) => setField("fanBeamQty", v)} />
                <NumInput label="Fan Beam Length (ft)" value={inp.fanBeamLength} onChange={(v) => setField("fanBeamLength", v)} />
                <NumInput label="Shade Beam Qty" value={inp.shadeBeamQty} onChange={(v) => setField("shadeBeamQty", v)} />
              </SectionCard>

              <SectionCard id="pricing" title="Pricing Adjustments" open={open.has("pricing")} onToggle={toggleSection}>
                <NumInput label="Markup" value={inp.markup} onChange={(v) => setField("markup", v)} hint="2.0 = 100% above cost" />
                <NumInput label="Tax Rate" value={inp.taxRate} onChange={(v) => setField("taxRate", v)} hint="e.g. 0.0745 for 7.45%" />
                <NumInput label="Price Increase (decimal)" value={inp.priceIncrease} onChange={(v) => setField("priceIncrease", v)} hint="e.g. 0.10 = 10%" />
                <NumInput label="Footings ($)" value={inp.footings} onChange={(v) => setField("footings", v)} />
                <NumInput label="Roof Mounts ($)" value={inp.roofMounts} onChange={(v) => setField("roofMounts", v)} />
                <NumInput label="Misc ($)" value={inp.misc} onChange={(v) => setField("misc", v)} />
              </SectionCard>

              <button
                onClick={() => setShowMaterials((v) => !v)}
                className="btn-secondary w-full justify-center"
              >
                {showMaterials ? "Hide" : "Show"} Material List ({result.lineItems.length} items)
              </button>
              {showMaterials && <MaterialList items={result.lineItems} />}
            </div>

            <div className="w-80 flex-shrink-0">
              <PriceSummary result={result} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
