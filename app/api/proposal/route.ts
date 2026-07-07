import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { proposalToken } = await request.json();
    if (!proposalToken) return NextResponse.json({ error: "Token required" }, { status: 400 });

    // Fetch proposal with quote and customer
    const { data: proposal } = await supabase
      .from("proposals")
      .select("*, quotes(*, customers(*), companies(*))")
      .eq("token", proposalToken)
      .single();

    if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

    const quote = proposal.quotes as Record<string, unknown>;
    const customer = quote.customers as Record<string, unknown>;
    const company = quote.companies as Record<string, unknown>;

    const proposalUrl = `https://uaquotepro.com/p/${proposalToken}`;
    const logoUrl = company.logo_url as string || null;
    const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

    await resend.emails.send({
      from: "Utah Awnings <noreply@uaquotepro.com>",
      to: customer.email as string,
      subject: "Your Utah Awnings Proposal - Ready to Review",
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f4;">
  <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

    <div style="text-align: center; margin-bottom: 32px;">
      ${logoUrl
        ? `<img src="${logoUrl}" alt="Utah Awnings" style="max-height: 80px; max-width: 240px; object-fit: contain; margin-bottom: 8px;" />`
        : `<div style="display: inline-block; background: #CC2229; border-radius: 12px; padding: 12px 20px; margin-bottom: 8px;">
             <span style="color: white; font-size: 22px; font-weight: 900;">UA</span>
           </div>
           <h1 style="color: #1a1a1a; margin: 8px 0 4px;">Utah Awnings</h1>`
      }
      <p style="color: #666; margin: 0; font-size: 14px;">Your Complete Shade Solution</p>
    </div>

    <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 8px;">Hi ${customer.name as string},</h2>
    <p style="color: #444; line-height: 1.6; margin-bottom: 16px;">
      Thank you for choosing Utah Awnings! Your proposal is ready to review.
      Please click the button below to view your contract, review the details, and accept your quote.
    </p>

    <div style="background: #f9f9f9; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
      <table style="width: 100%; font-size: 14px;">
        <tr>
          <td style="color: #666; padding: 4px 0;">Contract Total</td>
          <td style="text-align: right; font-weight: bold; color: #CC2229; font-size: 18px;">${fmt(quote.total_job_sale as number)}</td>
        </tr>
        <tr>
          <td style="color: #666; padding: 4px 0;">Deposit Required</td>
          <td style="text-align: right; font-weight: bold;">${fmt(quote.deposit_amount as number)}</td>
        </tr>
        <tr>
          <td style="color: #666; padding: 4px 0;">Due on Completion</td>
          <td style="text-align: right; font-weight: bold;">${fmt(quote.balance_due as number)}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${proposalUrl}"
         style="background: #CC2229; color: white; padding: 14px 32px; border-radius: 10px;
                text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">
        Review &amp; Accept Proposal
      </a>
    </div>

    <p style="color: #888; font-size: 13px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
      Questions? Call us at <strong>801-979-5423</strong> or reply to this email.<br>
      1950 W Parkway Blvd, West Valley City, UT 84119 &nbsp;|&nbsp; 174 Old Hwy 91 #27, Hurricane, UT 84737
    </p>

    <p style="color: #bbb; font-size: 12px; text-align: center; margin-top: 16px;">
      uaquotepro.com &middot; Utah Awnings Sales Platform
    </p>
  </div>
</body>
</html>
      `,
    });

    // Update proposal status to sent
    await supabase
      .from("proposals")
      .update({ status: "sent" })
      .eq("token", proposalToken);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
