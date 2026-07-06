"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Calculator, Users, Briefcase, FileText,
  BarChart2, Settings, ChevronRight, Menu, X, LogOut, User
} from "lucide-react";
import { useProfile } from "@/lib/hooks/useProfile";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

const nav = [
  { href: "/quote",     icon: Calculator, label: "Quote Builder" },
  { href: "/customers", icon: Users,       label: "Customers" },
  { href: "/jobs",      icon: Briefcase,   label: "Jobs" },
  { href: "/proposals", icon: FileText,    label: "Proposals" },
  { href: "/reports",   icon: BarChart2,   label: "Reports" },
  { href: "/settings",  icon: Settings,    label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("Utah Awnings");
  const { profile } = useProfile();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadCompany() {
      const { data } = await supabase
        .from("companies")
        .select("logo_url, name")
        .eq("slug", "utah-awnings")
        .single();
      if (data) {
        setLogoUrl(data.logo_url || null);
        setCompanyName(data.name || "Utah Awnings");
      }
    }
    loadCompany();
  }, []);

  // Close sidebar on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when sidebar open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-charcoal-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <Image src={logoUrl} alt="Logo" width={140} height={48} className="object-contain max-h-12" />
          ) : (
            <>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ backgroundColor: "#CC2229" }}>
                <span className="text-white text-sm font-black">UA</span>
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-none">{companyName}</p>
                <p className="text-charcoal-400 text-xs mt-0.5">Sales Platform</p>
              </div>
            </>
          )}
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden text-charcoal-400 hover:text-white transition p-1"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={"flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition " +
                (active
                  ? "text-white"
                  : "text-charcoal-400 hover:bg-charcoal-700 hover:text-white")}
              style={active ? { backgroundColor: "#CC2229" } : {}}
            >
              <Icon size={18} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-charcoal-700">
        {profile && (
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-charcoal-700">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                 style={{ backgroundColor: "#CC2229" }}>
              <User size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">{profile.full_name}</p>
              <p className="text-charcoal-400 text-xs capitalize">
                {profile.role.replace("_", " ")}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-charcoal-400 hover:text-white transition p-1"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
        <p className="text-charcoal-500 text-xs text-center mt-3">uaquotepro.com</p>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar (fixed left) ── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col z-30 bg-charcoal-800">
        <SidebarContent />
      </aside>

      {/* ── Mobile/tablet top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-charcoal-800 border-b border-charcoal-700 flex items-center px-4 h-14">
        <button
          onClick={() => setOpen(true)}
          className="text-white p-2 -ml-2 touch-target flex items-center justify-center"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2.5 ml-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden"
               style={{ backgroundColor: logoUrl ? "transparent" : "#CC2229" }}>
            {logoUrl ? (
              <Image src={logoUrl} alt="Logo" width={28} height={28} className="object-contain w-full h-full" />
            ) : (
              <span className="text-white text-xs font-black">UA</span>
            )}
          </div>
          <span className="text-white text-sm font-bold">{companyName}</span>
        </div>
        {profile && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-charcoal-400 text-xs font-medium">{profile.full_name}</span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center"
                 style={{ backgroundColor: "#CC2229" }}>
              <User size={13} className="text-white" />
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile/tablet overlay ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile/tablet slide-in drawer ── */}
      <aside
        className={"lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-charcoal-800 flex flex-col transition-transform duration-300 " +
          (open ? "translate-x-0" : "-translate-x-full")}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
