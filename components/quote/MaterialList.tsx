import type { LineItem } from "@/lib/pricing/types";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function MaterialList({ items }: { items: LineItem[] }) {
  if (!items.length) return null;
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="section-heading">Material List ({items.length} items)</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              {["Item","Qty","Len","Color","Rate","Amount"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, i) => (
              <tr key={i} className="hover:bg-slate-50 transition">
                <td className="px-4 py-2.5 text-slate-800 font-medium">{item.name}</td>
                <td className="px-4 py-2.5 text-slate-600 font-mono">{item.qty}</td>
                <td className="px-4 py-2.5 text-slate-600 font-mono">{item.length || "-"}</td>
                <td className="px-4 py-2.5">
                  {item.color && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-medium">
                      {item.color}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{fmt(item.rate)}</td>
                <td className="px-4 py-2.5 text-slate-800 font-mono font-semibold">{fmt(item.amount)}</td>
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
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
