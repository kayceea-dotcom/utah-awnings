// Real cross-section dimensions sourced from Duralum/4STEL engineering
// drawings (IAPMO UES ER-195, sheets S4.1/S4.2). Beams sit with their tall
// dimension vertical (for bending strength) — e.g. "3x8" is 3" wide (front-
// to-back) x 8" tall, not the other way around.
//
// "3x3" and "3x8" are pixel-confirmed exact (sheet B2/B5 and B11/B13-B19).
// "7_i_beam" is pixel-confirmed exact (sheet B6: 4.000" x 7.000"). "4_i_beam"
// is inferred from its name (nominal 4" height, matching the 3x8's 3" width)
// — not pixel-confirmed against sheet B3, verify against the drawing if
// exact precision is needed later.
export interface BeamProfile {
  widthInches: number;
  heightInches: number;
}

export const BEAM_PROFILES: Record<string, BeamProfile> = {
  "3x3": { widthInches: 3, heightInches: 3 },
  "3x8": { widthInches: 3, heightInches: 8 },
  "4_i_beam": { widthInches: 3, heightInches: 4 },
  "7_i_beam": { widthInches: 4, heightInches: 7 },
};

export function getBeamProfile(beamType: string): BeamProfile {
  return BEAM_PROFILES[beamType] ?? BEAM_PROFILES["3x8"];
}

// Fan beam (sheet B17) is its own distinct, smaller member — not one of the
// BeamType profiles above.
export const FAN_BEAM_PROFILE: BeamProfile = { widthInches: 2.14, heightInches: 2.5 };
