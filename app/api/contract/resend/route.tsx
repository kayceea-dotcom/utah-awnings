import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { Resend } from "resend";
import { buildContractData } from "@/lib/contract";
import ContractPdf from "@/lib/contract.pdf";

const resend = new Resend(process.env.RESEND_API_KEY);
const OFFICE_EMAIL = "utahawnings@gmail.com";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { proposalToken } = await request.json();
    if (!proposalToken) return NextResponse.json({ error: "Token required" }, { status: 400 });

    const { data: proposal } = await supabase
      .from("proposals")
      .select("*, quotes(*, customers(*), companies(*))")
      .eq("token", proposalToken)
      .single();

    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

    const status = proposal.status as string;
    if (status !== "signed" && status !== "accepted" && status !== "ordered") {
      return NextResponse.json({ error: "This proposal hasn't been signed yet" }, { status: 400 });
    }

    const data = buildContractData(proposal);
    const pdfBuffer = await renderToBuffer(<ContractPdf data={data} />);
    const filename = "Contract-" + data.jobName.replace(/\s+/g, "-") + ".pdf";

    await resend.emails.send({
      from: "Utah Awnings <noreply@uaquotepro.com>",
      to: OFFICE_EMAIL,
      subject: "Signed Contract - " + data.customerName + " (" + data.jobName + ")",
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px; background: #f4f4f4;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <h2 style="color: #CC2229; margin: 0 0 8px;">Signed contract attached</h2>
    <p style="color: #444; line-height: 1.6;">
      The signed contract for <strong>${data.customerName}</strong> (${data.jobName}) is attached as a PDF.
    </p>
  </div>
</body>
</html>
      `,
      attachments: [{ filename, content: pdfBuffer }],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contract resend error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
