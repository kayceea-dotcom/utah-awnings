"use client";

import type { MultiSpanBeamConfig, RunConfig } from "@/lib/scene/types";
import { getBeamProfile } from "@/lib/scene/beamProfiles";
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
        const postHeightFt = b.postHeightFt || run.postHeightFt;
        const absoluteXs = b.postXs.map((x) => run.originOffsetFt + x);
        // Side-mounted ("double_*") beams don't add height to the post plate;
        // beams that bear on top extend the plate up to cover the beam too.
        const wrapBeamHeightFt = b.mountedOnSide ? 0 : getBeamProfile(b.type).heightInches / 12;

        return (
          <group key={b.id}>
            <Beam
              widthFt={b.lengthFt}
              xOffsetFt={run.originOffsetFt}
              heightFt={postHeightFt}
              zFt={b.positionFromHouseFt}
              colorName={colorName}
              beamType={b.type}
              mountedOnSide={b.mountedOnSide}
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
              />
            )}
          </group>
        );
      })}
    </>
  );
}
