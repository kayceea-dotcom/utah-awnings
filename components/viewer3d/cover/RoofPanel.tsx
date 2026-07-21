"use client";

import type { RunConfig } from "@/lib/scene/types";
import { getMaterial } from "@/lib/scene/colors";

const THICKNESS_FT = 0.08;

interface RoofPanelProps {
  run: RunConfig;
  colorName: string;
}

export default function RoofPanel({ run, colorName }: RoofPanelProps) {
  const material = getMaterial(colorName, { roughness: 0.4, metalness: 0.3 });
  const pitchRad = (run.roofPitchDeg * Math.PI) / 180;

  // Rotate about the house-wall edge so the front (outer) edge slopes DOWN,
  // away from the house, matching real drainage direction and the fixed
  // slope set in STANDARD_ROOF_PITCH_DEG.
  return (
    <group position={[run.originOffsetFt + run.widthFt / 2, run.postHeightFt, 0]} rotation={[pitchRad, 0, 0]}>
      <mesh position={[0, THICKNESS_FT / 2, run.projectionFt / 2]} material={material}>
        <boxGeometry args={[run.widthFt, THICKNESS_FT, run.projectionFt]} />
      </mesh>
    </group>
  );
}
