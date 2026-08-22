import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getFollowUpStatus } from "@/lib/followups/engine";
import type { ProposalFollowUpTimestamps } from "@/lib/followups/types";

// Read-only mirror of /api/proposal/followup - same step validation, but
// only renders the HTML (optionally with an in-progress edited body) for a
// rep to preview. Never sends anything or touches proposals/*_sent_at.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { proposalToken, stepKey, customBody } = await request.json();
    if (!proposalToken || !stepKey) {
      return NextResponse.json({ error: "Token and stepKey required" }, { status: 400 });
    }

    const { data: proposal } = await supabase
      .from("proposals")
      .select("*, quotes(*, customers(*), companies(*))")
      .eq("token", proposalToken)
      .single();

    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

    const timestamps: ProposalFollowUpTimestamps = {
      initial_email_sent_at: proposal.initial_email_sent_at,
      followup1_sent_at: proposal.followup1_sent_at,
      followup2_sent_at: proposal.followup2_sent_at,
      final_followup_sent_at: proposal.final_followup_sent_at,
    };

    const status = getFollowUpStatus(timestamps);
    if (status.kind !== "action_due" || status.step.key !== stepKey) {
      return NextResponse.json({ error: "This step is not currently due" }, { status: 400 });
    }
    const step = status.step;

    if (step.sendRoute !== "followup-engine-route") {
      return NextResponse.json({ error: "Use /api/proposal to send the initial email" }, { status: 400 });
    }
    if (step.channel !== "email" || !step.buildHtml || !step.subject) {
      return NextResponse.json({ error: "Channel not yet supported" }, { status: 400 });
    }

    const quote = proposal.quotes as Record<string, unknown>;
    const customer = quote.customers as Record<string, unknown>;
    const company = quote.companies as Record<string, unknown>;

    const html = step.buildHtml({
      customerName: customer.name as string,
      customerEmail: customer.email as string,
      totalJobSale: quote.total_job_sale as number,
      depositAmount: quote.deposit_amount as number,
      balanceDue: quote.balance_due as number,
      proposalUrl: `https://uaquotepro.com/p/${proposalToken}`,
      logoUrl: (company.logo_url as string) || null,
    }, typeof customBody === "string" && customBody.trim() ? customBody : undefined);

    return NextResponse.json({ subject: step.subject, html, defaultBody: step.defaultBody });
  } catch (err) {
    console.error("Follow-up preview error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
