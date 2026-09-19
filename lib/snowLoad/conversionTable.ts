// Ground snow load code-version conversion table, sourced from 4STEL Engineering
// Standard Letter #149-195 (Snow Load Equivalent for 2024 IBC), dated 2026-03-04.
// The "2024 IBC" row is what utahsnowload.usu.edu reports today (confirmed against
// two live lookups: 43 psf -> 30 psf for Logan, 28 psf -> 20 psf for West Valley
// City). The "design" row is the value our engineering span tables are built around.
const CONVERSION_TABLE: { code2024: number; design: number }[] = [
  { code2024: 14, design: 10 },
  { code2024: 28, design: 20 },
  { code2024: 35, design: 25 },
  { code2024: 43, design: 30 },
  { code2024: 51, design: 36 },
  { code2024: 57, design: 40 },
  { code2024: 60, design: 42 },
  { code2024: 71, design: 50 },
  { code2024: 85, design: 60 },
  { code2024: 102, design: 72 },
  { code2024: 120, design: 84 },
];

export interface SnowLoadConversion {
  rawPsf: number;
  tierPsf: number;
  designPsf: number;
  exceedsTable: boolean;
}

// Rounds a raw (USU map) ground snow load UP to the next 2024-IBC tier -
// conservative, so we never under-design - and returns the corresponding
// design-table value. A site above the top tier (120 psf) has no mapped
// design value and needs a site-specific engineering review.
export function convertToDesignSnowLoad(rawPsf: number): SnowLoadConversion {
  const tier = CONVERSION_TABLE.find((row) => rawPsf <= row.code2024);
  if (!tier) {
    const top = CONVERSION_TABLE[CONVERSION_TABLE.length - 1];
    return { rawPsf, tierPsf: top.code2024, designPsf: top.design, exceedsTable: true };
  }
  return { rawPsf, tierPsf: tier.code2024, designPsf: tier.design, exceedsTable: false };
}
