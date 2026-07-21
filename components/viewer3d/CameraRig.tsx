"use client";

import { forwardRef, useImperativeHandle, useRef, useLayoutEffect, type ElementRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { BBox } from "@/lib/scene/types";

export type ViewPreset = "front" | "back" | "left" | "right" | "top" | "iso" | "reset";

export interface CameraRigHandle {
  setView: (preset: ViewPreset) => void;
}

interface CameraRigProps {
  bbox: BBox;
}

function getPresetOffset(preset: ViewPreset, bbox: BBox): THREE.Vector3 {
  const { widthFt, depthFt, heightFt } = bbox;
  const dist = Math.max(widthFt, depthFt, heightFt, 6) * 1.6;
  switch (preset) {
    case "front":
      return new THREE.Vector3(0, heightFt * 0.6, dist);
    case "back":
      return new THREE.Vector3(0, heightFt * 0.6, -dist);
    case "left":
      return new THREE.Vector3(-dist, heightFt * 0.6, 0);
    case "right":
      return new THREE.Vector3(dist, heightFt * 0.6, 0);
    case "top":
      return new THREE.Vector3(0, dist * 1.2, 0.001);
    case "iso":
    case "reset":
    default:
      return new THREE.Vector3(dist * 0.6, dist * 0.6, dist * 0.8);
  }
}

const CameraRig = forwardRef<CameraRigHandle, CameraRigProps>(function CameraRig({ bbox }, ref) {
  const controlsRef = useRef<ElementRef<typeof OrbitControls>>(null);
  const { camera } = useThree();

  const target = new THREE.Vector3(bbox.widthFt / 2, bbox.heightFt / 2, bbox.depthFt / 2);

  const setView = (preset: ViewPreset) => {
    const offset = getPresetOffset(preset, bbox);
    camera.position.set(target.x + offset.x, offset.y, target.z + offset.z);
    camera.lookAt(target);
    controlsRef.current?.target.copy(target);
    controlsRef.current?.update();
  };

  useImperativeHandle(ref, () => ({ setView }), [bbox.widthFt, bbox.depthFt, bbox.heightFt]);

  // Auto-fit only when the scene's actual dimensions change — never on
  // color/cosmetic edits — so it doesn't fight a user who has manually orbited.
  useLayoutEffect(() => {
    setView("iso");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bbox.widthFt, bbox.depthFt, bbox.heightFt]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      target={[target.x, target.y, target.z]}
    />
  );
});

export default CameraRig;
