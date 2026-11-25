"use client";

import type { SceneConfig, RunConfig } from "@/lib/scene/types";
import { computeFrontEdgeHeightFt } from "@/lib/scene/geometry";
import { getBeamProfile } from "@/lib/scene/beamProfiles";
import Posts from "./Posts";
import Beam from "./Beam";
import RoofPanel from "./RoofPanel";
import MultiSpanBeams from "./MultiSpanBeams";
import Gutter, { getGutterTopY, getGutterDepthFt } from "./Gutter";
import FrontPlate from "./FrontPlate";
import SideFascia, { SIDE_FASCIA_HEIGHT_FT } from "./SideFascia";
import RafterTails from "./RafterTails";
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
    ? scene.runs.map((r) => ({ xOffsetFt: r.originOffsetFt, widthFt: r.widthFt, zFt: r.zOffsetFt + r.projectionFt, heightFt: frontEdgeHeight(r) }))
    : scene.runs.length > 0
      ? [{ xOffsetFt: 0, widthFt: totalWidthFt, zFt: frontZFt, heightFt: roofHeightFt }]
      : [];

  const downspoutXs =
    scene.downspoutsQty <= 0 || totalWidthFt <= 0
      ? []
      : scene.downspoutsQty === 1
        ? [scene.downspoutSide === "left" ? DOWNSPOUT_END_INSET_FT : totalWidthFt - DOWNSPOUT_END_INSET_FT]
        : [DOWNSPOUT_END_INSET_FT, totalWidthFt - DOWNSPOUT_END_INSET_FT];
  const downspouts = downspoutXs.map((x) => {
    const run = scene.runs.find((r) => x >= r.originOffsetFt - 0.001 && x <= r.originOffsetFt + r.widthFt + 0.001) ?? scene.runs[0];
    return { x, zFt: run.zOffsetFt + run.projectionFt, heightFt: frontEdgeHeight(run) };
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
            />
          )}
          {run.rafterTails.enabled && (
            <RafterTails
              xs={run.rafterTails.positions.map((p) => run.originOffsetFt + p.x)}
              zFt={run.projectionFt}
              heightFt={computeFrontEdgeHeightFt(run.postHeightFt, run.projectionFt, run.roofPitchDeg)}
              colorName={scene.colors.postsBeam}
            />
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
          />
          <Posts xs={scene.rearBeam.postXs} zFt={scene.rearBeam.zFt} heightFt={scene.rearBeam.topHeightFt} colorName={scene.colors.postsBeam} />
          {firstRun?.hasWrap && (
            <PostWrap
              xs={scene.rearBeam.postXs}
              zFt={scene.rearBeam.zFt}
              postHeightFt={scene.rearBeam.topHeightFt}
              beamHeightFt={getBeamProfile(scene.rearBeam.type).heightInches / 12}
              colorName={scene.colors.postsBeam}
            />
          )}
        </group>
      )}

      {firstRun?.hasWrap && (
        <group position={[0, 0, firstRun.zOffsetFt]}>
          <SidePlates
            xLeftFt={firstRun.originOffsetFt}
            xRightFt={firstRun.originOffsetFt + firstRun.widthFt}
            projectionFt={firstRun.projectionFt}
            topYFt={
              scene.gutterType === "extruded" ? roofHeightFt - SIDE_FASCIA_HEIGHT_FT : getGutterTopY(roofHeightFt)
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
        <group position={[0, 0, firstRun.zOffsetFt]}>
          <SideFascia
            xLeftFt={firstRun.originOffsetFt}
            xRightFt={firstRun.originOffsetFt + firstRun.widthFt}
            projectionFt={firstRun.projectionFt}
            heightFt={roofHeightFt}
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
