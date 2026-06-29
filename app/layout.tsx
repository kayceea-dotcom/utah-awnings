import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Utah Awnings - Sales Platform",
  description: "Professional quoting and job management for Utah Awnings",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}
