import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { INSTALL_CHECKLIST } from "@/lib/installChecklist";

const resend = new Resend(process.env.RESEND_API_KEY);
const OFFICE_EMAIL = "utahawnings@gmail.com";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { quoteId, checklist, photos } = await request.json();
    if (!quoteId) return NextResponse.json({ error: "Missing job" }, { status: 400 });
    if (!INSTALL_CHECKLIST.every((i) => checklist?.[i.key] === true)) {
      return NextResponse.json({ error: "Every checklist item must be checked" }, { status: 400 });
    }
    if (!Array.isArray(photos) || photos.length < 1) {
      return NextResponse.json({ error: "Add at least one photo of the finished job" }, { status: 400 });
    }

    // The database function re-checks that this job is assigned to the caller
    // and isn't already finished - it's what actually marks the job complete.
    const { data: completedAt, error: rpcError } = await supabase.rpc("installer_finish_job", {
      p_quote_id: quoteId, p_checklist: checklist, p_photos: photos,
    });
    if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 400 });

    // From here the job is finished no matter what - a notification problem is
    // logged but never reported back as the job failing.
    try {
      const { data: quote } = await supabase
        .from("quotes")
        .select("created_by, inputs, customers(name), proposals(token)")
        .eq("id", quoteId)
        .single();
      const q = quote as unknown as {
        created_by: string | null;
        inputs: Record<string, unknown> | null;
        customers: { name: string } | null;
        proposals: { token: string }[] | { token: string } | null;
      } | null;

      const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const recipients = new Set<string>([OFFICE_EMAIL]);
      if (q?.created_by) {
        const { data: userData } = await adminClient.auth.admin.getUserById(q.created_by);
        if (userData?.user?.email) recipients.add(userData.user.email);
        const { data: repProfile } = await adminClient.from("profiles").select("email").eq("id", q.created_by).single();
        if (repProfile?.email) recipients.add(repProfile.email);
      }
      const { data: installer } = await adminClient.from("profiles").select("full_name").eq("id", user.id).single();

      const jobName = (q?.inputs?.jobName as string) || q?.customers?.name || "Job";
      const customerName = q?.customers?.name || "";
      const proposal = Array.isArray(q?.proposals) ? q?.proposals[0] : q?.proposals;
      const link = proposal?.token ? "https://uaquotepro.com/proposals/" + proposal.token : "https://uaquotepro.com/jobs";
      const thumbs = (photos as string[]).slice(0, 6)
        .map((u) => `<a href="${u}"><img src="${u}" width="150" style="border-radius:8px;margin:0 6px 6px 0;" /></a>`).join("");

      const { error: sendError } = await resend.emails.send({
        from: "Utah Awnings <noreply@uaquotepro.com>",
        to: Array.from(recipients),
        subject: "Install finished - " + customerName + " (" + jobName + ")",
        html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px; background: #f4f4f4;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    <h2 style="color: #CC2229; margin: 0 0 8px;">Install finished</h2>
    <p style="color: #444; line-height: 1.6;">
      <strong>${installer?.full_name || "The installer"}</strong> finished <strong>${jobName}</strong>${customerName ? " for <strong>" + customerName + "</strong>" : ""}.
      Every checklist item is checked and ${photos.length} photo${photos.length === 1 ? "" : "s"} ${photos.length === 1 ? "was" : "were"} uploaded.
    </p>
    <div style="margin: 16px 0;">${thumbs}</div>
    <div style="text-align: center;">
      <a href="${link}" style="background: #CC2229; color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; display: inline-block;">View job</a>
    </div>
  </div>
</body>
</html>`,
      });
      if (sendError) console.error("Install-finished email send error:", sendError);
    } catch (notifyErr) {
      console.error("Install-finished notification error:", notifyErr);
    }

    return NextResponse.json({ success: true, completedAt });
  } catch (err) {
    console.error("Installer finish error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
