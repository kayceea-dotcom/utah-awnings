"use client";

import type { RunConfig } from "@/lib/scene/types";
import { FAN_BEAM_PROFILE } from "@/lib/scene/beamProfiles";
import Beam from "./Beam";

interface FanBeamProps {
  qty: number;
  lengthFt: number;
  run: RunConfig;
  colorName: string;
}

export default function FanBeam({ qty, lengthFt, run, colorName }: FanBeamProps) {
  if (qty <= 0 || lengthFt <= 0) return null;

  const items = [];
  for (let i = 0; i < qty; i++) {
    const z = (run.projectionFt * (i + 1)) / (qty + 1);
    items.push(
      <Beam
        key={i}
        widthFt={lengthFt}
        xOffsetFt={run.originOffsetFt + (run.widthFt - lengthFt) / 2}
        heightFt={run.postHeightFt}
        zFt={z}
        colorName={colorName}
        profileOverride={FAN_BEAM_PROFILE}
      />
    );
  }
  return <>{items}</>;
}
