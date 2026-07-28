// Friendly labels/categories/units for every purchasable RATES entry, used by the
// Individual Items quote page to let a rep pick catalog parts by name instead of
// typing raw rate keys. Keep in sync with lib/pricing/rates.ts when rates are added.

import { RATES } from "./rates";

export type CatalogUnit = "ft" | "sq ft" | "ea";

export interface CatalogEntry {
  key: keyof typeof RATES;
  label: string;
  category: string;
  unit: CatalogUnit;
}

export const CATALOG: CatalogEntry[] = [
  // Flat Panels
  { key: "T6_024", label: "T6 .024 - 6in Flat Pan", category: "Flat Panels", unit: "ft" },
  { key: "T6_032", label: "T6 .032 - 6in Flat Pan", category: "Flat Panels", unit: "ft" },
  { key: "T6_040", label: "T6 .040 - 6in Flat Pan", category: "Flat Panels", unit: "ft" },
  { key: "flat_8_020", label: "8in Flat Pan .020", category: "Flat Panels", unit: "ft" },
  { key: "flat_8_024", label: "8in Flat Pan .024", category: "Flat Panels", unit: "ft" },
  { key: "flat_8_032", label: "8in Flat Pan .032", category: "Flat Panels", unit: "ft" },

  // Beams
  { key: "beam_3x8", label: "3x8 Beam", category: "Beams", unit: "ft" },
  { key: "beam_2x6", label: "2x6 Beam", category: "Beams", unit: "ft" },
  { key: "beam_3x3", label: "3x3 Beam", category: "Beams", unit: "ft" },
  { key: "beam_4_i_beam", label: "4in I-Beam", category: "Beams", unit: "ft" },
  { key: "beam_7_i_beam", label: "7in I-Beam", category: "Beams", unit: "ft" },
  { key: "steel_3x3_g_beam_ft", label: "3x3 Steel G-Beam Insert", category: "Beams", unit: "ft" },

  // Steel Inserts
  { key: "steel_3x8_14ga_ft", label: "3x8 Steel Insert 14ga", category: "Steel Inserts", unit: "ft" },
  { key: "steel_3x8_12ga_ft", label: "3x8 Steel Insert 12ga", category: "Steel Inserts", unit: "ft" },

  // Posts
  { key: "post_3x3_sleeve_ft", label: "3x3 Post Sleeve", category: "Posts", unit: "ft" },
  { key: "post_3x3_steel_ft", label: "3x3 Steel Post", category: "Posts", unit: "ft" },

  // Hangers
  { key: "hanger_roll_form_ft", label: "Hanger - Roll Form", category: "Hangers", unit: "ft" },
  { key: "hanger_extruded_ft", label: "Hanger - Extruded", category: "Hangers", unit: "ft" },
  { key: "hanger_a_rail_ft", label: "Hanger - A-Rail", category: "Hangers", unit: "ft" },
  { key: "hanger_elevated_roof_mount", label: "Hanger - Elevated Roof Mount", category: "Hangers", unit: "ea" },

  // Gutters
  { key: "gutter_roll_form_ft", label: "Gutter - Roll Form", category: "Gutters", unit: "ft" },
  { key: "gutter_extruded_ft", label: "Gutter - Extruded", category: "Gutters", unit: "ft" },
  { key: "fascia_extruded_ft", label: "Fascia - Extruded", category: "Gutters", unit: "ft" },
  { key: "fascia_extruded_2x6_ft", label: "Fascia - Extruded 2x6 (W-Pan)", category: "Gutters", unit: "ft" },
  { key: "fascia_extruded_3x8_ft", label: "Fascia - Extruded 3x8", category: "Gutters", unit: "ft" },

  // Post Plates / Brackets / Caps
  { key: "post_plate_3x8_ft", label: "Post Plate 3x8", category: "Post Plates / Brackets / Caps", unit: "ft" },
  { key: "post_plate_2x6_ft", label: "Post Plate 2x6", category: "Post Plates / Brackets / Caps", unit: "ft" },
  { key: "mitered_cap_3x8", label: "Mitered Cap 3x8", category: "Post Plates / Brackets / Caps", unit: "ea" },
  { key: "mitered_cap_2x6", label: "Mitered Cap 2x6", category: "Post Plates / Brackets / Caps", unit: "ea" },
  { key: "rafter_tail_3x8_ft", label: "Rafter Tail 3x8", category: "Post Plates / Brackets / Caps", unit: "ea" },
  { key: "rafter_tail_2x6_ft", label: "Rafter Tail 2x6", category: "Post Plates / Brackets / Caps", unit: "ea" },
  { key: "sideplate_3x8_ft", label: "Sideplate 3x8 (Cut One Side)", category: "Post Plates / Brackets / Caps", unit: "ft" },
  { key: "sideplate_2x6_ft", label: "Sideplate 2x6 (Cut One Side)", category: "Post Plates / Brackets / Caps", unit: "ft" },
  { key: "inside_brkt_3x8", label: "Inside Bracket 3x8", category: "Post Plates / Brackets / Caps", unit: "ea" },
  { key: "inside_brkt_2x6", label: "Inside Bracket 2x6", category: "Post Plates / Brackets / Caps", unit: "ea" },
  { key: "outside_brkt_3x8", label: "Outside Bracket 3x8", category: "Post Plates / Brackets / Caps", unit: "ea" },
  { key: "outside_brkt_2x6", label: "Outside Bracket 2x6 (Pergola)", category: "Post Plates / Brackets / Caps", unit: "ea" },
  { key: "post_brkt", label: "Post Bracket", category: "Post Plates / Brackets / Caps", unit: "ea" },
  { key: "endcap_3x8", label: "End Cap 3x8", category: "Post Plates / Brackets / Caps", unit: "ea" },
  { key: "endcap_2x6", label: "End Cap 2x6", category: "Post Plates / Brackets / Caps", unit: "ea" },
  { key: "endcap_3x3", label: "End Cap 3x3 (Beam)", category: "Post Plates / Brackets / Caps", unit: "ea" },

  // Fan Beam
  { key: "fan_beam_ft", label: "Fan Beam", category: "Fan Beam", unit: "ft" },
  { key: "fan_beam_cap_ft", label: "Fan Beam Cap", category: "Fan Beam", unit: "ft" },

  // Downspouts & Drainage
  { key: "downspout_2x3_10", label: "Downspout 2x3 10ft", category: "Downspouts & Drainage", unit: "ea" },
  { key: "elbow_2x3", label: "Elbow 2x3", category: "Downspouts & Drainage", unit: "ea" },
  { key: "dropout", label: "Dropout", category: "Downspouts & Drainage", unit: "ea" },
  { key: "downspout_strap", label: "Downspout Strap", category: "Downspouts & Drainage", unit: "ea" },
  { key: "flashing", label: "Flashing", category: "Downspouts & Drainage", unit: "ea" },
  { key: "gutter_dam", label: "Gutter Dam", category: "Downspouts & Drainage", unit: "ea" },
  { key: "gutter_splice", label: "Gutter Splice", category: "Downspouts & Drainage", unit: "ea" },

  // Hardware
  { key: "lag_screw", label: "Lag Screw", category: "Hardware", unit: "ea" },
  { key: "screw_14x1_colored", label: "#14x1 Colored Screw", category: "Hardware", unit: "ea" },
  { key: "screw_14x1_washered", label: "#14x1 Washered Screw", category: "Hardware", unit: "ea" },
  { key: "screw_8x0_5_color", label: "#8x1/2 Pan Screw - Color", category: "Hardware", unit: "ea" },
  { key: "screw_8x0_5_extruded", label: "#8x1/2 Pan Screw - Extruded", category: "Hardware", unit: "ea" },
  { key: "plug_5_8", label: "Plug 5/8in", category: "Hardware", unit: "ea" },
  { key: "anchor_wedge", label: "Wedge Anchor", category: "Hardware", unit: "ea" },
  { key: "foam_gasket_ft", label: "Foam Gasket", category: "Hardware", unit: "ft" },
  { key: "pan_clip", label: "Pan Clip", category: "Hardware", unit: "ea" },
  { key: "silicone_clear", label: "Silicone Clear", category: "Hardware", unit: "ea" },
  { key: "spray_paint", label: "Spray Paint", category: "Hardware", unit: "ea" },
  { key: "foam_insert_2x6", label: "Foam Insert 2x6", category: "Hardware", unit: "ea" },

  // Pergola
  { key: "rafter_2x6_032_ft", label: "Rafter 2x6 .032 (Pergola)", category: "Pergola", unit: "ft" },
  { key: "rafter_2x6_040_ft", label: "Rafter 2x6 .040 (Pergola)", category: "Pergola", unit: "ft" },
  { key: "lattice_2x2_ft", label: "Lattice 2x2", category: "Pergola", unit: "ft" },
  { key: "lattice_2x3_ft", label: "Lattice 2x3", category: "Pergola", unit: "ft" },
  { key: "lattice_screw", label: "Lattice Screw", category: "Pergola", unit: "ea" },
  { key: "lattice_splice_2x2", label: "Lattice Splice 2x2", category: "Pergola", unit: "ea" },
  { key: "lattice_splice_2x3", label: "Lattice Splice 2x3", category: "Pergola", unit: "ea" },
  { key: "endcap_2x2", label: "End Cap 2x2 (Lattice)", category: "Pergola", unit: "ea" },
  { key: "endcap_2x3", label: "End Cap 2x3 (Lattice)", category: "Pergola", unit: "ea" },
  { key: "foam_insert_pergola", label: "Foam Insert (Pergola)", category: "Pergola", unit: "ea" },

  // W-Pan
  { key: "wpan_sqft", label: "W-Pan Tri-V .032 Panel", category: "W-Pan", unit: "sq ft" },
  { key: "duraking_025_ft", label: "DuraKing 4x12 .025 Panel", category: "W-Pan", unit: "ft" },
  { key: "duraking_032_ft", label: "DuraKing 4x12 .032 Panel", category: "W-Pan", unit: "ft" },
  { key: "duraking_040_ft", label: "DuraKing 4x12 .040 Panel", category: "W-Pan", unit: "ft" },

  // Metal Wall
  { key: "ls_tubing_ft", label: "Tuf-Rib Tubing (Metal Wall)", category: "Metal Wall", unit: "ft" },
  { key: "ls_bracket", label: "Metal Wall Bracket", category: "Metal Wall", unit: "ea" },
  { key: "metal_panel_screws", label: "Metal Wall Panel Screws (box)", category: "Metal Wall", unit: "ea" },

  // IRP / LRP Panels
  { key: "IRP_3_032", label: "IRP 3in .032 Panel", category: "IRP / LRP", unit: "sq ft" },
  { key: "IRP_4_032", label: "IRP 4.25in .032 Panel", category: "IRP / LRP", unit: "sq ft" },

  // LRP Hangers
  { key: "lrp_3_hanger_16", label: "LRP 3in Hanger - 16ft", category: "IRP / LRP", unit: "ea" },
  { key: "lrp_3_hanger_20", label: "LRP 3in Hanger - 20ft", category: "IRP / LRP", unit: "ea" },
  { key: "lrp_3_hanger_24", label: "LRP 3in Hanger - 24ft", category: "IRP / LRP", unit: "ea" },
  { key: "lrp_4_hanger_20", label: "LRP 4.25in Hanger - 20ft", category: "IRP / LRP", unit: "ea" },

  // LRP Gutters
  { key: "lrp_3_gutter_16", label: "LRP 3in Gutter - 16ft", category: "IRP / LRP", unit: "ea" },
  { key: "lrp_3_gutter_20", label: "LRP 3in Gutter - 20ft", category: "IRP / LRP", unit: "ea" },
  { key: "lrp_3_gutter_24", label: "LRP 3in Gutter - 24ft", category: "IRP / LRP", unit: "ea" },
  { key: "lrp_4_gutter_20", label: "LRP 4.25in Gutter - 20ft", category: "IRP / LRP", unit: "ea" },
  { key: "lrp_4_gutter_24", label: "LRP 4.25in Gutter - 24ft", category: "IRP / LRP", unit: "ea" },

  // LRP Side Fascia
  { key: "lrp_3_fascia_17", label: "LRP 3in Side Fascia - 17ft", category: "IRP / LRP", unit: "ea" },
  { key: "lrp_3_fascia_21", label: "LRP 3in Side Fascia - 21ft", category: "IRP / LRP", unit: "ea" },
  { key: "lrp_3_fascia_25", label: "LRP 3in Side Fascia - 25ft", category: "IRP / LRP", unit: "ea" },
  { key: "lrp_4_fascia_25", label: "LRP 4.25in Side Fascia - 25ft", category: "IRP / LRP", unit: "ea" },

  // LRP Drip Edge
  { key: "lrp_drip_edge_24", label: "LRP Drip Edge - 24ft", category: "IRP / LRP", unit: "ea" },
];

export const CATALOG_BY_KEY: Record<string, CatalogEntry> = Object.fromEntries(
  CATALOG.map((c) => [c.key, c])
);

export const CATEGORIES: string[] = Array.from(new Set(CATALOG.map((c) => c.category)));
