// Free geocoding via OpenStreetMap Nominatim - no API key/billing account
// needed. Fine for this app's traffic (a rep looking up a handful of
// addresses a day); scoped to Utah and rate-limited to Nominatim's 1 req/sec
// usage policy isn't a concern at this volume, but we still send a proper
// User-Agent per their terms.
export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export async function geocodeUtahAddress(address: string): Promise<GeocodeResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", `${address}, Utah`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("countrycodes", "us");
  url.searchParams.set("limit", "1");

  const res = await fetch(url, {
    headers: { "User-Agent": "utah-awnings-quote-app (kayceea@gmail.com)" },
  });
  if (!res.ok) return null;

  const results = await res.json();
  if (!Array.isArray(results) || results.length === 0) return null;

  const top = results[0];
  return { lat: parseFloat(top.lat), lng: parseFloat(top.lon), displayName: top.display_name };
}
