import type { Metadata } from "next";
import "./globals.css";
import NumberInputScrollGuard from "@/components/NumberInputScrollGuard";

export const metadata: Metadata = {
  title: "Utah Awnings - Sales Platform",
  description: "Professional quoting and job management for Utah Awnings",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <NumberInputScrollGuard />
        {children}
      </body>
    </html>
  );
}
