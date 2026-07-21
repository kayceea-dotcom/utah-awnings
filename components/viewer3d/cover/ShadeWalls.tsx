"use client";

import { getMaterial } from "@/lib/scene/colors";

const WALL_THICKNESS_FT = 0.05;

interface ShadeWallsProps {
  sides: ("left" | "right" | "back")[];
  totalWidthFt: number;
  depthFt: number;
  heightFt: number;
  colorName: string;
}

// Cosmetic-only — no "shade walls" field exists on NewportInputs yet.
export default function ShadeWalls({ sides, totalWidthFt, depthFt, heightFt, colorName }: ShadeWallsProps) {
  const material = getMaterial(colorName, { roughness: 0.7 });
  return (
    <>
      {sides.includes("left") && (
        <mesh position={[0, heightFt / 2, depthFt / 2]} material={material}>
          <boxGeometry args={[WALL_THICKNESS_FT, heightFt, depthFt]} />
        </mesh>
      )}
      {sides.includes("right") && (
        <mesh position={[totalWidthFt, heightFt / 2, depthFt / 2]} material={material}>
          <boxGeometry args={[WALL_THICKNESS_FT, heightFt, depthFt]} />
        </mesh>
      )}
      {sides.includes("back") && (
        <mesh position={[totalWidthFt / 2, heightFt / 2, depthFt]} material={material}>
          <boxGeometry args={[totalWidthFt, heightFt, WALL_THICKNESS_FT]} />
        </mesh>
      )}
    </>
  );
}
