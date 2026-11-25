"use client";

import type { RunConfig } from "@/lib/scene/types";
import { getMaterial } from "@/lib/scene/colors";
import { ROOF_PANEL_THICKNESS_FT } from "@/lib/scene/geometry";

const THICKNESS_FT = ROOF_PANEL_THICKNESS_FT;
const RIB_HEIGHT_FT = 0.14;
const RIB_WIDTH_FT = 0.07;

interface RoofPanelProps {
  run: RunConfig;
  colorName: string;
}

export default function RoofPanel({ run, colorName }: RoofPanelProps) {
  const material = getMaterial(colorName, { roughness: 0.45, metalness: 0.05 });
  const pitchRad = (run.roofPitchDeg * Math.PI) / 180;

  // Rotate about the house-wall edge so the front (outer) edge slopes DOWN,
  // away from the house, matching real drainage direction and the fixed
  // slope set in STANDARD_ROOF_PITCH_DEG.
  // V-Panel: a raised rib where each panel meets the next, running house to front.
  const ribXs: number[] = [];
  if (run.ribSpacingFt && run.ribSpacingFt > 0) {
    for (let x = run.ribSpacingFt; x < run.widthFt - 0.01; x += run.ribSpacingFt) ribXs.push(x - run.widthFt / 2);
  }

  return (
    <group position={[run.originOffsetFt + run.widthFt / 2, run.postHeightFt, 0]} rotation={[pitchRad, 0, 0]}>
      <mesh position={[0, THICKNESS_FT / 2, run.projectionFt / 2]} material={material}>
        <boxGeometry args={[run.widthFt, THICKNESS_FT, run.projectionFt]} />
      </mesh>
      {ribXs.map((x, i) => (
        <mesh key={i} position={[x, THICKNESS_FT + RIB_HEIGHT_FT / 2, run.projectionFt / 2]} material={material}>
          <boxGeometry args={[RIB_WIDTH_FT, RIB_HEIGHT_FT, run.projectionFt]} />
        </mesh>
      ))}
    </group>
  );
}
