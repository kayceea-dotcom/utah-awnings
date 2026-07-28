"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

const PRODUCTS = [
  { slug: "flat-panel", label: "Flat Panel" },
  { slug: "irp", label: "IRP Insulated Roof" },
  { slug: "pergola", label: "Pergola" },
  { slug: "w-pan", label: "W-Pan Cover" },
  { slug: "metal-wall", label: "Metal Wall System" },
  { slug: "individual", label: "Individual Items" },
];

export default function ProductSwitcher({ current }: { current: string }) {
  const router = useRouter();

  return (
    <div className="relative inline-flex items-center">
      <select
        aria-label="Switch product"
        className="appearance-none bg-transparent border-0 p-0 pr-4 text-base lg:text-sm font-bold text-gray-900 truncate cursor-pointer focus:outline-none focus:ring-0"
        value={current}
        onChange={(e) => router.push("/quote/" + e.target.value)}
      >
        {PRODUCTS.map((p) => (
          <option key={p.slug} value={p.slug}>{p.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-0 text-gray-400 pointer-events-none" />
    </div>
  );
}
