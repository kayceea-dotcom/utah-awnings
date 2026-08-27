export interface OrderSheetItem {
  name: string;
  qty: number;
  length: number | null;
  color: string;
}

export interface OrderSheetData {
  poNumber: string;
  jobName: string;
  salesman: string;
  salesmanPhone: string;
  customerName: string;
  installAddress: string;
  installDate: string;
  productType: string;
  notes: string;
  items: OrderSheetItem[];
}

// Shared by the preview route and the actual send route, so a rep previewing
// an order sees exactly what gets emailed/printed - never a re-implementation
// that could drift from the real thing.
export function buildOrderSheetData(proposal: Record<string, unknown>): OrderSheetData {
  const quote = proposal.quotes as Record<string, unknown>;
  const customer = quote.customers as Record<string, unknown>;
  const lineItems = (quote.line_items as Record<string, unknown>[]) || [];
  const inputs = quote.inputs as Record<string, unknown>;

  const jobName = (inputs?.jobName as string) || (customer.name as string) || "Unknown Job";
  const salesman = (inputs?.salesman as string) || "Utah Awnings";
  const poNumber = (jobName.toUpperCase().replace(/\s+/g, "-") + "-" + salesman.toUpperCase().replace(/\s+/g, "-")).slice(0, 40);
  const installDate = quote.estimated_install_date
    ? new Date(quote.estimated_install_date as string).toLocaleDateString()
    : "TBD";

  const items: OrderSheetItem[] = lineItems.map((item) => ({
    name: (item.name as string) || "",
    qty: (item.qty as number) ?? 0,
    length: (item.displayLength as number) ?? (item.length as number) ?? null,
    color: (item.color as string) || "",
  }));

  return {
    poNumber,
    jobName,
    salesman,
    // Falls back to the company's own number for quotes saved before each
    // rep had a phone number on their profile.
    salesmanPhone: (inputs?.salesmanPhone as string) || "801-979-5423",
    customerName: (customer.name as string) || "",
    installAddress: ((customer.address as string) || "") + " " + ((customer.city as string) || "") + ", UT " + ((customer.zip as string) || ""),
    installDate,
    productType: String(quote.style || quote.product_type || "").toUpperCase(),
    notes: (quote.notes as string) || "None",
    items,
  };
}

export function buildOrderSheetHtml(data: OrderSheetData): string {
  const tableRows = data.items.map((item) => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 8px 12px; font-size: 13px;">${item.name}</td>
      <td style="padding: 8px 12px; font-size: 13px; text-align: center;">${item.qty}</td>
      <td style="padding: 8px 12px; font-size: 13px; text-align: center;">${item.length || "-"}</td>
      <td style="padding: 8px 12px; font-size: 13px;">${item.color}</td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #1a1a1a;">

  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 3px solid #CC2229; padding-bottom: 16px;">
    <div>
      <h1 style="margin: 0; font-size: 24px; color: #CC2229;">Utah Awnings</h1>
      <p style="margin: 4px 0 0; color: #666; font-size: 13px;">1950 W Parkway Blvd, West Valley City, UT 84119</p>
      <p style="margin: 2px 0 0; color: #666; font-size: 13px;">174 Old Hwy 91 #27, Hurricane, UT 84737</p>
      <p style="margin: 2px 0 0; color: #666; font-size: 13px;">801-979-5423</p>
    </div>
    <div style="text-align: right;">
      <h2 style="margin: 0; font-size: 18px;">MATERIAL ORDER</h2>
      <p style="margin: 4px 0 0; font-size: 13px; color: #666;">Date: ${new Date().toLocaleDateString()}</p>
    </div>
  </div>

  <table style="width: 100%; margin-bottom: 24px; font-size: 13px;">
    <tr>
      <td style="padding: 4px 0; width: 50%;"><strong>PO Number:</strong> ${data.poNumber}</td>
      <td style="padding: 4px 0;"><strong>Job Name:</strong> ${data.jobName}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0;"><strong>Salesman:</strong> ${data.salesman}</td>
      <td style="padding: 4px 0;"><strong>Customer:</strong> ${data.customerName}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0;"><strong>Install Address:</strong> ${data.installAddress}</td>
      <td style="padding: 4px 0;"><strong>Est. Install Date:</strong> ${data.installDate}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0;"><strong>Product Type:</strong> ${data.productType}</td>
      <td style="padding: 4px 0;"><strong>Salesman Phone:</strong> ${data.salesmanPhone}</td>
    </tr>
  </table>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <thead>
      <tr style="background: #CC2229; color: white;">
        <th style="padding: 10px 12px; text-align: left; font-size: 13px;">Item Description</th>
        <th style="padding: 10px 12px; text-align: center; font-size: 13px;">Qty</th>
        <th style="padding: 10px 12px; text-align: center; font-size: 13px;">Length (ft)</th>
        <th style="padding: 10px 12px; text-align: left; font-size: 13px;">Color / Spec</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div style="border-top: 2px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #666;">
    <p style="margin: 0;"><strong>Notes:</strong> ${data.notes}</p>
    <p style="margin: 8px 0 0;">Please confirm receipt and estimated lead time. Contact salesman with any questions.</p>
  </div>

</body>
</html>
    `;
}
