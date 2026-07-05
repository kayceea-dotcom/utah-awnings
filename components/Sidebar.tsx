"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, Users, Briefcase, FileText, BarChart2, Settings, ChevronRight } from "lucide-react";
import UserMenu from "@/components/UserMenu";

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
  return (
    <aside className="fixed inset-y-0 left-0 w-56 bg-slate-900 flex flex-col z-30">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center">
            <span className="text-white text-xs font-black">UA</span>
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-none">Utah Awnings</p>
            <p className="text-slate-400 text-xs mt-0.5">Sales Platform</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={"flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition " +
                (active ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white")}
            >
              <Icon size={16} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>
      <UserMenu />
    </aside>
  );
}
