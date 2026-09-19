import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { geocodeUtahAddress } from "@/lib/snowLoad/geocode";
import { getGroundSnowLoad } from "@/lib/snowLoad/grid";
import { convertToDesignSnowLoad } from "@/lib/snowLoad/conversionTable";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { address } = await request.json();
    if (!address) return NextResponse.json({ error: "Address required" }, { status: 400 });

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
