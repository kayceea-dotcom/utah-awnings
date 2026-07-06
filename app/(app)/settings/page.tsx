"use client";

export const dynamic = "force-dynamic";

import TopBar from "@/components/TopBar";
import Link from "next/link";
import { Users, DollarSign, Building2 } from "lucide-react";

const sections = [
  { href: "/settings/team", icon: Users, label: "Team", desc: "Invite and manage salespeople" },
  { href: "/settings/pricing", icon: DollarSign, label: "Pricing", desc: "Update material price list" },
  { href: "/settings/company", icon: Building2, label: "Company", desc: "Logo, name, contact info" },
];

export default function SettingsPage() {
  return (
    <>
      <TopBar title="Settings" subtitle="Manage your account and preferences" />
      <main className="flex-1 p-4 lg:p-6">
        <div className="max-w-xl mx-auto space-y-3">
          {sections.map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="card p-4 flex items-center gap-4 hover:border-red-200 hover:shadow-md transition group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ backgroundColor: "#fdf2f2" }}>
                <Icon size={18} style={{ color: "#CC2229" }} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 group-hover:text-red-700 transition">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
