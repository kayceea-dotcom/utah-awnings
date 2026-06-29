import type { QuoteResult } from "@/lib/pricing/types";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const pct = (n: number) => (n * 100).toFixed(1) + "%";

export default function PriceSummary({ result }: { result: QuoteResult }) {
  const margin = result.totalJobSale > 0 ? result.totalProfit / result.totalJobSale : 0;
  return (
    <div className="card p-5 sticky top-6 space-y-4">
      <h2 className="section-heading">Price Summary</h2>
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center">
        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Total Job Sale</p>
        <p className="text-3xl font-black text-blue-700 tracking-tight">{fmt(result.totalJobSale)}</p>
        <div className="flex justify-center gap-3 mt-2 text-xs text-slate-500">
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
          <div key={label} className="flex justify-between text-slate-600">
            <span>{label}</span>
            <span className="font-mono text-slate-800">{fmt(val)}</span>
          </div>
        ))}
        <div className="border-t border-dashed border-slate-200 my-2" />
        <div className="flex justify-between text-slate-600">
          <span>Markup</span>
          <span className="font-mono text-slate-800">{result.markup}x</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>CC Fee (3.25%)</span>
          <span className="font-mono text-slate-800">{fmt(result.ccFee)}</span>
        </div>
        <div className="border-t border-slate-200 my-2" />
        <div className="flex justify-between font-semibold text-slate-900">
          <span>Total Job Sale</span>
          <span className="font-mono">{fmt(result.totalJobSale)}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
          <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Profit</p>
          <p className="text-lg font-bold text-emerald-700">{fmt(result.totalProfit)}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Margin</p>
          <p className="text-lg font-bold text-slate-700">{pct(margin)}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Cost/sq ft</p>
          <p className="text-lg font-bold text-slate-700">{fmt(result.costPerSqFt)}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Price/sq ft</p>
          <p className="text-lg font-bold text-slate-700">{fmt(result.pricePerSqFt)}</p>
        </div>
      </div>
    </div>
  );
}
