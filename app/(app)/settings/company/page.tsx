"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/hooks/useProfile";
import TopBar from "@/components/TopBar";
import { Upload, Building2, Save } from "lucide-react";

export default function CompanySettingsPage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("Utah Awnings");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { profile } = useProfile();
  const supabase = createClient();

  useEffect(() => {
    async function loadCompany() {
      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("slug", "utah-awnings")
        .single();
      if (data) {
        setCompanyName(data.name || "Utah Awnings");
        setPhone(data.phone || "");
        setEmail(data.email || "");
        setAddress(data.address || "");
        setLogoUrl(data.logo_url || null);
      }
    }
    loadCompany();
  }, []);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const ext = file.name.split(".").pop();
    const filename = "utah-awnings-logo." + ext;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(filename, file, { upsert: true });

    if (uploadError) {
      setMessage({ type: "error", text: "Upload failed: " + uploadError.message });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("logos")
      .getPublicUrl(filename);

    const publicUrl = urlData.publicUrl;

    await supabase
      .from("companies")
      .update({ logo_url: publicUrl })
      .eq("slug", "utah-awnings");

    setLogoUrl(publicUrl);
    setMessage({ type: "success", text: "Logo uploaded successfully!" });
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const { error } = await supabase
      .from("companies")
      .update({ name: companyName, phone, email, address })
      .eq("slug", "utah-awnings");

    if (error) {
      setMessage({ type: "error", text: "Failed to save: " + error.message });
    } else {
      setMessage({ type: "success", text: "Company info saved!" });
    }
    setSaving(false);
  }

  if (profile?.role !== "admin" && profile?.role !== "manager") {
    return (
      <>
        <TopBar title="Company Settings" />
        <main className="flex-1 p-4 lg:p-6 flex items-center justify-center">
          <p className="text-gray-500 text-sm">You do not have permission to edit company settings.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title="Company Settings" subtitle="Logo, name, and contact info" />
      <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
        <div className="max-w-xl mx-auto space-y-5">

          {/* Logo Upload */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={18} className="text-gray-500" />
              <h2 className="text-sm font-bold text-gray-800">Company Logo</h2>
            </div>

            <div className="flex items-center gap-5">
              {/* Preview */}
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-50">
                {logoUrl ? (
                  <img src={logoUrl} alt="Company logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="rounded-xl flex items-center justify-center w-14 h-14"
                       style={{ backgroundColor: "#CC2229" }}>
                    <span className="text-white text-lg font-black">UA</span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-3">
                  Upload your company logo. It will appear in the sidebar, login page, and customer emails.
                  PNG or JPG recommended.
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  <Upload size={15} />
                  {uploading ? "Uploading..." : "Upload Logo"}
                </button>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Company Information</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Company Name</label>
                <input
                  type="text"
                  className="input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  type="text"
                  className="input"
                  placeholder="801-979-5423"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="info@utahawnings.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Address</label>
                <input
                  type="text"
                  className="input"
                  placeholder="1950 Parkway Blvd, West Valley City, UT 84119"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              {message && (
                <div className={"rounded-xl px-4 py-3 text-sm font-medium " +
                  (message.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700")}>
                  {message.text}
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary w-full disabled:opacity-50"
              >
                <Save size={15} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
