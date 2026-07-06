"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/hooks/useProfile";
import TopBar from "@/components/TopBar";
import { UserPlus, Mail, Shield, RefreshCw } from "lucide-react";

interface TeamMember {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("sales_rep");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { profile } = useProfile();
  const supabase = createClient();

  async function loadMembers() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });
    setMembers(data || []);
    setLoading(false);
  }

  useEffect(() => { loadMembers(); }, []);

  async function handleInvite() {
    if (!inviteEmail || !inviteName) return;
    setSending(true);
    setMessage(null);

    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        full_name: inviteName,
        role: inviteRole,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage({ type: "error", text: data.error || "Failed to send invite" });
    } else {
      setMessage({ type: "success", text: inviteName + " has been invited! They will receive an email to set up their account." });
      setInviteEmail("");
      setInviteName("");
      setInviteRole("sales_rep");
      loadMembers();
    }
    setSending(false);
  }

  const roleLabel = (role: string) => {
    if (role === "admin") return "Admin";
    if (role === "manager") return "Manager";
    return "Sales Rep";
  };

  const roleColor = (role: string) => {
    if (role === "admin") return "bg-red-100 text-red-700";
    if (role === "manager") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-600";
  };

  if (profile?.role !== "admin" && profile?.role !== "manager") {
    return (
      <>
        <TopBar title="Team" subtitle="Manage your sales team" />
        <main className="flex-1 p-4 lg:p-6 flex items-center justify-center">
          <p className="text-gray-500 text-sm">You do not have permission to manage the team.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title="Team" subtitle="Invite and manage your sales team" />
      <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Invite Card */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus size={18} className="text-gray-500" />
              <h2 className="text-sm font-bold text-gray-800">Invite a Team Member</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="John Smith"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="john@utahawnings.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Role</label>
                <div className="relative">
                  <select
                    className="select pr-8"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="sales_rep">Sales Rep</option>
                    <option value="manager">Manager</option>
                    {profile?.role === "admin" && (
                      <option value="admin">Admin</option>
                    )}
                  </select>
                </div>
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
                onClick={handleInvite}
                disabled={sending || !inviteEmail || !inviteName}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail size={16} />
                {sending ? "Sending Invite..." : "Send Invite"}
              </button>
            </div>
          </div>

          {/* Team List */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-gray-500" />
                <h2 className="text-sm font-bold text-gray-800">
                  Team Members ({members.length})
                </h2>
              </div>
              <button onClick={loadMembers} className="text-gray-400 hover:text-gray-600 transition">
                <RefreshCw size={15} />
              </button>
            </div>

            {loading ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">Loading...</div>
            ) : members.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">No team members yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {members.map((member) => (
                  <div key={member.id} className="px-5 py-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white text-sm"
                         style={{ backgroundColor: "#CC2229" }}>
                      {member.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {member.full_name}
                        {member.id === profile?.id && (
                          <span className="ml-2 text-xs text-gray-400 font-normal">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={"inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold " + roleColor(member.role)}>
                      {roleLabel(member.role)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </>
  );
}
