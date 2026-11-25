"use client";

import * as THREE from "three";
import { useMemo } from "react";
import { Instances, Instance } from "@react-three/drei";
import { getMaterial } from "@/lib/scene/colors";

// Decorative rafter tails, as they look on a finished wrap-kit cover: chunky
// corbel-style blocks hanging from the roof's top edge and reaching out past it, full height at the back
// and swooping down to a thin lip at the tip (a cove cut), or a straight
// diagonal for a beveled/mitered end. Real tails are ~2in wide extrusions on
// the engineering detail; the photographed corbels read closer to 3.5in once
// capped, so they're drawn at that width.
const TAIL_LENGTH_FT = 1.5; // how far the tail reaches past the roof's front edge
const TAIL_SETBACK_FT = 0.1; // tucks slightly behind the front edge so it joins it
const TAIL_WIDTH_FT = 4 / 12;
const TAIL_HEIGHT_FT = 10 / 12;
const TAIL_LIP_FT = 2 / 12;

export type TailStyle = "cove" | "bevel";

export function tailStyleFor(endCut: string): TailStyle {
  return endCut === "beveled" || endCut === "mitered" ? "bevel" : "cove";
}

// Side profile of one tail: x = distance out from the back, y = down from the top.
function tailShape(style: TailStyle): THREE.Shape {
  const L = TAIL_LENGTH_FT + TAIL_SETBACK_FT;
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(L, 0);
  s.lineTo(L, -TAIL_LIP_FT);
  if (style === "bevel") {
    s.lineTo(L * 0.3, -TAIL_HEIGHT_FT);
  } else {
    // Ogee: a concave sweep in from the thin lip, then a convex belly back
    // down to the full height at the roof edge.
    const H = TAIL_HEIGHT_FT;
    s.bezierCurveTo(L * 0.62, -TAIL_LIP_FT, L * 0.7, -H * 0.5, L * 0.42, -H * 0.55);
    s.bezierCurveTo(L * 0.2, -H * 0.6, L * 0.28, -H, 0, -H);
  }
  s.lineTo(0, 0);
  return s;
}

interface RafterTailsProps {
  xs: number[]; // absolute X positions
  zFt: number; // roofline edge Z — the tail starts flush here and extends out past it
  heightFt: number; // Y of the tail's flat top (the roof's top surface)
  colorName: string;
  style?: TailStyle;
}

// Order front-to-back is panel -> gutter -> front plate -> rafter tail — the
// rafter tail is the outermost, most forward piece, extending out past the
// gutter/front plate rather than terminating at the roofline.
export default function RafterTails({ xs, zFt, heightFt, colorName, style = "cove" }: RafterTailsProps) {
  const geometry = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(tailShape(style), { depth: TAIL_WIDTH_FT, bevelEnabled: false, curveSegments: 10 });
    // Shape x -> world z (outward), shape y -> world y, extrusion -> world x, centred on the tail's x.
    g.rotateY(-Math.PI / 2);
    g.translate(TAIL_WIDTH_FT / 2, 0, 0);
    return g;
  }, [style]);
  const material = getMaterial(colorName, { roughness: 0.6 });

  if (xs.length === 0) return null;

  return (
    <Instances limit={xs.length} geometry={geometry} material={material}>
      {xs.map((x, i) => (
        <Instance key={i} position={[x, heightFt, zFt - TAIL_SETBACK_FT]} />
      ))}
    </Instances>
  );
}
