import * as THREE from "three";
import type { AwningColor } from "@/lib/pricing/types";

// Sampled directly from the swatch chart in the official Utah Awnings catalog
// brochure (PROOF Catalog Brochure 0371-26), pixel-averaged per swatch.
export const AWNING_COLOR_HEX: Record<AwningColor, string> = {
  White: "#E1DFDE",
  Siennawood: "#352514",
  Slate: "#414846",
  Driftwood: "#786B50",
  Beechwood: "#AB8E5E",
  Maplewood: "#E1D9C6",
  Ebony: "#2C2A28",
  Sandlewood: "#D6C7A6",
};

interface MaterialOpts {
  roughness?: number;
  metalness?: number;
}

const materialCache = new Map<string, THREE.MeshStandardMaterial>();

export function getMaterial(colorName: string, opts: MaterialOpts = {}): THREE.MeshStandardMaterial {
  const hex = AWNING_COLOR_HEX[colorName as AwningColor] ?? "#CCCCCC";
  const roughness = opts.roughness ?? 0.6;
  const metalness = opts.metalness ?? 0.15;
  const key = `${hex}|${roughness}|${metalness}`;
  let mat = materialCache.get(key);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({ color: hex, roughness, metalness });
    materialCache.set(key, mat);
  }
  return mat;
}
