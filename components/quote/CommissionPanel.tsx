"use client";

import { computeCommission, nextTierPrompt } from "@/lib/commission/engine";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex justify-between text-gray-600">
      <span>{label}</span>
      <span className={"font-mono " + (warn ? "text-red-600 font-bold" : "text-gray-800")}>{value}</span>
    </div>
  );
}

export default function CommissionPanel({ materialCost, price }: { materialCost: number; price: number }) {
  if (materialCost <= 0) {
    return (
      <div className="card p-5">
        <h2 className="section-heading">Commission</h2>
        <p className="text-sm text-gray-400 mt-2">Enter dimensions to see commission.</p>
      </div>
    );
  }

  const c = computeCommission(materialCost, price);
  const next = nextTierPrompt(materialCost, price);

  return (
    <div className="card p-5 space-y-3">
      <h2 className="section-heading">Commission</h2>

      {c.belowFloor && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs font-bold text-red-700">
            Below minimum — commission drops to {(c.commissionRate * 100).toFixed(0)}%
          </p>
        </div>
      )}

      <div className="space-y-1.5 text-sm">
        <Row label="Material Cost" value={fmt(materialCost)} />
        <Row label="Floor Price" value={fmt(c.floorPrice)} />
        <Row label="Current Price" value={fmt(c.price)} />
        <Row label="Markup" value={c.markup.toFixed(3) + "x"} warn={c.belowFloor} />
        <Row label="vs Floor" value={(c.percentVsFloor >= 0 ? "+" : "") + c.percentVsFloor.toFixed(1) + "%"} warn={c.belowFloor} />
        <Row label="Gross Profit" value={fmt(c.grossProfit)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={"rounded-xl p-3 border " + (c.belowFloor ? "border-red-200 bg-red-50" : "border-green-100 bg-green-50")}>
          <p className={"text-xs font-bold uppercase tracking-wide " + (c.belowFloor ? "text-red-600" : "text-green-600")}>
            Commission Rate
          </p>
          <p className={"text-lg font-bold " + (c.belowFloor ? "text-red-700" : "text-green-700")}>
            {(c.commissionRate * 100).toFixed(0)}%
          </p>
        </div>
        <div className={"rounded-xl p-3 border " + (c.belowFloor ? "border-red-200 bg-red-50" : "border-green-100 bg-green-50")}>
          <p className={"text-xs font-bold uppercase tracking-wide " + (c.belowFloor ? "text-red-600" : "text-green-600")}>
            Commission $
          </p>
          <p className={"text-lg font-bold " + (c.belowFloor ? "text-red-700" : "text-green-700")}>
            {fmt(c.commissionDollars)}
          </p>
        </div>
      </div>

      {next && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
          <p className="text-xs text-blue-700">
            Price at {fmt(next.targetPrice)} to earn {(next.nextRate * 100).toFixed(0)}% (+{fmt(next.extraDollars)})
          </p>
        </div>
      )}

      <p className="text-[11px] text-gray-400">
        Break-even reference: {fmt(c.breakEven)} — not a quoting floor
      </p>
    </div>
  );
}
