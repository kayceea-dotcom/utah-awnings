"use client";

import { getMaterial } from "@/lib/scene/colors";
import { getBeamProfile, type BeamProfile } from "@/lib/scene/beamProfiles";

interface BeamProps {
  widthFt: number; // length along X (the beam's span)
  xOffsetFt: number; // left edge of the beam along X
  heightFt: number; // Y position of the top of posts
  zFt: number; // distance from the house wall
  colorName: string;
  beamType?: string; // looks up a real BEAM_PROFILES cross-section
  profileOverride?: BeamProfile; // for members that aren't a BeamType (e.g. fan beam)
  mountedOnSide?: boolean; // "double_*" beams attach beside the post instead of bearing on top
}

export default function Beam({
  widthFt,
  xOffsetFt,
  heightFt,
  zFt,
  colorName,
  beamType,
  profileOverride,
  mountedOnSide,
}: BeamProps) {
  const material = getMaterial(colorName, { roughness: 0.5 });
  const profile = profileOverride ?? getBeamProfile(beamType ?? "3x8");
  // The beam's tall dimension sits vertical (for bending strength); its
  // narrower dimension sits front-to-back (Z), matching real construction.
  const beamHeightFt = profile.heightInches / 12;
  const beamDepthFt = profile.widthInches / 12;
  // Side-mounted beams straddle the post's top rather than sitting fully
  // above it — the post doesn't gain any extra height from the beam.
  const centerY = mountedOnSide ? heightFt : heightFt + beamHeightFt / 2;

  return (
    <mesh position={[xOffsetFt + widthFt / 2, centerY, zFt]} material={material}>
      <boxGeometry args={[widthFt, beamHeightFt, beamDepthFt]} />
    </mesh>
  );
}
