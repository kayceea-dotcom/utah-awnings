"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AcceptInvitePage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Exchange the token from the URL hash for a real session
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        if (session?.user?.user_metadata?.full_name) {
          setName(session.user.user_metadata.full_name);
        }
        setReady(true);
      }
    });
  }, []);

  async function handleSetPassword() {
    if (!password || password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/quote");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
               style={{ backgroundColor: "#CC2229" }}>
            <span className="text-white text-xl font-black">UA</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Utah Awnings</h1>
          <p className="text-slate-400 text-sm mt-1">Sales Platform</p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-slate-800 text-lg font-semibold mb-1">
            Welcome{name ? ", " + name : ""}!
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Set a password to activate your account.
          </p>

          {!ready && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-blue-600 text-sm">Verifying your invite link...</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                className="input"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!ready}
              />
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                className="input"
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ready && handleSetPassword()}
                disabled={!ready}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleSetPassword}
              disabled={loading || !password || !confirm || !ready}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Setting up account..." : "Activate Account"}
            </button>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">uaquotepro.com</p>
      </div>
    </div>
  );
}
