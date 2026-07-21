"use client";

import * as THREE from "three";
import { useMemo } from "react";

const SHADE_DROP_RATIO = 0.6; // fraction of post height the shade appears extended

interface DropDownShadesProps {
  sides: ("front" | "left" | "right")[];
  totalWidthFt: number;
  depthFt: number;
  heightFt: number;
}

// Cosmetic-only — no "drop-down shades" field exists on NewportInputs yet.
export default function DropDownShades({ sides, totalWidthFt, depthFt, heightFt }: DropDownShadesProps) {
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#d1d5db", transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    []
  );
  const dropFt = heightFt * SHADE_DROP_RATIO;

  return (
    <>
      {sides.includes("front") && (
        <mesh position={[totalWidthFt / 2, heightFt - dropFt / 2, depthFt]} material={material}>
          <planeGeometry args={[totalWidthFt, dropFt]} />
        </mesh>
      )}
      {sides.includes("left") && (
        <mesh position={[0, heightFt - dropFt / 2, depthFt / 2]} rotation={[0, Math.PI / 2, 0]} material={material}>
          <planeGeometry args={[depthFt, dropFt]} />
        </mesh>
      )}
      {sides.includes("right") && (
        <mesh
          position={[totalWidthFt, heightFt - dropFt / 2, depthFt / 2]}
          rotation={[0, Math.PI / 2, 0]}
          material={material}
        >
          <planeGeometry args={[depthFt, dropFt]} />
        </mesh>
      )}
    </>
  );
}
