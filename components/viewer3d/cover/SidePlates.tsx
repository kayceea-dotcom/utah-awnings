"use client";

import { getMaterial } from "@/lib/scene/colors";

// Side plate material follows the wrap kit selection — "2x6" (2" x 6") or
// "3x8" (3" x 8") — the same two options used for post plates and the front
// plate, per the "Sideplates Cut One Side" pricing line item.
const SIDE_PLATE_PROFILES: Record<string, { thicknessInches: number; heightInches: number }> = {
  "2x6": { thicknessInches: 2, heightInches: 6 },
  "3x8": { thicknessInches: 3, heightInches: 8 },
};

interface SidePlatesProps {
  xLeftFt: number;
  xRightFt: number;
  projectionFt: number;
  topYFt: number; // attaches directly under the side fascia (or gutter, if no separate fascia)
  wrapType: string;
  colorName: string;
}

// Not a cap sitting on top of the beam — a board that closes off the side of
// the roof, running the full projection depth from the beam up to the
// underside of the side fascia (matching how the front plate closes off the
// front, under the gutter).
export default function SidePlates({ xLeftFt, xRightFt, projectionFt, topYFt, wrapType, colorName }: SidePlatesProps) {
  const material = getMaterial(colorName, { roughness: 0.5 });
  const profile = SIDE_PLATE_PROFILES[wrapType] ?? SIDE_PLATE_PROFILES["2x6"];
  const heightFt = profile.heightInches / 12;
  const thicknessFt = profile.thicknessInches / 12;
  const centerY = topYFt - heightFt / 2;
  return (
    <>
      <mesh position={[xLeftFt, centerY, projectionFt / 2]} material={material}>
        <boxGeometry args={[thicknessFt, heightFt, projectionFt]} />
      </mesh>
      <mesh position={[xRightFt, centerY, projectionFt / 2]} material={material}>
        <boxGeometry args={[thicknessFt, heightFt, projectionFt]} />
      </mesh>
    </>
  );
}
