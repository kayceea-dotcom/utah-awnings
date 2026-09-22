import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { geocodeUtahAddress } from "@/lib/snowLoad/geocode";
import { getGroundSnowLoad } from "@/lib/snowLoad/grid";
import { convertToDesignSnowLoad } from "@/lib/snowLoad/conversionTable";

// Washington County (and Mesquite, NV, just across the state line and off
// the Utah map entirely) is warm-desert low-elevation terrain where almost
// every builder there designs to a flat 10 psf regardless of what the
// PRISM-model map says for a specific point (which floors at 21 psf raw /
// 20 psf design - see lib/snowLoad/grid.ts). This only fires on the bare
// county/city name itself, not on a real address or town within it - a real
// address should still get its own computed value.
const FLAT_10PSF_OVERRIDES: Record<string, string> = {
  "washington county": "Washington County, UT",
  "mesquite": "Mesquite, NV",
};

function matchFlatOverride(rawAddress: string): string | null {
  const normalized = rawAddress
    .trim()
    .toLowerCase()
    .replace(/,?\s*(ut|utah|nv|nevada)\.?$/i, "")
    .trim();
  return FLAT_10PSF_OVERRIDES[normalized] || null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { address } = await request.json();
    if (!address) return NextResponse.json({ error: "Address required" }, { status: 400 });

    const overrideLabel = matchFlatOverride(address);
    if (overrideLabel) {
      return NextResponse.json({
        matchedAddress: `${overrideLabel} (local building convention, not map-derived)`,
        lat: 0,
        lng: 0,
        rawPsf: 14,
        designPsf: 10,
        exceedsTable: false,
        outOfStudyRegion: false,
      });
    }

    const geocode = await geocodeUtahAddress(address);
    if (!geocode) return NextResponse.json({ error: "Could not find that address" }, { status: 404 });

    const { psf: rawPsf, outOfStudyRegion } = getGroundSnowLoad(geocode.lat, geocode.lng);
    const conversion = convertToDesignSnowLoad(rawPsf);

    return NextResponse.json({
      matchedAddress: geocode.displayName,
      lat: geocode.lat,
      lng: geocode.lng,
      rawPsf,
      designPsf: conversion.designPsf,
      exceedsTable: conversion.exceedsTable,
      outOfStudyRegion,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
