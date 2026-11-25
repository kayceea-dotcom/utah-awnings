"use client";

import type { SceneConfig } from "@/lib/scene/types";
import CoverAssembly from "./cover/CoverAssembly";

export default function SceneRoot({ scene, showDimensions }: { scene: SceneConfig; showDimensions?: boolean }) {
  return (
    <>
      <ambientLight intensity={0.9} />
      <hemisphereLight args={["#ffffff", "#9ca3af", 0.6]} />
      <directionalLight position={[10, 15, 8]} intensity={1.1} />
      <directionalLight position={[-8, 6, -6]} intensity={0.4} />
      <gridHelper args={[40, 40]} />
      <CoverAssembly scene={scene} showDimensions={showDimensions} />
    </>
  );
}
