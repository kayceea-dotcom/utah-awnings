"use client";

import { Line, Text, Billboard } from "@react-three/drei";
import type { RunConfig } from "@/lib/scene/types";
import { computeFrontEdgeHeightFt, formatFeetInches } from "@/lib/scene/geometry";

// Matches the yellow dimension-overlay style on patiokitsdirect.com's 3D
// designer, which uses the same Duralum material/parts we do.
const DIM_COLOR = "#E8E600";

function DimLabel({ position, text }: { position: [number, number, number]; text: string }) {
  return (
    <Billboard position={position}>
      <Text fontSize={0.5} color={DIM_COLOR} outlineWidth={0.025} outlineColor="#1a1a1a" anchorX="center" anchorY="middle">
        {text}
      </Text>
    </Billboard>
  );
}

export default function DimensionOverlay({ run }: { run: RunConfig }) {
  const { originOffsetFt, widthFt, projectionFt, beamZFt, postHeightFt, postTopHeightFt, roofPitchDeg } = run;
  const xLeft = originOffsetFt;
  const xRight = originOffsetFt + widthFt;
  const widthLineY = postTopHeightFt + 0.1;
  const cantileverFt = Math.max(projectionFt - beamZFt, 0);
  const frontEdgeHeightFt = computeFrontEdgeHeightFt(postHeightFt, projectionFt, roofPitchDeg);

  return (
    <group>
      {/* Width — along the front beam line */}
      <Line points={[[xLeft, widthLineY, beamZFt], [xRight, widthLineY, beamZFt]]} color={DIM_COLOR} lineWidth={2} />
      <DimLabel position={[(xLeft + xRight) / 2, widthLineY + 0.6, beamZFt]} text={`${formatFeetInches(widthFt)} width`} />

      {/* Projection — follows the roof slope from the house wall to the beam */}
      <Line points={[[xRight, postHeightFt, 0], [xRight, postTopHeightFt, beamZFt]]} color={DIM_COLOR} lineWidth={2} />
      <DimLabel
        position={[xRight + 0.7, (postHeightFt + postTopHeightFt) / 2, beamZFt / 2]}
        text={`${formatFeetInches(projectionFt)} projection`}
      />

      {/* Post height */}
      <Line points={[[xLeft, 0, beamZFt], [xLeft, postTopHeightFt, beamZFt]]} color={DIM_COLOR} lineWidth={2} />
      <DimLabel position={[xLeft - 0.7, postTopHeightFt / 2, beamZFt]} text={`${formatFeetInches(postTopHeightFt)} post`} />

      {/* Cantilever — beam inset from the front (rafter tail) edge */}
      {cantileverFt > 0.05 && (
        <>
          <Line
            points={[[xRight, postTopHeightFt, beamZFt], [xRight, frontEdgeHeightFt, projectionFt]]}
            color={DIM_COLOR}
            lineWidth={2}
          />
          <DimLabel
            position={[xRight + 0.7, (postTopHeightFt + frontEdgeHeightFt) / 2 + 0.3, (beamZFt + projectionFt) / 2]}
            text={`${formatFeetInches(cantileverFt)} cantilever`}
          />
        </>
      )}
    </group>
  );
}
