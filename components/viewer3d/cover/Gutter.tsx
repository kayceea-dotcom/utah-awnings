"use client";

import { getMaterial } from "@/lib/scene/colors";

// Real profiles from Duralum/4STEL engineering drawings (IAPMO UES ER-195,
// sheet S4.1/S4.4). "roll_form" is a combined gutter+fascia extrusion (B1:
// 6.5" Roll Formed Gutter Fascia, 6.560"H x 3.020"D). "extruded" is the Mag
// Gutter (B4: ~4.50"H x 4.00"D), which pairs with a separate Fascia piece
// (see SideFascia.tsx/FrontPlate.tsx).
const GUTTER_PROFILES: Record<string, { heightInches: number; depthInches: number }> = {
  roll_form: { heightInches: 6.56, depthInches: 3.02 },
  extruded: { heightInches: 4.5, depthInches: 4.0 },
};

// Per the "Rafter Tail to Gutter" assembly detail, the gutter sits directly
// against the rafter tail, spanning the same height band — its top is flush
// with the roofline/rafter-tail-top, hanging down from there.
export function getGutterHeightFt(gutterType: string): number {
  return (GUTTER_PROFILES[gutterType] ?? GUTTER_PROFILES.roll_form).heightInches / 12;
}

export function getGutterBottomY(heightFt: number, gutterType: string): number {
  return heightFt - getGutterHeightFt(gutterType);
}

export function getGutterTopY(heightFt: number): number {
  return heightFt;
}

export function getGutterDepthFt(gutterType: string): number {
  return (GUTTER_PROFILES[gutterType] ?? GUTTER_PROFILES.roll_form).depthInches / 12;
}

interface GutterProps {
  totalWidthFt: number;
  zFt: number;
  heightFt: number;
  colorName: string;
  gutterType: string;
}

export default function Gutter({ totalWidthFt, zFt, heightFt, colorName, gutterType }: GutterProps) {
  const gutterHeightFt = getGutterHeightFt(gutterType);
  const gutterDepthFt = (GUTTER_PROFILES[gutterType] ?? GUTTER_PROFILES.roll_form).depthInches / 12;
  const material = getMaterial(colorName, { roughness: 0.5 });
  return (
    <mesh position={[totalWidthFt / 2, heightFt - gutterHeightFt / 2, zFt]} material={material}>
      <boxGeometry args={[totalWidthFt, gutterHeightFt, gutterDepthFt]} />
    </mesh>
  );
}
