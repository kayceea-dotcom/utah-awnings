import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildOrderSheetData, buildOrderSheetHtml } from "@/lib/orderSheet";
import OrderSheetPdf from "@/lib/orderSheet.pdf";

const resend = new Resend(process.env.RESEND_API_KEY);

// Lets a rep download/print the exact same order-sheet PDF that POST emails
// to the supplier, without sending anything or touching the proposal's
// status - previously the only way to see this PDF at all was in the
// supplier's inbox. Mirrors /api/contract's GET (same renderToBuffer +
// inline Content-Disposition pattern) so it opens/prints the same way on
// any device, including mobile.
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data: proposal } = await supabase
      .from("proposals")
      .select("*, quotes(*, customers(*), companies(*))")
      .eq("token", token)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const data = buildOrderSheetData(proposal);
    const pdfBuffer = await renderToBuffer(<OrderSheetPdf data={data} />);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Order-${data.poNumber}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Order sheet PDF error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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
      cc: ["info@utahawnings.com", "utahawnings@gmail.com"],
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
