"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { Instances, Instance } from "@react-three/drei";
import { getMaterial } from "@/lib/scene/colors";

const POST_SIZE_FT = 0.25; // ~3in post profile placeholder

interface PostsProps {
  xs: number[]; // absolute X positions
  zFt: number;
  heightFt: number;
  colorName: string;
}

export default function Posts({ xs, zFt, heightFt, colorName }: PostsProps) {
  const geometry = useMemo(() => new THREE.BoxGeometry(POST_SIZE_FT, heightFt, POST_SIZE_FT), [heightFt]);
  const material = getMaterial(colorName, { roughness: 0.6 });

  if (xs.length === 0) return null;

  return (
    <Instances limit={xs.length} geometry={geometry} material={material}>
      {xs.map((x, i) => (
        <Instance key={i} position={[x, heightFt / 2, zFt]} />
      ))}
    </Instances>
  );
}
