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

const DEFAULT: NewportInputs = {
  jobName: "", salesman: "",
  projection1: 0, width1: 0,
  projection2: 0, width2: 0,
  panelType1: "T6_040", panelType2: "",
  beamLength1: 0, beamLength2: 0,
  beamType1: "3x8", beamType2: "",
  beamEndCut1: "beveled", beamEndCut2: "",
  gutterType: "roll_form", hangerType: "a_rail",
  posts1: 0, postHeight1: 10,
  posts2: 0, postHeight2: 10,
  colorPans: "White", colorGutterFascia: "White", colorPostsBeam: "White",
  wrapType: "3x8",
  rafterTails: false, bayWindowPopout: false,
  downspouts: 1, sprayPaint: false,
  groundMountPosts1: false, groundMountPosts2: false,
  fanBeamQty: 0, fanBeamLength: 16,
  shadeBeamQty: 0,
  priceIncrease: 0, footings: 0, roofMounts: 0, misc: 0,
  markup: 1.8, taxRate: 0.0745,
};

type SectionId = "job" | "dimensions" | "structure" | "posts" | "colors" | "extras" | "pricing";

export default function NewportQuotePage() {
  const [inp, setInp] = useState<NewportInputs>(DEFAULT);
  const [open, setOpen] = useState<Set<SectionId>>(
    new Set(["job","dimensions","structure","posts","colors","extras","pricing"] as SectionId[])
  );
  const [showMaterials, setShowMaterials] = useState(false);

  const result = useMemo(() => calcNewport(inp), [inp]);

  function set<K extends keyof NewportInputs>(key: K, val: NewportInputs[K]) {
    setInp((p) => ({ ...p, [key]: val }));
  }

  function numHandler(key: keyof NewportInputs) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      set(key, (parseFloat(e.target.value) || 0) as never);
  }

  function toggleSection(s: SectionId) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(s)) { next.delete(s); } else { next.add(s); }
      return next;
    });
  }

  function SectionCard({ id, title, children }: { id: SectionId; title: string; children: React.ReactNode }) {
    return (
      <div className="card overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 transition"
        >
          <span className="text-sm font-semibold text-slate-700">{title}</span>
          {open.has(id)
            ? <ChevronUp size={16} className="text-slate-400" />
            : <ChevronDown size={16} className="text-slate-400" />
          }
        </button>
        {open.has(id) && (
          <div className="px-5 pb-5 pt-1 grid grid-cols-2 gap-4">{children}</div>
        )}
      </div>
    );
  }

  function InputField({ label, field, type = "number", hint, span = 1 }: {
    label: string; field: keyof NewportInputs; type?: string; hint?: string; span?: number;
  }) {
    return (
      <div className={span === 2 ? "col-span-2" : ""}>
        <Field label={label} hint={hint}>
          <input
            type={type}
            className="input"
            value={inp[field] as string | number}
            onChange={type === "number" ? numHandler(field) : (e) => set(field, e.target.value as never)}
          />
        </Field>
      </div>
    );
  }

  function SelectField({ label, field, options, span = 1 }: {
    label: string; field: keyof NewportInputs;
    options: { value: string; label: string }[]; span?: number;
  }) {
    return (
      <div className={span === 2 ? "col-span-2" : ""}>
        <Field label={label}>
          <div className="relative">
            <select
              className="select pr-8"
              value={inp[field] as string}
              onChange={(e) => set(field, e.target.value as never)}
            >
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

  function ToggleField({ label, field, yesLabel }: {
    label: string; field: keyof NewportInputs; yesLabel?: string;
  }) {
    const active = inp[field] as boolean;
    return (
      <div>
        <Field label={label}>
          <button
            onClick={() => set(field, !active as never)}
            className={"w-full rounded-lg border px-3 py-2 text-sm font-medium transition text-left " +
              (active
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}
          >
            {active ? "Yes" + (yesLabel ? " - " + yesLabel : "") : "No"}
          </button>
        </Field>
      </div>
    );
  }

  const colorOpts = COLORS.map((c) => ({ value: c, label: c }));

  return (
    <>
      <TopBar title="Newport Patio Cover" subtitle="Flat pan roof system - live pricing">
        <button onClick={() => setInp(DEFAULT)} className="btn-secondary text-xs">
          <RefreshCw size={13} /> Reset
        </button>
      </TopBar>

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-6 items-start">

            <div className="flex-1 min-w-0 space-y-3">

              <SectionCard id="job" title="Job Information">
                <InputField label="Job Name" field="jobName" type="text" span={2} />
                <InputField label="Salesman" field="salesman" type="text" />
              </SectionCard>

              <SectionCard id="dimensions" title="Dimensions">
                <InputField label="Projection #1 (ft)" field="projection1" hint="Depth of the cover" />
                <InputField label="Width #1 (ft)" field="width1" hint="Along the house" />
                <InputField label="Projection #2 (ft)" field="projection2" hint="Leave 0 if single run" />
                <InputField label="Width #2 (ft)" field="width2" />
                <SelectField label="Panel Type #1" field="panelType1" options={PANEL_TYPES} />
                <SelectField label="Panel Type #2" field="panelType2"
                  options={[{ value: "", label: "None (single run)" }, ...PANEL_TYPES]} />
                <InputField label="Beam Length #1 (ft)" field="beamLength1" hint="Usually width + overhang" />
                <InputField label="Beam Length #2 (ft)" field="beamLength2" />
              </SectionCard>

              <SectionCard id="structure" title="Structure">
                <SelectField label="Beam Type #1" field="beamType1" options={BEAM_TYPES} />
                <SelectField label="End Cut #1" field="beamEndCut1" options={END_CUTS} />
                <SelectField label="Beam Type #2" field="beamType2"
                  options={[{ value: "", label: "None" }, ...BEAM_TYPES]} />
                <SelectField label="End Cut #2" field="beamEndCut2"
                  options={[{ value: "", label: "N/A" }, ...END_CUTS]} />
                <SelectField label="Hanger Type" field="hangerType" options={HANGERS} />
                <SelectField label="Gutter Type" field="gutterType" options={GUTTERS} />
                <SelectField label="Wrap Type" field="wrapType" options={WRAPS} />
                <ToggleField label="Rafter Tails" field="rafterTails" />
              </SectionCard>

              <SectionCard id="posts" title="Posts">
                <InputField label="Posts #1 (qty)" field="posts1" />
                <SelectField label="Height #1 (ft)" field="postHeight1"
                  options={POST_HEIGHTS.map((h) => ({ value: String(h), label: String(h) + " ft" }))} />
                <InputField label="Posts #2 (qty)" field="posts2" />
                <SelectField label="Height #2 (ft)" field="postHeight2"
                  options={POST_HEIGHTS.map((h) => ({ value: String(h), label: String(h) + " ft" }))} />
                <InputField label="Downspouts" field="downspouts" />
                <ToggleField label="Spray Paint" field="sprayPaint" yesLabel="include spray paint" />
              </SectionCard>

              <SectionCard id="colors" title="Colors">
                <SelectField label="Pan Color" field="colorPans" options={colorOpts} />
                <SelectField label="Gutter / Fascia Color" field="colorGutterFascia" options={colorOpts} />
                <SelectField label="Posts / Beam Color" field="colorPostsBeam" options={colorOpts} />
              </SectionCard>

              <SectionCard id="extras" title="Fan Beam / Shade Beam">
                <InputField label="Fan Beam Qty" field="fanBeamQty" />
                <InputField label="Fan Beam Length (ft)" field="fanBeamLength" />
                <InputField label="Shade Beam Qty" field="shadeBeamQty" />
              </SectionCard>

              <SectionCard id="pricing" title="Pricing Adjustments">
                <InputField label="Markup" field="markup" hint="1.8 = 80% above cost" />
                <InputField label="Tax Rate" field="taxRate" hint="e.g. 0.0745 for 7.45%" />
                <InputField label="Price Increase (decimal)" field="priceIncrease" hint="e.g. 0.10 = 10%" />
                <InputField label="Footings ($)" field="footings" />
                <InputField label="Roof Mounts ($)" field="roofMounts" />
                <InputField label="Misc ($)" field="misc" />
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
