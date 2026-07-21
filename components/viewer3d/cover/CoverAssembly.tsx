"use client";

import type { SceneConfig } from "@/lib/scene/types";
import { computeDownspoutXPositions, computeFrontEdgeHeightFt } from "@/lib/scene/geometry";
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

export default function CoverAssembly({ scene, showDimensions }: { scene: SceneConfig; showDimensions?: boolean }) {
  const totalWidthFt = scene.bboxFt.widthFt;
  const frontZFt = scene.runs.length > 0 ? Math.max(...scene.runs.map((r) => r.projectionFt)) : 0;
  // Front-mounted trim (gutter, fascia, front plate, downspouts, etc.) sits at
  // the roof's FRONT edge, which is lower than the post height once the roof
  // pitch is applied — not at the flat post height itself.
  const roofHeightFt =
    scene.runs.length > 0
      ? Math.max(...scene.runs.map((r) => computeFrontEdgeHeightFt(r.postHeightFt, r.projectionFt, r.roofPitchDeg)))
      : 0;
  const downspoutXs = computeDownspoutXPositions(totalWidthFt, scene.downspoutsQty);

  return (
    <>
      {scene.runs.map((run) => (
        <group key={run.id}>
          <RoofPanel run={run} colorName={scene.colors.pans} />
          <Beam
            widthFt={run.widthFt}
            xOffsetFt={run.originOffsetFt}
            heightFt={run.postTopHeightFt}
            zFt={run.beamZFt}
            colorName={scene.colors.postsBeam}
            beamType={run.beamType}
          />
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
              beamHeightFt={getBeamProfile(run.beamType).heightInches / 12}
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

      {scene.runs[0]?.hasWrap && (
        <SidePlates
          xLeftFt={scene.runs[0].originOffsetFt}
          xRightFt={scene.runs[0].originOffsetFt + scene.runs[0].widthFt}
          projectionFt={scene.runs[0].projectionFt}
          topYFt={
            scene.gutterType === "extruded" ? roofHeightFt - SIDE_FASCIA_HEIGHT_FT : getGutterTopY(roofHeightFt)
          }
          wrapType={scene.runs[0].wrapType}
          colorName={scene.colors.postsBeam}
        />
      )}

      {scene.runs.length > 0 && (
        <Gutter
          totalWidthFt={totalWidthFt}
          zFt={frontZFt}
          heightFt={roofHeightFt}
          colorName={scene.colors.gutterFascia}
          gutterType={scene.gutterType}
        />
      )}
      {scene.runs[0]?.hasWrap && scene.gutterType === "extruded" && (
        <FrontPlate
          totalWidthFt={totalWidthFt}
          gutterOuterZFt={frontZFt + getGutterDepthFt("extruded") / 2}
          topYFt={getGutterTopY(roofHeightFt)}
          wrapType={scene.runs[0].wrapType}
          colorName={scene.colors.gutterFascia}
        />
      )}
      {scene.runs[0] && scene.gutterType === "extruded" && (
        <SideFascia
          xLeftFt={scene.runs[0].originOffsetFt}
          xRightFt={scene.runs[0].originOffsetFt + scene.runs[0].widthFt}
          projectionFt={scene.runs[0].projectionFt}
          heightFt={roofHeightFt}
          colorName={scene.colors.gutterFascia}
        />
      )}

      <Downspouts xs={downspoutXs} zFt={frontZFt} heightFt={roofHeightFt} colorName={scene.colors.gutterFascia} />

      {scene.fanBeam && scene.runs[0] && (
        <FanBeam
          qty={scene.fanBeam.qty}
          lengthFt={scene.fanBeam.lengthFt}
          run={scene.runs[0]}
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
