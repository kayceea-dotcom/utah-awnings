"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useProfile } from "@/lib/hooks/useProfile";

// Installers have their own area (/installer) plus their profile page. Anywhere
// else in the app sends them back to their jobs - the quote builder, customers,
// proposals and reports aren't theirs to see.
export default function InstallerGuard() {
  const { profile } = useProfile();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (profile?.role !== "installer") return;
    const allowed = pathname.startsWith("/installer") || pathname.startsWith("/settings/profile");
    if (!allowed) router.replace("/installer");
  }, [profile?.role, pathname, router]);

  return null;
}
