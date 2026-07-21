"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { Instances, Instance } from "@react-three/drei";
import { getMaterial } from "@/lib/scene/colors";

const TAIL_LENGTH_FT = 1;
// Per the Duralum/4STEL engineering detail ("2 x 6½ x .024" RAFTER"), a
// rafter tail is a 2" (wide) x 6.5" (tall) extrusion, not a small square.
const TAIL_WIDTH_FT = 2 / 12;
const TAIL_HEIGHT_FT = 6.5 / 12;

interface RafterTailsProps {
  xs: number[]; // absolute X positions
  zFt: number; // roofline edge Z — the tail starts flush here and extends out past it
  heightFt: number; // roof height
  colorName: string;
}

// Order front-to-back is panel -> gutter -> front plate -> rafter tail — the
// rafter tail is the outermost, most forward piece, extending out past the
// gutter/front plate rather than terminating at the roofline.
export default function RafterTails({ xs, zFt, heightFt, colorName }: RafterTailsProps) {
  const geometry = useMemo(() => new THREE.BoxGeometry(TAIL_WIDTH_FT, TAIL_HEIGHT_FT, TAIL_LENGTH_FT), []);
  const material = getMaterial(colorName, { roughness: 0.6 });

  if (xs.length === 0) return null;

  return (
    <Instances limit={xs.length} geometry={geometry} material={material}>
      {xs.map((x, i) => (
        <Instance key={i} position={[x, heightFt - TAIL_HEIGHT_FT / 2, zFt + TAIL_LENGTH_FT / 2]} />
      ))}
    </Instances>
  );
}
