import { beamTypeLabel } from "./pricing/shared";
import { TERMS } from "./contractTerms";

export interface ContractData {
  companyName: string;
  companyAddress1: string;
  companyAddress2: string;
  companyPhone: string;
  logoUrl: string | null;
  contractDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerCity: string;
  customerZip: string;
  jobName: string;
  productType: string;
  panelType: string;
  panelColor: string;
  gutterFasciaColor: string;
  beamLabel: string;
  postsBeamColor: string;
  wrap: string;
  endCut: string;
  fanBeam: string;
  notes: string;
  depositPct: number;
  depositAmount: number;
  balanceDue: number;
  totalJobSale: number;
  installDate: string;
  status: string;
  signedAt: string | null;
  paymentMethod: string | null;
  signatureData: string | null;
  terms: string[];
}

// Shared by the printable contract route so the PDF a rep downloads for
// office records always matches the same data the customer actually saw
// and signed (proposal + quote + customer + company, same nested shape
// used by the customer-facing /p/[token] page).
export function buildContractData(proposal: Record<string, unknown>): ContractData {
  const quote = proposal.quotes as Record<string, unknown>;
  const customer = (quote.customers as Record<string, unknown>) || {};
  const company = (quote.companies as Record<string, unknown>) || {};
  const inputs = (quote.inputs as Record<string, unknown>) || {};

  return {
    companyName: (company.name as string) || "Utah Awnings",
    companyAddress1: (company.address as string) || "",
    companyAddress2: (company.address2 as string) || "",
    companyPhone: (company.phone as string) || "",
    logoUrl: (company.logo_url as string) || null,
    contractDate: new Date().toLocaleDateString(),
    customerName: (customer.name as string) || "",
    customerPhone: (customer.phone as string) || "",
    customerEmail: (customer.email as string) || "",
    customerAddress: (customer.address as string) || "",
    customerCity: (customer.city as string) || "",
    customerZip: (customer.zip as string) || "",
    jobName: (inputs.jobName as string) || (customer.name as string) || "Unknown Job",
    productType: String(quote.style || quote.product_type || ""),
    panelType: (quote.panel_type as string) || "",
    panelColor: (quote.color as string) || "",
    gutterFasciaColor: (inputs.colorGutterFascia as string) || "",
    beamLabel: beamTypeLabel((quote.beam_type as string) || ""),
    postsBeamColor: (inputs.colorPostsBeam as string) || "",
    wrap: (quote.wrap as string) || "",
    endCut: (quote.end_cut as string) || "",
    fanBeam: quote.fan_beam ? String(quote.fan_beam) : "",
    notes: (quote.notes as string) || "",
    depositPct: (quote.deposit_pct as number) || 0,
    depositAmount: (quote.deposit_amount as number) || 0,
    balanceDue: (quote.balance_due as number) || 0,
    totalJobSale: (quote.total_job_sale as number) || 0,
    installDate: quote.estimated_install_date
      ? new Date(quote.estimated_install_date as string).toLocaleDateString()
      : "TBD",
    status: (proposal.status as string) || "draft",
    signedAt: (proposal.signed_at as string) || null,
    paymentMethod: (proposal.payment_method as string) || null,
    signatureData: (proposal.signature_data as string) || null,
    terms: TERMS,
  };
}
