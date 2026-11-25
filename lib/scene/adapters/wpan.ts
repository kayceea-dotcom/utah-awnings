import type { WPanInputs } from "@/lib/pricing/wpan";
import type { SceneConfig, CosmeticOverrides } from "../types";
import { coverToScene } from "./cover";

// V-Panel: Tri-V panels are 2ft wide, DuraKing 1ft - the ribs run between panels.
export function wpanToScene(inp: WPanInputs, cosmetic?: CosmeticOverrides): SceneConfig {
  const panelWidthFt = inp.panelType === "wpan_032" ? 2 : 1;
  return coverToScene(inp, { productType: "w_pan", roofType: "w_pan", ribSpacingFt: panelWidthFt }, cosmetic);
}
