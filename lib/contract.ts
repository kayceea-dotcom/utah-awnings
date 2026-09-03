import { beamTypeLabel } from "./pricing/shared";
import { TERMS } from "./contractTerms";
import type { CoverDiagramGeometryInput } from "./coverDiagramGeometry";
import type { SideProfileGeometryInput } from "./sideProfileGeometry";
import type { BeamConfig } from "./pricing/types";

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
  salesmanName: string;
  salesmanPhone: string;
  productType: string;
  dimensions: string;
  postHeight: string;
  deckHeight: string;
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
  diagramInput: CoverDiagramGeometryInput | null;
  sideProfileInput: SideProfileGeometryInput | null;
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

  // Mirror the customer-facing /p/[token] page's own rule for whether rafter
  // tails show: Pergola's rafters are always structural, IRP's wrap kit never
  // includes rafter tails, and Flat Panel/W-Pan only show them when a wrap
  // kit is selected and Rafter Tails is toggled on.
  const productType = String(quote.style || quote.product_type || "");
  const showRafterTails = productType === "pergola"
    ? true
    : productType === "irp"
      ? false
      : inputs.wrapType !== "none" && !!inputs.rafterTails;

  const diagramInput: CoverDiagramGeometryInput | null =
    inputs.projection1 && inputs.width1
      ? {
          projection1: Number(inputs.projection1) || 0,
          width1: Number(inputs.width1) || 0,
          projection2: Number(inputs.projection2) || 0,
          width2: Number(inputs.width2) || 0,
          jogType: String(inputs.jogType || "ground"),
          posts1: Number(inputs.posts1) || 0,
          posts2: Number(inputs.posts2) || 0,
          downspouts: Number(inputs.downspouts) || 1,
          downspoutSide: String(inputs.downspoutSide || "right"),
          showRafterTails,
          beams: (inputs.beams as BeamConfig[]) || [],
          beamType1: String(inputs.beamType1 || "3x8"),
          beamType2: String(inputs.beamType2 || "3x8"),
          mountStyle: String(inputs.mountStyle || "attached"),
          rearPosts: Number(inputs.rearPosts) || 0,
        }
      : null;

  const sideProfileInput: SideProfileGeometryInput | null =
    inputs.projection1 && inputs.postHeight1
      ? {
          projection: Number(inputs.projection1) || 0,
          postHeight: Number(inputs.postHeight1) || 0,
          deckHeight: Number(inputs.deckHeight) || 0,
          houseAttachment: String(inputs.houseAttachment || "stucco"),
          groundAttachment: String(inputs.groundAttachment || "concrete"),
          beamType: String(inputs.beamType1 || "3x8"),
          wrapType: String(inputs.wrapType || "none"),
          hasPanel: productType !== "pergola",
          endCut: String(inputs.beamEndCut1 || "beveled"),
          showRafterTail: showRafterTails,
          mountStyle: String(inputs.mountStyle || "attached"),
          rearPostHeight: Number(inputs.rearPostHeight) || 0,
          rearBeamType: String(inputs.rearBeamType || inputs.beamType1 || "3x8"),
          rearEndCut: String(inputs.rearBeamEndCut || inputs.beamEndCut1 || "beveled"),
        }
      : null;

  // Same "does this job have a second run" rule as coverDiagramGeometry.ts's
  // hasRun2, so the text summary here always agrees with the diagram below it.
  const hasRun2 = Number(inputs.projection2) > 0 && Number(inputs.width2) > 0;
  const dimensions =
    inputs.width1 && inputs.projection1
      ? hasRun2
        ? Number(inputs.projection1) + "' x " + Number(inputs.width1) + "' + " + Number(inputs.projection2) + "' x " + Number(inputs.width2) + "'"
        : Number(inputs.projection1) + "' x " + Number(inputs.width1) + "'"
      : "";

  const mountStyle = String(inputs.mountStyle || "attached");
  const postHeight = inputs.postHeight1
    ? mountStyle === "freestanding" && inputs.rearPostHeight
      ? Number(inputs.postHeight1) + "' Front / " + Number(inputs.rearPostHeight) + "' Rear"
      : Number(inputs.postHeight1) + "'"
    : "";

  const deckHeight =
    String(inputs.groundAttachment || "") === "deck" && Number(inputs.deckHeight) > 0
      ? Number(inputs.deckHeight) + "'"
      : "";

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
    salesmanName: (inputs.salesman as string) || "",
    salesmanPhone: (inputs.salesmanPhone as string) || "",
    productType: String(quote.style || quote.product_type || ""),
    dimensions,
    postHeight,
    deckHeight,
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
    diagramInput,
    sideProfileInput,
  };
}
