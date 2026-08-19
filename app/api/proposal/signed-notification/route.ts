import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export async function POST(request: NextRequest) {
  try {
    const { proposalToken } = await request.json();
    if (!proposalToken) {
      return NextResponse.json({ error: "Missing proposalToken" }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data: proposal } = await supabase
      .from("proposals")
      .select("*, quotes(*, customers(*), companies(*))")
      .eq("token", proposalToken)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const quote = proposal.quotes as Record<string, unknown>;
    const customer = (quote.customers as Record<string, unknown>) || {};
    const company = (quote.companies as Record<string, unknown>) || {};
    const inputs = (quote.inputs as Record<string, unknown>) || {};

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Resolve the real salesman email via the quote's actual creator (auth
    // user record), not the free-text `salesman` display name on the quote -
    // that's just whatever full_name was on their profile when they built it.
    const recipients = new Set<string>();
    const createdBy = quote.created_by as string | null;
    if (createdBy) {
      const { data: userData } = await adminClient.auth.admin.getUserById(createdBy);
      if (userData?.user?.email) recipients.add(userData.user.email);
    }
    const officeEmail = (company.email as string) || "utahawnings@gmail.com";
    recipients.add(officeEmail);

    const jobName = (inputs.jobName as string) || (customer.name as string) || "Unknown Job";
    const salesman = (inputs.salesman as string) || "Utah Awnings";
    const total = (quote.total_job_sale as number) || 0;
    const proposalUrl = "https://uaquotepro.com/proposals/" + proposalToken;

    await resend.emails.send({
      from: "Utah Awnings <noreply@uaquotepro.com>",
      to: Array.from(recipients),
      subject: "Contract Signed - " + (customer.name as string) + " (" + jobName + ")",
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px; background: #f4f4f4;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <h2 style="color: #CC2229; margin: 0 0 8px;">A customer just signed!</h2>
    <p style="color: #444; line-height: 1.6; margin-bottom: 20px;">
      <strong>${customer.name}</strong> signed the contract for <strong>${jobName}</strong>.
    </p>
    <table style="width: 100%; font-size: 14px; margin-bottom: 24px;">
      <tr><td style="padding: 4px 0; color: #666;">Salesman</td><td style="padding: 4px 0; text-align: right;"><strong>${salesman}</strong></td></tr>
      <tr><td style="padding: 4px 0; color: #666;">Contract Total</td><td style="padding: 4px 0; text-align: right;"><strong>${fmt(total)}</strong></td></tr>
      <tr><td style="padding: 4px 0; color: #666;">Signed</td><td style="padding: 4px 0; text-align: right;"><strong>${new Date().toLocaleString()}</strong></td></tr>
    </table>
    <div style="text-align: center;">
      <a href="${proposalUrl}"
         style="background: #CC2229; color: white; padding: 12px 28px; border-radius: 10px;
                text-decoration: none; font-weight: 700; display: inline-block;">
        View Proposal
      </a>
    </div>
  </div>
</body>
</html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Signed notification error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
