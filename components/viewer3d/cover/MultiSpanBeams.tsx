"use client";

import type { MultiSpanBeamConfig, RunConfig } from "@/lib/scene/types";
import { getBeamProfile } from "@/lib/scene/beamProfiles";
import { computeFrontEdgeHeightFt, wrapColumnSizeFt } from "@/lib/scene/geometry";
import Beam from "./Beam";
import Posts from "./Posts";
import PostWrap from "./PostWrap";

interface MultiSpanBeamsProps {
  beams: MultiSpanBeamConfig[];
  runs: RunConfig[];
  colorName: string;
  hasWrap: boolean;
}

export default function MultiSpanBeams({ beams, runs, colorName, hasWrap }: MultiSpanBeamsProps) {
  return (
    <>
      {beams.map((b) => {
        const run = runs.find((r) => r.id === b.runId);
        if (!run) return null;
        const absoluteXs = b.postXs.map((x) => run.originOffsetFt + x);
        const beamHeightFt = getBeamProfile(b.type).heightInches / 12;
        // The beam holds the roof up from underneath, so its top is the roof's
        // height at its distance from the house (the roof slopes toward the front).
        const roofAtBeamFt = computeFrontEdgeHeightFt(run.postHeightFt, b.positionFromHouseFt, run.roofPitchDeg);
        // Side-mounted ("double_*") beams straddle the post top (the post ends at the
        // beam's centre); beams that bear on top sit on the post, which ends at the beam's underside.
        const postHeightFt = b.mountedOnSide ? roofAtBeamFt - beamHeightFt / 2 : roofAtBeamFt - beamHeightFt;
        // Side-mounted ("double_*") beams don't add height to the post plate;
        // beams that bear on top extend the plate up to cover the beam too.
        const wrapBeamHeightFt = b.mountedOnSide ? 0 : beamHeightFt;

        return (
          <group key={b.id} position={[0, 0, run.zOffsetFt]}>
            <Beam
              widthFt={b.lengthFt}
              xOffsetFt={run.originOffsetFt}
              heightFt={postHeightFt}
              zFt={b.positionFromHouseFt}
              colorName={colorName}
              beamType={b.type}
              mountedOnSide={b.mountedOnSide}
              profileOverride={hasWrap && wrapColumnSizeFt(run.wrapType)
                ? { widthInches: wrapColumnSizeFt(run.wrapType) * 12, heightInches: beamHeightFt * 12 }
                : undefined}
            />
            {b.postsQty > 0 && (
              <Posts xs={absoluteXs} zFt={b.positionFromHouseFt} heightFt={postHeightFt} colorName={colorName} />
            )}
            {hasWrap && b.postsQty > 0 && (
              <PostWrap
                xs={absoluteXs}
                zFt={b.positionFromHouseFt}
                postHeightFt={postHeightFt}
                beamHeightFt={wrapBeamHeightFt}
                colorName={colorName}
                sizeFt={wrapColumnSizeFt(run.wrapType) || undefined}
              />
            )}
          </group>
        );
      })}
    </>
  );
}
