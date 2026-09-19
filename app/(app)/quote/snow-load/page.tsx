"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import TopBar from "@/components/TopBar";

interface SnowLoadResult {
  matchedAddress: string;
  lat: number;
  lng: number;
  rawPsf: number;
  designPsf: number;
  exceedsTable: boolean;
  outOfStudyRegion: boolean;
}

export default function SnowLoadLookupPage() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SnowLoadResult | null>(null);

  async function lookup() {
    if (!address.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/snow-load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Lookup failed");
      } else {
        setResult(data);
      }
    } catch {
      setError("Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TopBar title="Snow Load Lookup" subtitle="Ground snow load for a Utah address, converted to our engineering design tables" />
      <main className="flex-1 p-6">
        <div className="max-w-xl mx-auto space-y-4">
          <div className="card p-4 space-y-3">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Job Address</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && lookup()}
                placeholder="1950 W Pkwy Blvd, West Valley City, UT"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={lookup}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: "#CC2229" }}
              >
                {loading ? "Looking up..." : "Look Up"}
              </button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          {result && (
            <div className="card p-5 space-y-4">
              <p className="text-xs text-slate-500">{result.matchedAddress}</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ground Snow Load</p>
                  <p className="text-2xl font-black text-slate-900">{result.rawPsf} psf</p>
                  <p className="text-xs text-slate-400">utahsnowload.usu.edu</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Use This Design Table</p>
                  <p className="text-2xl font-black" style={{ color: "#CC2229" }}>{result.designPsf} psf</p>
                  <p className="text-xs text-slate-400">converted per 4STEL 2024 IBC letter</p>
                </div>
              </div>

              {result.exceedsTable && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  This site&apos;s ground snow load is above the top of our conversion table (120 psf / 2024 IBC).
                  Needs a site-specific engineering review before quoting a span.
                </p>
              )}
              {result.outOfStudyRegion && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  This region wasn&apos;t well covered by the underlying study - the value may be less reliable.
                  A site-specific study is recommended for a build near this load.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
