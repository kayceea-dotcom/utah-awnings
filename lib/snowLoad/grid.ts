import fs from "fs";
import path from "path";

// Ground snow load grid vendored from utahsnowload.usu.edu (Structural
// Engineers Association of Utah / USU PRISM-based model), fetched 2026-09-18
// from https://www.usu.edu/utahsnowload/files/json/snowloadMat.json.
// Vendored (not fetched live) so a lookup doesn't depend on USU's server or
// pull a ~13MB file on every request - it's a fixed historical dataset the
// user has already accepted as "close enough" for quoting purposes.
// Reimplements the bilinear interpolation in USU's own
// utahsnowload/_resources/js/process.js against this same grid.

interface SnowLoadGrid {
  latKeys: string[];
  lngKeys: string[];
  matrix: Record<string, Record<string, number>>;
}

let cachedGrid: SnowLoadGrid | null = null;

function loadGrid(): SnowLoadGrid {
  if (cachedGrid) return cachedGrid;
  const filePath = path.join(process.cwd(), "lib", "snowLoad", "data", "snowloadMat.json");
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const matrix: Record<string, Record<string, number>> = raw.snowloadMatrix;
  const latKeys = Object.keys(matrix);
  const lngKeys = Object.keys(matrix[latKeys[0]]);
  cachedGrid = { latKeys, lngKeys, matrix };
  return cachedGrid;
}

// USU's own tool flags a result as unreliable when any of the 4 surrounding
// grid cells is >= 429 psf ("Region not covered by study" in process.js).
const OUT_OF_STUDY_THRESHOLD = 429;

function findBracket(target: number, keys: string[]): { lowerKey: string; upperKey: string; t: number } {
  const sorted = keys.map((k) => ({ key: k, val: Number(k) })).sort((a, b) => a.val - b.val);
  if (target <= sorted[0].val) return { lowerKey: sorted[0].key, upperKey: sorted[0].key, t: 0 };
  const last = sorted[sorted.length - 1];
  if (target >= last.val) return { lowerKey: last.key, upperKey: last.key, t: 0 };
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (target >= a.val && target <= b.val) {
      const t = b.val === a.val ? 0 : (target - a.val) / (b.val - a.val);
      return { lowerKey: a.key, upperKey: b.key, t };
    }
  }
  return { lowerKey: last.key, upperKey: last.key, t: 0 };
}

export interface GroundSnowLoadResult {
  psf: number;
  outOfStudyRegion: boolean;
}

export function getGroundSnowLoad(lat: number, lng: number): GroundSnowLoadResult {
  const grid = loadGrid();
  const latBracket = findBracket(lat, grid.latKeys);
  const lngBracket = findBracket(lng, grid.lngKeys);

  const sw = grid.matrix[latBracket.lowerKey][lngBracket.lowerKey];
  const se = grid.matrix[latBracket.lowerKey][lngBracket.upperKey];
  const nw = grid.matrix[latBracket.upperKey][lngBracket.lowerKey];
  const ne = grid.matrix[latBracket.upperKey][lngBracket.upperKey];

  const bottom = sw + (se - sw) * lngBracket.t;
  const top = nw + (ne - nw) * lngBracket.t;
  const interpolated = bottom + (top - bottom) * latBracket.t;

  const rounded = Math.max(21, Math.round(interpolated));
  const outOfStudyRegion = [sw, se, nw, ne].some((v) => v >= OUT_OF_STUDY_THRESHOLD);

  return { psf: rounded, outOfStudyRegion };
}
