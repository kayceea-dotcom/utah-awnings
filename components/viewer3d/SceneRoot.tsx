"use client";

import type { SceneConfig } from "@/lib/scene/types";
import CoverAssembly from "./cover/CoverAssembly";

export default function SceneRoot({ scene, showDimensions }: { scene: SceneConfig; showDimensions?: boolean }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 8]} intensity={1} />
      <gridHelper args={[40, 40]} />
      <CoverAssembly scene={scene} showDimensions={showDimensions} />
    </>
  );
}
