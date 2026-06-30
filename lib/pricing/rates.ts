// Master price list sourced directly from the Pricing Page worksheet.
// Update prices here -- never hard-code in calculators.

export const RATES = {
  // Flat Panels (per linear ft)
  T6_024:       3.90,
  T6_032:       4.79,
  T6_040:       6.45,
  flat_8_020:   2.49,
  flat_8_024:   2.87,
  flat_8_032:   4.98,

  // Beams (per linear ft)
  beam_3x8:    10.10,
  beam_2x6:     6.59,
  beam_3x3:     3.63,

  // Steel inserts (per ft)
  steel_3x8_14ga_ft:  15.26,
  steel_3x8_12ga_ft:  21.80,

  // Posts
  post_3x3_sleeve_ft:  4.71,
  post_3x3_steel_ft:   8.477,

  // Hangers (per ft)
  hanger_roll_form_ft:   3.37,
  hanger_a_rail_ft:     13.77,

  // Gutters
  gutter_roll_form_ft:   4.63,
  gutter_extruded_ft:   14.784,
  fascia_extruded_ft:    7.117,

  // Post plates / brackets / caps
  post_plate_3x8_ft:   10.10,
  post_plate_2x6_ft:    6.59,
  mitered_cap_3x8:      5.47,
  mitered_cap_2x6:      3.84,
  rafter_tail_3x8_ft:  10.10,
  rafter_tail_2x6_ft:   6.59,
  sideplate_3x8_ft:    10.10,
  sideplate_2x6_ft:     6.59,
  inside_brkt_3x8:      4.09,
  inside_brkt_2x6:      2.12,
  outside_brkt_3x8:     5.17,
  post_brkt:            7.85,
  endcap_3x8:           5.47,
  endcap_2x6:           3.84,
  endcap_3x3:           3.30,
  fascia_extruded_2x6_ft: 6.59,
  fascia_extruded_3x8_ft: 7.12,

  // Fan beam
  fan_beam_ft:      8.8895,
  fan_beam_cap_ft:  4.84,

  // Downspouts and drainage
  downspout_2x3_10:  23.75,
  elbow_2x3:          4.08,
  dropout:            2.96,
  downspout_strap:    2.01,
  flashing:          25.41,

  // Hardware
  lag_screw:              0.40,
  screw_14x1_colored:     0.28,
  screw_14x1_washered:    0.35,
  screw_8x0_5_color:      0.18,
  screw_8x0_5_extruded:   0.18,
  plug_5_8:               0.39,
  anchor_wedge:           4.42,
  foam_gasket_ft:         0.71,
  gutter_splice:          8.62,
  gutter_dam:             0.92,
  pan_clip:               0.46,
  silicone_clear:        11.38,
  spray_paint:           18.16,
  foam_insert_2x6:        4.98,

  // Constants
  CC_FEE_RATE:   0.0325,
  DEFAULT_TAX:   0.0725,
} as const;
