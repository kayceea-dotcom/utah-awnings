"use client";

import { useState, useEffect, useRef } from "react";
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
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;

    async function exchangeToken() {
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            setError("Invalid or expired invite link. Please request a new invite.");
            return;
          }
          if (sessionData.user?.user_metadata?.full_name) {
            setName(sessionData.user.user_metadata.full_name);
          }
          setReady(true);
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        if (session.user?.user_metadata?.full_name) {
          setName(session.user.user_metadata.full_name);
        }
        setReady(true);
      } else {
        setError("Invalid or expired invite link. Please request a new invite.");
      }
    }

    exchangeToken();
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

    const { error } = await supabaseRef.current.auth.updateUser({ password });
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

          {!ready && !error && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4">
              <p className="text-blue-600 text-sm">Verifying your invite link...</p>
            </div>
          )}

          {ready && (
            <div className="space-y-4">
              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  onKeyDown={(e) => e.key === "Enter" && handleSetPassword()}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {ready && (
            <button
              onClick={handleSetPassword}
              disabled={loading || !password || !confirm}
              className="btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Setting up account..." : "Activate Account"}
            </button>
          )}
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">uaquotepro.com</p>
      </div>
    </div>
  );
}
