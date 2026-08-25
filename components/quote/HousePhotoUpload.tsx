"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X } from "lucide-react";
import Field from "@/components/quote/Field";

// Stored in the "renders" bucket (already public, already used for 3D
// capture uploads) under its own house-photos/ prefix rather than a new
// bucket - avoids a manual Supabase dashboard step to create one.
export default function HousePhotoUpload({ value, onChange }: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const filename = "house-photos/" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;

    const { error: uploadError } = await supabase.storage.from("renders").upload(filename, file);
    if (uploadError) {
      setError("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("renders").getPublicUrl(filename);
    onChange(data.publicUrl);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="col-span-2">
      <Field label="House Photo">
        <div className="flex items-center gap-3">
          {value && (
            <div className="relative flex-shrink-0">
              <img src={value} alt="House" className="h-16 w-16 rounded-lg object-cover border border-gray-200" />
              <button type="button" onClick={() => onChange("")}
                className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-0.5 text-gray-500 hover:text-red-600">
                <X size={12} />
              </button>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="btn-secondary text-xs px-3 py-2 disabled:opacity-50">
            <Upload size={14} />
            {uploading ? "Uploading..." : value ? "Replace Photo" : "Upload Photo"}
          </button>
        </div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </Field>
    </div>
  );
}
