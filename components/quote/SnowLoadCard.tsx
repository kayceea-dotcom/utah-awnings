"use client";

import { useState } from "react";
import Field from "./Field";

export interface SiteSnowLoad {
  address: string;
  rawPsf: number;
  designPsf: number;
  exceedsTable: boolean;
}

interface Props {
  value: SiteSnowLoad | null;
  onChange: (v: SiteSnowLoad | null) => void;
}

// Optional per-job snow load lookup, feeding the span-check warnings shown
// under each panel run below. Left blank, no span check runs - this never
// blocks building a quote, it only adds a heads-up when a site's load is
// filled in and a run is entered too long for the selected panel.
export default function SnowLoadCard({ value, onChange }: Props) {
  const [address, setAddress] = useState(value?.address || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup() {
    if (!address.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/snow-load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Lookup failed");
        onChange(null);
      } else {
        onChange({ address: data.matchedAddress, rawPsf: data.rawPsf, designPsf: data.designPsf, exceedsTable: data.exceedsTable });
      }
    } catch {
      setError("Lookup failed");
      onChange(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="col-span-2">
      <Field label="Site Snow Load" hint="Optional - checks each run's span against our engineering tables">
        <div className="flex gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="Job address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
          />
          <button
            type="button"
            onClick={lookup}
            disabled={loading}
            className="btn-secondary text-xs px-3 whitespace-nowrap disabled:opacity-50"
          >
            {loading ? "Looking up..." : "Look Up"}
          </button>
        </div>
      </Field>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {value && (
        <p className="text-xs text-slate-500 mt-1">
          {value.rawPsf} psf ground snow load → checking spans against <span className="font-semibold">{value.designPsf} psf</span> design table
          {value.exceedsTable && " (above our conversion table's top tier - has an engineer review this site)"}
        </p>
      )}
    </div>
  );
}
