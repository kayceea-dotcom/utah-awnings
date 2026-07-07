import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { email, full_name } = await request.json();

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate a password reset link
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: "https://uaquotepro.com/accept-invite" },
    });

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Failed to generate link" }, { status: 400 });
    }

    const resetLink = data.properties?.action_link || "https://uaquotepro.com/accept-invite";

    // Get company logo
    const { data: company } = await supabase
      .from("companies")
      .select("logo_url")
      .eq("slug", "utah-awnings")
      .single();

    const logoUrl = company?.logo_url || null;

    // Get sender profile
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    await resend.emails.send({
      from: "Utah Awnings <noreply@uaquotepro.com>",
      to: email,
      subject: "Set up your Utah Awnings Sales Platform account",
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f4;">
  <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="text-align: center; margin-bottom: 32px;">
      ${logoUrl
        ? `<img src="${logoUrl}" alt="Utah Awnings" style="max-height: 80px; max-width: 240px; object-fit: contain;" />`
        : `<div style="display: inline-block; background: #CC2229; border-radius: 12px; padding: 12px 20px;">
             <span style="color: white; font-size: 22px; font-weight: 900;">UA</span>
           </div>
           <h1 style="color: #1a1a1a; margin: 8px 0 4px;">Utah Awnings</h1>`
      }
      <p style="color: #666; margin: 0; font-size: 14px;">Sales Platform</p>
    </div>

    <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 8px;">Hi ${full_name},</h2>
    <p style="color: #444; line-height: 1.6; margin-bottom: 8px;">
      ${senderProfile?.full_name || "Your manager"} has sent you a new link to set up your
      <strong>Utah Awnings Sales Platform</strong> account.
    </p>
    <p style="color: #444; line-height: 1.6; margin-bottom: 24px;">
      Click the button below to set your password and get started.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetLink}"
         style="background: #CC2229; color: white; padding: 14px 32px; border-radius: 10px;
                text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">
        Set Up My Account
      </a>
    </div>

    <p style="color: #888; font-size: 13px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
      This link expires in 24 hours. If you need a new link contact your manager.
    </p>
    <p style="color: #bbb; font-size: 12px; text-align: center; margin-top: 16px;">
      uaquotepro.com - Utah Awnings Sales Platform
    </p>
  </div>
</body>
</html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
