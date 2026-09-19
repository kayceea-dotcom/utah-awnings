import { T6_SPAN_120C, FLAT_PAN_SPAN_120C, DURAKING_SPAN_120C, ER505_TABLE2, ER505_TABLE3, ER505_TABLE5, type FlatSpanTable, type IrpSpanSection } from "./data";
import type { PanelType } from "@/lib/pricing/types";
import type { WPanType } from "@/lib/pricing/wpan";
import type { IRPType } from "@/lib/pricing/irp";

export interface SpanCheckResult {
  maxSpanFt: number | null;
  tierPsfUsed: number | null;
  hasData: boolean;
  // No engineering table backs this panel at all (e.g. Tri-V) - distinct
  // from exceedsTable, where a table exists but this site's load is off the
  // top of it.
  noTableForPanel: boolean;
  exceedsTable: boolean;
}

const NO_TABLE: SpanCheckResult = { maxSpanFt: null, tierPsfUsed: null, hasData: false, noTableForPanel: true, exceedsTable: false };
const EXCEEDS_TABLE: SpanCheckResult = { maxSpanFt: null, tierPsfUsed: null, hasData: false, noTableForPanel: false, exceedsTable: true };

export function parseFeetInches(s: string): number {
  const m = s.match(/^(\d+)'-(\d+)"$/);
  if (!m) return NaN;
  return Number(m[1]) + Number(m[2]) / 12;
}

// Finds the smallest tier >= psf (conservative - rounds UP to a stricter
// load tier, never under-designs). Returns null if psf exceeds every tier.
function roundUpTier(psf: number, tiers: number[]): number | null {
  const sorted = [...tiers].sort((a, b) => a - b);
  return sorted.find((t) => psf <= t) ?? null;
}

// ── Table 1 / 1C / 2 style lookups (T6, Flat Pan, DuraKing) - single span
// value per GSL tier x gauge, already resolved to the fixed 120mph Exp C
// wind column. ──
function checkFlatTableSpan(table: FlatSpanTable, gauge: string, designPsf: number): SpanCheckResult {
  const tiers = table[gauge];
  if (!tiers) return NO_TABLE;
  const tierKeys = Object.keys(tiers).map(Number);
  const tier = roundUpTier(designPsf, tierKeys);
  if (tier === null) return EXCEEDS_TABLE;
  return { maxSpanFt: parseFeetInches(tiers[tier]), tierPsfUsed: tier, hasData: true, noTableForPanel: false, exceedsTable: false };
}

// ── ER-505 IRP/LRP EPS panel lookup - "Snow" loading case only. Live / Wind
// Upward / Wind Downward rows aren't checked here - those need real wind
// uplift/downward pressure (psf), not just a wind speed category, and this
// app doesn't compute that. A run that clears this Snow check hasn't been
// verified against those other load cases. ──
function checkIrpSection(section: IrpSpanSection, designPsf: number): SpanCheckResult {
  const tier = roundUpTier(designPsf, section.psfColumns);
  if (tier === null) return EXCEEDS_TABLE;
  const idx = section.psfColumns.indexOf(tier);
  return { maxSpanFt: parseFeetInches(section.spans[idx]), tierPsfUsed: tier, hasData: true, noTableForPanel: false, exceedsTable: false };
}

function checkIrpThickness(thicknessKey: "3.0" | "4.25" | "6.0", facingKey: "0.024" | "0.030", hasFanBeam: boolean, designPsf: number): SpanCheckResult {
  // Table 5 ("optional" high snow load tiers) only exists for the 2.0pcf/
  // .030" facing at 4.25in/6.0in, and only at exact psf matches - it's a
  // supplemental table added specifically for jurisdiction-specific tiers
  // like ours, not a general ladder. Prefer it whenever it has an exact hit;
  // fall back to Table 2/3's 5-psf-step ladder (which rounds up) otherwise.
  if (facingKey === "0.030" && (thicknessKey === "4.25" || thicknessKey === "6.0")) {
    const t5 = ER505_TABLE5[thicknessKey];
    const section5 = t5 && (hasFanBeam ? t5.withFan : t5.noFan);
    if (section5 && section5.psfColumns.includes(designPsf)) {
      return checkIrpSection(section5, designPsf);
    }
  }

  const table = facingKey === "0.024" ? ER505_TABLE2 : ER505_TABLE3;
  const entry = table[thicknessKey];
  if (!entry) return NO_TABLE;
  const section = hasFanBeam ? entry.withFan : entry.noFan;
  if (!section) return NO_TABLE;
  return checkIrpSection(section, designPsf);
}

// ── Per-product entry points, keyed off the exact enum values used in each
// product's own quote builder. ──

export function checkNewportSpan(panelType: PanelType, designPsf: number): SpanCheckResult {
  if (panelType.startsWith("T6_")) {
    const gauge = "0." + panelType.split("_")[1];
    return checkFlatTableSpan(T6_SPAN_120C, gauge, designPsf);
  }
  if (panelType.startsWith("flat_8_")) {
    const gauge = "0." + panelType.split("_")[2];
    return checkFlatTableSpan(FLAT_PAN_SPAN_120C, gauge, designPsf);
  }
  return NO_TABLE;
}

export function checkWPanSpan(panelType: WPanType, designPsf: number): SpanCheckResult {
  // Tri-V ("wpan_032") has no per-gauge rate and no matching span table.
  if (panelType === "wpan_032") return NO_TABLE;
  // DuraKing's rated gauges are .025/.032/.040; the span table (transcribed
  // from the manufacturer's evaluation report) lists .024/.032/.040 - .025 is
  // the same nominal facing as the table's .024 entry, just rounded
  // differently between documents, so it maps there.
  const gauge = panelType === "duraking_025" ? "0.024" : "0." + panelType.split("_")[1];
  return checkFlatTableSpan(DURAKING_SPAN_120C, gauge, designPsf);
}

export function checkIrpPanelSpan(panelType: IRPType, hasFanBeam: boolean, designPsf: number): SpanCheckResult {
  if (panelType === "lrp_4_032") return checkIrpThickness("4.25", "0.030", hasFanBeam, designPsf);
  if (panelType === "lrp_3_032") return checkIrpThickness("3.0", "0.030", hasFanBeam, designPsf);
  return checkIrpThickness("3.0", "0.024", hasFanBeam, designPsf);
}
