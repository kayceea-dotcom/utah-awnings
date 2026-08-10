// Standard fixed-rate amortization estimate, used to show a "as low as $X/mo"
// figure on the customer proposal page. Not a real quote from a lender -
// actual terms are determined by Hearth/whichever financing partner approves the applicant.
export function estimateMonthlyPayment(principal: number, aprPercent: number, termYears: number): number {
  if (!principal || principal <= 0) return 0;
  const monthlyRate = aprPercent / 100 / 12;
  const numPayments = termYears * 12;
  if (monthlyRate === 0) return principal / numPayments;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numPayments));
}

export const HEARTH_PREQUALIFY_URL = "https://app.gethearth.com/financing/103/62/prequalify";
export const FINANCING_APR = 7.9;
export const FINANCING_TERM_YEARS = 12;

export interface FinancingOption {
  termYears: number;
  apr: number;
}

// Shown on the rep-facing Price Summary while writing a bid - separate from
// the single customer-facing estimate above (FINANCING_APR/FINANCING_TERM_YEARS).
export const BID_FINANCING_OPTIONS: FinancingOption[] = [
  { termYears: 3, apr: 18.12 },
  { termYears: 5, apr: 19.37 },
  { termYears: 7, apr: 9.99 },
];
