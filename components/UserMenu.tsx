"use client";

import { useProfile } from "@/lib/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

export default function UserMenu() {
  const { profile } = useProfile();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (!profile) return null;

  return (
    <div className="px-3 py-3 border-t border-slate-800">
      <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <User size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold truncate">{profile.full_name}</p>
          <p className="text-slate-500 text-xs capitalize">{profile.role.replace("_", " ")}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-slate-500 hover:text-white transition"
          title="Sign out"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
