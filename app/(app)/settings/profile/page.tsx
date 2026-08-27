"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/hooks/useProfile";
import TopBar from "@/components/TopBar";
import { User, Save } from "lucide-react";

// Open to every role, unlike Settings > Team (admin/manager only) - a sales
// rep has no other way to set their own contact info, which now shows up on
// proposals and contracts customers see.
export default function MyProfilePage() {
  const { profile, loading } = useProfile();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  async function handleSave() {
    if (!profile || !fullName || !phone) return;
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("id", profile.id);

    if (error) {
      setMessage({ type: "error", text: "Failed to save: " + error.message });
    } else {
      setMessage({ type: "success", text: "Profile saved!" });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <>
        <TopBar title="My Profile" />
        <main className="flex-1 p-4 lg:p-6 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Loading...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title="My Profile" subtitle="Your name and contact info" />
      <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
        <div className="max-w-xl mx-auto space-y-5">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <User size={18} className="text-gray-500" />
              <h2 className="text-sm font-bold text-gray-800">Your Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input type="text" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input type="text" className="input" placeholder="(801) 555-1234" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">Shown to customers on proposals and contracts - required.</p>
              </div>

              {message && (
                <div className={"rounded-xl px-4 py-3 text-sm font-medium " +
                  (message.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700")}>
                  {message.text}
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !fullName || !phone}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={15} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
