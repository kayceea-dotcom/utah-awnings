import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

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
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "manager")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use service role client to invite user
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { email, full_name, role } = await request.json();

    if (!email || !full_name) {
      return NextResponse.json({ error: "Email and name are required" }, { status: 400 });
    }

    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role: role || "sales_rep" },
      redirectTo: "https://uaquotepro.com/accept-invite",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
