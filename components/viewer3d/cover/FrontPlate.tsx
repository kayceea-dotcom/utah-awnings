"use client";

import { getMaterial } from "@/lib/scene/colors";

// Same wrap kit material as SidePlates/PostWrap — "2x6" or "3x8" depending
// on the wrap type selected, per the "Front Plate Gutter" pricing line item.
const FRONT_PLATE_PROFILES: Record<string, { thicknessInches: number; heightInches: number }> = {
  "2x6": { thicknessInches: 2, heightInches: 6 },
  "3x8": { thicknessInches: 3, heightInches: 8 },
};

interface FrontPlateProps {
  totalWidthFt: number;
  gutterOuterZFt: number; // Z of the gutter's outer (forward-facing) face
  topYFt: number; // attaches at the gutter's height, extending down
  wrapType: string;
  colorName: string;
}

// Matches the "Front Plate Gutter" pricing line item — a board spanning the
// full width, mounted to the OUTSIDE (forward) face of the gutter (order
// front-to-back is panel -> gutter -> front plate -> rafter tail). Only
// needed with an extruded gutter (a roll-form gutter is tall enough to serve
// as its own front plate).
export default function FrontPlate({ totalWidthFt, gutterOuterZFt, topYFt, wrapType, colorName }: FrontPlateProps) {
  const material = getMaterial(colorName, { roughness: 0.5 });
  const profile = FRONT_PLATE_PROFILES[wrapType] ?? FRONT_PLATE_PROFILES["2x6"];
  const heightFt = profile.heightInches / 12;
  const thicknessFt = profile.thicknessInches / 12;
  return (
    <mesh position={[totalWidthFt / 2, topYFt - heightFt / 2, gutterOuterZFt + thicknessFt / 2]} material={material}>
      <boxGeometry args={[totalWidthFt, heightFt, thicknessFt]} />
    </mesh>
  );
}
