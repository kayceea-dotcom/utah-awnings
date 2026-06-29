import Link from "next/link";
import TopBar from "@/components/TopBar";

const products = [
  { slug: "newport", label: "Newport Patio Cover", desc: "T6 flat pan, standard residential" },
  { slug: "flat-pan", label: "Flat Pan Cover", desc: "T6 or 8in flat pan, extruded gutter" },
  { slug: "irp", label: "IRP Insulated Roof", desc: "3in / 4in / 6in insulated roof panel" },
  { slug: "pergola", label: "Pergola", desc: "2x6 rafters, 2x2 lattice tubing" },
  { slug: "w-pan", label: "W-Pan Cover", desc: "Tri-V W-Pan, DuraKing options" },
  { slug: "metal-wall", label: "Metal Wall System", desc: "29g tuf-rib horizontal / vertical" },
  { slug: "individual", label: "Individual Items", desc: "Custom line-item / mixed job" },
];

export default function QuotePage() {
  return (
    <>
      <TopBar title="Quote Builder" subtitle="Select a product to start a quote" />
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="section-heading">Select Product</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((p) => (
              <Link
                key={p.slug}
                href={"/quote/" + p.slug}
                className="card p-4 hover:border-blue-300 hover:shadow-md transition group flex gap-3 items-start"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">
                    {p.label.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition">{p.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
