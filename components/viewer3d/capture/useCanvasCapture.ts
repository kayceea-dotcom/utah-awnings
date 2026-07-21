"use client";

import { useCallback } from "react";
import { useThree } from "@react-three/fiber";

export function useCanvasCapture() {
  const { gl, scene, camera } = useThree();

  return useCallback(
    (pixelRatioOverride = 2) => {
      const prevRatio = gl.getPixelRatio();
      gl.setPixelRatio(pixelRatioOverride);
      gl.render(scene, camera);
      const dataUrl = gl.domElement.toDataURL("image/png");
      gl.setPixelRatio(prevRatio);
      return dataUrl;
    },
    [gl, scene, camera]
  );
}
