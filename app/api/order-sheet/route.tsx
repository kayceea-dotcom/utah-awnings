import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildOrderSheetData, buildOrderSheetHtml } from "@/lib/orderSheet";
import OrderSheetPdf from "@/lib/orderSheet.pdf";

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

    const data = buildOrderSheetData(proposal);
    const html = buildOrderSheetHtml(data);
    const pdfBuffer = await renderToBuffer(<OrderSheetPdf data={data} />);

    // Send to Wholesale Patio Supply, with a printable PDF copy attached
    await resend.emails.send({
      from: "Utah Awnings Orders <noreply@uaquotepro.com>",
      to: "sales@wpatio.com",
      cc: "info@utahawnings.com",
      subject: "Material Order - PO# " + data.poNumber + " - " + data.jobName,
      html,
      attachments: [
        { filename: "Order-" + data.poNumber + ".pdf", content: pdfBuffer },
      ],
    });

    // Update proposal status
    await supabase
      .from("proposals")
      .update({ status: "ordered" })
      .eq("token", proposalToken);

    return NextResponse.json({ success: true, poNumber: data.poNumber });
  } catch (err) {
    console.error("Order sheet error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
