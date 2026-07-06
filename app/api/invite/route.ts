import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Verify the requesting user is admin or manager
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "manager")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { email, full_name, role } = await request.json();

    if (!email || !full_name) {
      return NextResponse.json({ error: "Email and name are required" }, { status: 400 });
    }

    // Create user directly without triggering Supabase email
    const { error } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: { full_name, role: role || "sales_rep" },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Generate invite link manually
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo: "https://uaquotepro.com/accept-invite",
        data: { full_name, role: role || "sales_rep" },
      },
    });

    if (linkError || !linkData) {
      return NextResponse.json({ error: "Failed to generate invite link" }, { status: 400 });
    }

    const inviteLink = linkData.properties?.action_link || "https://uaquotepro.com/accept-invite";

    // Role display label
    const roleLabel = role === "admin" ? "Admin"
      : role === "manager" ? "Manager"
      : "Sales Rep";

    // Send our own branded email via Resend
    await resend.emails.send({
      from: "Utah Awnings <noreply@uaquotepro.com>",
      to: email,
      subject: "You're invited to join Utah Awnings Sales Platform",
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f4f4f4;">
  <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background: #CC2229; border-radius: 12px; padding: 12px 20px;">
        <span style="color: white; font-size: 22px; font-weight: 900;">UA</span>
      </div>
      <h1 style="color: #1a1a1a; margin: 16px 0 4px;">Utah Awnings</h1>
      <p style="color: #666; margin: 0; font-size: 14px;">Sales Platform</p>
    </div>
    <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 8px;">Hi ${full_name}, you have been invited!</h2>
    <p style="color: #444; line-height: 1.6; margin-bottom: 8px;">
      <strong>${profile.full_name}</strong> has added you to the
      <strong>Utah Awnings Sales Platform</strong> as a <strong>${roleLabel}</strong>.
    </p>
    <p style="color: #444; line-height: 1.6; margin-bottom: 24px;">
      Click the button below to set your password and get started building quotes.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${inviteLink}"
         style="background: #CC2229; color: white; padding: 14px 32px; border-radius: 10px;
                text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">
        Activate My Account
      </a>
    </div>
    <p style="color: #888; font-size: 13px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
      If you were not expecting this invite, you can safely ignore this email.<br>
      Questions? Reply to this email or contact your manager.
    </p>
    <p style="color: #bbb; font-size: 12px; text-align: center; margin-top: 16px;">
      uaquotepro.com &middot; Utah Awnings Sales Platform
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
