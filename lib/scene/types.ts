export type RoofType = "flat_pan" | "w_pan" | "irp" | "pergola_lattice";

export interface Vec2 {
  x: number;
  z: number;
}

export interface BBox {
  widthFt: number;
  depthFt: number;
  heightFt: number;
}

export interface RunConfig {
  id: "run1" | "run2";
  widthFt: number;
  projectionFt: number;
  originOffsetFt: number; // where this run starts along the house wall (run2 = run1.widthFt)
  zOffsetFt: number; // how far this run's house edge sits out from z=0 (a house-wall jog steps the wall while the front stays flush)
  ribSpacingFt?: number; // V-Panel: spacing of the raised ribs across the width (= panel width)
  hasBeam: boolean; // false for "no beam" - the posts stand at the front edge instead
  roofType: RoofType;
  roofPitchDeg: number; // fixed per product type (1/2"/ft for solid covers, 0 for pergola) — not user-adjustable
  postHeightFt: number; // height at the house-wall starting point
  postTopHeightFt: number; // actual height of the post tops / beam, following the roof slope down from postHeightFt
  beamZFt: number; // distance from house wall to the beam/post line
  beamLengthFt: number;
  beamType: string;
  beamEndCut: string;
  postsQty: number;
  posts: Vec2[]; // computed plan positions
  rafterTails: { enabled: boolean; positions: Vec2[] };
  hasWrap: boolean;
  wrapType: string;
}

// Additional beams required by multi-span structural configurations (per the
// Duralum engineering drawings: attached single-span = 1 beam, attached
// multi-span = 2 beams, freestanding single-span = 2 beams, freestanding
// multi-span = 3 beams). These are the 2nd/3rd beams beyond the front one.
export interface MultiSpanBeamConfig {
  id: string;
  type: string;
  qty: number;
  lengthFt: number;
  positionFromHouseFt: number;
  postsQty: number;
  postHeightFt: number;
  postXs: number[]; // computed positions, relative to the run's origin (0..lengthFt)
  runId: "run1" | "run2";
  // "double_*" beam types (e.g. "double_3x8") mount to the SIDE of their
  // posts rather than bearing on top — post plates stop at the post height
  // instead of extending up to cover the beam too.
  mountedOnSide: boolean;
}

// Rear beam of a freestanding / roof-mount cover - same construction as the
// front beam, sitting just in from the house-side edge.
export interface RearBeamConfig {
  type: string;
  xOffsetFt: number;
  lengthFt: number;
  zFt: number;
  topHeightFt: number; // top of the posts / underside of the beam
  postXs: number[]; // absolute X
}

export interface FanBeamConfig {
  qty: number;
  lengthFt: number;
}

export interface ColorAssignment {
  pans: string; // AwningColor name
  gutterFascia: string;
  postsBeam: string;
  accent: string; // cosmetic-only stub — no field on NewportInputs yet
}

export interface CosmeticExtras {
  trim: { enabled: boolean; color: string };
  recessedLights: { enabled: boolean; qty: number };
  shadeWalls: { enabled: boolean; sides: ("left" | "right" | "back")[] };
  dropDownShades: { enabled: boolean; sides: ("front" | "left" | "right")[] };
}

// Cosmetic-only overrides for options that don't exist on any product's real
// Inputs type yet. Lives entirely in the 3D panel's local state — never
// touches NewportInputs, calcNewport, or SaveQuoteModal.
export interface CosmeticOverrides {
  accentColor?: string;
  trim?: { enabled: boolean; color: string };
  recessedLights?: { enabled: boolean; qty: number };
  shadeWalls?: { enabled: boolean; sides: ("left" | "right" | "back")[] };
  dropDownShades?: { enabled: boolean; sides: ("front" | "left" | "right")[] };
}

export interface SceneConfig {
  productType: "newport" | "flat_pan" | "pergola" | "w_pan" | "irp";
  runs: RunConfig[];
  multiSpanBeams: MultiSpanBeamConfig[];
  rearBeam: RearBeamConfig | null;
  houseWall: boolean; // attached covers have a house wall behind them
  downspoutSide: "left" | "right";
  jog: "none" | "ground" | "house";
  fanBeam: FanBeamConfig | null;
  gutterType: string;
  downspoutsQty: number;
  colors: ColorAssignment;
  groundMount: boolean;
  extras: CosmeticExtras;
  bboxFt: BBox;
}
