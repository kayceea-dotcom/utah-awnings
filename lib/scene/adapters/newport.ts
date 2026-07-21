import type { NewportInputs } from "@/lib/pricing/types";
import type { RunConfig, MultiSpanBeamConfig, SceneConfig, CosmeticOverrides } from "../types";
import {
  BEAM_INSET_FT,
  STANDARD_ROOF_PITCH_DEG,
  computeFrontEdgeHeightFt,
  computePostXPositions,
  computeRafterTailXPositions,
  computeSceneBBox,
} from "../geometry";
import { getBeamProfile } from "../beamProfiles";

function buildRun(args: {
  id: "run1" | "run2";
  widthFt: number;
  projectionFt: number;
  originOffsetFt: number;
  postsQty: number;
  postHeightFt: number;
  beamLengthFt: number;
  beamType: string;
  beamEndCut: string;
  hasWrap: boolean;
  wrapType: string;
  rafterTailsEnabled: boolean;
  roofPitchDeg: number;
}): RunConfig {
  const beamZFt = Math.max(args.projectionFt - BEAM_INSET_FT, 0);
  const posts = computePostXPositions(args.widthFt, args.postsQty).map((x) => ({ x, z: beamZFt }));
  const rafterTails = args.rafterTailsEnabled
    ? { enabled: true, positions: computeRafterTailXPositions(args.widthFt).map((x) => ({ x, z: args.projectionFt })) }
    : { enabled: false, positions: [] };
  // The roof panel pivots at postHeightFt at the house wall and slopes down.
  // The panel RESTS ON TOP of the beam, which rests on top of the post — so
  // the post/beam-bottom height is the panel's height at the beam's distance
  // from the house, MINUS the beam's own thickness (leaving room for the
  // beam to sit under the panel instead of poking up through it).
  const panelHeightAtBeamFt = computeFrontEdgeHeightFt(args.postHeightFt, beamZFt, args.roofPitchDeg);
  const beamHeightFt = getBeamProfile(args.beamType).heightInches / 12;
  const postTopHeightFt = panelHeightAtBeamFt - beamHeightFt;

  return {
    id: args.id,
    widthFt: args.widthFt,
    projectionFt: args.projectionFt,
    originOffsetFt: args.originOffsetFt,
    roofType: "flat_pan",
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

export function newportToScene(inp: NewportInputs, cosmetic?: CosmeticOverrides): SceneConfig {
  const hasWrap = inp.wrapType !== "none";
  const roofPitchDeg = STANDARD_ROOF_PITCH_DEG;
  const runs: RunConfig[] = [];

  if (inp.width1 > 0 && inp.projection1 > 0) {
    runs.push(
      buildRun({
        id: "run1",
        widthFt: inp.width1,
        projectionFt: inp.projection1,
        originOffsetFt: 0,
        postsQty: inp.posts1,
        postHeightFt: inp.postHeight1,
        beamLengthFt: inp.beamLength1,
        beamType: inp.beamType1,
        beamEndCut: inp.beamEndCut1,
        hasWrap,
        wrapType: inp.wrapType,
        rafterTailsEnabled: hasWrap && inp.rafterTails,
        roofPitchDeg,
      })
    );
  }

  if (inp.width2 > 0 && inp.projection2 > 0) {
    runs.push(
      buildRun({
        id: "run2",
        widthFt: inp.width2,
        projectionFt: inp.projection2,
        originOffsetFt: inp.width1,
        postsQty: inp.posts2,
        postHeightFt: inp.postHeight2,
        beamLengthFt: inp.beamLength2,
        beamType: inp.beamType2 || inp.beamType1,
        beamEndCut: inp.beamEndCut2 || inp.beamEndCut1,
        hasWrap,
        wrapType: inp.wrapType,
        rafterTailsEnabled: hasWrap && inp.rafterTails,
        roofPitchDeg,
      })
    );
  }

  const multiSpanBeams: MultiSpanBeamConfig[] = (inp.beams ?? []).map((b, i) => ({
    id: `multi-${i}`,
    type: b.type,
    qty: b.qty,
    lengthFt: b.length,
    positionFromHouseFt: b.positionFromHouse,
    postsQty: b.posts,
    postHeightFt: b.postHeight,
    postXs: computePostXPositions(b.length, b.posts),
    runId: "run1",
    mountedOnSide: b.type.startsWith("double"),
  }));

  return {
    productType: "newport",
    runs,
    multiSpanBeams,
    fanBeam: inp.fanBeamQty > 0 ? { qty: inp.fanBeamQty, lengthFt: inp.fanBeamLength } : null,
    gutterType: inp.gutterType,
    downspoutsQty: inp.downspouts,
    colors: {
      pans: inp.colorPans,
      gutterFascia: inp.colorGutterFascia,
      postsBeam: inp.colorPostsBeam,
      accent: cosmetic?.accentColor ?? inp.colorPostsBeam,
    },
    groundMount: inp.groundMountPosts1 || inp.groundMountPosts2,
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
