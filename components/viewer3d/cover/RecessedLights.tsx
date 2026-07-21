"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { Instances, Instance } from "@react-three/drei";

const LIGHT_RADIUS_FT = 0.15;

interface RecessedLightsProps {
  qty: number;
  totalWidthFt: number;
  depthFt: number;
  heightFt: number;
}

// Cosmetic-only — no "recessed lights" field exists on NewportInputs yet.
export default function RecessedLights({ qty, totalWidthFt, depthFt, heightFt }: RecessedLightsProps) {
  const geometry = useMemo(() => new THREE.CylinderGeometry(LIGHT_RADIUS_FT, LIGHT_RADIUS_FT, 0.05, 16), []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#fff8e1", emissive: "#fff3c4", emissiveIntensity: 0.8 }),
    []
  );

  if (qty <= 0 || totalWidthFt <= 0) return null;

  const xs: number[] = [];
  for (let i = 0; i < qty; i++) xs.push((totalWidthFt / (qty + 1)) * (i + 1));

  return (
    <Instances limit={xs.length} geometry={geometry} material={material}>
      {xs.map((x, i) => (
        <Instance key={i} position={[x, heightFt - 0.03, depthFt / 2]} rotation={[Math.PI / 2, 0, 0]} />
      ))}
    </Instances>
  );
}
