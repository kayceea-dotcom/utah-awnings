import type { BeamConfig, PostLayout } from "@/lib/pricing/types";
import type { RunConfig, MultiSpanBeamConfig, SceneConfig, CosmeticOverrides, RoofType, RearBeamConfig } from "../types";
import {
  BEAM_INSET_FT,
  STANDARD_ROOF_PITCH_DEG,
  computeFrontEdgeHeightFt,
  computePostXPositions,
  computeRafterTailXPositions,
  computeSceneBBox,
  resolvePostXs,
} from "../geometry";
import { getBeamProfile } from "../beamProfiles";

// Posts at a "no beam" front edge stand just inside the gutter instead of on a beam line.
const NO_BEAM_POST_INSET_FT = 0.15;

/** The slice of a quote's inputs the 3D model is built from. Flat Panel and V-Panel
 *  inputs both satisfy it. */
export interface SceneCoverInputs {
  width1: number; projection1: number; width2: number; projection2: number;
  jogType: string;
  posts1: number; postHeight1: number; posts2: number; postHeight2: number;
  beamLength1: number; beamLength2: number;
  beamType1: string; beamType2: string;
  beamEndCut1: string; beamEndCut2: string;
  wrapType: string; rafterTails: boolean;
  beams?: BeamConfig[];
  gutterType: string;
  downspouts: number; downspoutSide: string;
  colorPans: string; colorGutterFascia: string; colorPostsBeam: string;
  groundAttachment: string;
  fanBeamQty: number; fanBeamLength: number;
  mountStyle: string;
  rearBeamType: string; rearBeamLength: number;
  rearPosts: number; skyliftPosts: number; rearPostHeight: number;
  postLayout?: PostLayout;
}

export interface CoverSceneOptions {
  productType: SceneConfig["productType"];
  roofType: RoofType;
  /** V-Panel: how wide each panel is (its ribs run between panels). */
  ribSpacingFt?: number;
}

function hasBeamType(type: string): boolean {
  return type !== "none" && type !== "";
}

function buildRun(args: {
  id: "run1" | "run2";
  widthFt: number;
  projectionFt: number;
  originOffsetFt: number;
  zOffsetFt: number;
  postsQty: number;
  postXsAbs: number[] | undefined;
  postHeightFt: number;
  beamLengthFt: number;
  beamType: string;
  beamEndCut: string;
  hasWrap: boolean;
  wrapType: string;
  rafterTailsEnabled: boolean;
  roofPitchDeg: number;
  roofType: RoofType;
  ribSpacingFt?: number;
}): RunConfig {
  const hasBeam = hasBeamType(args.beamType);
  const beamZFt = Math.max(args.projectionFt - (hasBeam ? BEAM_INSET_FT : NO_BEAM_POST_INSET_FT), 0);
  const evenXs = computePostXPositions(args.widthFt, args.postsQty);
  const xs = resolvePostXs(args.postXsAbs, args.postsQty, args.originOffsetFt, args.widthFt, evenXs);
  const posts = xs.map((x) => ({ x, z: beamZFt }));
  const rafterTails = args.rafterTailsEnabled
    ? { enabled: true, positions: computeRafterTailXPositions(args.widthFt).map((x) => ({ x, z: args.projectionFt })) }
    : { enabled: false, positions: [] };
  // The roof panel pivots at postHeightFt at the house wall and slopes down.
  // The panel RESTS ON TOP of the beam, which rests on top of the post — so
  // the post/beam-bottom height is the panel's height at the beam's distance
  // from the house, MINUS the beam's own thickness (leaving room for the
  // beam to sit under the panel instead of poking up through it).
  const panelHeightAtBeamFt = computeFrontEdgeHeightFt(args.postHeightFt, beamZFt, args.roofPitchDeg);
  const beamHeightFt = hasBeam ? getBeamProfile(args.beamType).heightInches / 12 : 0;
  const postTopHeightFt = panelHeightAtBeamFt - beamHeightFt;

  return {
    id: args.id,
    widthFt: args.widthFt,
    projectionFt: args.projectionFt,
    originOffsetFt: args.originOffsetFt,
    zOffsetFt: args.zOffsetFt,
    ribSpacingFt: args.ribSpacingFt,
    hasBeam,
    roofType: args.roofType,
    roofPitchDeg: args.roofPitchDeg,
    postHeightFt: args.postHeightFt,
    postTopHeightFt,
    beamZFt,
    beamLengthFt: args.beamLengthFt,
    beamType: args.beamType,
    beamEndCut: args.beamEndCut,
    postsQty: args.postsQty,
    posts,
    rafterTails,
    hasWrap: args.hasWrap,
    wrapType: args.wrapType,
  };
}

export function coverToScene(inp: SceneCoverInputs, opts: CoverSceneOptions, cosmetic?: CosmeticOverrides): SceneConfig {
  const hasWrap = inp.wrapType !== "none";
  const roofPitchDeg = STANDARD_ROOF_PITCH_DEG;
  const hasRun2 = inp.width2 > 0 && inp.projection2 > 0;
  const isHouseJog = hasRun2 && inp.jogType === "house";
  const jog: SceneConfig["jog"] = !hasRun2 ? "none" : isHouseJog ? "house" : "ground";
  const rearStyle = inp.mountStyle === "freestanding" || inp.mountStyle === "roof_mount";
  const frontZFt = Math.max(inp.projection1 > 0 ? inp.projection1 : 0, hasRun2 ? inp.projection2 : 0);
  // A freestanding / roof-mount cover is highest at its rear beam, not at a wall.
  const pivotHeight = (own: number) => (rearStyle && inp.rearPostHeight > 0 ? inp.rearPostHeight : own);

  const runs: RunConfig[] = [];
  if (inp.width1 > 0 && inp.projection1 > 0) {
    runs.push(
      buildRun({
        id: "run1",
        widthFt: inp.width1,
        projectionFt: inp.projection1,
        originOffsetFt: 0,
        zOffsetFt: isHouseJog ? frontZFt - inp.projection1 : 0,
        postsQty: inp.posts1,
        postXsAbs: inp.postLayout?.xs1,
        postHeightFt: pivotHeight(inp.postHeight1),
        beamLengthFt: inp.beamLength1,
        beamType: inp.beamType1,
        beamEndCut: inp.beamEndCut1,
        hasWrap,
        wrapType: inp.wrapType,
        rafterTailsEnabled: hasWrap && inp.rafterTails,
        roofPitchDeg,
        roofType: opts.roofType,
        ribSpacingFt: opts.ribSpacingFt,
      })
    );
  }
  if (hasRun2) {
    runs.push(
      buildRun({
        id: "run2",
        widthFt: inp.width2,
        projectionFt: inp.projection2,
        originOffsetFt: inp.width1,
        zOffsetFt: isHouseJog ? frontZFt - inp.projection2 : 0,
        postsQty: inp.posts2,
        postXsAbs: inp.postLayout?.xs2,
        postHeightFt: pivotHeight(inp.postHeight2),
        beamLengthFt: inp.beamLength2,
        // A house-wall jog keeps one continuous front beam across both runs.
        beamType: isHouseJog ? inp.beamType1 : inp.beamType2,
        beamEndCut: isHouseJog ? inp.beamEndCut1 : inp.beamEndCut2 || inp.beamEndCut1,
        hasWrap,
        wrapType: inp.wrapType,
        rafterTailsEnabled: hasWrap && inp.rafterTails,
        roofPitchDeg,
        roofType: opts.roofType,
        ribSpacingFt: opts.ribSpacingFt,
      })
    );
  }

  const totalWidthFt = runs.length > 0 ? Math.max(...runs.map((r) => r.originOffsetFt + r.widthFt)) : 0;

  const multiSpanBeams: MultiSpanBeamConfig[] = (inp.beams ?? []).map((b, i) => ({
    id: `multi-${i}`,
    type: b.type,
    qty: b.qty,
    lengthFt: b.length,
    positionFromHouseFt: b.positionFromHouse,
    postsQty: b.posts,
    postHeightFt: b.postHeight,
    postXs: resolvePostXs(b.postXs, b.posts, 0, Math.max(inp.width1, b.length), computePostXPositions(b.length, b.posts)),
    runId: "run1",
    mountedOnSide: b.type.startsWith("double"),
  }));

  let rearBeam: RearBeamConfig | null = null;
  if (rearStyle && inp.rearBeamLength > 0 && totalWidthFt > 0) {
    const count = inp.mountStyle === "roof_mount" ? inp.skyliftPosts : inp.rearPosts;
    const pivot = pivotHeight(inp.postHeight1);
    const beamHeightFt = getBeamProfile(inp.rearBeamType).heightInches / 12;
    rearBeam = {
      type: inp.rearBeamType,
      xOffsetFt: Math.max(0, (totalWidthFt - inp.rearBeamLength) / 2),
      lengthFt: inp.rearBeamLength,
      zFt: BEAM_INSET_FT,
      topHeightFt: computeFrontEdgeHeightFt(pivot, BEAM_INSET_FT, roofPitchDeg) - beamHeightFt,
      postXs: resolvePostXs(inp.postLayout?.rearXs, count, 0, totalWidthFt, computePostXPositions(totalWidthFt, count)),
    };
  }

  return {
    productType: opts.productType,
    runs,
    multiSpanBeams,
    rearBeam,
    houseWall: !rearStyle,
    downspoutSide: inp.downspoutSide === "left" ? "left" : "right",
    jog,
    fanBeam: inp.fanBeamQty > 0 ? { qty: inp.fanBeamQty, lengthFt: inp.fanBeamLength } : null,
    gutterType: inp.gutterType,
    downspoutsQty: inp.downspouts,
    colors: {
      pans: inp.colorPans,
      gutterFascia: inp.colorGutterFascia,
      postsBeam: inp.colorPostsBeam,
      accent: cosmetic?.accentColor ?? inp.colorPostsBeam,
    },
    groundMount: inp.groundAttachment === "ground_mount",
    extras: {
      trim: cosmetic?.trim ?? { enabled: false, color: inp.colorGutterFascia },
      recessedLights: cosmetic?.recessedLights ?? { enabled: false, qty: 0 },
      shadeWalls: cosmetic?.shadeWalls ?? { enabled: false, sides: [] },
      dropDownShades: cosmetic?.dropDownShades ?? { enabled: false, sides: [] },
    },
    bboxFt: computeSceneBBox(
      runs.map((r) => ({
        widthFt: r.widthFt,
        projectionFt: r.projectionFt,
        postHeightFt: r.postHeightFt,
        originOffsetFt: r.originOffsetFt,
      }))
    ),
  };
}
