import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Utah Awnings - Sales Platform",
    short_name: "UA Quote Pro",
    description: "Professional quoting and job management for Utah Awnings",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#CC2229",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
