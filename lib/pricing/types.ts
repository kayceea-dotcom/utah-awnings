export type ProductType =
  | "newport" | "flat_pan" | "irp" | "pergola" | "w_pan" | "metal_wall" | "individual";

export type BeamType = "3x3" | "3x8" | "4_i_beam" | "7_i_beam";
export type EndCut = "scallop" | "beveled" | "mitered" | "corbel";
export type GutterType = "roll_form" | "extruded";
export type HangerType = "roll_form" | "extruded" | "a_rail" | "elevated_roof_mount";
export type PanelType =
  | "T6_024" | "T6_032" | "T6_040"
  | "flat_8_020" | "flat_8_024" | "flat_8_032";
export type AwningColor =
  | "White" | "Siennawood" | "Slate" | "Driftwood"
  | "Beechwood" | "Maplewood" | "Ebony" | "Sandlewood";
export type WrapType = "none" | "2x6" | "3x8";
// Only matters when there's a second run (width2 > 0). A jog in the house wall
// means the front edge stays straight (one beam/gutter run) but the hanger
// has to split to follow the wall. A jog in the ground/deck means the front
// edge steps (two separate beams/gutters) but the hanger stays continuous.
export type JogType = "house" | "ground";

export interface BeamConfig {
  type: string;
  qty: number;
  length: number;
  positionFromHouse: number;
  posts: number;
  postHeight: number;
}

export interface NewportInputs {
  // Newport and Modern (Flat-Pan) share this calculator, but a few line
  // items are specific to one product's actual material list.
  product: "newport" | "flat_pan";
  jobName: string;
  salesman: string;
  projection1: number;
  width1: number;
  projection2: number;
  width2: number;
  jogType: JogType;
  panelType1: PanelType;
  panelType2: PanelType | "";
  beamLength1: number;
  beamLength2: number;
  beamType1: BeamType;
  beamType2: BeamType | "";
  beamEndCut1: EndCut;
  beamEndCut2: EndCut | "";
  beams: BeamConfig[];
  gutterType: GutterType;
  hangerType: HangerType;
  posts1: number;
  postHeight1: number;
  posts2: number;
  postHeight2: number;
  colorPans: AwningColor;
  colorGutterFascia: AwningColor;
  colorPostsBeam: AwningColor;
  wrapType: WrapType;
  rafterTails: boolean;
  bayWindowPopout: boolean;
  downspouts: number;
  sprayPaint: boolean;
  groundMountPosts1: boolean;
  groundMountPosts2: boolean;
  fanBeamQty: number;
  fanBeamLength: number;
  shadeBeamQty: number;
  priceIncrease: number;
  footings: number;
  roofMounts: number;
  misc: number;
  markup: number;
  taxRate: number;
}

export interface LineItem {
  name: string;
  qty: number;
  length: number;
  unit: string;
  rate: number;
  amount: number;
  color?: string;
}

export interface QuoteResult {
  lineItems: LineItem[];
  materialCost: number;
  taxes: number;
  priceIncrease: number;
  totalMaterials: number;
  footings: number;
  roofMounts: number;
  misc: number;
  subtotal: number;
  markup: number;
  ccFee: number;
  totalJobSale: number;
  totalProfit: number;
  costPerSqFt: number;
  pricePerSqFt: number;
  totalSqFt: number;
}
