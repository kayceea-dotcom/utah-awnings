// Simplified 2D side-profile silhouettes for each rafter tail end cut style,
// traced from the catalog brochure's "Rafter Tails" page (scalloped / corbel
// / mitered / beveled). Drawn in a 44x24 box, attached edge at x=0 (flush
// with the beam), tail tip toward x=44. Shared by the on-screen
// SideProfileDiagram (raw <path d>) and the PDF version (react-pdf <Path d>)
// so both draw the exact same shape from one definition.
export const END_CUT_PROFILE_PATHS: Record<string, string> = {
  beveled: "M0,0 L44,0 L44,24 L0,24 Z",
  mitered: "M0,0 L44,0 L44,13 L33,24 L0,24 Z",
  scallop: "M0,0 L44,0 Q44,11 33,15 Q23,19 23,24 L0,24 Z",
  corbel: "M0,0 L44,0 L44,5 Q44,20 29,20 L29,24 L0,24 Z",
};

export function endCutProfilePath(endCut?: string): string {
  return END_CUT_PROFILE_PATHS[endCut || "beveled"] || END_CUT_PROFILE_PATHS.beveled;
}
