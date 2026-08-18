"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus } from "lucide-react";
import type { LineItem } from "@/lib/pricing/types";
import { CATALOG, CATALOG_BY_KEY, CATEGORIES } from "@/lib/pricing/catalog";
import { RATES } from "@/lib/pricing/rates";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const COLORS = ["White", "Siennawood", "Slate", "Driftwood", "Beechwood", "Maplewood", "Ebony", "Sandlewood"];
const COLOR_OPTS = [{ value: "", label: "None" }, ...COLORS.map((c) => ({ value: c, label: c }))];

function recalcAmount(item: LineItem): LineItem {
  return { ...item, amount: item.qty * (item.length || 1) * item.rate };
}

interface MaterialListProps {
  items: LineItem[];
  // When set, the list becomes editable (qty/length/color/rate inputs, add/remove
  // rows) and calls back with the full updated array on every change - the caller
  // owns whether/how that diverges from the auto-calculated list.
  editable?: boolean;
  onItemsChange?: (items: LineItem[]) => void;
}

export default function MaterialList({ items, editable = false, onItemsChange }: MaterialListProps) {
  // Add-item draft form state - picks a real catalog part (name + rate) instead
  // of a blank "New Item" row, same picker UX as the Individual Items page.
  const [draftCategory, setDraftCategory] = useState(CATEGORIES[0]);
  const [draftKey, setDraftKey] = useState(CATALOG.find((c) => c.category === CATEGORIES[0])?.key ?? "");
  const [draftQty, setDraftQty] = useState(1);
  const [draftLength, setDraftLength] = useState(0);
  const [draftColor, setDraftColor] = useState("");

  const draftEntry = CATALOG_BY_KEY[draftKey];
  const categoryItems = CATALOG.filter((c) => c.category === draftCategory);

  useEffect(() => {
    // Keep the item picker valid when the category changes
    const first = CATALOG.find((c) => c.category === draftCategory);
    if (first && !categoryItems.some((c) => c.key === draftKey)) {
      setDraftKey(first.key);
    }
  }, [draftCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!items.length && !editable) return null;

  function updateItem(i: number, patch: Partial<LineItem>) {
    if (!onItemsChange) return;
    onItemsChange(items.map((item, idx) => (idx === i ? recalcAmount({ ...item, ...patch }) : item)));
  }

  function removeItem(i: number) {
    if (!onItemsChange) return;
    onItemsChange(items.filter((_, idx) => idx !== i));
  }

  function addItem() {
    if (!onItemsChange || !draftKey || draftQty <= 0) return;
    const rate = (RATES as Record<string, number>)[draftKey] ?? 0;
    const length = draftEntry?.unit === "ea" ? 0 : draftLength;
    const newItem = recalcAmount({
      name: draftEntry?.label ?? draftKey,
      qty: draftQty,
      length,
      unit: draftEntry?.unit ?? "",
      rate,
      amount: 0,
      color: draftColor,
    });
    onItemsChange([...items, newItem]);
    setDraftQty(1);
    setDraftLength(0);
  }

  const headers = editable
    ? ["Item", "Qty", "Len", "Color", "Rate", "Amount", ""]
    : ["Item", "Qty", "Len", "Color", "Rate", "Amount"];

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="section-heading">Material List ({items.length} items)</h2>
      </div>

      {editable && (
        <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Category</label>
              <select className="select text-sm" value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-2 lg:col-span-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Item</label>
              <select className="select text-sm" value={draftKey} onChange={(e) => setDraftKey(e.target.value)}>
                {categoryItems.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Qty</label>
              <input type="number" className="input text-sm" value={draftQty === 0 ? "" : draftQty} placeholder="0"
                onChange={(e) => setDraftQty(parseFloat(e.target.value) || 0)} />
            </div>
            {draftEntry?.unit !== "ea" && (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">
                  Length ({draftEntry?.unit ?? "ft"})
                </label>
                <input type="number" className="input text-sm" value={draftLength === 0 ? "" : draftLength} placeholder="0"
                  onChange={(e) => setDraftLength(parseFloat(e.target.value) || 0)} />
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Color</label>
              <select className="select text-sm" value={draftColor} onChange={(e) => setDraftColor(e.target.value)}>
                {COLOR_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <button onClick={addItem} className="btn-primary w-full text-sm">
            <Plus size={15} /> Add Item
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              {headers.map((h, i) => (
                <th key={h + i} className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, i) => (
              <tr key={i} className="hover:bg-slate-50 transition">
                <td className="px-4 py-2 text-slate-800 font-medium min-w-[160px]">
                  {editable ? (
                    <input className="input text-sm py-1" style={{ minHeight: "auto" }} value={item.name} onChange={(e) => updateItem(i, { name: e.target.value })} />
                  ) : item.name}
                </td>
                <td className="px-2 py-2 text-slate-600 font-mono w-32">
                  {editable ? (
                    <input type="number" className="input text-sm py-1 px-2" style={{ minHeight: "auto" }} placeholder="0"
                      value={item.qty || ""} onChange={(e) => updateItem(i, { qty: parseFloat(e.target.value) || 0 })} />
                  ) : item.qty}
                </td>
                <td className="px-2 py-2 text-slate-600 font-mono w-32">
                  {editable ? (
                    <input type="number" className="input text-sm py-1 px-2" style={{ minHeight: "auto" }} placeholder="0"
                      value={item.length || ""} onChange={(e) => updateItem(i, { length: parseFloat(e.target.value) || 0 })} />
                  ) : ((item.displayLength ?? item.length) || "-")}
                </td>
                <td className="px-4 py-2 w-28">
                  {editable ? (
                    <input className="input text-sm py-1" style={{ minHeight: "auto" }} value={item.color || ""} onChange={(e) => updateItem(i, { color: e.target.value })} />
                  ) : item.color ? (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-medium">
                      {item.color}
                    </span>
                  ) : null}
                </td>
                <td className="px-2 py-2 text-slate-500 font-mono text-xs w-32">
                  {editable ? (
                    <input type="number" step="0.01" className="input text-sm py-1 px-2" style={{ minHeight: "auto" }} placeholder="0"
                      value={item.rate || ""} onChange={(e) => updateItem(i, { rate: parseFloat(e.target.value) || 0 })} />
                  ) : fmt(item.rate)}
                </td>
                <td className="px-4 py-2.5 text-slate-800 font-mono font-semibold">{fmt(item.amount)}</td>
                {editable && (
                  <td className="px-4 py-2.5">
                    <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600" title="Remove item">
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t-2 border-slate-200">
              <td colSpan={5} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 text-right">
                Material Cost
              </td>
              <td className="px-4 py-3 font-mono font-bold text-slate-900">
                {fmt(items.reduce((s, i) => s + i.amount, 0))}
              </td>
              {editable && <td />}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
