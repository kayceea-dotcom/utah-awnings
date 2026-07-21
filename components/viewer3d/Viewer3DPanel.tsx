"use client";

import { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import type { SceneConfig } from "@/lib/scene/types";
import { createClient } from "@/lib/supabase/client";
import SceneRoot from "./SceneRoot";
import CameraRig, { type CameraRigHandle, type ViewPreset } from "./CameraRig";
import ViewerToolbar from "./ViewerToolbar";
import CaptureBridge, { type CaptureHandle } from "./capture/CaptureBridge";

interface Viewer3DPanelProps {
  scene: SceneConfig;
  onRenderCaptured?: (url: string) => void;
}

export default function Viewer3DPanel({ scene, onRenderCaptured }: Viewer3DPanelProps) {
  const cameraRigRef = useRef<CameraRigHandle>(null);
  const captureRef = useRef<CaptureHandle>(null);
  const [generatingRender, setGeneratingRender] = useState(false);
  const [renderError, setRenderError] = useState("");
  const [renderPreviewUrl, setRenderPreviewUrl] = useState("");
  const [showDimensions, setShowDimensions] = useState(false);

  if (scene.runs.length === 0) {
    return (
      <div className="w-full aspect-square rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-center text-sm text-slate-400 px-4">
        Enter width and projection to preview in 3D
      </div>
    );
  }

  const handleSetView = (preset: ViewPreset) => cameraRigRef.current?.setView(preset);

  async function handleGenerateRender() {
    const dataUrl = captureRef.current?.capture(2);
    if (!dataUrl) return;
    setGeneratingRender(true);
    setRenderError("");
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const supabase = createClient();
      const filename = `draft-${Date.now()}/${Date.now()}.png`;
      const { error } = await supabase.storage.from("renders").upload(filename, blob, {
        upsert: true,
        contentType: "image/png",
      });
      if (error) throw error;
      const { data } = supabase.storage.from("renders").getPublicUrl(filename);
      setRenderPreviewUrl(data.publicUrl);
      onRenderCaptured?.(data.publicUrl);
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : "Failed to generate render");
    } finally {
      setGeneratingRender(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative w-full aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
        <Canvas camera={{ fov: 45 }} gl={{ preserveDrawingBuffer: true }}>
          <SceneRoot scene={scene} showDimensions={showDimensions} />
          <CameraRig ref={cameraRigRef} bbox={scene.bboxFt} />
          <CaptureBridge ref={captureRef} />
        </Canvas>
        <ViewerToolbar
          onSetView={handleSetView}
          onGenerateRender={handleGenerateRender}
          generatingRender={generatingRender}
          showDimensions={showDimensions}
          onToggleDimensions={() => setShowDimensions((v) => !v)}
        />
      </div>
      {renderError && <p className="text-xs text-red-600">{renderError}</p>}
      {renderPreviewUrl && (
        <a href={renderPreviewUrl} target="_blank" rel="noreferrer" className="block text-xs text-blue-600 underline">
          View generated render
        </a>
      )}
    </div>
  );
}
