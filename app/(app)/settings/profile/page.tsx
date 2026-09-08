"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/hooks/useProfile";
import TopBar from "@/components/TopBar";
import { User, Save, Bell, BellOff } from "lucide-react";
import { isPushSupported, getExistingSubscription, subscribeToPush, unsubscribeFromPush } from "@/lib/pushNotifications";

// Open to every role, unlike Settings > Team (admin/manager only) - a sales
// rep has no other way to set their own contact info, which now shows up on
// proposals and contracts customers see.
export default function MyProfilePage() {
  const { profile, loading } = useProfile();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [notifStatus, setNotifStatus] = useState<"checking" | "unsupported" | "denied" | "enabled" | "disabled">("checking");
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifError, setNotifError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  useEffect(() => {
    if (!isPushSupported()) {
      setNotifStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setNotifStatus("denied");
      return;
    }
    getExistingSubscription().then((sub) => setNotifStatus(sub ? "enabled" : "disabled"));
  }, []);

  async function handleToggleNotifications() {
    setNotifBusy(true);
    setNotifError("");
    try {
      if (notifStatus === "enabled") {
        await unsubscribeFromPush();
        setNotifStatus("disabled");
      } else {
        await subscribeToPush();
        setNotifStatus(Notification.permission === "denied" ? "denied" : "enabled");
      }
    } catch (err) {
      setNotifError(err instanceof Error ? err.message : "Failed to update notifications");
      if (Notification.permission === "denied") setNotifStatus("denied");
    }
    setNotifBusy(false);
  }

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

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={18} className="text-gray-500" />
              <h2 className="text-sm font-bold text-gray-800">Notifications</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Get a push notification on this device the moment a customer signs one of your jobs - in addition to the email you already get.
            </p>

            {notifStatus === "unsupported" ? (
              <p className="text-xs text-gray-400">Not supported on this browser.</p>
            ) : notifStatus === "denied" ? (
              <p className="text-xs text-red-500">
                Notifications are blocked for this site in your browser settings. Re-enable them there, then reload this page.
              </p>
            ) : (
              <>
                <button
                  onClick={handleToggleNotifications}
                  disabled={notifBusy || notifStatus === "checking"}
                  className="btn-secondary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {notifStatus === "enabled" ? <BellOff size={15} /> : <Bell size={15} />}
                  {notifBusy
                    ? "Working..."
                    : notifStatus === "checking"
                    ? "Checking..."
                    : notifStatus === "enabled"
                    ? "Disable on This Device"
                    : "Enable on This Device"}
                </button>
                {notifStatus === "enabled" && (
                  <p className="text-xs text-green-600 mt-2">Enabled on this device.</p>
                )}
              </>
            )}

            {notifError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-3">
                <p className="text-red-600 text-sm">{notifError}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
