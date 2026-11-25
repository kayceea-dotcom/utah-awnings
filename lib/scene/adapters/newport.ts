import type { NewportInputs } from "@/lib/pricing/types";
import type { SceneConfig, CosmeticOverrides } from "../types";
import { coverToScene } from "./cover";

// Flat Panel (T6 flat pan) - built by the shared cover adapter.
export function newportToScene(inp: NewportInputs, cosmetic?: CosmeticOverrides): SceneConfig {
  return coverToScene(inp, { productType: "newport", roofType: "flat_pan" }, cosmetic);
}
