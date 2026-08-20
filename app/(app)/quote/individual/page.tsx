"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo, useEffect } from "react";
import { calcIndividual } from "@/lib/pricing/individual";
import type { IndividualInputs, IndividualLineInput } from "@/lib/pricing/individual";
import { CATALOG, CATALOG_BY_KEY, CATEGORIES } from "@/lib/pricing/catalog";
import { RATES } from "@/lib/pricing/rates";
import { useMarkupTier } from "@/lib/hooks/useMarkupTier";
import { useDiscountOption } from "@/lib/hooks/useDiscountOption";
import TopBar from "@/components/TopBar";
import Field from "@/components/quote/Field";
import CommissionPanel from "@/components/quote/CommissionPanel";
import MarkupTierSelect from "@/components/quote/MarkupTierSelect";
import DiscountOptionSelect from "@/components/quote/DiscountOptionSelect";
import { ChevronDown, ChevronUp, RefreshCw, Plus, Trash2, Send } from "lucide-react";
import { useProfile } from "@/lib/hooks/useProfile";
import { useRouter } from "next/navigation";
import SaveQuoteModal from "@/components/quote/SaveQuoteModal";
import ProductSwitcher from "@/components/quote/ProductSwitcher";

const COLORS = ["White","Siennawood","Slate","Driftwood","Beechwood","Maplewood","Ebony","Sandlewood"];
const COLOR_OPTS = [{ value: "", label: "None" }, ...COLORS.map((c) => ({ value: c, label: c }))];

const DEFAULT: IndividualInputs = {
  jobName: "", salesman: "",
  items: [],
  discount: 0, footings: 0, roofMounts: 0, misc: 0,
  markup: 1.8, taxRate: 0.0745,
};

type SectionId = "job" | "items" | "pricing";

function SectionCard({ id, title, open, onToggle, children }: {
  id: SectionId; title: string; open: boolean;
  onToggle: (id: SectionId) => void; children: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden">
      <button onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-4 lg:px-5 py-4 text-left hover:bg-gray-50 transition">
        <span className="text-sm font-bold text-gray-800">{title}</span>
        {open ? <ChevronUp size={18} className="text-gray-400 flex-shrink-0" />
               : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && <div className="px-4 lg:px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
}

function TextInput({ label, value, onChange, span, readOnly }: {
  label: string; value: string; onChange?: (v: string) => void; span?: number; readOnly?: boolean;
}) {
  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <Field label={label}>
        <input type="text" className={"input " + (readOnly ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "")}
          value={value} readOnly={readOnly}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined} />
      </Field>
    </div>
  );
}

function NumInput({ label, value, onChange, hint }: {
  label: string; value: number; onChange: (v: number) => void; hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input type="number" className="input" value={value === 0 ? "" : value} placeholder="0"
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)} />
    </Field>
  );
}

function SelectInput({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
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
  );
}

function MobilePriceBar({ result, onExpand }: { result: ReturnType<typeof calcIndividual>; onExpand: () => void }) {
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

function PriceSummaryPanel({ result, onClose }: { result: ReturnType<typeof calcIndividual>; onClose?: () => void }) {
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
      </div>
      <div className="space-y-1.5 text-sm">
        {([
          ["Material Cost",   result.materialCost],
          ["Tax",             result.taxes],
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
        {result.discount > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Discount</span>
            <span className="font-mono text-gray-800">-{fmt(result.discount)}</span>
          </div>
        )}
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
      </div>
    </div>
  );
}

let nextId = 1;

export default function IndividualQuotePage() {
  const [inp, setInp] = useState<IndividualInputs>(DEFAULT);
  const [open, setOpen] = useState<Set<SectionId>>(new Set(["job", "items", "pricing"] as SectionId[]));
  const [showPricePanel, setShowPricePanel] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const { profile } = useProfile();
  const router = useRouter();

  // Add-item draft form state (not part of the saved quote until "Add" is clicked)
  const [draftCategory, setDraftCategory] = useState(CATEGORIES[0]);
  const [draftKey, setDraftKey] = useState(CATALOG.find((c) => c.category === CATEGORIES[0])?.key ?? "");
  const [draftQty, setDraftQty] = useState(1);
  const [draftLength, setDraftLength] = useState(0);
  const [draftColor, setDraftColor] = useState("");

  const result = useMemo(() => calcIndividual(inp), [inp]);
  const markupTier = useMarkupTier({
    materialCost: result.materialCost,
    subtotal: result.subtotal,
    markup: inp.markup,
    setMarkup: (m) => setField("markup", m),
  });
  const discountOption = useDiscountOption({
    ccFee: result.ccFee,
    discount: inp.discount,
    setDiscount: (d) => setField("discount", d),
  });
  const draftEntry = CATALOG_BY_KEY[draftKey];
  const categoryItems = CATALOG.filter((c) => c.category === draftCategory);

  useEffect(() => {
    if (profile?.full_name) {
      setInp((p) => ({ ...p, salesman: profile.full_name }));
    }
  }, [profile]);

  useEffect(() => {
    // Keep the item picker valid when the category changes
    const first = CATALOG.find((c) => c.category === draftCategory);
    if (first && !categoryItems.some((c) => c.key === draftKey)) {
      setDraftKey(first.key);
    }
  }, [draftCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  function setField<K extends keyof IndividualInputs>(key: K, val: IndividualInputs[K]) {
    setInp((p) => ({ ...p, [key]: val }));
  }

  function addItem() {
    if (!draftKey || draftQty <= 0) return;
    const newItem: IndividualLineInput = {
      id: "item-" + nextId++,
      rateKey: draftKey,
      qty: draftQty,
      length: draftEntry?.unit === "ea" ? 0 : draftLength,
      color: draftColor,
    };
    setInp((p) => ({ ...p, items: [...p.items, newItem] }));
    setDraftQty(1);
    setDraftLength(0);
  }

  function updateItem(id: string, patch: Partial<IndividualLineInput>) {
    setInp((p) => ({
      ...p,
      items: p.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  }

  function removeItem(id: string) {
    setInp((p) => ({ ...p, items: p.items.filter((it) => it.id !== id) }));
  }

  function toggleSection(s: SectionId) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(s)) { next.delete(s); } else { next.add(s); }
      return next;
    });
  }

  const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <>
      <TopBar title="Individual Items" subtitle="Custom line-item / mixed job - live pricing" titleNode={<ProductSwitcher current="individual" />}>
        <button onClick={() => { setInp(DEFAULT); markupTier.reset(); discountOption.reset(); }} className="btn-secondary text-xs px-3 py-2">
          <RefreshCw size={13} /> Reset
        </button>
        <button onClick={() => setShowSaveModal(true)} className="btn-primary text-xs px-3 py-2">
          <Send size={13} /> Generate Proposal
        </button>
      </TopBar>

      <main className="flex-1 p-3 lg:p-6 pb-32 lg:pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-6 items-start">
            <div className="flex-1 min-w-0 space-y-3">

              <SectionCard id="job" title="Job Information" open={open.has("job")} onToggle={toggleSection}>
                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                  <TextInput label="Job Name" value={inp.jobName} onChange={(v) => setField("jobName", v)} span={2} />
                  <TextInput label="Salesman" value={inp.salesman} readOnly span={2} />
                </div>
              </SectionCard>

              <SectionCard id="items" title={"Items (" + inp.items.length + ")"} open={open.has("items")} onToggle={toggleSection}>
                <div className="space-y-4">
                  {/* Add item form */}
                  <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                    <div className="grid grid-cols-2 gap-3">
                      <SelectInput label="Category" value={draftCategory} onChange={setDraftCategory}
                        options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
                      <SelectInput label="Item" value={draftKey} onChange={setDraftKey}
                        options={categoryItems.map((c) => ({ value: c.key, label: c.label }))} />
                      <NumInput label="Qty" value={draftQty} onChange={setDraftQty} />
                      {draftEntry?.unit !== "ea" && (
                        <NumInput label={"Length (" + (draftEntry?.unit ?? "ft") + ")"} value={draftLength} onChange={setDraftLength} />
                      )}
                      <SelectInput label="Color" value={draftColor} onChange={setDraftColor} options={COLOR_OPTS} />
                    </div>
                    <button onClick={addItem} className="btn-primary w-full text-sm">
                      <Plus size={15} /> Add Item
                    </button>
                  </div>

                  {/* Items table */}
                  {inp.items.length > 0 && (
                    <div className="overflow-x-auto border border-gray-200 rounded-xl">
                      <table className="w-full min-w-[640px] text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-left">
                            {["Item","Qty","Len","Color","Rate","Amount",""].map((h) => (
                              <th key={h} className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {inp.items.map((it) => {
                            const entry = CATALOG_BY_KEY[it.rateKey];
                            const rate = (RATES as Record<string, number>)[it.rateKey] ?? 0;
                            return (
                              <tr key={it.id} className="hover:bg-gray-50 transition">
                                <td className="px-3 py-2 text-gray-800 font-medium whitespace-nowrap">{entry?.label ?? it.rateKey}</td>
                                <td className="px-3 py-2 w-20">
                                  <input type="number" className="input py-1 text-xs" value={it.qty === 0 ? "" : it.qty}
                                    onChange={(e) => updateItem(it.id, { qty: parseFloat(e.target.value) || 0 })} />
                                </td>
                                <td className="px-3 py-2 w-20">
                                  {entry?.unit !== "ea" ? (
                                    <input type="number" className="input py-1 text-xs" value={it.length === 0 ? "" : it.length}
                                      onChange={(e) => updateItem(it.id, { length: parseFloat(e.target.value) || 0 })} />
                                  ) : <span className="text-gray-400">-</span>}
                                </td>
                                <td className="px-3 py-2 w-28">
                                  <select className="select py-1 text-xs" value={it.color}
                                    onChange={(e) => updateItem(it.id, { color: e.target.value })}>
                                    {COLOR_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                  </select>
                                </td>
                                <td className="px-3 py-2 text-gray-500 font-mono text-xs whitespace-nowrap">
                                  {fmt(rate)}
                                </td>
                                <td className="px-3 py-2 text-gray-800 font-mono font-semibold whitespace-nowrap">
                                  {fmt(it.qty * (it.length || 1) * rate)}
                                </td>
                                <td className="px-3 py-2">
                                  <button onClick={() => removeItem(it.id)} className="text-gray-400 hover:text-red-500 transition">
                                    <Trash2 size={15} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50 border-t-2 border-gray-200">
                            <td colSpan={5} className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-gray-500 text-right">
                              Material Cost
                            </td>
                            <td colSpan={2} className="px-3 py-3 font-mono font-bold text-gray-900">
                              {fmt(result.materialCost)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                  {inp.items.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No items added yet.</p>
                  )}
                </div>
              </SectionCard>

              <SectionCard id="pricing" title="Pricing Adjustments" open={open.has("pricing")} onToggle={toggleSection}>
                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                  <MarkupTierSelect tier={markupTier.tier} onTierChange={markupTier.setTier}
                    markup={inp.markup} onMarkupChange={(v) => setField("markup", v)} />
                  <NumInput label="Tax Rate" value={inp.taxRate} onChange={(v) => setField("taxRate", v)} hint="e.g. 0.0745" />
                  <DiscountOptionSelect option={discountOption.option} onOptionChange={discountOption.setOption}
                    discount={inp.discount} onDiscountChange={(v) => setField("discount", v)} />
                  <NumInput label="Footings ($)" value={inp.footings} onChange={(v) => setField("footings", v)} />
                  <NumInput label="Roof Mounts ($)" value={inp.roofMounts} onChange={(v) => setField("roofMounts", v)} />
                  <NumInput label="Misc ($)" value={inp.misc} onChange={(v) => setField("misc", v)} />
                </div>
              </SectionCard>

              <div className="hidden lg:block">
                <PriceSummaryPanel result={result} />
              </div>
            </div>

            <div className="hidden lg:block w-80 flex-shrink-0 sticky top-20 space-y-4">
              <PriceSummaryPanel result={result} />
              <CommissionPanel materialCost={result.materialCost} price={result.totalJobSale} discount={inp.discount} discountFullyExempt={discountOption.option === 'cash'} />
            </div>
          </div>
        </div>
      </main>

      <MobilePriceBar result={result} onExpand={() => setShowPricePanel(true)} />

      {showPricePanel && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto">
            <PriceSummaryPanel result={result} onClose={() => setShowPricePanel(false)} />
            <div className="mt-4">
              <CommissionPanel materialCost={result.materialCost} price={result.totalJobSale} discount={inp.discount} discountFullyExempt={discountOption.option === 'cash'} />
            </div>
          </div>
        </div>
      )}

      {showSaveModal && (
        <SaveQuoteModal
          productType="individual"
          inputs={inp as unknown as Record<string, unknown>}
          lineItems={result.lineItems}
          materialCost={result.materialCost}
          totalJobSale={result.totalJobSale}
          totalProfit={result.totalProfit}
          markup={result.markup}
          onClose={() => setShowSaveModal(false)}
          onSuccess={(token) => {
            setShowSaveModal(false);
            router.push("/proposals/" + token);
          }}
        />
      )}
    </>
  );
}
