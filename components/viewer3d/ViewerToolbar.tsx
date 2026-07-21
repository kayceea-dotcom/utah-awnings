"use client";

import type { ViewPreset } from "./CameraRig";

const VIEW_BUTTONS: { preset: ViewPreset; label: string }[] = [
  { preset: "reset", label: "Reset" },
  { preset: "front", label: "Front" },
  { preset: "back", label: "Back" },
  { preset: "left", label: "Left" },
  { preset: "right", label: "Right" },
  { preset: "top", label: "Top" },
  { preset: "iso", label: "Iso" },
];

interface ViewerToolbarProps {
  onSetView: (preset: ViewPreset) => void;
  onGenerateRender?: () => void;
  generatingRender?: boolean;
  showDimensions?: boolean;
  onToggleDimensions?: () => void;
}

export default function ViewerToolbar({
  onSetView,
  onGenerateRender,
  generatingRender,
  showDimensions,
  onToggleDimensions,
}: ViewerToolbarProps) {
  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-1 rounded-md border border-slate-200 bg-white/90 px-2 py-1 shadow-sm backdrop-blur">
      {VIEW_BUTTONS.map((b) => (
        <button
          key={b.preset}
          type="button"
          onClick={() => onSetView(b.preset)}
          className="rounded px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          {b.label}
        </button>
      ))}
      {onToggleDimensions && (
        <button
          type="button"
          onClick={onToggleDimensions}
          className={`rounded px-2 py-0.5 text-xs font-medium ${
            showDimensions ? "bg-slate-700 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Dimensions
        </button>
      )}
      {onGenerateRender && (
        <button
          type="button"
          onClick={onGenerateRender}
          disabled={generatingRender}
          className="rounded px-2 py-0.5 text-xs font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "#CC2229" }}
        >
          {generatingRender ? "Rendering…" : "Generate Proposal Render"}
        </button>
      )}
    </div>
  );
}
