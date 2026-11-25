"use client";

import type { SceneConfig, RunConfig } from "@/lib/scene/types";
import { computeFrontEdgeHeightFt, wrapColumnSizeFt, ROOF_PANEL_THICKNESS_FT } from "@/lib/scene/geometry";
import { getBeamProfile } from "@/lib/scene/beamProfiles";
import Posts from "./Posts";
import Beam from "./Beam";
import RoofPanel from "./RoofPanel";
import MultiSpanBeams from "./MultiSpanBeams";
import Gutter, { getGutterTopY, getGutterDepthFt } from "./Gutter";
import FrontPlate from "./FrontPlate";
import SideFascia, { SIDE_FASCIA_HEIGHT_FT } from "./SideFascia";
import RafterTails, { tailStyleFor } from "./RafterTails";
import FanBeam from "./FanBeam";
import PostWrap from "./PostWrap";
import SidePlates from "./SidePlates";
import Downspouts from "./Downspouts";
import Trim from "./Trim";
import RecessedLights from "./RecessedLights";
import ShadeWalls from "./ShadeWalls";
import DropDownShades from "./DropDownShades";
import DimensionOverlay from "./DimensionOverlay";
import HouseWall from "./HouseWall";

// Downspouts hang just inside each end of the front.
const DOWNSPOUT_END_INSET_FT = 0.4;

// With a wrap kit the beam is boxed in the same mitered plate as the posts, so
// its face is as deep as the finished column and flush with it.
function wrapProfile(beamType: string, wrapType: string) {
  const column = wrapColumnSizeFt(wrapType);
  if (!column) return undefined;
  return { widthInches: column * 12, heightInches: getBeamProfile(beamType).heightInches };
}

function frontEdgeHeight(run: RunConfig): number {
  return computeFrontEdgeHeightFt(run.postHeightFt, run.projectionFt, run.roofPitchDeg);
}

export default function CoverAssembly({ scene, showDimensions }: { scene: SceneConfig; showDimensions?: boolean }) {
  const totalWidthFt = scene.bboxFt.widthFt;
  // Where the front of the cover sits - in a house-wall jog the runs' house edges
  // step but the front stays flush, so it's the same for both runs.
  const frontZFt = scene.runs.length > 0 ? Math.max(...scene.runs.map((r) => r.zOffsetFt + r.projectionFt)) : 0;
  // Front-mounted trim (gutter, fascia, front plate, downspouts, etc.) sits at
  // the roof's FRONT edge, which is lower than the post height once the roof
  // pitch is applied — not at the flat post height itself.
  const roofHeightFt = scene.runs.length > 0 ? Math.max(...scene.runs.map(frontEdgeHeight)) : 0;
  // A ground/deck jog steps the FRONT, so each run gets its own gutter at its own front edge.
  const steppedFront = scene.jog === "ground" && scene.runs.length > 1;
  const frontRuns = steppedFront
    ? scene.runs.map((r) => ({ xOffsetFt: r.originOffsetFt, widthFt: r.widthFt, zFt: r.zOffsetFt + r.projectionFt, heightFt: frontEdgeHeight(r) + ROOF_PANEL_THICKNESS_FT }))
    : scene.runs.length > 0
      ? [{ xOffsetFt: 0, widthFt: totalWidthFt, zFt: frontZFt, heightFt: roofHeightFt + ROOF_PANEL_THICKNESS_FT }]
      : [];

  const downspoutXs =
    scene.downspoutsQty <= 0 || totalWidthFt <= 0
      ? []
      : scene.downspoutsQty === 1
        ? [scene.downspoutSide === "left" ? DOWNSPOUT_END_INSET_FT : totalWidthFt - DOWNSPOUT_END_INSET_FT]
        : [DOWNSPOUT_END_INSET_FT, totalWidthFt - DOWNSPOUT_END_INSET_FT];
  const downspouts = downspoutXs.map((x) => {
    const run = scene.runs.find((r) => x >= r.originOffsetFt - 0.001 && x <= r.originOffsetFt + r.widthFt + 0.001) ?? scene.runs[0];
    return { x, zFt: run.zOffsetFt + run.projectionFt, heightFt: frontEdgeHeight(run) + ROOF_PANEL_THICKNESS_FT };
  });
  const firstRun = scene.runs[0];

  return (
    <>
      {scene.houseWall && <HouseWall runs={scene.runs} />}
      {scene.runs.map((run) => (
        <group key={run.id} position={[0, 0, run.zOffsetFt]}>
          <RoofPanel run={run} colorName={scene.colors.pans} />
          {run.hasBeam && (
            <Beam
              widthFt={run.widthFt}
              xOffsetFt={run.originOffsetFt}
              heightFt={run.postTopHeightFt}
              zFt={run.beamZFt}
              colorName={scene.colors.postsBeam}
              beamType={run.beamType}
              profileOverride={wrapProfile(run.beamType, run.hasWrap ? run.wrapType : "none")}
            />
          )}
          <Posts
            xs={run.posts.map((p) => run.originOffsetFt + p.x)}
            zFt={run.beamZFt}
            heightFt={run.postTopHeightFt}
            colorName={scene.colors.postsBeam}
          />
          {run.hasWrap && (
            <PostWrap
              xs={run.posts.map((p) => run.originOffsetFt + p.x)}
              zFt={run.beamZFt}
              postHeightFt={run.postTopHeightFt}
              beamHeightFt={run.hasBeam ? getBeamProfile(run.beamType).heightInches / 12 : 0}
              colorName={scene.colors.postsBeam}
              sizeFt={wrapColumnSizeFt(run.wrapType) || undefined}
            />
          )}
          {run.rafterTails.enabled && (
            // The tails are the roof's own rafters poking out, so they tilt with it.
            <group position={[0, run.postHeightFt, 0]} rotation={[(run.roofPitchDeg * Math.PI) / 180, 0, 0]}>
              <RafterTails
                xs={run.rafterTails.positions.map((p) => run.originOffsetFt + p.x)}
                zFt={run.projectionFt}
                heightFt={ROOF_PANEL_THICKNESS_FT}
                colorName={scene.colors.postsBeam}
                style={tailStyleFor(run.beamEndCut)}
              />
            </group>
          )}
          {showDimensions && <DimensionOverlay run={run} />}
        </group>
      ))}

      <MultiSpanBeams
        beams={scene.multiSpanBeams}
        runs={scene.runs}
        colorName={scene.colors.postsBeam}
        hasWrap={scene.runs[0]?.hasWrap ?? false}
      />

      {scene.rearBeam && (
        <group>
          <Beam
            widthFt={scene.rearBeam.lengthFt}
            xOffsetFt={scene.rearBeam.xOffsetFt}
            heightFt={scene.rearBeam.topHeightFt}
            zFt={scene.rearBeam.zFt}
            colorName={scene.colors.postsBeam}
            beamType={scene.rearBeam.type}
            profileOverride={wrapProfile(scene.rearBeam.type, firstRun?.hasWrap ? firstRun.wrapType : "none")}
          />
          <Posts xs={scene.rearBeam.postXs} zFt={scene.rearBeam.zFt} heightFt={scene.rearBeam.topHeightFt} colorName={scene.colors.postsBeam} />
          {firstRun?.hasWrap && (
            <PostWrap
              xs={scene.rearBeam.postXs}
              zFt={scene.rearBeam.zFt}
              postHeightFt={scene.rearBeam.topHeightFt}
              beamHeightFt={getBeamProfile(scene.rearBeam.type).heightInches / 12}
              colorName={scene.colors.postsBeam}
              sizeFt={wrapColumnSizeFt(firstRun.wrapType) || undefined}
            />
          )}
        </group>
      )}

      {firstRun?.hasWrap && (
        // Side trim follows the roof's slope (hung off its top edge), not a level line.
        <group position={[0, firstRun.postHeightFt, firstRun.zOffsetFt]} rotation={[(firstRun.roofPitchDeg * Math.PI) / 180, 0, 0]}>
          <SidePlates
            xLeftFt={firstRun.originOffsetFt}
            xRightFt={firstRun.originOffsetFt + firstRun.widthFt}
            projectionFt={firstRun.projectionFt}
            topYFt={
              scene.gutterType === "extruded"
                ? ROOF_PANEL_THICKNESS_FT - SIDE_FASCIA_HEIGHT_FT
                : getGutterTopY(ROOF_PANEL_THICKNESS_FT)
            }
            wrapType={firstRun.wrapType}
            colorName={scene.colors.postsBeam}
          />
        </group>
      )}

      {frontRuns.map((f, i) => (
        <group key={"front" + i}>
          <Gutter
            totalWidthFt={f.widthFt}
            xOffsetFt={f.xOffsetFt}
            zFt={f.zFt}
            heightFt={f.heightFt}
            colorName={scene.colors.gutterFascia}
            gutterType={scene.gutterType}
          />
          {firstRun?.hasWrap && scene.gutterType === "extruded" && (
            <FrontPlate
              totalWidthFt={f.widthFt}
              xOffsetFt={f.xOffsetFt}
              gutterOuterZFt={f.zFt + getGutterDepthFt("extruded") / 2}
              topYFt={getGutterTopY(f.heightFt)}
              wrapType={firstRun.wrapType}
              colorName={scene.colors.gutterFascia}
            />
          )}
        </group>
      ))}
      {firstRun && scene.gutterType === "extruded" && (
        <group position={[0, firstRun.postHeightFt, firstRun.zOffsetFt]} rotation={[(firstRun.roofPitchDeg * Math.PI) / 180, 0, 0]}>
          <SideFascia
            xLeftFt={firstRun.originOffsetFt}
            xRightFt={firstRun.originOffsetFt + firstRun.widthFt}
            projectionFt={firstRun.projectionFt}
            heightFt={ROOF_PANEL_THICKNESS_FT}
            colorName={scene.colors.gutterFascia}
          />
        </group>
      )}

      {downspouts.map((d, i) => (
        <Downspouts key={"ds" + i} xs={[d.x]} zFt={d.zFt} heightFt={d.heightFt} colorName={scene.colors.gutterFascia} />
      ))}

      {scene.fanBeam && firstRun && (
        <FanBeam
          qty={scene.fanBeam.qty}
          lengthFt={scene.fanBeam.lengthFt}
          run={firstRun}
          colorName={scene.colors.postsBeam}
        />
      )}

      {scene.extras.trim.enabled && scene.runs.length > 0 && (
        <Trim totalWidthFt={totalWidthFt} zFt={frontZFt} heightFt={roofHeightFt} colorName={scene.extras.trim.color} />
      )}
      {scene.extras.recessedLights.enabled && scene.runs.length > 0 && (
        <RecessedLights
          qty={scene.extras.recessedLights.qty}
          totalWidthFt={totalWidthFt}
          depthFt={frontZFt}
          heightFt={roofHeightFt}
        />
      )}
      {scene.extras.shadeWalls.enabled && scene.runs.length > 0 && (
        <ShadeWalls
          sides={scene.extras.shadeWalls.sides}
          totalWidthFt={totalWidthFt}
          depthFt={frontZFt}
          heightFt={roofHeightFt}
          colorName={scene.colors.accent}
        />
      )}
      {scene.extras.dropDownShades.enabled && scene.runs.length > 0 && (
        <DropDownShades
          sides={scene.extras.dropDownShades.sides}
          totalWidthFt={totalWidthFt}
          depthFt={frontZFt}
          heightFt={roofHeightFt}
        />
      )}
    </>
  );
}
