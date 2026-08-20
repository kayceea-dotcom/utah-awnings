import type { Metadata, Viewport } from "next";
import "./globals.css";
import NumberInputScrollGuard from "@/components/NumberInputScrollGuard";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Utah Awnings - Sales Platform",
  description: "Professional quoting and job management for Utah Awnings",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Utah Awnings",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#CC2229",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <NumberInputScrollGuard />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
