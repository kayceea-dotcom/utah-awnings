"use client";

import { Trash2, Plus } from "lucide-react";
import type { LineItem } from "@/lib/pricing/types";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

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
    if (!onItemsChange) return;
    onItemsChange([...items, recalcAmount({ name: "New Item", qty: 1, length: 0, unit: "", rate: 0, amount: 0, color: "" })]);
  }

  const headers = editable
    ? ["Item", "Qty", "Len", "Color", "Rate", "Amount", ""]
    : ["Item", "Qty", "Len", "Color", "Rate", "Amount"];

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="section-heading">Material List ({items.length} items)</h2>
        {editable && (
          <button onClick={addItem} className="text-xs btn-secondary px-3 py-1.5">
            <Plus size={13} /> Add Item
          </button>
        )}
      </div>
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
                <td className="px-4 py-2 text-slate-600 font-mono w-20">
                  {editable ? (
                    <input type="number" className="input text-sm py-1" style={{ minHeight: "auto" }} value={item.qty} onChange={(e) => updateItem(i, { qty: parseFloat(e.target.value) || 0 })} />
                  ) : item.qty}
                </td>
                <td className="px-4 py-2 text-slate-600 font-mono w-20">
                  {editable ? (
                    <input type="number" className="input text-sm py-1" style={{ minHeight: "auto" }} value={item.length} onChange={(e) => updateItem(i, { length: parseFloat(e.target.value) || 0 })} />
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
                <td className="px-4 py-2 text-slate-500 font-mono text-xs w-24">
                  {editable ? (
                    <input type="number" step="0.01" className="input text-sm py-1" style={{ minHeight: "auto" }} value={item.rate} onChange={(e) => updateItem(i, { rate: parseFloat(e.target.value) || 0 })} />
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
