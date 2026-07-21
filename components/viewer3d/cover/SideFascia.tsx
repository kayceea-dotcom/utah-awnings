"use client";

import { getMaterial } from "@/lib/scene/colors";

export const SIDE_FASCIA_HEIGHT_FT = 0.5;
const SIDE_FASCIA_THICKNESS_FT = 0.08;

interface SideFasciaProps {
  xLeftFt: number;
  xRightFt: number;
  projectionFt: number;
  heightFt: number; // roof/gutter height
  colorName: string;
}

// Matches the "Extruded Side Fascia" pricing line item — two boards running
// the full projection depth (house to front) at the left/right roof edges.
// Its own distinct material/rate from the wrap-kit family (PostWrap/
// SidePlates/FrontPlate); only needed with an extruded gutter, independent of
// whether a wrap kit is selected.
export default function SideFascia({ xLeftFt, xRightFt, projectionFt, heightFt, colorName }: SideFasciaProps) {
  const material = getMaterial(colorName, { roughness: 0.5 });
  return (
    <>
      <mesh position={[xLeftFt, heightFt - SIDE_FASCIA_HEIGHT_FT / 2, projectionFt / 2]} material={material}>
        <boxGeometry args={[SIDE_FASCIA_THICKNESS_FT, SIDE_FASCIA_HEIGHT_FT, projectionFt]} />
      </mesh>
      <mesh position={[xRightFt, heightFt - SIDE_FASCIA_HEIGHT_FT / 2, projectionFt / 2]} material={material}>
        <boxGeometry args={[SIDE_FASCIA_THICKNESS_FT, SIDE_FASCIA_HEIGHT_FT, projectionFt]} />
      </mesh>
    </>
  );
}
