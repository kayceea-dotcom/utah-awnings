import type { SpanCheckResult } from "@/lib/spanTables/lookup";

interface Props {
  result: SpanCheckResult;
  projectionFt: number;
  designPsf: number | null;
}

// Renders nothing until a site snow load has been looked up and a
// projection is entered - this never nags on a blank/in-progress quote.
export default function SpanWarning({ result, projectionFt, designPsf }: Props) {
  if (designPsf === null || projectionFt <= 0) return null;
  if (result.noTableForPanel) return null; // e.g. Tri-V - no table to check against

  if (result.exceedsTable) {
    return (
      <p className="col-span-2 -mt-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        {designPsf} psf design snow load is above this panel&apos;s engineering table - needs a site-specific engineer review before quoting a span here.
      </p>
    );
  }

  if (result.maxSpanFt !== null && projectionFt > result.maxSpanFt) {
    return (
      <p className="col-span-2 -mt-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        Projection ({projectionFt}ft) exceeds the max allowable span ({result.maxSpanFt.toFixed(1)}ft) for this panel at {result.tierPsfUsed} psf design snow load / 120mph Exp C wind.
      </p>
    );
  }

  return null;
}
