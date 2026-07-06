import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Profile {
  id: string;
  full_name: string;
  role: "admin" | "manager" | "sales_rep";
  company_id: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log("useProfile - user:", user?.id, "error:", userError);
      if (!user) { setLoading(false); return; }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      console.log("useProfile - profile:", data, "error:", profileError);
      setProfile(data);
      setLoading(false);
    }
    load();
  }, []);

  return { profile, loading };
}
