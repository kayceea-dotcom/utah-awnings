// Transcribed directly from the user's "Duralumn panel spans.xlsx", built from
// manufacturer/evaluation-report span tables (Table 1 T6, Table 1C 8x2.5 Flat
// Pan, Table 2 DuraKing, and UES/IAPMO Evaluation Report 505 Tables 2/3/5 for
// the EPS/LRP insulated roof panels).
//
// Table 1 / 1C / 2 are fixed to the 120mph Exposure C wind column - Utah
// Awnings' standing design wind choice - so that's the only column kept here.

export type FeetInches = string; // e.g. "16'-11\""

export interface FlatSpanTable {
  [gauge: string]: { [gslTier: number]: FeetInches };
}

// Table 1 - T6 Panel - max span at 120mph Exposure C, by GSL tier x gauge.
export const T6_SPAN_120C: FlatSpanTable = {
  "0.024": { 10: "15'-4\"", 20: "13'-4\"", 25: "13'-3\"", 30: "12'-7\"", 40: "11'-8\"", 50: "10'-5\"", 60: "9'-3\"", 72: "8'-0\"", 84: "6'-11\"" },
  "0.032": { 10: "18'-10\"", 20: "16'-6\"", 25: "16'-3\"", 30: "15'-7\"", 40: "14'-4\"", 50: "13'-4\"", 60: "12'-7\"", 72: "11'-9\"", 84: "10'-11\"" },
  "0.040": { 10: "20'-11\"", 20: "18'-9\"", 25: "18'-5\"", 30: "17'-4\"", 40: "15'-9\"", 50: "14'-8\"", 60: "13'-10\"", 72: "13'-0\"", 84: "12'-4\"" },
};

// Table 1C - 8x2.5 Flat Pan - max span at 120mph Exposure C, by GSL tier x gauge.
export const FLAT_PAN_SPAN_120C: FlatSpanTable = {
  "0.020": { 10: "12'-6\"", 20: "10'-2\"", 25: "9'-9\"", 30: "9'-3\"", 40: "8'-4\"", 50: "7'-5\"" },
  "0.024": { 10: "13'-7\"", 20: "11'-4\"", 25: "10'-4\"", 30: "9'-9\"", 40: "9'-0\"", 50: "8'-3\"" },
  "0.032": { 10: "15'-7\"", 20: "13'-0\"", 25: "11'-4\"", 30: "10'-9\"", 40: "9'-9\"", 50: "9'-1\"" },
  "0.040": { 10: "17'-7\"", 20: "14'-6\"", 25: "12'-3\"", 30: "11'-7\"", 40: "10'-7\"", 50: "9'-9\"" },
};

// Table 2 - DuraKing Panel - max span at 120mph Exposure C, by GSL tier x gauge.
export const DURAKING_SPAN_120C: FlatSpanTable = {
  "0.020": { 10: "13'-7\"", 20: "12'-1\"", 25: "12'-1\"", 30: "11'-8\"", 40: "9'-10\"", 50: "8'-3\"", 60: "6'-11\"", 72: "5'-10\"", 84: "5'-0\"" },
  "0.024": { 10: "15'-5\"", 20: "14'-5\"", 25: "14'-5\"", 30: "14'-1\"", 40: "12'-11\"", 50: "11'-9\"", 60: "9'-11\"", 72: "8'-4\"", 84: "7'-2\"" },
  "0.032": { 10: "18'-8\"", 20: "17'-8\"", 25: "17'-8\"", 30: "17'-4\"", 40: "15'-11\"", 50: "14'-7\"", 60: "13'-4\"", 72: "12'-3\"", 84: "11'-4\"" },
  "0.040": { 10: "21'-11\"", 20: "20'-7\"", 25: "20'-7\"", 30: "19'-9\"", 40: "18'-0\"", 50: "16'-8\"", 60: "15'-8\"", 72: "14'-4\"", 84: "13'-3\"" },
};

// ER-505 IRP/LRP EPS panels - "Snow" loading case only. Live/Wind Up/Wind
// Down rows aren't checked by this tool (they need real wind pressure psf,
// not just a wind speed category) - see lookup.ts for the caveat surfaced to
// the rep.
export interface IrpSpanSection {
  psfColumns: number[];
  spans: FeetInches[]; // parallel to psfColumns
}

// Table 2 - 1.0pcf EPS, 0.024" facings (our IRP_3_024 panel). No "with fan
// beam insert" variant published for this facing/density combo.
export const ER505_TABLE2: Record<string, { noFan: IrpSpanSection; withFan?: IrpSpanSection }> = {
  "3.0": {
    noFan: { psfColumns: [20, 25, 30, 35, 40, 45, 50, 55], spans: ["11'-4\"", "10'-2\"", "9'-3\"", "8'-6\"", "7'-5\"", "6'-8\"", "6'-0\"", "5'-5\""] },
    withFan: { psfColumns: [20, 25, 30, 35, 40, 45, 50, 55], spans: ["12'-6\"", "11'-3\"", "10'-3\"", "9'-6\"", "8'-11\"", "8'-5\"", "7'-7\"", "6'-1\""] },
  },
};

// Table 3 - 2.0pcf EPS, 0.030" facings (our IRP_3_032 / IRP_4_032 panels).
export const ER505_TABLE3: Record<string, { noFan: IrpSpanSection; withFan: IrpSpanSection }> = {
  "3.0": {
    noFan: { psfColumns: [20, 25, 30, 35, 40, 45, 50, 55], spans: ["14'-1\"", "13'-1\"", "12'-3\"", "11'-7\"", "11'-0\"", "10'-6\"", "10'-1\"", "9'-8\""] },
    withFan: { psfColumns: [20, 25, 30, 35, 40, 45, 50, 55], spans: ["14'-11\"", "13'-9\"", "12'-11\"", "12'-2\"", "11'-6\"", "11'-0\"", "10'-6\"", "10'-2\""] },
  },
  "4.25": {
    noFan: { psfColumns: [20, 25, 30, 35, 40, 45, 50, 55], spans: ["17'-7\"", "16'-3\"", "15'-3\"", "14'-5\"", "13'-7\"", "12'-10\"", "12'-2\"", "11'-8\""] },
    withFan: { psfColumns: [20, 25, 30, 35, 40, 45, 50, 55], spans: ["17'-11\"", "16'-2\"", "14'-10\"", "13'-9\"", "12'-11\"", "12'-3\"", "11'-7\"", "11'-1\""] },
  },
  "6.0": {
    noFan: { psfColumns: [20, 25, 30, 35, 40, 45, 50, 55], spans: ["22'-2\"", "20'-0\"", "18'-5\"", "17'-1\"", "16'-0\"", "15'-2\"", "14'-5\"", "13'-9\""] },
    withFan: { psfColumns: [20, 25, 30, 35, 40, 45, 50, 55], spans: ["21'-1\"", "19'-0\"", "17'-6\"", "16'-3\"", "15'-3\"", "14'-5\"", "13'-8\"", "13'-1\""] },
  },
};

// Table 5 - 2.0pcf EPS, 0.030" facings - "optional" high-snow-load tiers.
// These columns line up almost exactly with our 4STEL conversion table's own
// design tiers (36/42/60/72/84), so this is preferred over Table 3 whenever
// the design psf lands exactly on one of these columns.
export const ER505_TABLE5: Record<string, { noFan: IrpSpanSection; withFan: IrpSpanSection }> = {
  "4.25": {
    noFan: { psfColumns: [10, 36, 42, 60, 66, 72, 78, 84], spans: ["21'-11\"", "14'-3\"", "13'-3\"", "11'-2\"", "10'-8\"", "10'-2\"", "9'-10\"", "9'-5\""] },
    withFan: { psfColumns: [10, 36, 42, 60, 66, 72, 78, 84], spans: ["23'-0\"", "13'-7\"", "12'-8\"", "10'-8\"", "10'-2\"", "9'-9\"", "9'-4\"", "9'-0\""] },
  },
  "6.0": {
    noFan: { psfColumns: [10, 36, 42, 60, 66, 72, 78, 84], spans: ["23'-0\"", "16'-10\"", "15'-8\"", "13'-2\"", "12'-7\"", "12'-1\"", "11'-7\"", "11'-2\""] },
    withFan: { psfColumns: [10, 36, 42, 60, 66, 72, 78, 84], spans: ["23'-0\"", "16'-0\"", "14'-11\"", "12'-6\"", "12'-0\"", "11'-6\"", "11'-0\"", "10'-8\""] },
  },
};
