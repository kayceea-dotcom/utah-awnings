import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { buildOrderSheetData, buildOrderSheetHtml } from "@/lib/orderSheet";

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

    const data = buildOrderSheetData(proposal);
    const html = buildOrderSheetHtml(data);

    return NextResponse.json({ html, poNumber: data.poNumber });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
