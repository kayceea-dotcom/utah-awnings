"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { Instances, Instance } from "@react-three/drei";
import { getMaterial } from "@/lib/scene/colors";

const WRAP_SIZE_FT = 0.32; // slightly larger than the 0.25ft post it covers

interface PostWrapProps {
  xs: number[]; // absolute X positions
  zFt: number;
  postHeightFt: number;
  beamHeightFt: number; // real beam profile height (e.g. 8" for 3x8) — beam sits on top of the post
  colorName: string;
  sizeFt?: number; // outer width of the finished column (defaults to a slim 0.32ft)
}

// Decorative aluminum bent-plate sleeve — same material/rate as SidePlates
// and FrontPlate ("Post Plates (Mitered)" pricing line item), just cut and
// installed differently. Covers the full post height (foundation to
// underside of beam) PLUS the beam's own height, since the beam sits on top
// of the post and the plate wraps up to cover its side face too.
export default function PostWrap({ xs, zFt, postHeightFt, beamHeightFt, colorName, sizeFt = WRAP_SIZE_FT }: PostWrapProps) {
  const totalHeightFt = postHeightFt + beamHeightFt;
  const geometry = useMemo(
    () => new THREE.BoxGeometry(sizeFt, totalHeightFt, sizeFt),
    [totalHeightFt, sizeFt]
  );
  const material = getMaterial(colorName, { roughness: 0.55 });

  if (xs.length === 0) return null;

  return (
    <Instances limit={xs.length} geometry={geometry} material={material}>
      {xs.map((x, i) => (
        <Instance key={i} position={[x, totalHeightFt / 2, zFt]} />
      ))}
    </Instances>
  );
}
