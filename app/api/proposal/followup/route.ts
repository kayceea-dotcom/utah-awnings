import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { getFollowUpStatus } from "@/lib/followups/engine";
import type { ProposalFollowUpTimestamps } from "@/lib/followups/types";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { proposalToken, stepKey } = await request.json();
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

    // Never trust the client-supplied stepKey: re-derive server-side which
    // step is actually due so a stale tab or forged request can't skip or
    // replay a step out of order.
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
    });

    await resend.emails.send({
      from: "Utah Awnings <noreply@uaquotepro.com>",
      to: customer.email as string,
      subject: step.subject,
      html,
    });

    await supabase
      .from("proposals")
      .update({ [step.fieldName]: new Date().toISOString() })
      .eq("token", proposalToken);

    return NextResponse.json({ success: true, step: step.key });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
