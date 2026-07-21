"use client";

import { getMaterial } from "@/lib/scene/colors";

const TRIM_HEIGHT_FT = 0.15;
const TRIM_THICKNESS_FT = 0.05;

interface TrimProps {
  totalWidthFt: number;
  zFt: number;
  heightFt: number;
  colorName: string;
}

// Cosmetic-only — no "trim" field exists on NewportInputs yet.
export default function Trim({ totalWidthFt, zFt, heightFt, colorName }: TrimProps) {
  const material = getMaterial(colorName, { roughness: 0.4 });
  return (
    <mesh position={[totalWidthFt / 2, heightFt + TRIM_HEIGHT_FT / 2, zFt]} material={material}>
      <boxGeometry args={[totalWidthFt, TRIM_HEIGHT_FT, TRIM_THICKNESS_FT]} />
    </mesh>
  );
}
