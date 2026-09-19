import type { SpanCheckResult } from "@/lib/spanTables/lookup";
import { effectiveSpanFt } from "@/lib/spanTables/lookup";

interface Props {
  result: SpanCheckResult;
  projectionFt: number;
  designPsf: number | null;
}

function formatFeetInches(ft: number): string {
  const totalInches = Math.round(ft * 12);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}"`;
}

// Renders nothing until a site snow load has been looked up and a
// projection is entered - this never nags on a blank/in-progress quote.
export default function SpanWarning({ result, projectionFt, designPsf }: Props) {
  if (designPsf === null || projectionFt <= 0) return null;
  if (result.noTableForPanel) return null; // e.g. Tri-V - no table to check against

  // The structural span is shorter than the raw projection - the panel
  // cantilevers past the front beam and the beam itself eats into the clear
  // span (see effectiveSpanFt) - that's what actually gets checked.
  const spanFt = effectiveSpanFt(projectionFt);

  if (result.exceedsTable) {
    return (
      <p className="col-span-2 -mt-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        {designPsf} psf design snow load is above this panel&apos;s engineering table - needs a site-specific engineer review before quoting a span here.
      </p>
    );
  }

  if (result.maxSpanFt !== null && spanFt > result.maxSpanFt) {
    return (
      <p className="col-span-2 -mt-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        {projectionFt}ft projection ({formatFeetInches(spanFt)} actual span after overhang/beam) exceeds the max allowable span ({formatFeetInches(result.maxSpanFt)}) for this panel at {result.tierPsfUsed} psf design snow load / 120mph Exp B wind.
        Consider adding a second beam partway through the run to split it into two shorter spans.
      </p>
    );
  }

  return null;
}
