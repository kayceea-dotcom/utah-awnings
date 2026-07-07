import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { proposalToken } = await request.json();

    const supabase = await createServerClient();

    // Fetch full proposal data
    const { data: proposal } = await supabase
      .from("proposals")
      .select("*, quotes(*, customers(*), companies(*))")
      .eq("token", proposalToken)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

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

    // Build HTML table for order sheet
    const tableRows = lineItems.map((item) => {
      const qty = item.qty as number;
      const length = item.length as number;
      const name = item.name as string;
      const color = item.color as string || "";
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 12px; font-size: 13px;">${name}</td>
          <td style="padding: 8px 12px; font-size: 13px; text-align: center;">${qty}</td>
          <td style="padding: 8px 12px; font-size: 13px; text-align: center;">${length || "-"}</td>
          <td style="padding: 8px 12px; font-size: 13px;">${color}</td>
        </tr>
      `;
    }).join("");

    const html = `
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
      <td style="padding: 4px 0; width: 50%;"><strong>PO Number:</strong> ${poNumber}</td>
      <td style="padding: 4px 0;"><strong>Job Name:</strong> ${jobName}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0;"><strong>Salesman:</strong> ${salesman}</td>
      <td style="padding: 4px 0;"><strong>Customer:</strong> ${customer.name as string}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0;"><strong>Install Address:</strong> ${(customer.address as string) || ""} ${(customer.city as string) || ""}, UT ${(customer.zip as string) || ""}</td>
      <td style="padding: 4px 0;"><strong>Est. Install Date:</strong> ${installDate}</td>
    </tr>
    <tr>
      <td style="padding: 4px 0;"><strong>Product Type:</strong> ${String(quote.style || quote.product_type || "").toUpperCase()}</td>
      <td style="padding: 4px 0;"><strong>Salesman Phone:</strong> 801-979-5423</td>
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
    <p style="margin: 0;"><strong>Notes:</strong> ${(quote.notes as string) || "None"}</p>
    <p style="margin: 8px 0 0;">Please confirm receipt and estimated lead time. Contact salesman with any questions.</p>
  </div>

</body>
</html>
    `;

    // Send to Wholesale Patio Supply
    await resend.emails.send({
      from: "Utah Awnings Orders <noreply@uaquotepro.com>",
      to: "sales@wpatio.com",
      cc: "info@utahawnings.com",
      subject: "Material Order - PO# " + poNumber + " - " + jobName,
      html,
    });

    // Update proposal status
    await supabase
      .from("proposals")
      .update({ status: "ordered" })
      .eq("token", proposalToken);

    return NextResponse.json({ success: true, poNumber });
  } catch (err) {
    console.error("Order sheet error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
