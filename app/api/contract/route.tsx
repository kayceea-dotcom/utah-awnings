import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildContractData } from "@/lib/contract";
import ContractPdf from "@/lib/contract.pdf";

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

    const data = buildContractData(proposal);
    const pdfBuffer = await renderToBuffer(<ContractPdf data={data} />);
    // Same PDF serves as the pre-signature quote and the post-signature
    // contract - matches the docTitle switch inside ContractPdf itself.
    const isSigned = data.status === "signed" || data.status === "accepted" || data.status === "pending_payment" || data.status === "ordered";
    const filename = (isSigned ? "Contract-" : "Quote-") + data.jobName.replace(/\s+/g, "-") + ".pdf";

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Contract PDF error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
