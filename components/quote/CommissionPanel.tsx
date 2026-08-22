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

export default function CommissionPanel({ materialCost, price, discount = 0, isCashDiscount = false }: {
  materialCost: number; price: number; discount?: number; isCashDiscount?: boolean;
}) {
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
  // Bottom two rate-card tiers (4%/8%, markup under 1.8x) get flagged red -
  // there's no hard floor anymore, just a low-tier warning.
  const warn = c.commissionRate < 0.14;

  return (
    <div className="card p-5 space-y-3">
      <h2 className="section-heading">Commission</h2>

      {warn && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs font-bold text-red-700">
            Low markup — commission is only {(c.commissionRate * 100).toFixed(0)}%
          </p>
        </div>
      )}

      <div className="space-y-1.5 text-sm">
        <Row label="Material Cost" value={fmt(materialCost)} />
        <Row label="Current Price" value={fmt(c.price)} />
        <Row label="Commission Markup" value={c.markup.toFixed(3) + "x"} warn={warn} />
        <Row label="Gross Profit" value={fmt(c.grossProfit)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={"rounded-xl p-3 border " + (warn ? "border-red-200 bg-red-50" : "border-green-100 bg-green-50")}>
          <p className={"text-xs font-bold uppercase tracking-wide " + (warn ? "text-red-600" : "text-green-600")}>
            Commission Rate
          </p>
          <p className={"text-lg font-bold " + (warn ? "text-red-700" : "text-green-700")}>
            {(c.commissionRate * 100).toFixed(0)}%
          </p>
        </div>
        <div className={"rounded-xl p-3 border " + (warn ? "border-red-200 bg-red-50" : "border-green-100 bg-green-50")}>
          <p className={"text-xs font-bold uppercase tracking-wide " + (warn ? "text-red-600" : "text-green-600")}>
            Commission $
          </p>
          <p className={"text-lg font-bold " + (warn ? "text-red-700" : "text-green-700")}>
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

      {discount > 0 && (
        <p className="text-[11px] text-gray-400">
          {isCashDiscount
            ? <>{fmt(discount)} check/cash discount — waives the CC fee, no effect on commission</>
            : <>Reflects a {fmt(discount)} discount already counted against commission above</>}
        </p>
      )}

      <p className="text-[11px] text-gray-400">
        Break-even reference: {fmt(c.breakEven)} — not a quoting floor
      </p>
    </div>
  );
}
