"use client";

import { forwardRef, useImperativeHandle } from "react";
import { useCanvasCapture } from "./useCanvasCapture";

export interface CaptureHandle {
  capture: (pixelRatioOverride?: number) => string;
}

// Bridges the imperative capture() call (needed by the HTML toolbar outside
// the Canvas) into r3f's useThree() context, which only works inside it.
const CaptureBridge = forwardRef<CaptureHandle>(function CaptureBridge(_props, ref) {
  const capture = useCanvasCapture();
  useImperativeHandle(ref, () => ({ capture }), [capture]);
  return null;
});

export default CaptureBridge;
