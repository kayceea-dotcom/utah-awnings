"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { Instances, Instance } from "@react-three/drei";
import { getMaterial } from "@/lib/scene/colors";

const DOWNSPOUT_SIZE_FT = 0.18;

interface DownspoutsProps {
  xs: number[]; // absolute X positions
  zFt: number;
  heightFt: number;
  colorName: string;
}

export default function Downspouts({ xs, zFt, heightFt, colorName }: DownspoutsProps) {
  const geometry = useMemo(() => new THREE.BoxGeometry(DOWNSPOUT_SIZE_FT, heightFt, DOWNSPOUT_SIZE_FT), [heightFt]);
  const material = getMaterial(colorName, { roughness: 0.5 });

  if (xs.length === 0) return null;

  return (
    <Instances limit={xs.length} geometry={geometry} material={material}>
      {xs.map((x, i) => (
        <Instance key={i} position={[x, heightFt / 2, zFt]} />
      ))}
    </Instances>
  );
}
