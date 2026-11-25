"use client";

import * as THREE from "three";
import type { RunConfig } from "@/lib/scene/types";

const WALL_THICKNESS_FT = 0.5;
const WALL_OVERHANG_FT = 2; // wall extends past the cover on both ends
const WALL_ABOVE_ROOF_FT = 3;

const wallMaterial = new THREE.MeshStandardMaterial({ color: "#cfc3ae", roughness: 0.95, metalness: 0 });

// The house the cover attaches to - just a plain wall slab behind each run's
// house edge (stepped when a house-wall jog steps the wall), so the model reads
// as an awning against a house instead of floating in space.
export default function HouseWall({ runs }: { runs: RunConfig[] }) {
  return (
    <>
      {runs.map((run, i) => {
        const left = run.originOffsetFt - (i === 0 ? WALL_OVERHANG_FT : 0);
        const right = run.originOffsetFt + run.widthFt + (i === runs.length - 1 ? WALL_OVERHANG_FT : 0);
        const height = run.postHeightFt + WALL_ABOVE_ROOF_FT;
        return (
          <mesh
            key={run.id}
            position={[(left + right) / 2, height / 2, run.zOffsetFt - WALL_THICKNESS_FT / 2 - 0.02]}
            material={wallMaterial}
          >
            <boxGeometry args={[right - left, height, WALL_THICKNESS_FT]} />
          </mesh>
        );
      })}
    </>
  );
}
